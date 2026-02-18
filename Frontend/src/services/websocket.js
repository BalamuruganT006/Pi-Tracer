// src/services/websocket.js
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/execute'

export function createWebSocket() {
  const ws = new WebSocket(WS_URL)
  
  ws.onopen = () => {
    console.log('WebSocket connected')
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
  
  return ws
}
