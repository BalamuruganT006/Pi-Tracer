// src/components/Visualizer/PythonTutorVis.jsx
import { useState, useEffect } from 'react'
import VariableBox from './VariableBox'
import HeapGraph from './HeapGraph'
import './Visualizer.css'

export default function PythonTutorVis({ trace, currentStep, onStepChange }) {
  const [stepData, setStepData] = useState(null)

  useEffect(() => {
    if (trace?.steps?.[currentStep - 1]) {
      setStepData(trace.steps[currentStep - 1])
    }
  }, [trace, currentStep])

  if (!trace || !stepData) {
    return (
      <div className="visualizer-empty">
        <div className="empty-icon">🐍</div>
        <p>Run code to see visualization</p>
        <span className="empty-hint">Your execution trace will appear here</span>
      </div>
    )
  }

  const { frames, heap, stdout, line, code, event } = stepData

  return (
    <div className="visualizer">
      {/* Header */}
      <div className="visualizer-header">
        <span className="step-counter">
          Step {currentStep} of {trace.total_steps}
        </span>
        <div className="step-controls">
          <button 
            onClick={() => onStepChange?.(1)}
            disabled={currentStep === 1}
            className="control-btn"
          >
            ⏮ First
          </button>
          <button 
            onClick={() => onStepChange?.(currentStep - 1)}
            disabled={currentStep === 1}
            className="control-btn"
          >
            ◀ Prev
          </button>
          <button 
            onClick={() => onStepChange?.(currentStep + 1)}
            disabled={currentStep === trace.total_steps}
            className="control-btn"
          >
            Next ▶
          </button>
          <button 
            onClick={() => onStepChange?.(trace.total_steps)}
            disabled={currentStep === trace.total_steps}
            className="control-btn"
          >
            Last ⏭
          </button>
        </div>
      </div>

      {/* Code Display */}
      <div className="code-display">
        {trace.code.split('\n').map((lineText, idx) => {
          const lineNum = idx + 1
          const isCurrent = lineNum === line
          const isPast = lineNum < line
          
          return (
            <div
              key={idx}
              className={`code-line ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}`}
            >
              <span className="line-number">{lineNum}</span>
              <span className="line-content">{lineText || ' '}</span>
              {isCurrent && <span className="current-arrow">←</span>}
            </div>
          )
        })}
      </div>

      {/* Frames */}
      <div className="frames-section">
        <h3 className="section-title">Frames</h3>
        {frames.map((frame, idx) => (
          <div key={idx} className="frame">
            <div className="frame-header">
              {frame.name === '<module>' ? '🌍' : '⚡'} {frame.name}
            </div>
            <div className="frame-vars">
              {Object.entries(frame.locals).map(([name, variable]) => (
                <VariableBox key={name} variable={variable} />
              ))}
              {Object.keys(frame.locals).length === 0 && (
                <span className="no-vars">No variables</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Heap */}
      <HeapGraph heap={heap} />

      {/* Output */}
      {stdout && (
        <div className="output-section">
          <h3 className="section-title">Output</h3>
          <pre className="output-content">{stdout}</pre>
        </div>
      )}

      {/* Event Badge */}
      <div className={`event-badge ${event}`}>
        Event: {event}
      </div>
    </div>
  )
}
