@echo off
echo ================================================
echo   LightPOS Frontend - Windows
echo ================================================

cd /d "%~dp0frontend"

echo Installing dependencies...
npm install

echo.
echo ================================================
echo   Frontend running at http://localhost:5173
echo ================================================
echo.
npm run dev
pause
