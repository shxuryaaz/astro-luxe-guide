import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LightweightRAGService {
  constructor() {
    this.embedder = null;
    this.chunks = [];
    this.embeddings = [];
    this.isInitialized = false;
    this.cache = new Map(); // Simple in-memory cache
  }

  async initialize() {
    try {
      console.log('🚀 Initializing OPTIMIZED lightweight RAG service...');
      
      // Use a faster, lighter model for speed optimization
      // Xenova/all-MiniLM-L6-v2 is good but let's try an even faster one
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        quantized: true, // Use quantized model for faster inference
        device: 'cpu'    // Ensure CPU usage for compatibility
      });
      
      console.log('✅ OPTIMIZED RAG service initialized successfully');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize RAG service:', error);
      throw error;
    }
  }

  async createEmbeddings(texts) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Creating embeddings for ${texts.length} texts (OPTIMIZED BATCH MODE)...`);
      
      const embeddings = [];
      const batchSize = 10; // Process 10 texts at once for speed
      
      // Process in batches for much faster embedding creation
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(texts.length/batchSize)} (${batch.length} texts)`);
        
        // Process entire batch at once - much faster than individual processing
        const batchEmbeddings = await this.embedder(batch, { pooling: 'mean', normalize: true });
        
        // Convert batch results to individual embeddings
        for (let j = 0; j < batch.length; j++) {
          const embeddingArray = Array.from(batchEmbeddings[j].data);
          embeddings.push(embeddingArray);
        }
      }
      
      console.log(`✅ Created ${embeddings.length} embeddings in OPTIMIZED mode`);
      return embeddings;
    } catch (error) {
      console.error('❌ Error creating embeddings:', error);
      throw error;
    }
  }

  async findSimilarChunks(query, chunks, embeddings, topK = 5) { // OPTIMIZED: Reduced to 5 for speed
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Finding similar chunks for query: "${query}" (OPTIMIZED MODE)`);
      
      // Create embedding for the query (single query, fast)
      const queryEmbedding = await this.embedder(query, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(queryEmbedding.data);
      
      // OPTIMIZED: Calculate cosine similarity with all chunks (vectorized)
      const similarities = [];
      for (let i = 0; i < embeddings.length; i++) {
        const similarity = this.cosineSimilarity(queryVector, embeddings[i]);
        
        // Early filtering: only keep chunks with decent similarity
        if (similarity > 0.2) { // Skip very low similarity chunks for speed
          similarities.push({
            index: i,
            similarity: similarity,
            chunk: chunks[i]
          });
        }
      }
      
      // Sort by similarity and get top K
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topChunks = similarities.slice(0, topK);
      
      console.log(`✅ Found ${topChunks.length} most similar chunks (OPTIMIZED)`);
      if (topChunks.length > 0) {
        console.log(`   Top similarity scores: ${topChunks.slice(0, 3).map(t => t.similarity.toFixed(3)).join(', ')}`);
      }
      
      return topChunks;
    } catch (error) {
      console.error('❌ Error finding similar chunks:', error);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) {
      return 0;
    }
    
    return dotProduct / (normA * normB);
  }

  async processPDF(pdfPath) {
    try {
      console.log(`📄 Processing PDF: ${pdfPath}`);
      
      // Extract text from PDF using pdftotext
      let pdfText;
      try {
        pdfText = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf8' });
        console.log('✅ PDF text extracted using pdftotext');
      } catch (error) {
        console.log('⚠️ pdftotext failed, trying alternative method...');
        // Fallback: try to read as text file (if already converted)
        pdfText = fs.readFileSync(pdfPath, 'utf-8');
        console.log('✅ PDF text read as text file');
      }
      
      if (!pdfText || pdfText.trim().length === 0) {
        throw new Error('Failed to extract text from PDF');
      }
      
      console.log(`📄 PDF parsed successfully. Text length: ${pdfText.length}`);
      
      // Split into chunks (OPTIMIZED: smaller chunks for faster processing)
      const chunks = this.splitIntoChunks(pdfText, 500, 100); // Reduced from 1000/200 to 500/100
      console.log(`✅ Created ${chunks.length} chunks from PDF (OPTIMIZED SIZE)`);
      
      // Create embeddings
      const embeddings = await this.createEmbeddings(chunks);
      
      // Store in memory
      this.chunks = chunks;
      this.embeddings = embeddings;
      
      console.log(`💾 Stored ${chunks.length} chunks and embeddings in memory`);
      
      return {
        chunks: chunks.length,
        embeddings: embeddings.length,
        totalTextLength: pdfText.length
      };
    } catch (error) {
      console.error('❌ Error processing PDF:', error);
      throw error;
    }
  }

  splitIntoChunks(text, maxChunkSize = 500, overlap = 100) { // OPTIMIZED: smaller chunks
    const chunks = [];
    let start = 0;
    
    console.log(`📝 Splitting text into chunks (max: ${maxChunkSize}, overlap: ${overlap})...`);
    
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // Try to break at sentence boundary for better chunk quality
      if (end < text.length) {
        const nextPeriod = text.indexOf('.', end - 50); // Reduced search range for speed
        const nextNewline = text.indexOf('\n', end - 50);
        
        if (nextPeriod > start && nextPeriod < end + 50) {
          end = nextPeriod + 1;
        } else if (nextNewline > start && nextNewline < end + 50) {
          end = nextNewline + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      
      // OPTIMIZED: More aggressive filtering for speed
      if (chunk.length > 30 && chunk.length < 1000) { // Only meaningful chunks
        // Skip metadata and low-quality content
        if (!chunk.includes('©') && !chunk.includes('ISBN') && 
            !chunk.includes('Publisher:') && !chunk.includes('Notion Press') &&
            !chunk.includes('VIRGO.') && !chunk.includes('INDEX')) {
          chunks.push(chunk);
        }
      }
      
      start = end - overlap;
      if (start >= text.length) break;
    }
    
    console.log(`✅ Created ${chunks.length} optimized chunks`);
    return chunks;
  }

  async searchKnowledge(query, topK = 5) { // OPTIMIZED: Reduced to 5 for speed
    if (this.chunks.length === 0) {
      throw new Error('No PDF chunks available. Please process a PDF first.');
    }
    
    try {
      // Check cache first
      const cacheKey = query.toLowerCase().trim();
      if (this.cache.has(cacheKey)) {
        console.log('✅ Using cached results for query');
        return this.cache.get(cacheKey);
      }
      
      console.log(`🔍 Searching knowledge base for: "${query}"`);
      
      // Find similar chunks
      const similarChunks = await this.findSimilarChunks(query, this.chunks, this.embeddings, topK);
      
      // OPTIMIZED: Faster filtering for speed
      const relevantChunks = similarChunks.filter(item => {
        const chunk = item.chunk;
        const lowerChunk = chunk.toLowerCase();
        const lowerQuery = query.toLowerCase();
        
        // Quick relevance check
        const hasQueryTerms = lowerQuery.split(' ').some(term => 
          lowerChunk.includes(term) && term.length > 2
        );
        
        // OPTIMIZED: Faster quality checks
        const isLowQuality = chunk.includes('©') || chunk.includes('ISBN') || 
                            chunk.includes('Publisher:') || chunk.includes('VIRGO.') ||
                            chunk.includes('INDEX') || chunk.includes('Chapter') ||
                            chunk.length < 50; // Reduced minimum length for speed
        
        // Must pass quality checks and have relevance
        return !isLowQuality && (hasQueryTerms || item.similarity > 0.3);
      });
      
      console.log(`✅ Found ${relevantChunks.length} relevant chunks after OPTIMIZED filtering`);
      
      // OPTIMIZED: Limit to top 3 most relevant chunks for maximum speed
      const finalChunks = relevantChunks.slice(0, 3).map(item => ({
        content: item.chunk,
        similarity: item.similarity,
        relevance: this.calculateRelevance(item.chunk, query)
      }));
      
      // Cache the results
      this.cache.set(cacheKey, finalChunks);
      
      return finalChunks;
      
    } catch (error) {
      console.error('❌ Error searching knowledge:', error);
      throw error;
    }
  }

  calculateRelevance(chunk, query) {
    const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
    let relevance = 0;
    
    for (const term of queryTerms) {
      if (chunk.toLowerCase().includes(term)) {
        relevance += 1;
      }
    }
    
    return relevance / queryTerms.length;
  }

  getStatus() {
    return {
      isInitialized: this.isInitialized,
      chunksLoaded: this.chunks.length,
      embeddingsLoaded: this.embeddings.length,
      cacheSize: this.cache.size,
      service: 'Lightweight RAG (No ChromaDB) - SPEED OPTIMIZED'
    };
  }

  // Clear cache to free memory
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }
}

export default LightweightRAGService;
