#!/bin/bash
set -e

echo "================================================"
echo "  LightPOS Backend — Django + Channels"
echo "================================================"

cd "$(dirname "$0")/backend"

# Remove stale venv if it was built with wrong Python
if [ -d "venv" ]; then
    VENV_PYTHON=$(venv/bin/python --version 2>&1)
    echo "Existing venv: $VENV_PYTHON"
    # Remove and recreate to ensure clean state
    echo "Removing old venv for clean reinstall..."
    rm -rf venv
fi

echo "Creating virtual environment..."
python3 -m venv venv

source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip -q

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running migrations..."
python manage.py migrate

echo "Seeding demo data..."
python manage.py seed

echo ""
echo "================================================"
echo "  Backend:    http://localhost:8000"
echo "  Admin:      http://localhost:8000/admin"
echo "  WebSocket:  ws://localhost:8000/ws/pos/"
echo "  Login:      admin / admin123"
echo "================================================"
echo ""
python manage.py runserver 0.0.0.0:8000
