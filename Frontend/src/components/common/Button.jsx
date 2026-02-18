// src/components/common/Button.jsx
import './common.css'

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon, 
  disabled = false, 
  onClick, 
  className = '',
  ...props 
}) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {icon && <span className="btn-icon">{icon}</span>}
      {children}
    </button>
  )
}
