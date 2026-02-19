// src/pages/TutorPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MonacoEditor, { defaultCode } from '../components/CodeEditor/MonacoEditor'
import PythonTutorVis from '../components/Visualizer/PythonTutorVis'
import { executeCode } from '../services/api'
import './pages.css'

export default function TutorPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState(defaultCode)
  const [currentStep, setCurrentStep] = useState(1)
  const [trace, setTrace] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState(null)

  const handleRun = async () => {
    if (!code?.trim()) return

    setIsRunning(true)
    setError(null)
    setTrace(null)

    try {
      const result = await executeCode(code)

      if (result.error) {
        setError(result.error)
      }

      if (result.steps && result.steps.length > 0) {
        setTrace({
          code: code,
          total_steps: result.total_steps,
          steps: result.steps,
          stdout: result.stdout || '',
        })
        setCurrentStep(1)
      } else if (!result.error) {
        setError('No execution steps returned')
      }
    } catch (err) {
      console.error('Execution error:', err)
      setError(`Connection failed: ${err.message}. Make sure backend is running on port 8000`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setTrace(null)
    setError(null)
    setCurrentStep(1)
  }

  return (
    <div className="tutor-page">
      {/* Header */}
      <header className="tutor-header">
        <div className="tutor-brand">
          <button 
            onClick={() => navigate('/')}
            className="back-btn"
            title="Back to Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="tutor-logo-wrap">
            <span className="tutor-logo">π</span>
            <h1 className="tutor-title">Pi-Tracer</h1>
          </div>
        </div>
        
        <div className="tutor-actions">
          {trace && (
            <div className="step-navigator">
              <button 
                className="step-btn"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep <= 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <span className="step-info">
                Step {currentStep} / {trace.total_steps}
              </span>
              <button 
                className="step-btn"
                onClick={() => setCurrentStep(Math.min(trace.total_steps, currentStep + 1))}
                disabled={currentStep >= trace.total_steps}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          )}
          
          {isRunning && (
            <span className="running-indicator">
              <span className="running-dot"></span>
              Running...
            </span>
          )}
          
          <button className="reset-btn" onClick={handleReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="tutor-main">
        <div className="editor-panel">
          <MonacoEditor
            value={code}
            onChange={setCode}
            onRun={handleRun}
          />
        </div>
        <div className="visualizer-panel">
          <PythonTutorVis
            trace={trace}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
          />
        </div>
      </main>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>×</button>
        </div>
      )}
    </div>
  )
}
