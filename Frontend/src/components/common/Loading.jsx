// src/components/common/Loading.jsx
import './common.css'

export default function Loading({ text = 'Loading...', size = 'md' }) {
  return (
    <div className={`loading loading-${size}`}>
      <div className="loading-spinner" />
      <span className="loading-text">{text}</span>
    </div>
  )
}
