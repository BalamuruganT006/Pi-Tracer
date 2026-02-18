// src/pages/LandingPage.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import PiSymbol3D from '../components/Landing3D/PiSymbol3D'
import './pages.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    setIsLoaded(true)
  }, [])
  
  return (
    <div className="landing-page">
      <PiSymbol3D />
      
      <div className="landing-content">
        <div className="landing-container">
          {isLoaded && (
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="landing-hero"
            >
              {/* Feature Tags */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="feature-tags"
              >
                <span className="feature-tag">Real-time Execution</span>
                <span className="feature-tag">Step-by-Step Visualization</span>
                <span className="feature-tag">3D Memory View</span>
              </motion.div>
              
              {/* CTA Buttons */}
              <div className="cta-buttons">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/tutor')}
                  className="btn btn-primary"
                >
                  <span>Start Coding</span>
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open('https://github.com', '_blank')}
                  className="btn btn-secondary"
                >
                  View on GitHub
                </motion.button>
              </div>
              
              {/* Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="stats"
              >
                <div className="stat">
                  <div className="stat-value">3D</div>
                  <div className="stat-label">Visualization</div>
                </div>
                <div className="stat">
                  <div className="stat-value">⚡</div>
                  <div className="stat-label">Real-time</div>
                </div>
                <div className="stat">
                  <div className="stat-value">🐍</div>
                  <div className="stat-label">Python 3.11</div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="scroll-indicator"
      >
        <span>Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="scroll-arrow"
        >
          ↓
        </motion.div>
      </motion.div>
    </div>
  )
}
