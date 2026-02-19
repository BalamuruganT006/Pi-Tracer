// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TutorPage from './pages/TutorPage'
import PyodideTutorPage from './pages/PyodideTutorPage'
import './styles/global.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/tutor-pyodide" element={<PyodideTutorPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
