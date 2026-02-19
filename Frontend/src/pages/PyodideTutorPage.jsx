// PyodideTutorPage - Pi-Tracer with Pyodide (client-side Python execution)
import { useState } from 'react'
import { motion } from 'framer-motion'
import MonacoEditor from '../components/CodeEditor/MonacoEditor'
import PythonTutorVis from '../components/Visualizer/PythonTutorVis'
import { usePyodide } from '../hooks/usePyodide'
import './pages.css'

const defaultPyodideCode = `# 🐍 Pyodide Python - Runs directly in your browser!
# No server required, full Python with scientific libraries

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Create some data
x = np.linspace(0, 10, 50)
y = np.sin(x)

# Basic Python operations
numbers = [1, 2, 3, 4, 5]
squares = [n**2 for n in numbers]

print("Original numbers:", numbers)  
print("Squared numbers:", squares)
print("")

# NumPy operations
print("NumPy array operations:")
arr = np.array([1, 2, 3, 4, 5])
print(f"Array: {arr}")
print(f"Mean: {np.mean(arr)}")
print(f"Sum: {np.sum(arr)}")
print("")

# Pandas DataFrame
df = pd.DataFrame({
    'x': x[:5], 
    'y': y[:5]
})
print("Pandas DataFrame:")
print(df.head())

# Simple algorithm - Fibonacci
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"\\nFibonacci(8) = {fibonacci(8)}")

# List operations
fruits = ["apple", "banana", "orange"]
for i, fruit in enumerate(fruits):
    print(f"{i+1}. {fruit}")

print("\\n✅ Pyodide execution complete!")
`

export default function PyodideTutorPage() {
  const [code, setCode] = useState(defaultPyodideCode)
  
  const {
    // Initialization
    initialize,
    isInitializing,
    isReady,
    initProgress,
    initError,

    // Execution  
    executeCode,
    isExecuting,
    currentStep,
    totalSteps,
    executionResult,
    executionError,
    executionProgress,

    // Utilities
    installPackage,
    getAvailablePackages,
    reset,
    status
  } = usePyodide()

  const [installingPackage, setInstallingPackage] = useState('')
  const [availablePackages] = useState(getAvailablePackages())

  const handleRun = async () => {
    await executeCode(code)
  }

  const handleInstallPackage = async (packageName) => {
    setInstallingPackage(packageName)
    try {
      await installPackage(packageName)
      alert(`✅ ${packageName} installed successfully!`)
    } catch (error) {
      alert(`❌ Failed to install ${packageName}: ${error.message}`)
    } finally {
      setInstallingPackage('')
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'ready': return '#28a745'
      case 'initializing': return '#ffc107'  
      case 'error': return '#dc3545'
      default: return '#6c757d'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'ready': return '✅'
      case 'initializing': return '⏳'
      case 'error': return '❌'
      default: return '⚪'
    }
  }

  return (
    <div className="tutor-page pyodide-page">
      {/* Header */}  
      <header className="tutor-header">
        <div className="tutor-brand">
          <span className="tutor-logo">🐍</span>
          <h1 className="tutor-title">Pi-Tracer + Pyodide</h1>
          <span className="pyodide-badge">Client-Side Python</span>
        </div>
        
        <div className="tutor-actions">
          {/* Pyodide Status */}
          <div className="pyodide-status" style={{ color: getStatusColor() }}>
            {getStatusIcon()} {status.replace('-', ' ')}
          </div>

          {/* Initialize Button */}
          {!isReady && !isInitializing && (
            <button 
              onClick={initialize}
              className="btn btn-primary"
              disabled={isInitializing}
            >
              🚀 Initialize Python
            </button>
          )}

          {/* Execution Status */}
          {isExecuting && (
            <span className="running-indicator">
              ⚡ Executing... {currentStep > 0 && `(${currentStep}/${totalSteps})`}
            </span>
          )}

          {/* Reset Button */}
          <button className="btn btn-secondary" onClick={reset}>
            🔄 Reset
          </button>
        </div>
      </header>

      {/* Initialization Progress */}
      {(isInitializing || initProgress) && (
        <motion.div 
          className="init-progress"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="progress-content">
            <div className="progress-message">
              {initProgress || 'Initializing Pyodide...'}
            </div>
            {isInitializing && (
              <div className="progress-bar">
                <div className="progress-fill" />
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Package Installation Panel */}
      {isReady && (
        <motion.div 
          className="package-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <details>
            <summary>📦 Available Python Packages</summary>
            <div className="package-grid">
              {availablePackages.map(pkg => (
                <button
                  key={pkg}
                  onClick={() => handleInstallPackage(pkg)}
                  disabled={installingPackage === pkg}
                  className="package-btn"
                >
                  {installingPackage === pkg ? '⏳' : '📦'} {pkg}
                </button>
              ))}
            </div>
          </details>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="tutor-main">
        {/* Code Editor */}
        <div className="editor-section">
          <MonacoEditor
            value={code}
            onChange={setCode}
            onRun={handleRun}
            language="python"
            readOnly={!isReady}
          />
          
          {!isReady && (
            <div className="editor-overlay">
              <div className="overlay-content">
                <h3>🐍 Initialize Pyodide</h3>
                <p>Click "Initialize Python" to load the Python runtime in your browser.</p>
                {initError && (
                  <div className="init-error">
                    ❌ Initialization failed: {initError}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Visualizer */}
        <div className="visualizer-section">
          <PythonTutorVis
            trace={executionResult}
            currentStep={currentStep}
            onStepChange={() => {}} // Steps controlled by Pyodide
            isPyodide={true}
          />
          
          {/* Execution Progress */}
          {executionProgress && (
            <div className="execution-progress">
              <div className="progress-message">{executionProgress}</div>
              {currentStep > 0 && totalSteps > 0 && (
                <div className="step-indicator">
                  Step {currentStep} of {totalSteps}
                  <div className="mini-progress">
                    <div 
                      className="mini-fill"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Error Display */}
      {(executionError || initError) && (
        <motion.div 
          className="error-banner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <strong>Error:</strong> {executionError || initError}
        </motion.div>
      )}

      {/* Info Panel */}
      <motion.div 
        className="info-panel"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3>🎯 Pyodide Benefits:</h3>
        <ul>
          <li>🚀 <strong>Runs in browser</strong> - No server required</li>
          <li>📱 <strong>Works offline</strong> - No internet needed after loading</li>
          <li>🔒 <strong>Secure</strong> - Code runs in browser sandbox</li>
          <li>📊 <strong>Full Python</strong> - NumPy, Pandas, Matplotlib included</li>
          <li>🌐 <strong>WebAssembly</strong> - Near-native performance</li>
        </ul>
      </motion.div>
    </div>
  )
}

// Additional CSS for Pyodide-specific styling
export const pyodideStyles = `
.pyodide-page {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.pyodide-badge {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  margin-left: 10px;
}

.init-progress {
  background: rgba(0, 123, 255, 0.1);
  border-bottom: 1px solid rgba(0, 123, 255, 0.2);
  padding: 15px 30px;
}

.progress-content {
  max-width: 1800px;
  margin: 0 auto;
}

.progress-message {
  color: #007bff;
  font-weight: 500;
  margin-bottom: 10px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: rgba(0, 123, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #007bff;
  animation: progressAnimation 2s ease-in-out infinite;
}

@keyframes progressAnimation {
  0% { width: 0%; }
  50% { width: 70%; }
  100% { width: 100%; }
}

.package-panel {
  background: rgba(255, 255, 255, 0.05);
  padding: 15px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.package-panel details {
  color: white;
}

.package-panel summary {
  cursor: pointer;
  font-weight: 500;
  margin-bottom: 15px;
}

.package-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
}

.package-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.package-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-1px);
}

.package-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.overlay-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  text-align: center;
  max-width: 400px;
}

.execution-progress {
  background: rgba(0, 123, 255, 0.1);
  padding: 10px 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.step-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
  color: #007bff;
}

.mini-progress {
  flex: 1;
  height: 4px;
  background: rgba(0, 123, 255, 0.2);
  border-radius: 2px;
}

.mini-fill {
  height: 100%;
  background: #007bff;
  transition: width 0.3s ease;
  border-radius: 2px;
}

.pyodide-status {
  font-weight: 500;
  font-size: 0.9rem;
}

.info-panel {
  background: rgba(255, 255, 255, 0.05);
  margin: 20px;
  padding: 20px;
  border-radius: 12px;
  color: white;
}

.info-panel h3 {
  margin-bottom: 15px;
  color: #ffd43b;
}

.info-panel ul {
  list-style: none;
  padding: 0;
}

.info-panel li {
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.init-error {
  background: rgba(220, 53, 69, 0.1);
  border: 1px solid rgba(220, 53, 69, 0.3);
  color: #dc3545;
  padding: 10px;
  border-radius: 6px;
  margin-top: 10px;
}
`