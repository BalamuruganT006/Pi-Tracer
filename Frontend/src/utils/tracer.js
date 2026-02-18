// src/utils/tracer.js

/**
 * Parse raw trace data from the backend into a structured format
 */
export function parseTrace(rawTrace) {
  if (!rawTrace || !rawTrace.steps) return null
  
  return {
    code: rawTrace.code || '',
    total_steps: rawTrace.steps.length,
    steps: rawTrace.steps.map((step, index) => ({
      step: index + 1,
      line: step.line,
      code: step.code || '',
      event: step.event || 'line',
      frames: step.frames || [],
      heap: step.heap || [],
      stdout: step.stdout || '',
    }))
  }
}

/**
 * Get variable changes between two steps
 */
export function getVariableChanges(prevStep, currentStep) {
  if (!prevStep || !currentStep) return { added: [], modified: [], removed: [] }
  
  const prevVars = {}
  const currVars = {}
  
  prevStep.frames?.forEach(frame => {
    Object.entries(frame.locals || {}).forEach(([name, val]) => {
      prevVars[`${frame.name}.${name}`] = val
    })
  })
  
  currentStep.frames?.forEach(frame => {
    Object.entries(frame.locals || {}).forEach(([name, val]) => {
      currVars[`${frame.name}.${name}`] = val
    })
  })
  
  const added = Object.keys(currVars).filter(k => !(k in prevVars))
  const removed = Object.keys(prevVars).filter(k => !(k in currVars))
  const modified = Object.keys(currVars).filter(k => 
    k in prevVars && currVars[k]?.repr !== prevVars[k]?.repr
  )
  
  return { added, modified, removed }
}
