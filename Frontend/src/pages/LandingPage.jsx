// src/pages/LandingPage.jsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import './pages.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 60 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="landing-page">
      {/* Animated Background Elements */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">π</span>
            <span className="logo-text">Pi-Tracer</span>
          </div>
          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#audience">Learn</a>
            <a href="#tech-stack">Tech Stack</a>
            <button onClick={() => navigate('/tutor')} className="nav-cta">
              <span>Try it Free</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-container">
            {isLoaded && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="hero-main"
              >
                <motion.h1 
                  className="hero-title"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  Master Python from visual clarity
                </motion.h1>
                
                <motion.p 
                  className="hero-subtitle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                >
                  Stop tracing loops in your head. Start seeing them in interactive space.
                  <br />
                  Turn complex code into clear visualizations. Learn faster, code smarter.
                </motion.p>

                {/* Feature Tags */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                  className="feature-tags"
                >
                  <span className="feature-tag">Real-time Execution</span>
                  <span className="feature-tag">Memory Visualization</span>
                  <span className="feature-tag">Step-by-Step Tracing</span>
                </motion.div>
                
                {/* CTA Buttons */}
                <motion.div 
                  className="cta-buttons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.3 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 255, 200, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/tutor-pyodide')}
                    className="btn btn-primary"
                  >
                    <span>Try Client-Side (Recommended)</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      →
                    </motion.span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05, borderColor: "rgba(0, 255, 200, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/tutor')}
                    className="btn btn-secondary"
                  >
                    <span>Try Server-Side</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <motion.div {...fadeInUp} className="section-header">
            <h2>Visualize and master.</h2>
            <p>Code. Trace. Visualize. Execute. Pi-Tracer takes you from confusion to clarity.</p>
          </motion.div>

          <div className="features-grid">
            <motion.div {...fadeInUp} className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Instant Code Execution</h3>
              <p>Run your Python code in real-time, right in your browser. No setup required, just write and execute with immediate visual feedback.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="feature-card">
              <div className="feature-icon">🧠</div>
              <h3>Memory Visualization</h3>
              <p>See your program's memory with interactive visuals. Watch variables, objects, and data structures come to life as your code executes.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Step-by-Step Tracing</h3>
              <p>Follow your code execution line by line. Understand program flow, variable changes, and function calls with crystal clarity.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Audience Section */}
      <section id="audience" className="audience-section">
        <div className="container">
          <motion.div {...fadeInUp} className="section-header">
            <h2>Learn your way</h2>
            <p>Pi-Tracer supports every step of your Python journey</p>
          </motion.div>

          <motion.div {...staggerChildren} className="audience-grid">
            <motion.div {...fadeInUp} className="audience-card">
              <div className="audience-icon">🎓</div>
              <h3>Students</h3>
              <p>Ace exams by seeing algorithms, not just reading them. Master data structures and algorithms through visual learning.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="audience-card">
              <div className="audience-icon">🚀</div>
              <h3>Beginners</h3>
              <p>Start your Python journey with confidence. Understand concepts like loops, functions, and classes through interactive visualization.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="audience-card">
              <div className="audience-icon">💡</div>
              <h3>Developers</h3>
              <p>Debug complex code faster. Visualize program execution to identify bottlenecks and optimize performance.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech-stack" className="tech-section">
        <div className="container">
          <motion.div {...fadeInUp} className="section-header">
            <h2>Built for Speed and Intelligence</h2>
            <p>The technologies that make Pi-Tracer fast, smart, and accessible</p>
          </motion.div>

          <motion.div {...staggerChildren} className="tech-grid">
            <motion.div {...fadeInUp} className="tech-card">
              <div className="tech-icon">⚛️</div>
              <h3>React</h3>
              <p>Component-based UI that's fast and responsive. Modern frontend framework for seamless user experience.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="tech-card">
              <div className="tech-icon">🐍</div>
              <h3>Python Engine</h3>
              <p>Full Python 3.11+ support with real-time execution. Run authentic Python code with complete language features.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="tech-card">
              <div className="tech-icon">⚡</div>
              <h3>WebAssembly</h3>
              <p>Near-native performance in the browser. Execute Python code at blazing fast speeds without server round-trips.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="tech-card">
              <div className="tech-icon">🎨</div>
              <h3>Framer Motion</h3>
              <p>Smooth animations and transitions. Beautiful, fluid user interface that responds to your every interaction.</p>
            </motion.div>

            <motion.div {...fadeInUp} className="tech-card">
              <div className="tech-icon">💾</div>
              <h3>FastAPI Backend</h3>
              <p>High-performance Python backend API. Real-time WebSocket connections for live code execution and tracing.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div {...fadeInUp} className="cta-content">
            <h2>Ready to see your code come alive?</h2>
            <p>Join thousands of developers who've transformed their understanding of Python</p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(139, 92, 246, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/tutor-pyodide')}
              className="btn btn-primary"
            >
              <span>Start Coding Now</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="logo-icon">π</span>
                <span className="logo-text">Pi-Tracer</span>
              </div>
              <p>Revolutionizing Python learning through visual clarity and interactive experiences.</p>
            </div>
            
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#audience">Learn</a>
                <a href="/tutor">Try Now</a>
              </div>
              
              <div className="footer-section">
                <h4>Resources</h4>
                <a href="#tech-stack">Tech Stack</a>
                <a href="#">Documentation</a>
                <a href="#">GitHub</a>
              </div>
              
              <div className="footer-section">
                <h4>Community</h4>
                <a href="#">Discord</a>
                <a href="#">GitHub Issues</a>
                <a href="#">Contribute</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2026 Pi-Tracer. Made with ❤️ for Python developers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
