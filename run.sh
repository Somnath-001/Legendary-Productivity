#!/bin/bash

echo "Stopping existing servers on ports 5001 and 5173..."
# Find and kill processes listening on ports 5001 (backend) and 5173 (frontend)
lsof -t -i:5001 | xargs kill -9 2>/dev/null
lsof -t -i:5173 | xargs kill -9 2>/dev/null

echo "Starting backend server..."
npm run dev --prefix backend &

echo "Starting frontend server..."
npm run dev --prefix frontend &

echo "Project is running!"
echo "Backend: http://localhost:5001"
echo "Frontend: http://localhost:5173"
