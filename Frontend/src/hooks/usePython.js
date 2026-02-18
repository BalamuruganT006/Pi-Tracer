// src/hooks/usePython.js
import { useState, useCallback } from 'react'
import { executeCode } from '../services/api'

export function usePython() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const run = useCallback(async (code, userInput = '') => {
    setIsLoading(true)
    setError(null)
    
    try {
      const data = await executeCode(code, userInput)
      setResult(data)
      return data
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { isLoading, result, error, run }
}
