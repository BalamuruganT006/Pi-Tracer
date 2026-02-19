// Pyodide Python executor - runs Python directly in the browser
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js'

class PyodideExecutor {
  constructor() {
    this.pyodide = null
    this.isLoading = false
    this.isReady = false
    this.loadPromise = null
  }

  async initialize(onProgress = null) {
    if (this.isReady) return this.pyodide
    if (this.loadPromise) return this.loadPromise

    this.isLoading = true
    
    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        onProgress?.('Loading Pyodide runtime...')
        
        // Load Pyodide with progress tracking
        this.pyodide = await loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.24.1/full/",
          stdout: (text) => {
            console.log('Python:', text)
          },
          stderr: (text) => {
            console.error('Python Error:', text)
          }
        })

        onProgress?.('Installing Python packages...')
        
        // Install commonly used packages
        await this.pyodide.loadPackage(['numpy', 'pandas', 'matplotlib'])
        
        onProgress?.('Setting up execution environment...')
        
        // Setup execution environment
        this.pyodide.runPython(`
import sys
import io
import traceback
from contextlib import redirect_stdout, redirect_stderr

class ExecutionTracer:
    def __init__(self):
        self.steps = []
        self.stdout_capture = io.StringIO()
        self.stderr_capture = io.StringIO()
        
    def trace_calls(self, frame, event, arg):
        if event == 'call':
            filename = frame.f_code.co_filename
            if not filename.startswith('<'):  # Skip built-in functions
                func_name = frame.f_code.co_name
                line_no = frame.f_lineno
                local_vars = dict(frame.f_locals)
                
                # Clean up variables for JSON serialization
                clean_vars = {}
                for k, v in local_vars.items():
                    try:
                        if not k.startswith('__'):
                            if isinstance(v, (int, float, str, bool, list, dict, tuple)):
                                clean_vars[k] = v
                            else:
                                clean_vars[k] = str(v)[:100]  # Truncate long strings
                    except:
                        clean_vars[k] = '<unable to serialize>'
                
                self.steps.append({
                    'event': event,
                    'function': func_name,
                    'line': line_no,
                    'locals': clean_vars,
                    'step': len(self.steps) + 1
                })
        return self.trace_calls
        
    def execute_with_trace(self, code):
        self.steps = []
        self.stdout_capture = io.StringIO()
        self.stderr_capture = io.StringIO()
        
        try:
            # Redirect stdout and stderr
            with redirect_stdout(self.stdout_capture), redirect_stderr(self.stderr_capture):
                # Set up tracing
                sys.settrace(self.trace_calls)
                
                # Execute the code
                exec(code, globals())
                
            return {
                'success': True,
                'steps': self.steps,
                'stdout': self.stdout_capture.getvalue(),
                'stderr': self.stderr_capture.getvalue()
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'traceback': traceback.format_exc(),
                'stdout': self.stdout_capture.getvalue(),
                'stderr': self.stderr_capture.getvalue(),
                'steps': self.steps
            }
        finally:
            sys.settrace(None)

# Create global tracer instance
_tracer = ExecutionTracer()
        `)

        onProgress?.('Python environment ready!')
        this.isReady = true
        this.isLoading = false
        
        resolve(this.pyodide)
        
      } catch (error) {
        this.isLoading = false
        reject(error)
      }
    })

    return this.loadPromise
  }

  async executeCode(code, callbacks = {}) {
    const { onStart, onStep, onComplete, onError, onProgress } = callbacks
    
    try {
      if (!this.isReady) {
        onProgress?.('Initializing Python environment...')
        await this.initialize(onProgress)
      }

      onStart?.('Executing Python code...')

      // Execute code with tracing
      const result = this.pyodide.runPython(`_tracer.execute_with_trace("""${code.replace(/"""/g, '\\"""')}""")`)
      
      if (result.success) {
        // Simulate step-by-step execution for better UX
        if (result.steps && result.steps.length > 0) {
          for (let i = 0; i < result.steps.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 200)) // 200ms delay per step
            onStep?.(result.steps[i], i + 1, result.steps.length)
          }
        }
        
        const executionResult = {
          steps: result.steps || [],
          total_steps: result.steps?.length || 0,
          stdout: result.stdout || '',
          stderr: result.stderr || '',
          execution_time_ms: Date.now() // Approximate
        }
        
        onComplete?.(executionResult)
        return executionResult
        
      } else {
        const errorMsg = result.error || 'Unknown execution error'
        onError?.(errorMsg)
        throw new Error(errorMsg)
      }

    } catch (error) {
      onError?.(error.message)
      throw error
    }
  }

  async installPackage(packageName, onProgress = null) {
    if (!this.isReady) {
      throw new Error('Pyodide not initialized. Call initialize() first.')
    }

    onProgress?.(`Installing ${packageName}...`)
    
    try {
      await this.pyodide.loadPackage(packageName)
      onProgress?.(`${packageName} installed successfully!`)
    } catch (error) {
      // Try micropip for pure Python packages
      onProgress?.(`Trying micropip for ${packageName}...`)
      await this.pyodide.runPython(`
import micropip
await micropip.install('${packageName}')
      `)
      onProgress?.(`${packageName} installed via micropip!`)
    }
  }

  getAvailablePackages() {
    // List of commonly available packages in Pyodide
    return [
      'numpy', 'pandas', 'matplotlib', 'scikit-learn', 'scipy',
      'sympy', 'bokeh', 'plotly', 'seaborn', 'networkx',
      'requests', 'beautifulsoup4', 'lxml', 'pillow', 'opencv-python'
    ]
  }

  runPython(code) {
    if (!this.isReady) {
      throw new Error('Pyodide not initialized')
    }
    return this.pyodide.runPython(code)
  }

  // Get current Python globals (for debugging)
  getGlobals() {
    if (!this.isReady) return {}
    
    try {
      return this.pyodide.runPython(`
import json
{k: str(v) for k, v in globals().items() if not k.startswith('_')}
      `)
    } catch {
      return {}
    }
  }
}

// Create singleton instance
const pyodideExecutor = new PyodideExecutor()

export default pyodideExecutor

// Export convenience functions
export const initializePyodide = (onProgress) => pyodideExecutor.initialize(onProgress)
export const executeWithPyodide = (code, callbacks) => pyodideExecutor.executeCode(code, callbacks)
export const installPyodidePackage = (pkg, onProgress) => pyodideExecutor.installPackage(pkg, onProgress)