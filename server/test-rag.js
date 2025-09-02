import dotenv from 'dotenv';
import LightweightRAGService from './services/ragService.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testRAG() {
  try {
    console.log('🧪 Testing Lightweight RAG System with real BNN PDF...');
    
    // Initialize RAG service
    const ragService = new LightweightRAGService();
    await ragService.initialize();
    
    console.log('✅ RAG service initialized');
    
    // Use the actual BNN PDF from root directory
    const pdfPath = path.join(__dirname, '../BNN_05_Dec_24.pdf');
    console.log(`📄 Using PDF at: ${pdfPath}`);
    
    // Process the real PDF
    console.log('📝 Processing BNN PDF...');
    const result = await ragService.processPDF(pdfPath);
    
    console.log(`✅ PDF processed: ${result.chunks} chunks, ${result.embeddings} embeddings`);
    
    // Test search with BNN-specific queries
    const testQueries = [
      "What about my career and relationships?",
      "Health issues and remedies",
      "Financial predictions and wealth",
      "Marriage timing and compatibility"
    ];
    
    for (const query of testQueries) {
      console.log(`\n🔍 Testing search with query: "${query}"`);
      
      const searchResults = await ragService.searchKnowledge(query, 3);
      
      console.log(`📊 Found ${searchResults.length} relevant results`);
      
      searchResults.forEach((result, index) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`Similarity: ${result.similarity.toFixed(3)}`);
        console.log(`Content: ${result.content.substring(0, 150)}...`);
      });
    }
    
    console.log('\n🎉 RAG system test completed successfully!');
    console.log(`📚 Total chunks loaded: ${ragService.chunks.length}`);
    console.log(`🔍 Total embeddings: ${ragService.embeddings.length}`);
    
  } catch (error) {
    console.error('❌ RAG test failed:', error);
    process.exit(1);
  }
}

// Run test
testRAG();
