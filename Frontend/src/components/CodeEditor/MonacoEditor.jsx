// src/components/CodeEditor/MonacoEditor.jsx
import { useRef, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import './CodeEditor.css'

export const defaultCode = `# Welcome to Pi-Tracer!
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
    
    // Define custom theme - Monochrome Purple
    monaco.editor.defineTheme('piTracerDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '#a855f7', fontStyle: 'bold' },
        { token: 'string', foreground: '#c084fc' },
        { token: 'number', foreground: '#d8b4fe' },
        { token: 'comment', foreground: '#52525b', fontStyle: 'italic' },
        { token: 'function', foreground: '#c084fc' },
        { token: 'variable', foreground: '#e4e4e7' },
        { token: 'type', foreground: '#e9d5ff' },
        { token: 'operator', foreground: '#a855f7' },
      ],
      colors: {
        'editor.background': '#0a0a0d',
        'editor.lineHighlightBackground': '#101014',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a855f7',
        'editor.selectionBackground': 'rgba(168, 85, 247, 0.2)',
        'editor.inactiveSelectionBackground': 'rgba(168, 85, 247, 0.1)',
        'editorCursor.foreground': '#a855f7',
        'editor.findMatchBackground': 'rgba(168, 85, 247, 0.3)',
        'editor.findMatchHighlightBackground': 'rgba(168, 85, 247, 0.15)',
        'editorWidget.background': '#101014',
        'editorWidget.border': 'rgba(168, 85, 247, 0.1)',
        'input.background': '#101014',
        'input.border': 'rgba(168, 85, 247, 0.1)',
        'scrollbarSlider.background': 'rgba(168, 85, 247, 0.1)',
        'scrollbarSlider.hoverBackground': 'rgba(168, 85, 247, 0.2)',
        'scrollbarSlider.activeBackground': 'rgba(168, 85, 247, 0.3)',
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
