// Example React component showing all WebSocket alternatives
import { useState } from 'react'
import { executeCode, executeCodeWithSSE, executeCodeWithPolling } from '../services/api'

export default function ExecutionMethodsDemo() {
  const [code, setCode] = useState(`# Try different execution methods
x = 5
y = 10
result = x + y
print(f"The sum is: {result}")

for i in range(3):
    print(f"Loop iteration: {i}")
`)
  
  const [method, setMethod] = useState('sse') // 'http', 'sse', 'polling'
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)

  const resetState = () => {
    setResult(null)
    setError(null)
    setProgress('')
    setCurrentStep(0)
    setTotalSteps(0)
  }

  const executeWithHTTP = async () => {
    setIsRunning(true)
    resetState()
    
    try {
      const result = await executeCode(code)
      setResult(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsRunning(false)
    }
  }

  const executeWithSSE = async () => {
    setIsRunning(true)
    resetState()
    
    try {
      await executeCodeWithSSE(code, {
        onStart: (message) => {
          setProgress(message)
        },
        onStep: (stepData, stepNumber, total) => {
          setCurrentStep(stepNumber)
          setTotalSteps(total)
          setProgress(`Step ${stepNumber} of ${total}`)
        },
        onComplete: (result) => {
          setResult(result)
          setIsRunning(false)
          setProgress('Completed!')
        },
        onError: (error) => {
          setError(error)
          setIsRunning(false)
          setProgress('Failed')
        }
      })
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }

  const executeWithPolling = async () => {
    setIsRunning(true)
    resetState()
    
    try {
      await executeCodeWithPolling(code, {
        onProgress: (message) => {
          setProgress(message)
        },
        onComplete: (result) => {
          setResult(result)
          setIsRunning(false)
          setProgress('Completed!')
        },
        onError: (error) => {
          setError(error)
          setIsRunning(false)
          setProgress('Failed')
        }
      })
    } catch (err) {
      setError(err.message)
      setIsRunning(false)
    }
  }

  const handleExecute = () => {
    switch (method) {
      case 'http':
        executeWithHTTP()
        break
      case 'sse':
        executeWithSSE()
        break
      case 'polling':
        executeWithPolling()
        break
    }
  }

  return (
    <div className="execution-demo">
      <div className="demo-header">
        <h2>🚀 WebSocket Alternatives Demo</h2>
        <p>Choose your preferred execution method:</p>
      </div>

      {/* Method Selection */}
      <div className="method-selector">
        <label>
          <input
            type="radio"
            value="http"
            checked={method === 'http'}
            onChange={(e) => setMethod(e.target.value)}
          />
          📡 <strong>HTTP REST</strong> - Simple request/response (no real-time)
        </label>
        
        <label>
          <input
            type="radio"
            value="sse"
            checked={method === 'sse'}
            onChange={(e) => setMethod(e.target.value)}
          />
          ⚡ <strong>Server-Sent Events</strong> - Real-time streaming (recommended)
        </label>
        
        <label>
          <input
            type="radio"
            value="polling"
            checked={method === 'polling'}
            onChange={(e) => setMethod(e.target.value)}
          />
          🔄 <strong>HTTP Polling</strong> - Check status periodically
        </label>
      </div>

      {/* Code Editor */}
      <div className="code-section">
        <h3>Python Code:</h3>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={10}
          className="code-editor"
          placeholder="Enter your Python code here..."
        />
      </div>

      {/* Execute Button */}
      <div className="execute-section">
        <button
          onClick={handleExecute}
          disabled={isRunning}
          className={`execute-btn ${isRunning ? 'running' : ''}`}
        >
          {isRunning ? (
            <>⏳ Running ({method.toUpperCase()})...</>
          ) : (
            <>▶️ Execute with {method.toUpperCase()}</>
          )}
        </button>
      </div>

      {/* Progress/Status */}
      {(progress || (currentStep > 0 && totalSteps > 0)) && (
        <div className="progress-section">
          <div className="progress-info">
            {currentStep > 0 && totalSteps > 0 ? (
              <div className="step-progress">
                <div className="step-indicator">
                  Step {currentStep} of {totalSteps}
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="status-message">{progress}</div>
            )}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="result-section">
          <h3>✅ Execution Result:</h3>
          <div className="result-content">
            <div className="result-stats">
              <span>Steps: {result.total_steps || result.steps?.length || 0}</span>
              <span>Time: {result.execution_time_ms}ms</span>
            </div>
            
            {result.stdout && (
              <div className="stdout">
                <h4>Output:</h4>
                <pre>{result.stdout}</pre>
              </div>
            )}
            
            <div className="steps">
              <h4>Execution Steps:</h4>
              <pre>{JSON.stringify(result.steps, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {error && (
        <div className="error-section">
          <h3>❌ Error:</h3>
          <div className="error-content">
            <pre>{error}</pre>
          </div>
        </div>
      )}

      {/* Method Comparison */}
      <div className="comparison-section">
        <h3>📊 Method Comparison:</h3>
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Method</th>
              <th>Real-time</th>
              <th>Complexity</th>
              <th>Browser Support</th>
              <th>Best For</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HTTP REST</td>
              <td>❌ No</td>
              <td>🟢 Simple</td>
              <td>✅ Universal</td>
              <td>Simple apps, reliable connections</td>
            </tr>
            <tr>
              <td>Server-Sent Events</td>
              <td>✅ Yes</td>
              <td>🟡 Medium</td>
              <td>✅ Modern browsers</td>
              <td>Real-time streaming, one-way data</td>
            </tr>
            <tr>
              <td>HTTP Polling</td>
              <td>🟡 Pseudo</td>
              <td>🟡 Medium</td>
              <td>✅ Universal</td>
              <td>Long-running tasks, periodic updates</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

// CSS styles (add to your CSS file)
const styles = `
.execution-demo {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
}

.method-selector {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.method-selector label {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  cursor: pointer;
  padding: 10px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.method-selector label:hover {
  background: white;
}

.code-editor {
  width: 100%;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  resize: vertical;
}

.execute-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.execute-btn:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-2px);
}

.execute-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.progress-section {
  margin: 20px 0;
  padding: 20px;
  background: #e3f2fd;
  border-radius: 8px;
}

.step-progress {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #ddd;
  border-radius: 4px;
  margin-top: 10px;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  border-radius: 4px;
  transition: width 0.3s;
}

.result-section, .error-section {
  margin: 20px 0;
  padding: 20px;
  border-radius: 8px;
}

.result-section {
  background: #d4edda;
  border: 1px solid #c3e6cb;
}

.error-section {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.comparison-table th {
  background: #f8f9fa;
  font-weight: bold;
}
`