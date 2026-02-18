// src/components/Visualizer/VariableBox.jsx
import './Visualizer.css'

export default function VariableBox({ variable }) {
  const getTypeColor = () => {
    const colors = {
      int: '#45b7d1',
      float: '#45b7d1',
      str: '#96ceb4',
      bool: '#feca57',
      list: '#ff6b6b',
      dict: '#4ecdc4',
      set: '#a78bfa',
      tuple: '#ffd93d',
      function: '#f38ba8',
      NoneType: '#6c7086'
    }
    return colors[variable.type] || '#a8a8a8'
  }

  return (
    <div 
      className="variable-box"
      style={{ borderColor: getTypeColor() }}
    >
      <span 
        className="var-type"
        style={{ background: getTypeColor() }}
      >
        {variable.type}
      </span>
      <div className="var-name">{variable.name}</div>
      <div className="var-value">{variable.repr}</div>
    </div>
  )
}
