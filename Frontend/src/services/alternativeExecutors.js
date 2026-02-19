// Alternative WebSocket implementations for Pi-Tracer Frontend
// Choose the one that best fits your needs

// =============================================================================
// 1. SERVER-SENT EVENTS (SSE) - Recommended Alternative
// =============================================================================

export class SSECodeExecutor {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async executeCode(code, onStep = null, onComplete = null, onError = null) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/execute-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              switch (data.type) {
                case 'step':
                  onStep?.(data.step_data, data.step_number, data.total_steps);
                  break;
                case 'complete':
                  onComplete?.(data.result);
                  break;
                case 'error':
                  onError?.(data.error);
                  break;
                case 'end':
                  return;
              }
            } catch (e) {
              console.warn('Failed to parse SSE data:', line);
            }
          }
        }
      }
    } catch (error) {
      onError?.(error.message);
    }
  }
}

// =============================================================================
// 2. HTTP LONG POLLING
// =============================================================================

export class PollingCodeExecutor {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async executeCode(code, onProgress = null, onComplete = null, onError = null) {
    try {
      // Submit job
      const submitResponse = await fetch(`${this.baseUrl}/api/v1/execute-poll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!submitResponse.ok) {
        throw new Error(`Submit failed: ${submitResponse.status}`);
      }

      const { job_id, poll_url } = await submitResponse.json();
      
      // Poll for results
      const pollInterval = 500; // Poll every 500ms
      let attempts = 0;
      const maxAttempts = 120; // 60 seconds max

      const poll = async () => {
        if (attempts++ > maxAttempts) {
          onError?.('Execution timeout');
          return;
        }

        try {
          const response = await fetch(`${this.baseUrl}/api/v1/jobs/${job_id}`);
          
          if (!response.ok) {
            if (response.status === 404) {
              // Job not found, continue polling
              setTimeout(poll, pollInterval);
              return;
            }
            throw new Error(`Poll failed: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.status === 'completed') {
            onComplete?.(result.result);
          } else if (result.status === 'error') {
            onError?.(result.error);
          } else {
            // Still processing
            onProgress?.(`Processing... (${attempts})`);
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          onError?.(error.message);
        }
      };

      // Start polling
      poll();

    } catch (error) {
      onError?.(error.message);
    }
  }
}

// =============================================================================
// 3. SIMPLE HTTP REST (No Real-time)
// =============================================================================

export class SimpleCodeExecutor {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async executeCode(code) {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`Execution failed: ${error.message}`);
    }
  }
}

// =============================================================================
// 4. USAGE EXAMPLES
// =============================================================================

// Example: Using Server-Sent Events
export function useSSEExecution() {
  const executor = new SSECodeExecutor();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const executeCode = async (code) => {
    setIsRunning(true);
    setError(null);
    setTrace(null);
    setCurrentStep(0);

    await executor.executeCode(
      code,
      // onStep
      (stepData, stepNumber, total) => {
        setCurrentStep(stepNumber);
        setTotalSteps(total);
      },
      // onComplete  
      (result) => {
        setTrace(result);
        setIsRunning(false);
      },
      // onError
      (error) => {
        setError(error);
        setIsRunning(false);
      }
    );
  };

  return { executeCode, currentStep, totalSteps, trace, error, isRunning };
}

// Example: Using Simple HTTP
export function useSimpleExecution() {
  const executor = new SimpleCodeExecutor();
  
  const [trace, setTrace] = useState(null);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const executeCode = async (code) => {
    setIsRunning(true);
    setError(null);
    
    try {
      const result = await executor.executeCode(code);
      setTrace(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunning(false);
    }
  };

  return { executeCode, trace, error, isRunning };
}