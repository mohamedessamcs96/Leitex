@echo off
echo ================================================
echo   LightPOS Backend - Windows
echo ================================================

cd /d "%~dp0backend"

if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -r requirements.txt -q

echo Running migrations...
python manage.py migrate

echo Seeding demo data...
python manage.py seed

echo.
echo ================================================
echo   Backend running at http://localhost:8000
echo   Admin: http://localhost:8000/admin
echo ================================================
echo.
python manage.py runserver 0.0.0.0:8000
pause
