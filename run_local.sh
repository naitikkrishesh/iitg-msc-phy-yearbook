#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

if [ ! -d "$ROOT/yearbook-backend/venv" ]; then
  echo "Backend virtual environment not found."
  echo "Run:"
  echo "  cd yearbook-backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
  exit 1
fi

if [ ! -d "$ROOT/yearbook-frontend/node_modules" ]; then
  echo "Frontend dependencies not installed."
  echo "Run:"
  echo "  cd yearbook-frontend && npm install"
  exit 1
fi

cleanup() {
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

cd "$ROOT/yearbook-backend"
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd "$ROOT/yearbook-frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000"
echo "Swagger:  http://localhost:8000/docs"
echo "Frontend: http://localhost:5173"
echo ""
wait
