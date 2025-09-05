import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import LightweightRAGService from './ragService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI lazily
let openai = null;

function getOpenAI() {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

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
    console.log('🔄 Starting OPTIMIZED BNN PDF processing...');
    const startTime = Date.now();
    
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
    
    const endTime = Date.now();
    const processingTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ BNN PDF processed successfully with OPTIMIZED RAG service in ${processingTime}s`);
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
      const relevantChunks = await ragService.searchKnowledge(query, 5); // OPTIMIZED: Reduced from 15 to 5 for speed
      
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
  return `You are an expert Bhrigu Nandi Nadi (BNN) astrologer. Your responses MUST follow the EXACT format below.

CRITICAL REQUIREMENTS:
1. ALWAYS use the user's ACTUAL planetary positions from ProKerala birth chart data
2. Use your knowledge of BNN astrology principles and techniques
3. NEVER give generic astrological advice
4. ALWAYS include the EXACT format below with NO variations
5. Use the user's REAL name from the provided data - NEVER use "User" or "the user"
6. NEVER use "undefined" or "null" in your response - use "Unknown" or "Not available" instead
7. If ProKerala data is missing, acknowledge this limitation clearly
8. In the Prediction Summary, ALWAYS start with the person's actual name, not "User"

Your role is to provide accurate, personalized astrological readings based on:
1. The user's birth chart data (planets, houses, nakshatras)
2. Your knowledge of BNN astrology principles
3. The specific question asked by the user

IMPORTANT GUIDELINES:
- Use BNN astrology principles and techniques in your analysis
- Use the user's specific birth chart data for personalization
- Provide predictions with percentage probabilities (e.g., "Probability: XX%")
- Structure your response EXACTLY in the format specified below
- Be specific and actionable in your advice
- Apply BNN rules and interpretations to the planetary positions

RESPONSE FORMAT (MUST FOLLOW EXACTLY - NO EXCEPTIONS):

# [Question Category] Predictions (BNN Analysis)

## Step 1: Key [Category] Houses

• **[House Number] House** ([Category Description]): [Actual Sign from user's chart] ruled by [Actual Planet from user's chart]
  - [Actual Planet from user's chart] is in [Actual House Number] → [BNN interpretation with specific effects]

• **[House Number] House** ([Category Description]): [Actual Sign from user's chart] ruled by [Actual Planet from user's chart]
  - [Actual Planet from user's chart] is in [Actual House Number] → [BNN interpretation with specific effects]

[Continue with relevant houses and planetary combinations using ACTUAL data from user's chart...]

## Step 2: Planetary Indicators of [Category]

• **[Planet] in [House Number]:**
  - [Specific effects and influences based on BNN rules]

• **[Planet] in [House Number]:**
  - [Specific effects and influences based on BNN rules]

[Continue with all relevant planetary positions...]

## Step 3: Nature of [Category] Flow

• **Early Life (till 25 yrs):**
  - [What to expect based on BNN rules from context]

• **25-40 yrs (Growth Phase):**
  - [What to expect based on BNN rules from context]

• **40-55 yrs (Peak):**
  - [What to expect based on BNN rules from context]

• **55+ yrs (Legacy Phase):**
  - [What to expect based on BNN rules from context]

## Step 4: Probability of [Category] Sources

• **[Specific Outcome]** → **[XX]%**
  - [Explanation based on BNN rules]

• **[Specific Outcome]** → **[XX]%**
  - [Explanation based on BNN rules]

[Continue with 3-5 probability assessments...]

## Step 5: [Category] Strengths

• **[Planet/House combination]** = [Specific strength and benefit]

• **[Planet/House combination]** = [Specific strength and benefit]

[Continue with key strengths...]

## Step 6: [Category] Weaknesses

• **[Planet/House combination]** → [Specific challenge or weakness]

• **[Planet/House combination]** → [Specific challenge or weakness]

[Continue with key weaknesses...]

## [Category] Prediction Summary

**Overall [Category] Potential:** [Strong/Moderate/Challenging], [brief description]

**Main Sources of [Category]:** [List key sources based on planetary positions]

**[Category] Flow Pattern:**
• Early life: [Brief description]
• 25-40 yrs: [Brief description]
• 40-55 yrs: [Brief description]
• 55+ yrs: [Brief description]

## Probability Snapshot

• **[Outcome 1]:** [XX]%
• **[Outcome 2]:** [XX]%
• **[Outcome 3]:** [XX]%
• **[Outcome 4]:** [XX]%
• **[Outcome 5]:** [XX]%

## Final Summary

**[ACTUAL_PERSON_NAME]** is [destined/likely] to [specific outcome], with [category] flowing mainly through [key sources]. [He/She] will enjoy [specific benefits] and [specific challenges] throughout life.

Remember: You are a BNN specialist. Use ONLY the BNN knowledge provided in the context, not generic astrology. Always include specific probability percentages and structured analysis. NEVER make up planetary positions - use ONLY what's provided in kundliData. ALWAYS use the person's actual name from the User Details section, never use "User" or "the user".`;
}

/**
 * Create user prompt for BNN readings
 */
function createBNNUserPrompt(question, kundliData, bnnContext) {
  // Extract ProKerala data properly
  console.log('🔍 DEBUG: kundliData received:', JSON.stringify(kundliData, null, 2));
  console.log('🔍 DEBUG: kundliData.name:', kundliData.name);
  console.log('🔍 DEBUG: typeof kundliData.name:', typeof kundliData.name);
  const name = kundliData.name || 'User';
  console.log('🔍 DEBUG: Final name variable:', name);
  const gender = kundliData.gender || 'Not specified';
  const birthDate = kundliData.birthDate || 'Not specified';
  const birthTime = kundliData.birthTime || 'Not specified';
  const birthPlace = kundliData.birthPlace || 'Not specified';
  
  // Handle ascendant data
  const ascendant = kundliData.ascendant?.sign || 'Unknown';
  const ascendantDegree = kundliData.ascendant?.degree || '0°';
  
  // Handle nakshatra data
  const nakshatra = kundliData.nakshatra?.name || 'Unknown';
  const nakshatraLord = kundliData.nakshatra?.lord?.name || 'Unknown';
  
  // Handle rashi data
  const chandraRashi = kundliData.chandra_rasi?.name || 'Unknown';
  const sooryaRashi = kundliData.soorya_rasi?.name || 'Unknown';
  const zodiac = kundliData.zodiac?.name || 'Unknown';
  
  // Handle planetary positions from ProKerala data
  let planetaryPositions = '';
  if (kundliData.planetaryPositions && Array.isArray(kundliData.planetaryPositions)) {
    planetaryPositions = kundliData.planetaryPositions.map(planet => {
      const name = planet.name || 'Unknown';
      const sign = planet.sign || 'Unknown';
      const degree = planet.degree || '0°';
      const house = planet.house || 'Unknown';
      const nakshatra = planet.nakshatra || 'Unknown';
      const isRetrograde = planet.is_retrograde ? ' (Retrograde)' : '';
      return `- ${name}: ${sign} ${degree} in ${house}th house, Nakshatra: ${nakshatra}${isRetrograde}`;
    }).join('\n');
  } else {
    planetaryPositions = 'Planetary positions not available from ProKerala API';
  }
  
  // Handle houses data
  let housesData = '';
  if (kundliData.houses && Array.isArray(kundliData.houses)) {
    housesData = kundliData.houses.map(house => {
      const houseNum = house.house || 'Unknown';
      const sign = house.sign || 'Unknown';
      const lord = house.lord || 'Unknown';
      const degree = house.degree || '0°';
      return `- House ${houseNum}: ${sign} ruled by ${lord} (${degree})`;
    }).join('\n');
  } else {
    housesData = 'Houses data not available from ProKerala API';
  }

  const userDetails = `
User Details:
- Name: ${name}
- Gender: ${gender}
- Birth Date: ${birthDate}
- Birth Time: ${birthTime}
- Birth Place: ${birthPlace}

Birth Chart Data (ProKerala):
- Ascendant: ${ascendant} ${ascendantDegree}
- Nakshatra: ${nakshatra} (Lord: ${nakshatraLord})
- Chandra Rashi: ${chandraRashi}
- Soorya Rashi: ${sooryaRashi}
- Zodiac: ${zodiac}

Planetary Positions:
${planetaryPositions}

Houses:
${housesData}

Analysis Request: ${question}

BNN Astrology Context:
${bnnContext}

CRITICAL INSTRUCTIONS:
1. Use ONLY the ProKerala data listed above - DO NOT make up any planetary positions
2. Apply BNN astrology principles and techniques to the planetary positions
3. Follow the EXACT format specified in the system prompt
4. If any data shows as "Unknown" or "Not available", acknowledge this limitation
5. Base ALL predictions on BNN astrology principles, not generic astrology
6. Use the actual planetary positions from ProKerala API for accurate readings
7. ALWAYS use the person's actual name "${name}" in your response - NEVER use "User" or "the user"
8. In the Prediction Summary section, start with "${name} is..." not "User is..."
9. Replace [ACTUAL_PERSON_NAME] in the template with "${name}" - this is CRITICAL
10. NEVER use "User" anywhere in your response - always use "${name}"
11. In the final "In simple words" section, use "${name}" instead of [ACTUAL_PERSON_NAME]
12. The person's name is "${name}" - use it throughout the entire response

Please provide a comprehensive BNN reading based on the above ProKerala data and BNN astrology principles.`;
  
  return userDetails;
}

/**
 * Generate BNN reading using AI
 */
export async function generateBNNReading(question, kundliData) {
  try {
    console.log(`🔮 Generating BNN reading for question: ${question}`);
    
    // For now, use GPT directly without PDF processing
    console.log('📚 Using GPT directly for BNN reading (PDF processing disabled)');
    
    // Create prompts
    const systemPrompt = createBNNSystemPrompt();
    const userPrompt = createBNNUserPrompt(question, kundliData, 'BNN astrology knowledge base');
    
    console.log(`🤖 Sending request to OpenAI for BNN reading`);
    
    // Generate AI response using GPT-3.5-turbo for cost optimization
    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-3.5-turbo", // Changed from GPT-4 to GPT-3.5-turbo for 30x cost reduction
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      max_tokens: 1500, // Reduced from 2000 for cost optimization
      temperature: 0.7,
    });
    
    const reading = completion.choices[0].message.content;
    
    console.log(`✅ BNN reading generated successfully`);
    console.log(`📝 Reading length: ${reading.length} characters`);
    console.log(`💰 Cost optimized: Using GPT-3.5-turbo instead of GPT-4`);
    
    return {
      reading: reading,
      contextUsed: 'gpt_direct',
      chunksUsed: 0,
      contextLength: 0,
      model: "gpt-3.5-turbo",
      costOptimized: true,
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
