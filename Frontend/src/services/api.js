// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export async function executeCode(code, userInput = '') {
  const response = await fetch(`${API_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, user_input: userInput })
  })
  return response.json()
}

export async function executeSimple(code, userInput = '') {
  const response = await fetch(`${API_URL}/execute/simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, user_input: userInput })
  })
  return response.json()
}
