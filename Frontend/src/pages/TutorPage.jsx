// src/pages/TutorPage.jsx
import { useState } from 'react'
import MonacoEditor, { defaultCode } from '../components/CodeEditor/MonacoEditor'
import PythonTutorVis from '../components/Visualizer/PythonTutorVis'
import { executeCode } from '../services/api'
import './pages.css'

export default function TutorPage() {
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
      setError(`Connection error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="tutor-page">
      <header className="tutor-header">
        <div className="tutor-brand">
          <span className="tutor-logo">🥧</span>
          <h1 className="tutor-title">Pi-Tracer</h1>
        </div>
        <div className="tutor-actions">
          {isRunning && <span className="running-indicator">Running...</span>}
          {error && <span className="error-indicator" title={error}>⚠ Error</span>}
          <button className="btn btn-secondary" onClick={() => { setTrace(null); setError(null) }}>
            Reset
          </button>
        </div>
      </header>

      <main className="tutor-main">
        <MonacoEditor
          value={code}
          onChange={setCode}
          onRun={handleRun}
        />
        <PythonTutorVis
          trace={trace}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
      </main>

      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  )
}
