// React hook for Pyodide integration
import { useState, useCallback, useRef } from 'react'
import pyodideExecutor from '../services/pyodideExecutor'

export function usePyodide() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [initProgress, setInitProgress] = useState('')
  const [initError, setInitError] = useState(null)
  
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [totalSteps, setTotalSteps] = useState(0)
  const [executionResult, setExecutionResult] = useState(null)
  const [executionError, setExecutionError] = useState(null)
  const [executionProgress, setExecutionProgress] = useState('')

  const initPromiseRef = useRef(null)

  const initialize = useCallback(async () => {
    if (isReady || isInitializing) {
      return initPromiseRef.current
    }

    setIsInitializing(true)
    setInitError(null)
    setInitProgress('Starting Pyodide initialization...')

    try {
      initPromiseRef.current = pyodideExecutor.initialize((progress) => {
        setInitProgress(progress)
      })

      await initPromiseRef.current
      setIsReady(true)
      setInitProgress('Python environment ready!')
      
    } catch (error) {
      setInitError(error.message)
      console.error('Pyodide initialization failed:', error)
    } finally {
      setIsInitializing(false)
    }

    return initPromiseRef.current
  }, [isReady, isInitializing])

  const executeCode = useCallback(async (code) => {
    if (!code?.trim()) return

    setIsExecuting(true)
    setExecutionError(null)
    setExecutionResult(null)
    setCurrentStep(0)
    setTotalSteps(0)
    setExecutionProgress('')

    try {
      // Auto-initialize if needed
      if (!isReady) {
        await initialize()
      }

      const result = await pyodideExecutor.executeCode(code, {
        onStart: (message) => {
          setExecutionProgress(message)
        },
        onProgress: (message) => {
          setExecutionProgress(message)
        },
        onStep: (stepData, stepNumber, total) => {
          setCurrentStep(stepNumber)
          setTotalSteps(total)
          setExecutionProgress(`Executing step ${stepNumber} of ${total}`)
        },
        onComplete: (result) => {
          setExecutionResult(result)
          setExecutionProgress('Execution completed!')
        },
        onError: (error) => {
          setExecutionError(error)
          setExecutionProgress('Execution failed')
        }
      })

      return result

    } catch (error) {
      setExecutionError(error.message)
      console.error('Code execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }, [isReady, initialize])

  const installPackage = useCallback(async (packageName) => {
    if (!isReady) {
      throw new Error('Pyodide not ready. Initialize first.')
    }

    try {
      await pyodideExecutor.installPackage(packageName, (progress) => {
        setInitProgress(progress)
      })
    } catch (error) {
      console.error(`Failed to install ${packageName}:`, error)
      throw error
    }
  }, [isReady])

  const getAvailablePackages = useCallback(() => {
    return pyodideExecutor.getAvailablePackages()
  }, [])

  const runPython = useCallback((code) => {
    if (!isReady) {
      throw new Error('Pyodide not ready')
    }
    return pyodideExecutor.runPython(code)
  }, [isReady])

  const reset = useCallback(() => {
    setExecutionResult(null)
    setExecutionError(null)
    setCurrentStep(0)
    setTotalSteps(0)
    setExecutionProgress('')
  }, [])

  return {
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
    runPython,
    reset,

    // Status
    status: isInitializing ? 'initializing' : 
            isReady ? 'ready' : 
            initError ? 'error' : 'not-initialized'
  }
}

// Convenience hook for simple code execution
export function useSimplePyodide() {
  const {
    executeCode,
    executionResult,
    executionError,
    isExecuting,
    isReady,
    initialize
  } = usePyodide()

  const execute = useCallback(async (code) => {
    try {
      return await executeCode(code)
    } catch (error) {
      console.error('Execution failed:', error)
      return null
    }
  }, [executeCode])

  return {
    execute,
    result: executionResult,
    error: executionError,
    isExecuting,
    isReady,
    initialize
  }
}