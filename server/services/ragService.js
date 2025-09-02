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
  }

  async initialize() {
    try {
      console.log('🚀 Initializing lightweight RAG service...');
      
      // Initialize the sentence transformer model
      this.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      
      console.log('✅ RAG service initialized successfully');
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
      console.log(`🔍 Creating embeddings for ${texts.length} texts...`);
      
      const embeddings = [];
      for (let i = 0; i < texts.length; i++) {
        const text = texts[i];
        const embedding = await this.embedder(text, { pooling: 'mean', normalize: true });
        const embeddingArray = Array.from(embedding.data);
        embeddings.push(embeddingArray);
        
        if ((i + 1) % 50 === 0) {
          console.log(`   Processed ${i + 1}/${texts.length} embeddings`);
        }
      }
      
      console.log(`✅ Created ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error) {
      console.error('❌ Error creating embeddings:', error);
      throw error;
    }
  }

  async findSimilarChunks(query, chunks, embeddings, topK = 10) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`🔍 Finding similar chunks for query: "${query}"`);
      
      // Create embedding for the query
      const queryEmbedding = await this.embedder(query, { pooling: 'mean', normalize: true });
      const queryVector = Array.from(queryEmbedding.data);
      
      // Calculate cosine similarity with all chunks
      const similarities = [];
      for (let i = 0; i < embeddings.length; i++) {
        const similarity = this.cosineSimilarity(queryVector, embeddings[i]);
        similarities.push({
          index: i,
          similarity: similarity,
          chunk: chunks[i]
        });
      }
      
      // Sort by similarity and get top K
      similarities.sort((a, b) => b.similarity - a.similarity);
      const topChunks = similarities.slice(0, topK);
      
      console.log(`✅ Found ${topChunks.length} most similar chunks`);
      console.log(`   Top similarity scores: ${topChunks.slice(0, 3).map(t => t.similarity.toFixed(3)).join(', ')}`);
      
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
      
      // Split into chunks
      const chunks = this.splitIntoChunks(pdfText, 1000, 200);
      console.log(`✅ Created ${chunks.length} chunks from PDF`);
      
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

  splitIntoChunks(text, maxChunkSize = 1000, overlap = 200) {
    const chunks = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + maxChunkSize;
      
      // Try to break at sentence boundary
      if (end < text.length) {
        const nextPeriod = text.indexOf('.', end - 100);
        const nextNewline = text.indexOf('\n', end - 100);
        
        if (nextPeriod > start && nextPeriod < end + 100) {
          end = nextPeriod + 1;
        } else if (nextNewline > start && nextNewline < end + 100) {
          end = nextNewline + 1;
        }
      }
      
      const chunk = text.substring(start, end).trim();
      if (chunk.length > 50) { // Only add chunks with meaningful content
        chunks.push(chunk);
      }
      
      start = end - overlap;
      if (start >= text.length) break;
    }
    
    return chunks;
  }

  async searchKnowledge(query, topK = 15) {
    if (this.chunks.length === 0) {
      throw new Error('No PDF chunks available. Please process a PDF first.');
    }
    
    try {
      console.log(`🔍 Searching knowledge base for: "${query}"`);
      
      // Find similar chunks
      const similarChunks = await this.findSimilarChunks(query, this.chunks, this.embeddings, topK);
      
      // Filter out low-quality chunks
      const relevantChunks = similarChunks.filter(item => {
        const chunk = item.chunk;
        const hasQueryTerms = query.toLowerCase().split(' ').some(term => 
          chunk.toLowerCase().includes(term)
        );
        
        // Reject metadata and generic content
        const isMetadata = chunk.includes('©') || chunk.includes('ISBN') || 
                          chunk.includes('Publisher:') || chunk.includes('Edition:');
        const isGenericQuote = chunk.includes('" - ') || chunk.includes('"Human behavior');
        const isTableOfContents = chunk.includes('VIRGO.') || chunk.includes('INDEX') || 
                                 chunk.includes('Chapter') || chunk.includes('Understanding');
        
        return !isMetadata && !isGenericQuote && !isTableOfContents && 
               (hasQueryTerms || item.similarity > 0.3);
      });
      
      console.log(`✅ Found ${relevantChunks.length} relevant chunks after filtering`);
      
      // Return the most relevant chunks
      return relevantChunks.map(item => ({
        content: item.chunk,
        similarity: item.similarity,
        relevance: this.calculateRelevance(item.chunk, query)
      }));
    } catch (error) {
      console.error('❌ Error searching knowledge:', error);
      throw error;
    }
  }

  calculateRelevance(chunk, query) {
    const queryTerms = query.toLowerCase().split(' ');
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
      service: 'Lightweight RAG (No ChromaDB)'
    };
  }
}

export default LightweightRAGService;
