// src/components/Landing3D/PiSymbol3D.jsx
import React, { useRef, useMemo, useEffect, useState, useCallback, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useSpring, animated, config } from '@react-spring/three'
import ParticleField from './ParticleField'
import FloatingCode from './FloatingCode'
import './Landing3D.css'

// Error boundary to prevent 3D crashes from killing the page
class Canvas3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error, info) {
    console.error('3D Canvas error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="pi-symbol-3d" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pi-overlay" style={{ position: 'relative', transform: 'none', bottom: 'auto', left: 'auto' }}>
            <h1 className="pi-title">Pi-Tracer</h1>
            <p className="pi-subtitle">Visualize Python Execution</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// Custom shader material for gradient effect
const GradientMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor1: { value: new THREE.Color('#306998') },
    uColor2: { value: new THREE.Color('#FFD43B') },
    uColor3: { value: new THREE.Color('#ff6b6b') },
    uMouse: { value: new THREE.Vector2(0, 0) },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    uniform float uTime;
    uniform vec2 uMouse;
    
    void main() {
      vUv = uv;
      vPosition = position;
      vNormal = normal;
      
      vec3 pos = position;
      float dist = distance(uv, uMouse);
      pos += normal * sin(dist * 10.0 - uTime * 2.0) * 0.02;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec2 uMouse;
    
    varying vec2 vUv;
    varying vec3 vPosition;
    varying vec3 vNormal;
    
    void main() {
      float mixFactor = sin(vUv.y * 3.14159 + uTime * 0.5) * 0.5 + 0.5;
      vec3 color = mix(uColor1, uColor2, mixFactor);
      
      float edge = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
      color = mix(color, uColor3, edge * 0.3);
      
      float mouseDist = distance(vUv, uMouse);
      float glow = smoothstep(0.5, 0.0, mouseDist) * 0.3;
      color += uColor3 * glow;
      
      vec3 lightDir = normalize(vec3(1.0, 1.0, 2.0));
      float diff = max(dot(vNormal, lightDir), 0.0);
      vec3 ambient = color * 0.4;
      vec3 diffuse = color * diff * 0.6;
      
      gl_FragColor = vec4(ambient + diffuse + glow, 1.0);
    }
  `
}

// Pi Symbol Mesh Component
function PiMesh({ mousePosition, isHovered, onHover }) {
  const meshRef = useRef()
  const materialRef = useRef()
  
  const { scale, rotation } = useSpring({
    scale: isHovered ? 1.15 : 1,
    rotation: isHovered ? [0, Math.PI * 0.15, 0] : [0, 0, 0],
    config: config.wobbly
  })
  
  // Create Pi geometry
  const geometry = useMemo(() => {
    const shape = new THREE.Shape()
    const w = 2.0
    const h = 2.5
    const t = 0.35
    
    // Top bar
    shape.moveTo(-w, h)
    shape.lineTo(w, h)
    shape.lineTo(w, h - t)
    shape.lineTo(-w, h - t)
    shape.lineTo(-w, h)
    
    // Left leg
    shape.moveTo(-w + 0.1, h - t)
    shape.bezierCurveTo(-w + 0.1, h * 0.3, -w * 0.5, -h * 0.5, -w * 0.8, -h)
    shape.lineTo(-w * 0.4, -h)
    shape.bezierCurveTo(-w * 0.1, -h * 0.3, w * 0.2, h * 0.3, -w + t + 0.1, h - t)
    
    // Right leg
    shape.moveTo(w - t - 0.1, h - t)
    shape.bezierCurveTo(w - t - 0.1, h * 0.3, w * 0.5, -h * 0.5, w * 0.8, -h)
    shape.lineTo(w * 0.4, -h)
    shape.bezierCurveTo(w * 0.1, -h * 0.3, -w * 0.2, h * 0.3, w - t - 0.1, h - t)
    
    const extrudeSettings = {
      steps: 2,
      depth: 0.5,
      bevelEnabled: true,
      bevelThickness: 0.1,
      bevelSize: 0.05,
      bevelOffset: 0,
      bevelSegments: 5,
      curveSegments: 24
    }
    
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geo.center()
    return geo
  }, [])
  
  // Create material
  const material = useMemo(() => {
    const mat = new THREE.ShaderMaterial(GradientMaterial)
    return mat
  }, [])
  
  useFrame((state) => {
    if (material) {
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uMouse.value.set(mousePosition.x, mousePosition.y)
    }
    
    if (meshRef.current && !isHovered) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.05
    }
  })
  
  const handleClick = useCallback(() => {
    window.dispatchEvent(new CustomEvent('pi-click', {
      detail: { position: meshRef.current?.position || new THREE.Vector3() }
    }))
  }, [])
  
  return (
    <animated.mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      scale={scale}
      rotation={rotation}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onClick={handleClick}
    />
  )
}

// Click burst effect
function ClickBurst({ position, onComplete }) {
  const pointsRef = useRef()
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < 50; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = Math.random() * 0.1 + 0.05
      
      temp.push({
        velocity: [
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        ],
        position: [0, 0, 0],
        life: 1.0,
        color: new THREE.Color().setHSL(Math.random(), 1, 0.5)
      })
    }
    return temp
  }, [])
  
  useFrame(() => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array
    const colors = pointsRef.current.geometry.attributes.color.array
    let active = false
    
    for (let i = 0; i < particles.length; i++) {
      const i3 = i * 3
      const p = particles[i]
      
      if (p.life > 0) {
        active = true
        p.position[0] += p.velocity[0]
        p.position[1] += p.velocity[1]
        p.position[2] += p.velocity[2]
        p.life -= 0.02
        
        positions[i3] = p.position[0]
        positions[i3 + 1] = p.position[1]
        positions[i3 + 2] = p.position[2]
        
        colors[i3] = p.color.r * p.life
        colors[i3 + 1] = p.color.g * p.life
        colors[i3 + 2] = p.color.b * p.life
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.geometry.attributes.color.needsUpdate = true
    
    if (!active) onComplete?.()
  })
  
  return (
    <points ref={pointsRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Main 3D Scene
function Scene() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovered, setIsHovered] = useState(false)
  const [bursts, setBursts] = useState([])
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      })
    }
    
    const handleClick = (e) => {
      if (e.detail?.position) {
        const id = Date.now()
        setBursts(prev => [...prev, { id, position: e.detail.position }])
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('pi-click', handleClick)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('pi-click', handleClick)
    }
  }, [])
  
  const removeBurst = useCallback((id) => {
    setBursts(prev => prev.filter(b => b.id !== id))
  }, [])
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#61dafb" />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#ffd700" />
      <pointLight position={[0, 0, 10]} intensity={0.8} color="#ff6b6b" distance={20} />
      
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <PiMesh 
          mousePosition={mousePosition}
          isHovered={isHovered}
          onHover={setIsHovered}
        />
      </Float>
      
      <ParticleField count={300} mousePosition={mousePosition} />
      <FloatingCode />
      
      {bursts.map(burst => (
        <ClickBurst 
          key={burst.id} 
          position={burst.position}
          onComplete={() => removeBurst(burst.id)}
        />
      ))}
      
      <ContactShadows
        position={[0, -4, 0]}
        opacity={0.4}
        scale={20}
        blur={2.5}
        far={4.5}
      />
      
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        minDistance={5}
        maxDistance={15}
        autoRotate={!isHovered}
        autoRotateSpeed={0.5}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  )
}

// Main Export Component
export default function PiSymbol3D() {
  return (
    <Canvas3DErrorBoundary>
      <div className="pi-symbol-3d">
        <Canvas
          camera={{ position: [0, 0, 8], fov: 50 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
        
        <div className="pi-overlay">
          <h1 className="pi-title">Pi-Tracer</h1>
          <p className="pi-subtitle">Visualize Python Execution in 3D</p>
        </div>
      </div>
    </Canvas3DErrorBoundary>
  )
}
