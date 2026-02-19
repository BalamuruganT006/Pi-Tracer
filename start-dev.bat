@echo off
echo ========================================
echo   Pi-Tracer - Starting Both Servers
echo ========================================
echo.

echo Starting Backend (Flask) on port 8000...
start "Pi-Tracer Backend" cmd /k "cd /d %~dp0Backend && set FLASK_APP=app.main && python -m flask run --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend (Vite) on port 5173...
start "Pi-Tracer Frontend" cmd /k "cd /d %~dp0Frontend && npm run dev"

echo.
echo ========================================
echo Servers are starting!
echo - Backend: http://localhost:8000
echo - Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to exit...
pause >nul
