#!/bin/bash
# LightPOS Frontend Setup & Run Script
set -e

echo "================================================"
echo "  LightPOS Frontend — React + Vite"
echo "================================================"

cd "$(dirname "$0")/frontend"

# Install dependencies
echo "Installing dependencies..."
npm install

# Start dev server
echo ""
echo "================================================"
echo "  Frontend running at http://localhost:5173"
echo "================================================"
echo ""
npm run dev
