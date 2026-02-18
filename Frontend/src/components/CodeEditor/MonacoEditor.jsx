// src/components/CodeEditor/MonacoEditor.jsx
import { useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import './CodeEditor.css'

const defaultCode = `# Welcome to Pi-Tracer!
# Write your Python code here and visualize execution

def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(5)
print(f"5! = {result}")

# Try modifying the code and run again!`

export default function MonacoEditor({ value, onChange, onRun }) {
  const editorRef = useRef(null)

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    
    // Define custom theme
    monaco.editor.defineTheme('piTracerDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '#ff79c6', fontStyle: 'bold' },
        { token: 'string', foreground: '#f1fa8c' },
        { token: 'number', foreground: '#bd93f9' },
        { token: 'comment', foreground: '#6272a4', fontStyle: 'italic' },
        { token: 'function', foreground: '#50fa7b' },
        { token: 'variable', foreground: '#f8f8f2' },
        { token: 'type', foreground: '#8be9fd' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.lineHighlightBackground': '#2a2a3e',
        'editorLineNumber.foreground': '#6272a4',
        'editor.selectionBackground': '#44475a',
        'editor.inactiveSelectionBackground': '#44475a80',
      }
    })
    
    monaco.editor.setTheme('piTracerDark')
    
    // Add keyboard shortcut
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRun?.()
    })
  }, [onRun])

  return (
    <div className="monaco-editor-container">
      <div className="editor-header">
        <span className="editor-filename">main.py</span>
        <span className="editor-hint">Press Ctrl+Enter to run</span>
      </div>
      
      <div className="editor-wrapper">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={value || defaultCode}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 20 },
            fontFamily: 'JetBrains Mono, monospace',
            fontLigatures: true,
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: true,
            multiCursorModifier: 'ctrlCmd',
            formatOnPaste: true,
            formatOnType: true,
            tabSize: 4,
            insertSpaces: true,
          }}
        />
      </div>
      
      <div className="editor-toolbar">
        <button className="run-btn" onClick={onRun}>
          <span className="run-icon">▶</span>
          Run Code
        </button>
        <button className="clear-btn" onClick={() => onChange?.('')}>
          Clear
        </button>
      </div>
    </div>
  )
}
