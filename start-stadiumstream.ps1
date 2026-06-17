# StadiumStream Launcher Script for Windows PowerShell
# Double-click or run from terminal: .\start-stadiumstream.ps1

Clear-Host
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                STADIUMSTREAM HUB LAUNCHER                " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] Starting Express API & WebSockets (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; Title StadiumStream-Backend; npm run start"

# Brief delay to ensure WebSocket port is initialized
Start-Sleep -Seconds 2

Write-Host "[2/2] Starting Vite React + TS Dev Server (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; Title StadiumStream-Frontend; npm run dev"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "                     SUCCESSFULLY RUN                     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "• Frontend Client: http://localhost:5173" -ForegroundColor Green
Write-Host "• Backend API Server: http://localhost:5000" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Separate terminals have been opened for both services."
Write-Host "To shut down, simply close their respective console windows."
Write-Host ""
