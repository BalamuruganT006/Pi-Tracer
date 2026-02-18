// src/components/Layout/Header.jsx
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

export default function Header() {
  const location = useLocation()
  
  return (
    <header className="app-header">
      <Link to="/" className="header-brand">
        <span className="header-logo">🥧</span>
        <span className="header-title">Pi-Tracer</span>
      </Link>
      <nav className="header-nav">
        <Link 
          to="/" 
          className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
        >
          Home
        </Link>
        <Link 
          to="/tutor" 
          className={`nav-link ${location.pathname === '/tutor' ? 'active' : ''}`}
        >
          Tutor
        </Link>
      </nav>
    </header>
  )
}
