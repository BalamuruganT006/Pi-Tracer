// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TutorPage from './pages/TutorPage'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tutor" element={<TutorPage />} />
      </Routes>
    </div>
  )
}

export default App
