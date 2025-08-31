# 📚 BNN PDF RAG System Setup Guide

This guide will help you set up the **PDF-based RAG (Retrieval Augmented Generation) system** that uses your Bhrigu Nandi Nadi PDF document as the knowledge base for AI readings.

## 🎯 What This System Does

Instead of using generic astrological knowledge, the AI will:
1. **Process your BNN PDF** - Extract and chunk the text
2. **Create embeddings** - Convert text chunks into searchable vectors
3. **Store in vector database** - ChromaDB for fast retrieval
4. **Search relevant content** - Find the most relevant BNN knowledge for each question
5. **Generate readings** - Use your specific BNN content to create accurate readings

## 🛠️ Setup Requirements

### 1. Backend Server Dependencies
```bash
cd server
npm install
```

### 2. ChromaDB (Vector Database)
```bash
# Install ChromaDB
pip install chromadb

# Or using Docker
docker run -p 8000:8000 chromadb/chroma
```

### 3. Environment Variables
Create `server/.env`:
```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

## 🚀 Quick Start

### Step 1: Start the Backend Server
```bash
cd server
npm run dev
```

### Step 2: Start ChromaDB
```bash
# If using pip
chroma run --host localhost --port 8000

# If using Docker
docker run -p 8000:8000 chromadb/chroma
```

### Step 3: Start the Frontend
```bash
npm run dev
```

### Step 4: Upload Your BNN PDF
1. Go to `/admin` in your app
2. Upload your Bhrigu Nandi Nadi PDF
3. Wait for processing (may take a few minutes)
4. Check the status shows "Active"

## 📋 Detailed Setup Instructions

### Backend Server Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Create Uploads Directory**
   ```bash
   mkdir server/uploads
   ```

3. **Set Environment Variables**
   ```bash
   cp server/env.example server/.env
   # Edit server/.env with your OpenAI API key
   ```

4. **Start the Server**
   ```bash
   npm run dev
   ```

### ChromaDB Setup

**Option A: Using pip (Recommended)**
```bash
pip install chromadb
chroma run --host localhost --port 8000
```

**Option B: Using Docker**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**Option C: Using conda**
```bash
conda install -c conda-forge chromadb
chroma run --host localhost --port 8000
```

### Frontend Configuration

1. **Add Backend URL to Environment**
   ```bash
   # In your .env file
   VITE_BACKEND_URL=http://localhost:3001
   ```

2. **Start Frontend**
   ```bash
   npm run dev
   ```

## 🔧 How the RAG System Works

### 1. PDF Processing
```javascript
// The system processes your PDF:
const data = await pdf(dataBuffer);
const text = data.text;
const chunks = splitTextIntoChunks(text);
```

### 2. Embedding Creation
```javascript
// Creates embeddings for each chunk:
const embeddings = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: chunk
});
```

### 3. Vector Storage
```javascript
// Stores in ChromaDB:
await collection.add({
  ids: ids,
  embeddings: embeddings,
  documents: chunks,
  metadatas: metadatas
});
```

### 4. Knowledge Retrieval
```javascript
// When generating a reading:
const query = createBNNQuery(question, kundliData);
const results = await searchBNNKnowledge(query);
const bnnContext = results.join('\n\n');
```

### 5. AI Generation
```javascript
// Uses your BNN content as context:
const systemPrompt = createBNNSystemPrompt(bnnContext);
const response = await openai.chat.completions.create({
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]
});
```

## 📊 System Architecture

```
Your BNN PDF → Text Extraction → Chunking → Embeddings → ChromaDB
                                                           ↓
User Question → Query Embedding → Vector Search → Relevant BNN Content
                                                           ↓
AI Model → BNN Context + Question → Structured Reading
```

## 🔍 Testing the System

### 1. Check Backend Health
```bash
curl http://localhost:3001/health
# Should return: {"status":"OK","message":"Astro Oracle Server is running"}
```

### 2. Check ChromaDB
```bash
curl http://localhost:8000/api/v1/heartbeat
# Should return: {"nanosecond heartbeat":1234567890}
```

### 3. Upload Test PDF
1. Go to `/admin`
2. Upload a small BNN PDF
3. Check processing completes successfully

### 4. Test AI Reading
1. Generate a Kundli
2. Ask a question
3. Verify the reading cites specific BNN content

## 🐛 Troubleshooting

### Backend Server Issues
```bash
# Check if server is running
curl http://localhost:3001/health

# Check logs
cd server
npm run dev
```

### ChromaDB Issues
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Restart ChromaDB
chroma run --host localhost --port 8000
```

### PDF Processing Issues
- Ensure PDF is not password protected
- Check file size (max 10MB)
- Verify PDF contains readable text (not just images)

### OpenAI API Issues
- Verify API key is correct
- Check billing is set up
- Ensure you have sufficient credits

## 📈 Performance Optimization

### For Large PDFs
```javascript
// Adjust chunk size in server/services/bnnService.js
function splitTextIntoChunks(text, maxChunkSize = 1000, overlap = 200)
```

### For Better Retrieval
```javascript
// Adjust number of results in searchBNNKnowledge
const results = await collection.query({
  nResults: 5, // Increase for more context
  include: ["documents", "metadatas", "distances"]
});
```

### For Faster Processing
```javascript
// Add delay between embedding requests
if (i % 10 === 0) {
  await new Promise(resolve => setTimeout(resolve, 100));
}
```

## 🔒 Security Considerations

1. **PDF Storage**: Uploads are stored locally, not in cloud
2. **API Keys**: All keys are environment variables
3. **Rate Limiting**: Backend includes rate limiting
4. **File Validation**: Only PDF files accepted
5. **Size Limits**: 10MB file size limit

## 🚀 Production Deployment

### Backend Deployment
```bash
# Build for production
cd server
npm run build

# Deploy to your preferred platform
# (Vercel, Railway, Heroku, etc.)
```

### ChromaDB Deployment
```bash
# Use cloud ChromaDB or deploy your own
# Options: ChromaDB Cloud, Pinecone, Weaviate
```

### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
OPENAI_API_KEY=your_production_key
CHROMA_HOST=your_chroma_host
CHROMA_PORT=8000
```

## 📚 Next Steps

1. **Upload your BNN PDF** via the admin panel
2. **Test with sample questions** to verify readings
3. **Fine-tune chunking** for better retrieval
4. **Add more astrological systems** (KP, Parashari, etc.)
5. **Implement user management** for admin access
6. **Add analytics** to track usage and performance

---

**Your BNN PDF is now the foundation of your AI astrology system! 🌟**
