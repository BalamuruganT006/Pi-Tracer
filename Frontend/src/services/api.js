// src/services/api.js - Updated with WebSocket alternatives
const API_URL = import.meta.env.VITE_API_URL || '/api/v1'

// =============================================================================
// EXECUTION METHODS AVAILABLE:
//
// 1. ORIGINAL HTTP EXECUTION - Simple API calls (no real-time)
// 2. SERVER-SENT EVENTS - Real-time streaming from backend
// 3. HTTP POLLING - Periodic status checks for long-running code
// 4. PYODIDE EXECUTION - Client-side Python with WebAssembly (see pyodideExecutor.js)
//    - Offline capable, no server required
//    - Supports numpy, pandas, matplotlib and most scientific libraries
//    - Full Python tracing and visualization
//    - Best user experience for Pi-Tracer
// =============================================================================

// =============================================================================
// ORIGINAL HTTP EXECUTION (No real-time)
// =============================================================================

export async function executeCode(code, userInput = '') {
  try {
    const response = await fetch(`${API_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, user_input: userInput })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return response.json()
  } catch (error) {
    console.error('executeCode error:', error)
    throw error
  }
}

// =============================================================================
// SERVER-SENT EVENTS EXECUTION (Real-time streaming)
// =============================================================================

export async function executeCodeWithSSE(code, callbacks = {}) {
  const { onStep, onComplete, onError, onStart } = callbacks;
  
  try {
    onStart?.();
    
    const response = await fetch(`${API_URL}/execute-stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
              case 'start':
                onStart?.(data.message);
                break;
              case 'step':
                onStep?.(data.step_data, data.step_number, data.total_steps);
                break;
              case 'complete':
                onComplete?.(data.result);
                return data.result;
              case 'error':
                onError?.(data.error);
                return;
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
    throw error;
  }
}

// =============================================================================
// POLLING EXECUTION (Submit job + poll for results)
// =============================================================================

export async function executeCodeWithPolling(code, callbacks = {}) {
  const { onProgress, onComplete, onError } = callbacks;
  
  try {
    // Submit execution job
    const submitResponse = await fetch(`${API_URL}/execute-poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!submitResponse.ok) {
      throw new Error(`Submit failed: ${submitResponse.status}`);
    }

    const { job_id } = await submitResponse.json();
    
    // Poll for results
    let attempts = 0;
    const maxAttempts = 120; // 60 seconds timeout
    const pollInterval = 500; // 500ms intervals

    return new Promise((resolve, reject) => {
      const poll = async () => {
        if (attempts++ > maxAttempts) {
          const error = 'Execution timeout (60 seconds)';
          onError?.(error);
          reject(new Error(error));
          return;
        }

        try {
          const response = await fetch(`${API_URL}/jobs/${job_id}`);
          
          if (response.status === 404) {
            onProgress?.(`Waiting... (${attempts})`);
            setTimeout(poll, pollInterval);
            return;
          }

          if (!response.ok) {
            throw new Error(`Poll failed: ${response.status}`);
          }

          const result = await response.json();
          
          if (result.status === 'completed') {
            onComplete?.(result.result);
            resolve(result.result);
          } else if (result.status === 'error') {
            onError?.(result.error);
            reject(new Error(result.error));
          } else {
            onProgress?.(`Processing... (${attempts})`);
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          onError?.(error.message);
          reject(error);
        }
      };

      poll();
    });
  } catch (error) {
    onError?.(error.message);
    throw error;
  }
}
