#!/bin/bash

echo "🚀 Starting ChromaDB for Astrometry..."

# Check if ChromaDB is already running
if curl -s http://localhost:8000/api/v1/heartbeat > /dev/null; then
    echo "✅ ChromaDB is already running on http://localhost:8000"
    exit 0
fi

# Check if chroma command is available
if ! command -v chroma &> /dev/null; then
    echo "❌ ChromaDB is not installed or not in PATH"
    echo "Please install ChromaDB first:"
    echo "pip install chromadb"
    exit 1
fi

# Create chroma_db directory if it doesn't exist
mkdir -p ./chroma_db

echo "📁 Starting ChromaDB with data directory: ./chroma_db"
echo "🌐 ChromaDB will be available at: http://localhost:8000"

# Start ChromaDB
chroma run --path ./chroma_db --host localhost --port 8000







