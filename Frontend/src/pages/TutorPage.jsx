// src/pages/TutorPage.jsx
import { useState } from 'react'
import MonacoEditor from '../components/CodeEditor/MonacoEditor'
import PythonTutorVis from '../components/Visualizer/PythonTutorVis'
import './pages.css'

// Mock trace data for demonstration
const mockTrace = {
  code: 'x = [1, 2, 3]\nfor i in x:\n    print(i)',
  total_steps: 5,
  steps: [
    {
      step: 1,
      line: 1,
      code: 'x = [1, 2, 3]',
      event: 'line',
      frames: [{
        name: '<module>',
        line: 1,
        locals: {
          x: { name: 'x', type: 'list', repr: '[1, 2, 3]', is_mutable: true }
        },
        globals: []
      }],
      heap: [{ id: 1, type: 'list', repr: '[1, 2, 3]', size: 88 }],
      stdout: ''
    },
    {
      step: 2,
      line: 2,
      code: 'for i in x:',
      event: 'line',
      frames: [{
        name: '<module>',
        line: 2,
        locals: {
          x: { name: 'x', type: 'list', repr: '[1, 2, 3]', is_mutable: true },
          i: { name: 'i', type: 'int', repr: '1' }
        },
        globals: []
      }],
      heap: [{ id: 1, type: 'list', repr: '[1, 2, 3]', size: 88 }],
      stdout: ''
    },
    {
      step: 3,
      line: 3,
      code: '    print(i)',
      event: 'line',
      frames: [{
        name: '<module>',
        line: 3,
        locals: {
          x: { name: 'x', type: 'list', repr: '[1, 2, 3]', is_mutable: true },
          i: { name: 'i', type: 'int', repr: '1' }
        },
        globals: []
      }],
      heap: [{ id: 1, type: 'list', repr: '[1, 2, 3]', size: 88 }],
      stdout: '1\n'
    }
  ]
}

export default function TutorPage() {
  const [code, setCode] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [trace, setTrace] = useState(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = async () => {
    setIsRunning(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 500))
    setTrace(mockTrace)
    setCurrentStep(1)
    setIsRunning(false)
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
          <button className="btn btn-secondary" onClick={() => setTrace(null)}>
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
    </div>
  )
}
