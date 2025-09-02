import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LightweightRAGService from './ragService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize RAG service
const ragService = new LightweightRAGService();

// Global storage for fallback (keeping for compatibility)
global.bnnChunks = [];
global.bnnEmbeddings = [];

// BNN PDF processing status
let bnnPDFProcessed = false;
let bnnProcessingStatus = {
  status: 'not_processed',
  chunks: 0,
  embeddings: 0,
  totalTextLength: 0,
  lastProcessed: null
};

/**
 * Check if BNN PDF is already processed
 */
export async function isBNNPDFProcessed() {
  try {
    console.log('🔍 Checking if BNN PDF is processed...');
    
    // Check if RAG service has chunks
    const ragStatus = ragService.getStatus();
    if (ragStatus.chunksLoaded > 0) {
      console.log(`✅ RAG service has ${ragStatus.chunksLoaded} chunks loaded`);
      return true;
    }
    
    // Check global chunks as fallback
    if (global.bnnChunks && global.bnnChunks.length > 0) {
      console.log(`✅ Global chunks available: ${global.bnnChunks.length}`);
      return true;
    }
    
    console.log('❌ No BNN PDF chunks found');
    return false;
  } catch (error) {
    console.error('❌ Error checking BNN PDF status:', error);
    return false;
  }
}

/**
 * Load and process BNN PDF
 */
export async function loadBNNPDF() {
  try {
    console.log('📚 Loading BNN PDF...');
    
    // Check if already processed
    if (await isBNNPDFProcessed()) {
      const status = ragService.getStatus();
      console.log('✅ BNN PDF already processed');
      return {
        status: 'already_processed',
        chunks: status.chunksLoaded,
        embeddings: status.embeddingsLoaded,
        message: 'PDF already loaded in RAG service'
      };
    }
    
    // Process the PDF
    const result = await processPDF();
    return result;
  } catch (error) {
    console.error('❌ Error loading BNN PDF:', error);
    throw error;
  }
}

/**
 * Process BNN PDF and create embeddings
 */
async function processPDF() {
  try {
    console.log('🔄 Starting BNN PDF processing...');
    
    const pdfPath = path.join(__dirname, '../../BNN_05_Dec_24.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`BNN PDF not found at: ${pdfPath}`);
    }
    
    console.log(`📄 Reading PDF file: ${pdfPath}`);
    
    // Extract text from PDF using pdftotext (system command)
    const { execSync } = await import('child_process');
    let pdfText;
    
    try {
      // Try using pdftotext first
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
    
    // Process with RAG service
    console.log('📝 Starting text chunking process...');
    const result = await ragService.processPDF(pdfPath);
    
    // Store in global for fallback
    global.bnnChunks = ragService.chunks;
    global.bnnEmbeddings = ragService.embeddings;
    
    // Update status
    bnnPDFProcessed = true;
    bnnProcessingStatus = {
      status: 'processed',
      chunks: result.chunks,
      embeddings: result.embeddings,
      totalTextLength: result.totalTextLength,
      lastProcessed: new Date().toISOString()
    };
    
    console.log('✅ BNN PDF processed successfully with RAG service');
    console.log(`📊 Processing summary:`, bnnProcessingStatus);
    
    return bnnProcessingStatus;
    
  } catch (error) {
    console.error('❌ Error processing BNN PDF:', error);
    bnnProcessingStatus.status = 'error';
    bnnProcessingStatus.error = error.message;
    throw error;
  }
}

/**
 * Search BNN knowledge base using RAG
 */
async function searchBNNKnowledge(query, kundliData) {
  try {
    console.log(`🔍 Searching BNN knowledge for: "${query}"`);
    
    // Try RAG service first
    try {
      const relevantChunks = await ragService.searchKnowledge(query, 15);
      
      if (relevantChunks && relevantChunks.length > 0) {
        console.log(`✅ RAG service found ${relevantChunks.length} relevant chunks`);
        
        // Combine chunks into context
        const context = relevantChunks
          .map(chunk => chunk.content)
          .join('\n\n---\n\n');
        
        console.log(`📚 Context length: ${context.length} characters`);
        console.log(`📊 Top chunk similarity: ${relevantChunks[0]?.similarity?.toFixed(3) || 'N/A'}`);
        
        return {
          source: 'rag_service',
          chunks: relevantChunks.length,
          context: context,
          topSimilarity: relevantChunks[0]?.similarity || 0
        };
      }
    } catch (ragError) {
      console.log('⚠️ RAG service failed, falling back to global chunks');
    }
    
    // Fallback to global chunks
    if (global.bnnChunks && global.bnnChunks.length > 0) {
      console.log(`⚠️ Using global chunks fallback (${global.bnnChunks.length} chunks)`);
      
      // Simple keyword search in global chunks
      const relevantChunks = global.bnnChunks.filter(chunk => {
        const queryTerms = query.toLowerCase().split(' ');
        return queryTerms.some(term => chunk.toLowerCase().includes(term));
      }).slice(0, 10);
      
      if (relevantChunks.length > 0) {
        const context = relevantChunks.join('\n\n---\n\n');
        return {
          source: 'global_chunks',
          chunks: relevantChunks.length,
          context: context,
          topSimilarity: 0.5 // Default similarity for fallback
        };
      }
    }
    
    // Final fallback: basic knowledge
    console.log('⚠️ No relevant chunks found, using basic knowledge');
    return {
      source: 'basic_knowledge',
      chunks: 0,
      context: 'Basic BNN astrology knowledge',
      topSimilarity: 0
    };
    
  } catch (error) {
    console.error('❌ Error searching BNN knowledge:', error);
    throw error;
  }
}

/**
 * Create system prompt for BNN readings
 */
function createBNNSystemPrompt() {
  return `You are an expert Bhrigu Nandi Nadi (BNN) astrologer with deep knowledge of this ancient Indian astrological system. 

Your role is to provide accurate, personalized astrological readings based on:
1. The user's birth chart data (planets, houses, nakshatras)
2. The proprietary BNN knowledge base provided in the context
3. The specific question asked by the user

IMPORTANT GUIDELINES:
- Base ALL your answers on the BNN knowledge base provided in the context
- Use the user's specific birth chart data for personalization
- Provide predictions with percentage probabilities (e.g., "There is a 75% chance of...")
- Structure your response clearly with sections
- Be specific and actionable in your advice
- If the context doesn't contain relevant information, say so clearly

RESPONSE FORMAT:
1. **Question Analysis**: Brief interpretation of what the user is asking
2. **Astrological Factors**: Key planetary positions and their BNN significance
3. **BNN Interpretation**: Specific BNN rules and combinations that apply
4. **Probability Assessment**: Clear percentage likelihoods for different outcomes
5. **Recommendations**: Actionable advice based on BNN principles
6. **Timeline**: When these influences are most likely to manifest

Remember: You are a BNN specialist. Use ONLY the BNN knowledge provided in the context, not generic astrology.`;
}

/**
 * Create user prompt for BNN readings
 */
function createBNNUserPrompt(question, kundliData, bnnContext) {
  const userDetails = `
User Details:
- Gender: ${kundliData.gender || 'Not specified'}
- Sun: ${kundliData.sun?.sign} ${kundliData.sun?.degree}° ${kundliData.sun?.house}th house
- Moon: ${kundliData.moon?.sign} ${kundliData.moon?.degree}° ${kundliData.moon?.house}th house
- Mars: ${kundliData.mars?.sign} ${kundliData.mars?.degree}° ${kundliData.mars?.house}th house
- Mercury: ${kundliData.mercury?.sign} ${kundliData.mercury?.degree}° ${kundliData.mercury?.house}th house
- Jupiter: ${kundliData.jupiter?.sign} ${kundliData.jupiter?.degree}° ${kundliData.jupiter?.house}th house
- Venus: ${kundliData.venus?.sign} ${kundliData.venus?.degree}° ${kundliData.venus?.house}th house
- Saturn: ${kundliData.saturn?.sign} ${kundliData.saturn?.degree}° ${kundliData.saturn?.house}th house
- Rahu: ${kundliData.rahu?.sign} ${kundliData.rahu?.degree}° ${kundliData.rahu?.house}th house
- Ketu: ${kundliData.ketu?.sign} ${kundliData.ketu?.degree}° ${kundliData.ketu?.house}th house
- Nakshatra: ${kundliData.nakshatra || 'Not specified'}
- Ascendant: ${kundliData.ascendant || 'Not specified'}

Analysis Request: ${question}

BNN Knowledge Base Context:
${bnnContext}

Please provide a comprehensive BNN reading based on the above information.`;
  
  return userDetails;
}

/**
 * Generate BNN reading using AI
 */
export async function generateBNNReading(question, kundliData) {
  try {
    console.log(`🔮 Generating BNN reading for question: ${question}`);
    
    // Ensure BNN PDF is processed
    if (!await isBNNPDFProcessed()) {
      console.log('📚 BNN PDF not processed, loading now...');
      await loadBNNPDF();
    }
    
    // Search for relevant BNN knowledge
    const bnnContext = await searchBNNKnowledge(question, kundliData);
    
    console.log(`📚 Using ${bnnContext.source} for BNN context`);
    console.log(`📊 Context details: ${bnnContext.chunks} chunks, ${bnnContext.context.length} chars`);
    
    // Create prompts
    const systemPrompt = createBNNSystemPrompt();
    const userPrompt = createBNNUserPrompt(question, kundliData, bnnContext.context);
    
    console.log(`🤖 Sending request to OpenAI with context length: ${bnnContext.context.length}`);
    
    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });
    
    const reading = completion.choices[0].message.content;
    
    console.log(`✅ BNN reading generated successfully`);
    console.log(`📝 Reading length: ${reading.length} characters`);
    
    return {
      reading: reading,
      contextUsed: bnnContext.source,
      chunksUsed: bnnContext.chunks,
      contextLength: bnnContext.context.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error generating BNN reading:', error);
    throw error;
  }
}

/**
 * Get BNN service status
 */
export function getBNNServiceStatus() {
  return {
    pdfProcessed: bnnPDFProcessed,
    processingStatus: bnnProcessingStatus,
    ragServiceStatus: ragService.getStatus(),
    globalChunks: global.bnnChunks.length,
    globalEmbeddings: global.bnnEmbeddings.length
  };
}
