// src/components/Landing3D/FloatingCode.jsx
import { useMemo } from 'react'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

const codeSnippets = [
  'def hello():',
  'x = [1, 2, 3]',
  'for i in range(10):',
  'print("Hello")',
  'return True',
  'if x > 5:',
  'class PiTracer:',
  'import math',
  'while True:',
  'yield x'
]

// Simple sprite-based text that doesn't require font loading
function CodeSprite({ text, position }) {
  const canvas = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 64
    const ctx = c.getContext('2d')
    ctx.fillStyle = 'transparent'
    ctx.fillRect(0, 0, 256, 64)
    ctx.font = '20px monospace'
    ctx.fillStyle = '#61dafb'
    ctx.globalAlpha = 0.5
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 128, 32)
    return c
  }, [text])

  const texture = useMemo(() => {
    const tex = new THREE.CanvasTexture(canvas)
    return tex
  }, [canvas])

  return (
    <sprite position={position} scale={[2, 0.5, 1]}>
      <spriteMaterial map={texture} transparent opacity={0.6} />
    </sprite>
  )
}

// Pre-calculate stable positions so they don't change on re-render
const positions = codeSnippets.map(() => [
  (Math.random() - 0.5) * 12,
  (Math.random() - 0.5) * 8,
  (Math.random() - 0.5) * 5 - 3
])

export default function FloatingCode() {
  return (
    <>
      {codeSnippets.map((code, i) => (
        <Float
          key={i}
          speed={2}
          rotationIntensity={0.5}
          floatIntensity={0.5}
          position={positions[i]}
        >
          <CodeSprite text={code} position={[0, 0, 0]} />
        </Float>
      ))}
    </>
  )
}
