#!/bin/bash

echo "========================================"
echo "  Pi-Tracer - Starting Both Servers"
echo "========================================"
echo ""

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting Backend (Flask) on port 8000..."
cd Backend
export FLASK_APP=app.main
python -m flask run --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3

echo "Starting Frontend (Vite) on port 5173..."
cd Frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "========================================"
echo "Servers are starting!"
echo "- Backend: http://localhost:8000"
echo "- Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."

wait
