#!/bin/bash

# Function to kill process on port
kill_port() {
  PORT=$1
  PID=$(lsof -ti:$PORT)
  if [ -n "$PID" ]; then
    echo "Killing process on port $PORT (PID: $PID)..."
    kill -9 $PID
  else
    echo "No process found on port $PORT."
  fi
}

echo "Cleaning up ports..."
kill_port 8000
kill_port 3000

# Start Backend
echo "Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Virtual environment not found. Creating..."
    python3 -m venv venv
fi
source venv/bin/activate

# Check if requirements need installing (simple check)
if ! pip freeze | grep -q fastapi; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
fi

# Start uvicorn in background
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
echo "Backend started (PID: $BACKEND_PID)"
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
# Start next dev in background
npm run dev &
FRONTEND_PID=$!
echo "Frontend started (PID: $FRONTEND_PID)"
cd ..

echo "------------------------------------------------"
echo "Application is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "------------------------------------------------"
echo "Press CTRL+C to stop all services."

# Trap SIGINT (Ctrl+C) to kill child processes
trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; exit" SIGINT

# Wait indefinitely so the script keeps running and can trap the signal
wait
