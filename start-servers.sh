#!/bin/bash

echo "🚀 Starting Astrometry Servers..."

# Function to check if a port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
}

# Function to start a server in background
start_server() {
    local name=$1
    local command=$2
    local port=$3
    
    echo "Starting $name on port $port..."
    if check_port $port; then
        echo "⚠️  Port $port is already in use. $name might already be running."
    else
        eval "$command" &
        echo "✅ $name started (PID: $!)"
    fi
}

# Start Frontend (React/Vite)
start_server "Frontend" "npm run dev" 5173

# Start Backend (PDF RAG Server)
cd server
start_server "Backend" "OPENAI_API_KEY=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 node server.js" 3001
cd ..

# Start ChromaDB (Vector Database)
if command -v chroma &> /dev/null; then
    start_server "ChromaDB" "chroma run --host localhost --port 8000" 8000
else
    echo "⚠️  ChromaDB not found. Install with: pip install chromadb"
    echo "   Or use Docker: docker run -p 8000:8000 chromadb/chroma"
fi

echo ""
echo "🎉 All servers are starting..."
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo "🗄️  ChromaDB: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for all background processes
wait
