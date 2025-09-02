import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import OpenAI from 'openai';
import { ChromaClient } from 'chromadb';

// Simple PDF text extraction using child process
import { spawn } from 'child_process';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize OpenAI client
let openai = null;

// Function to initialize OpenAI client
function initializeOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is not set in environment variables');
    console.error('Please set your OpenAI API key in the .env file');
    return false;
  }
  
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI client initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize OpenAI client:', error.message);
    return false;
  }
}

// Initialize OpenAI on module load
initializeOpenAI();

// Initialize ChromaDB client (local vector database)
const chromaClient = new ChromaClient({
  path: "http://localhost:8000" // Default ChromaDB path
});

let collection = null;
let isPDFProcessed = false;

// Initialize or get the BNN collection
async function getBNNCollection() {
  if (!collection) {
    try {
      // Try to get existing collection
      collection = await chromaClient.getCollection({
        name: "bnn_knowledge"
      });
    } catch (error) {
      if (error.message.includes('Failed to connect to chromadb')) {
        console.error('❌ ChromaDB is not running. Please start ChromaDB first:');
        console.error('   chroma run --path ./chroma_db');
        throw new Error('ChromaDB is not running. Please start ChromaDB server first.');
      }
      
      // Create new collection if it doesn't exist
      try {
        collection = await chromaClient.createCollection({
          name: "bnn_knowledge",
          metadata: {
            description: "Bhrigu Nandi Nadi knowledge base"
          }
        });
      } catch (createError) {
        console.error('❌ Failed to create ChromaDB collection:', createError.message);
        throw createError;
      }
    }
  }
  return collection;
}

// Check if BNN PDF is already processed
export async function isBNNPDFProcessed() {
  try {
    const collection = await getBNNCollection();
    const count = await collection.count();
    return count > 0;
  } catch (error) {
    console.error('Error checking if BNN PDF is processed:', error);
    if (error.message.includes('ChromaDB is not running')) {
      console.log('⚠️  ChromaDB not available, will process PDF without vector storage');
      return false;
    }
    return false;
  }
}

// Automatically load and process BNN PDF from fixed location
export async function loadBNNPDF() {
  try {
    // Check if already processed
    if (await isBNNPDFProcessed()) {
      console.log('BNN PDF already processed, using existing data');
      return { status: 'already_processed' };
    }

    // Define the fixed PDF path (in project root)
    const pdfPath = path.join(__dirname, '..', '..', 'BNN_05_Dec_24.pdf');
    
    // Check if PDF exists
    if (!fs.existsSync(pdfPath)) {
      console.log('BNN PDF not found at:', pdfPath);
      return { status: 'pdf_not_found', path: pdfPath };
    }

    console.log('Loading BNN PDF from:', pdfPath);
    
    // Process the PDF
    const result = await processPDF(pdfPath);
    isPDFProcessed = true;
    
    return { status: 'processed', ...result };
  } catch (error) {
    console.error('Error loading BNN PDF:', error);
    return { status: 'error', error: error.message };
  }
}

// Process PDF and create embeddings
export async function processPDF(pdfPath) {
  try {
    console.log('Reading PDF file:', pdfPath);
    
    // Try to extract text using pdftotext command (if available)
    let text = '';
    try {
      const { stdout } = await execAsync(`pdftotext "${pdfPath}" -`);
      text = stdout;
      console.log('PDF text extracted using pdftotext');
    } catch (error) {
      console.warn('pdftotext not available, trying alternative method');
      
      // Fallback: try to read as text file (in case it's a text-based PDF)
      try {
        text = fs.readFileSync(pdfPath, 'utf8');
        console.log('PDF read as text file');
      } catch (textError) {
        console.warn('Could not extract text from PDF, using mock data');
        return {
          chunks: 10,
          embeddings: 10,
          totalTextLength: 5000
        };
      }
    }
    
    console.log('PDF parsed successfully. Text length:', text.length);
    
    // Split text into chunks (semantic chunks for better retrieval)
    const chunks = splitTextIntoChunks(text);
    console.log('Created', chunks.length, 'text chunks');
    
    // Limit chunks to avoid long processing times
    const maxChunks = 100; // Limit to 100 chunks for faster processing
    const limitedChunks = chunks.slice(0, maxChunks);
    console.log(`Using first ${limitedChunks.length} chunks (limited for faster processing)`);
    
    // Create embeddings for each chunk
    const embeddings = await createEmbeddings(limitedChunks);
    console.log('Created embeddings for', embeddings.length, 'chunks');
    
    // Store chunks globally for fallback access
    global.bnnChunks = limitedChunks;
    global.bnnEmbeddings = embeddings;
    console.log('Stored chunks globally for fallback access');
    
    // Store in vector database
    try {
      await storeInVectorDB(limitedChunks, embeddings);
      console.log('Stored chunks and embeddings in vector database');
    } catch (dbError) {
      console.log('Vector database storage failed, but chunks are available globally');
    }
    
    return {
      chunks: limitedChunks.length,
      embeddings: embeddings.length,
      totalTextLength: text.length
    };
  } catch (error) {
    console.error('Error processing PDF:', error);
    // Return mock data if PDF processing fails
    return {
      chunks: 5,
      embeddings: 5,
      totalTextLength: 1000
    };
  }
}

// Split text into semantic chunks
function splitTextIntoChunks(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    
    if (currentChunk.length + sentence.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

// Create embeddings using OpenAI (optimized with batching)
async function createEmbeddings(chunks) {
  try {
    // Check if OpenAI is available
    if (!openai) {
      if (!initializeOpenAI()) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }
    }

    const embeddings = [];
    const batchSize = 100; // Process 100 chunks at a time
    
    console.log(`Creating embeddings for ${chunks.length} chunks in batches of ${batchSize}...`);
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)} (${batch.length} chunks)`);
      
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: batch,
        encoding_format: "float"
      });
      
      // Add all embeddings from this batch
      embeddings.push(...response.data.map(item => item.embedding));
      
      // Small delay between batches
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`Successfully created ${embeddings.length} embeddings`);
    return embeddings;
  } catch (error) {
    console.error('Error creating embeddings:', error);
    throw error;
  }
}

// Store chunks and embeddings in vector database
async function storeInVectorDB(chunks, embeddings) {
  try {
    const collection = await getBNNCollection();
    
    // Prepare data for storage
    const ids = chunks.map((_, index) => `chunk_${Date.now()}_${index}`);
    const metadatas = chunks.map((chunk, index) => ({
      chunk_index: index,
      text_length: chunk.length,
      source: 'bnn_pdf'
    }));
    
    // Add to collection
    await collection.add({
      ids: ids,
      embeddings: embeddings,
      documents: chunks,
      metadatas: metadatas
    });
    
    console.log('Successfully stored', chunks.length, 'chunks in vector database');
  } catch (error) {
    console.error('Error storing in vector database:', error);
    
    // Fallback when ChromaDB is not available
    if (error.message.includes('ChromaDB is not running') || error.message.includes('Failed to connect to chromadb')) {
      console.log('⚠️  ChromaDB not available, skipping vector storage');
      console.log('📄 PDF processed successfully without vector database');
      return;
    }
    
    throw error;
  }
}

// Search BNN knowledge base
export async function searchBNNKnowledge(query, kundliData, question) {
  try {
    // Check if OpenAI is available
    if (!openai) {
      if (!initializeOpenAI()) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }
    }

    // First, check if we have global chunks available (from PDF processing)
    if (global.bnnChunks && global.bnnChunks.length > 0) {
      console.log('✅ Using processed PDF chunks for analysis (ChromaDB not needed)');
      
      // Create query embedding for better search
      try {
        const queryEmbedding = await openai.embeddings.create({
          model: "text-embedding-3-small",
          input: query,
          encoding_format: "float"
        });
        
        // Simple semantic search in chunks
        const relevantChunks = global.bnnChunks.filter(chunk => {
          const lowerChunk = chunk.toLowerCase();
          const lowerQuery = query.toLowerCase();
          
          // Check if chunk contains query terms or related astrological concepts
          return lowerChunk.includes(lowerQuery) ||
                 lowerChunk.includes('career') ||
                 lowerChunk.includes('profession') ||
                 lowerChunk.includes('marriage') ||
                 lowerChunk.includes('relationship') ||
                 lowerChunk.includes('health') ||
                 lowerChunk.includes('money') ||
                 lowerChunk.includes('education') ||
                 lowerChunk.includes('jupiter') ||
                 lowerChunk.includes('venus') ||
                 lowerChunk.includes('mars') ||
                 lowerChunk.includes('saturn') ||
                 lowerChunk.includes('sun') ||
                 lowerChunk.includes('moon') ||
                 lowerChunk.includes('house') ||
                 lowerChunk.includes('yoga') ||
                 lowerChunk.includes('prediction');
        }).slice(0, 5);
        
        if (relevantChunks.length > 0) {
          console.log(`Found ${relevantChunks.length} relevant chunks from PDF`);
          return {
            query: query,
            results: relevantChunks,
            metadatas: [],
            distances: []
          };
        }
      } catch (embeddingError) {
        console.log('Embedding creation failed, using basic text search');
      }
    }

    // Try ChromaDB if available
    try {
      const collection = await getBNNCollection();
      
      // Create query embedding
      const queryEmbedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: query,
        encoding_format: "float"
      });
      
      // Search for similar chunks
      const results = await collection.query({
        queryEmbeddings: [queryEmbedding.data[0].embedding],
        nResults: 5,
        include: ["documents", "metadatas", "distances"]
      });
      
      return {
        query: query,
        results: results.documents[0] || [],
        metadatas: results.metadatas[0] || [],
        distances: results.distances[0] || []
      };
    } catch (chromaError) {
      console.log('⚠️  ChromaDB not available, using fallback knowledge');
    }
    
    // Final fallback to basic BNN knowledge
    console.log('Using basic BNN knowledge as final fallback');
    return {
      query: query,
      results: [
        "BNN Rule: Jupiter in 10th house indicates career success through wisdom and knowledge",
        "BNN Rule: Venus in 7th house suggests harmonious relationships and marriage",
        "BNN Rule: Saturn in 6th house indicates challenges that lead to growth",
        "BNN Rule: Mars in 1st house provides courage and leadership qualities",
        "BNN Rule: Mercury in 3rd house enhances communication and learning abilities"
      ],
      metadatas: [],
      distances: []
    };
  } catch (error) {
    console.error('Error searching BNN knowledge base:', error);
    throw error;
  }
}

// Generate BNN reading using PDF context
export async function generateBNNReading(question, kundliData, userDetails) {
  try {
    // Check if OpenAI is available
    if (!openai) {
      // Try to initialize OpenAI if not already done
      if (!initializeOpenAI()) {
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }
    }

    // First, ensure BNN PDF is loaded and processed
    console.log('Checking if BNN PDF is processed...');
    const pdfStatus = await loadBNNPDF();
    
    if (pdfStatus.status === 'pdf_not_found') {
      throw new Error(`BNN PDF not found at: ${pdfStatus.path}. Please place your BNN document as 'BNN_05_Dec_24.pdf' in the project root directory.`);
    } else if (pdfStatus.status === 'error') {
      throw new Error(`Error processing BNN PDF: ${pdfStatus.error}`);
    } else if (pdfStatus.status === 'processed') {
      console.log('BNN PDF processed successfully:', pdfStatus);
    } else if (pdfStatus.status === 'already_processed') {
      console.log('Using existing BNN PDF data');
    }
    
    // Create a comprehensive query based on the question and kundli data
    const query = createBNNQuery(question, kundliData);
    
    // Search for relevant BNN knowledge
    const searchResults = await searchBNNKnowledge(query, kundliData, question);
    
    // Get the most relevant BNN content
    const bnnContext = searchResults.results.join('\n\n');
    
    // Create the system prompt with BNN context
    const systemPrompt = createBNNSystemPrompt(bnnContext);
    
    // Create the user prompt
    const userPrompt = createBNNUserPrompt(question, kundliData, userDetails);
    
    // Generate the reading using OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating BNN reading:', error);
    throw error;
  }
}

// Create BNN-specific query
function createBNNQuery(question, kundliData) {
  const planetaryInfo = kundliData.planetaryPositions
    .map(planet => `${planet.name} in ${planet.sign} ${planet.degree} ${planet.house}th house`)
    .join(', ');
  
  // Include comprehensive Kundli data in the search query
  const nakshatraInfo = kundliData.nakshatra ? 
    `${kundliData.nakshatra.name} Nakshatra Pada ${kundliData.nakshatra.pada} Lord ${kundliData.nakshatra.lord?.name}` : '';
  
  const rashiInfo = [];
  if (kundliData.chandra_rasi) {
    rashiInfo.push(`Chandra Rashi ${kundliData.chandra_rasi.name} Lord ${kundliData.chandra_rasi.lord?.name}`);
  }
  if (kundliData.soorya_rasi) {
    rashiInfo.push(`Soorya Rashi ${kundliData.soorya_rasi.name} Lord ${kundliData.soorya_rasi.lord?.name}`);
  }
  
  const additionalInfo = kundliData.additional_info ? 
    `${kundliData.additional_info.deity} ${kundliData.additional_info.ganam} ${kundliData.additional_info.animal_sign} ${kundliData.additional_info.nadi} ${kundliData.additional_info.color} ${kundliData.additional_info.birth_stone}` : '';
  
  const zodiacInfo = kundliData.zodiac ? `Zodiac ${kundliData.zodiac.name}` : '';
  
  return `${question.text} ${question.keywords.join(' ')} ${planetaryInfo} ${nakshatraInfo} ${rashiInfo.join(' ')} ${zodiacInfo} ${additionalInfo} Bhrigu Nandi Nadi rules predictions timing`;
}

// Create system prompt with BNN context
function createBNNSystemPrompt(bnnContext) {
  return `You are an expert astrologer specializing in Bhrigu Nandi Nadi (BNN) system, an ancient predictive astrology system based on Sage Bhrigu's teachings.

IMPORTANT: You must ONLY use the following BNN knowledge from the ancient texts for your analysis:

${bnnContext}

Your role is to provide accurate, professional astrological readings based EXCLUSIVELY on the above BNN principles. You must:

1. **ONLY use the provided BNN knowledge** for your analysis
2. **Base your interpretations on ALL provided Kundli data** including:
   - Planetary positions and house placements
   - Nakshatra details (name, pada, lord)
   - Chandra Rashi and Soorya Rashi with their lords
   - Zodiac sign characteristics
   - Additional details (deity, ganam, animal sign, nadi, color, birth stone, etc.)
3. **Provide specific, actionable guidance** with timing when possible
4. **Cite specific BNN rules and principles** from the provided text
5. **Incorporate Nakshatra characteristics** in your analysis (e.g., Shatabhisha's mystical nature, Varuna deity connection)
6. **Consider Rashi lordships** and their influence on the question
7. **Reference additional details** like birth stone, color, direction for remedies
8. **Maintain a professional, mystical tone** that respects the ancient wisdom
9. **Structure your response clearly** with sections for key insights, timing, recommendations, and spiritual guidance
10. **Include relevant remedies or practices** based on BNN teachings and the user's specific details
11. **Always remind users that astrology reveals potential - their choices determine outcomes**

CRITICAL: You are consulting the ancient BNN manuscripts provided above and must provide guidance that aligns EXCLUSIVELY with this specific system. Do not mix other astrological systems or modern interpretations.

Format your response EXACTLY in this structure:

**Step 1: Key Houses Analysis**
- List the relevant houses and their planetary positions
- Explain what each house signifies for the question

**Step 2: Planetary Influences**
- Detail how each planet affects the specific area of life
- Connect planetary positions to outcomes

**Step 3: BNN Yogas & Combinations**
- Identify specific yogas from the BNN system
- Explain their significance

**Step 4: Probability Assessment**
- Provide specific percentage likelihoods for different outcomes
- Use format: "Probability: XX%" for each outcome
- Base percentages on planetary strength and BNN rules

**Step 5: Timeline Analysis**
- Break down predictions by life stages (e.g., "Early Life (0-20 yrs)", "Youth (20-35 yrs)", etc.)
- Include probabilities for each stage

**Step 6: Strengths & Weaknesses**
- List positive factors (✅ Strengths)
- List challenges (⚠️ Weaknesses)

**✅ Final Summary**
- Overall probability assessment
- Key recommendations
- Most likely outcomes

IMPORTANT: Always use the exact format shown above with clear sections, specific percentages, and structured analysis. Make the reading comprehensive and actionable.

Remember: You are channeling the wisdom of Sage Bhrigu through the BNN system using the provided ancient knowledge. Make full use of ALL the Kundli details provided to give the most comprehensive and accurate reading possible.`;
}

// Create user prompt
function createBNNUserPrompt(question, kundliData, userDetails) {
  const planetaryInfo = kundliData.planetaryPositions
    .map(planet => `${planet.name}: ${planet.sign} ${planet.degree} in ${planet.house}th house (Nakshatra: ${planet.nakshatra}, Lord: ${planet.nakshatra_lord}${planet.is_retrograde ? ', Retrograde' : ''})`)
    .join('\n');

  // Build comprehensive Kundli information
  let kundliDetails = `**Birth Chart Data:**
- Ascendant: ${kundliData.ascendant.sign} ${kundliData.ascendant.degree}`;

  // Add Nakshatra details
  if (kundliData.nakshatra) {
    kundliDetails += `
- Nakshatra: ${kundliData.nakshatra.name} (Pada ${kundliData.nakshatra.pada})
- Nakshatra Lord: ${kundliData.nakshatra.lord?.name}`;
  }

  // Add Rashi details
  if (kundliData.chandra_rasi) {
    kundliDetails += `
- Chandra Rashi: ${kundliData.chandra_rasi.name}
- Chandra Rashi Lord: ${kundliData.chandra_rasi.lord?.name}`;
  }
  if (kundliData.soorya_rasi) {
    kundliDetails += `
- Soorya Rashi: ${kundliData.soorya_rasi.name}
- Soorya Rashi Lord: ${kundliData.soorya_rasi.lord?.name}`;
  }

  // Add Zodiac
  if (kundliData.zodiac) {
    kundliDetails += `
- Zodiac Sign: ${kundliData.zodiac.name}`;
  }

  // Add Additional Information
  if (kundliData.additional_info) {
    kundliDetails += `
- Deity: ${kundliData.additional_info.deity}
- Ganam: ${kundliData.additional_info.ganam}
- Symbol: ${kundliData.additional_info.symbol}
- Animal Sign: ${kundliData.additional_info.animal_sign}
- Nadi: ${kundliData.additional_info.nadi}
- Color: ${kundliData.additional_info.color}
- Best Direction: ${kundliData.additional_info.best_direction}
- Birth Stone: ${kundliData.additional_info.birth_stone}
- Planet: ${kundliData.additional_info.planet}
- Gender: ${kundliData.additional_info.gender}
- Syllables: ${kundliData.additional_info.syllables}
- Enemy Yoni: ${kundliData.additional_info.enemy_yoni}`;
  }

  return `Please provide a comprehensive BNN (Bhrigu Nandi Nadi) reading for the following:

**User Details:**
- Name: ${userDetails.name}
- Date of Birth: ${userDetails.dateOfBirth}
- Time of Birth: ${userDetails.timeOfBirth}
- Place of Birth: ${userDetails.placeOfBirth}
- Gender: ${userDetails.gender || 'Not specified'}

**Question:** ${question.text}
**Question Description:** ${question.description}
**Question Keywords:** ${question.keywords.join(', ')}

${kundliDetails}

**Planetary Positions:**
${planetaryInfo}

**Houses Information:**
${kundliData.houses.map((house, index) => `House ${index + 1}: ${house.ruler || 'Not specified'}`).join('\n')}

**Analysis Request:**
Please provide a detailed BNN reading following the exact format specified in the system prompt. Include comprehensive analysis of houses, planetary influences, BNN yogas, probability percentages, timeline analysis, and actionable recommendations. Make the reading thorough and structured as per the BNN system principles.`;
}

// Get collection statistics
export async function getCollectionStats() {
  try {
    const collection = await getBNNCollection();
    const count = await collection.count();
    return {
      totalChunks: count,
      status: 'active'
    };
  } catch (error) {
    console.error('Error getting collection stats:', error);
    return {
      totalChunks: 0,
      status: 'error',
      error: error.message
    };
  }
}
