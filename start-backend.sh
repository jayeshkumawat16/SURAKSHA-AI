#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
  echo "Creating Python virtual environment in backend/venv..."
  python3 -m venv venv
fi

source venv/bin/activate

if ! python -c "import fastapi, uvicorn" 2>/dev/null; then
  echo "Installing backend dependencies from requirements.txt..."
  pip install -r requirements.txt
fi

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo "Creating backend/.env from .env.example (Gemini key not configured by default)..."
    cp .env.example .env
  fi
fi

echo "Starting SURAKSHA AI Backend on http://0.0.0.0:8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
