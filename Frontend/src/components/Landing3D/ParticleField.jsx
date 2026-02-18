// src/components/Landing3D/ParticleField.jsx
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField({ count = 300, mousePosition }) {
  const pointsRef = useRef()
  
  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10
        ],
        velocity: [
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        ],
        phase: Math.random() * Math.PI * 2
      })
    }
    return temp
  }, [count])
  
  useFrame((state) => {
    if (!pointsRef.current) return
    
    const positions = pointsRef.current.geometry.attributes.position.array
    const time = state.clock.elapsedTime
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const p = particles[i]
      
      positions[i3] += p.velocity[0]
      positions[i3 + 1] += p.velocity[1]
      positions[i3 + 2] += p.velocity[2]
      
      const dx = positions[i3] - mousePosition.x * 5
      const dy = positions[i3 + 1] - mousePosition.y * 5
      const dist = Math.sqrt(dx * dx + dy * dy)
      
      if (dist < 2) {
        const force = (2 - dist) * 0.01
        positions[i3] += dx * force
        positions[i3 + 1] += dy * force
      }
      
      positions[i3 + 1] += Math.sin(time + p.phase) * 0.002
      
      if (Math.abs(positions[i3]) > 7.5) p.velocity[0] *= -1
      if (Math.abs(positions[i3 + 1]) > 7.5) p.velocity[1] *= -1
      if (Math.abs(positions[i3 + 2]) > 5) p.velocity[2] *= -1
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  const colors = useMemo(() => {
    return new Float32Array(particles.flatMap(() => {
      const color = new THREE.Color().setHSL(Math.random(), 0.8, 0.6)
      return [color.r, color.g, color.b]
    }))
  }, [particles])
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(particles.flatMap(p => p.position))}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
