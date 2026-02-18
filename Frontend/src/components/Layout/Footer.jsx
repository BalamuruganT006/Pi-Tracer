// src/components/Layout/Footer.jsx
import './Layout.css'

export default function Footer() {
  return (
    <footer className="app-footer">
      <p>&copy; {new Date().getFullYear()} Pi-Tracer. Visualize Python Execution.</p>
    </footer>
  )
}
