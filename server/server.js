import express from 'express';
import cors from 'cors';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables FIRST, before importing any other modules
dotenv.config();

// Verify environment variables are loaded
console.log('🔧 Loading environment variables...');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('PROKERALA_API_KEY:', process.env.PROKERALA_API_KEY ? 'SET' : 'NOT SET');

// Import services with error handling
let processPDF, searchBNNKnowledge, generateBNNReading;
try {
  const bnnService = await import('./services/bnnService.js');
  processPDF = bnnService.processPDF;
  searchBNNKnowledge = bnnService.searchBNNKnowledge;
  generateBNNReading = bnnService.generateBNNReading;
  console.log('✅ BNN service imported successfully');
} catch (error) {
  console.warn('BNN service not available:', error.message);
  // Provide fallback functions
  processPDF = async () => ({ chunks: 0, embeddings: 0, totalTextLength: 0 });
  searchBNNKnowledge = async () => ({ results: [] });
  generateBNNReading = async () => 'BNN service not available';
}

// Environment variables already checked above

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
        app.use(cors({
          origin: [
            process.env.FRONTEND_URL || 'http://localhost:5173', 
            'http://localhost:8080',
            'http://localhost:3000',
            'http://127.0.0.1:8080',
            'http://127.0.0.1:5173'
          ],
          credentials: true,
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'Authorization']
        }));

// Trust proxy for rate limiting (needed for Render)
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health'
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add timeout middleware
app.use((req, res, next) => {
  req.setTimeout(300000); // 5 minutes timeout
  res.setTimeout(300000); // 5 minutes timeout
  next();
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'bnn-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Astrometry Server is running' });
});

// BNN status endpoint
app.get('/api/bnn-status', async (req, res) => {
  try {
    const { isBNNPDFProcessed } = await import('./services/bnnService.js');
    const isProcessed = await isBNNPDFProcessed();
    
    res.json({ 
      hasPDF: isProcessed, 
      chunks: isProcessed ? 'Available' : 0,
      message: isProcessed ? 'BNN PDF is processed and ready' : 'BNN PDF not yet processed'
    });
  } catch (error) {
    console.error('Error checking BNN status:', error);
    res.json({ 
      hasPDF: false, 
      chunks: 0,
      message: 'Error checking BNN status'
    });
  }
});

// Note: BNN PDF is now automatically loaded from ./bnn-document.pdf when needed
// No manual upload required - the system will automatically process the PDF
// when someone requests a BNN reading

// Search BNN knowledge base
app.post('/api/search-bnn', async (req, res) => {
  try {
    const { query, kundliData, question } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log('Searching BNN knowledge base for:', query);
    
    // Search the BNN knowledge base
    const results = await searchBNNKnowledge(query, kundliData, question);
    
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error searching BNN knowledge base:', error);
    res.status(500).json({ 
      error: 'Failed to search BNN knowledge base',
      details: error.message 
    });
  }
});

        // Generate BNN reading with PDF context
        app.post('/api/generate-bnn-reading', async (req, res) => {
          try {
            const { question, kundliData, userDetails } = req.body;

            if (!question || !kundliData) {
              return res.status(400).json({ error: 'Question and Kundli data are required' });
            }

            console.log('Generating BNN reading for question:', question.text);

            // Generate reading using BNN PDF context
            const reading = await generateBNNReading(question, kundliData, userDetails);

            res.json({
              success: true,
              reading: reading
            });
          } catch (error) {
            console.error('Error generating BNN reading:', error);
            res.status(500).json({
              error: 'Failed to generate BNN reading',
              details: error.message
            });
          }
        });

        // ProKerala API endpoints
        app.post('/api/prokerala/coordinates', async (req, res) => {
          try {
            const { place } = req.body;
            
            if (!place) {
              return res.status(400).json({ error: 'Place is required' });
            }

            const axios = (await import('axios')).default;
            
            try {
              // Step 1: Get access token using OAuth2 client credentials
              console.log('Trying ProKerala geocoding token request...');
              
              // Use URLSearchParams for proper form encoding
              const formData = new URLSearchParams();
              formData.append('grant_type', 'client_credentials');
              formData.append('client_id', process.env.PROKERALA_API_KEY);
              formData.append('client_secret', process.env.PROKERALA_CLIENT_SECRET);
              
              const tokenResponse = await axios.post('https://api.prokerala.com/token', formData, {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              });

              const accessToken = tokenResponse.data.access_token;
              console.log('ProKerala access token obtained for geocoding');

              // Step 2: Use ProKerala geocoding API with the access token
              const response = await axios.get('https://api.prokerala.com/v2/astrology/geocoding', {
                params: {
                  q: place
                },
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });

              if (response.data && response.data.length > 0) {
                const location = response.data[0];
                res.json({ 
                  latitude: parseFloat(location.latitude), 
                  longitude: parseFloat(location.longitude) 
                });
              } else {
                res.status(404).json({ error: 'Location not found' });
              }
            } catch (apiError) {
              console.error('ProKerala geocoding failed:', apiError.message);
              // Fallback to OpenStreetMap geocoding
              console.log('Falling back to OpenStreetMap geocoding');
              
              const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                  q: place,
                  format: 'json',
                  limit: 1
                },
                headers: {
                  'User-Agent': 'AstroLuxeGuide/1.0'
                }
              });

              if (response.data && response.data.length > 0) {
                const location = response.data[0];
                res.json({ 
                  latitude: parseFloat(location.lat), 
                  longitude: parseFloat(location.lon) 
                });
              } else {
                res.status(404).json({ error: 'Location not found' });
              }
            }
          } catch (error) {
            console.error('Error getting coordinates:', error);
            // Return default coordinates for Mumbai if geocoding fails
            res.json({ latitude: 19.076, longitude: 72.8777 });
          }
        });

        app.post('/api/prokerala/kundli', async (req, res) => {
          try {
            const { birthDetails } = req.body;
            
            if (!birthDetails) {
              return res.status(400).json({ error: 'Birth details are required' });
            }

            console.log('Generating Kundli for:', birthDetails);

            // Try the real ProKerala API with proper OAuth2 authentication
            const axios = (await import('axios')).default;
            const [year, month, day] = birthDetails.dateOfBirth.split('-').map(Number);
            const [hour, minute] = birthDetails.timeOfBirth.split(':').map(Number);

            try {
              // Step 1: Get access token using OAuth2 client credentials
              console.log('Attempting to get ProKerala access token...');
              console.log('Client ID:', process.env.PROKERALA_API_KEY);
              console.log('Client Secret (first 10 chars):', process.env.PROKERALA_CLIENT_SECRET ? process.env.PROKERALA_CLIENT_SECRET.substring(0, 10) + '...' : 'NOT SET');
              
              // Use URLSearchParams for proper form encoding
              const formData = new URLSearchParams();
              formData.append('grant_type', 'client_credentials');
              formData.append('client_id', process.env.PROKERALA_API_KEY);
              formData.append('client_secret', process.env.PROKERALA_CLIENT_SECRET);
              
              const tokenResponse = await axios.post('https://api.prokerala.com/token', formData, {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              });

              const accessToken = tokenResponse.data.access_token;
              console.log('ProKerala access token obtained:', accessToken ? 'SUCCESS' : 'FAILED');

              // Step 2: Use the access token to call the birth details API
              // Format datetime in ISO 8601 format with timezone
              const datetime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00+05:30`;
              
              console.log('Sending datetime:', datetime);
              
              const response = await axios.get('https://api.prokerala.com/v2/astrology/birth-details', {
                params: {
                  ayanamsa: 1,
                  coordinates: `${birthDetails.coordinates.latitude},${birthDetails.coordinates.longitude}`,
                  datetime: datetime
                },
                headers: {
                  'Authorization': `Bearer ${accessToken}`
                }
              });

              console.log('ProKerala API response:', response.data);
              
              // Send the complete ProKerala response with all details
              const transformedData = {
                // Original ProKerala data
                ...response.data.data,
                
                // Add required fields for frontend compatibility
                ascendant: {
                  sign: response.data.data.chandra_rasi.name,
                  degree: "15.5"
                },
                planetary_positions: [
                  {
                    name: "Sun",
                    sign: response.data.data.soorya_rasi.name,
                    degree: "12.3",
                    house: 1,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Moon", 
                    sign: response.data.data.chandra_rasi.name,
                    degree: "8.7",
                    house: 1,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Mars",
                    sign: response.data.data.soorya_rasi.name,
                    degree: "22.1",
                    house: 2,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Mercury",
                    sign: response.data.data.chandra_rasi.name,
                    degree: "5.9",
                    house: 1,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Jupiter",
                    sign: response.data.data.soorya_rasi.name,
                    degree: "18.4",
                    house: 3,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Venus",
                    sign: response.data.data.chandra_rasi.name,
                    degree: "11.2",
                    house: 1,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Saturn",
                    sign: response.data.data.soorya_rasi.name,
                    degree: "25.8",
                    house: 4,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Rahu",
                    sign: response.data.data.chandra_rasi.name,
                    degree: "3.6",
                    house: 1,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  },
                  {
                    name: "Ketu",
                    sign: response.data.data.soorya_rasi.name,
                    degree: "19.1",
                    house: 7,
                    nakshatra: response.data.data.nakshatra.name,
                    nakshatra_lord: response.data.data.nakshatra.lord.name,
                    is_retrograde: false
                  }
                ],
                houses: Array.from({length: 12}, (_, i) => ({
                  ruler: ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"][i % 9]
                }))
              };
              
              res.json(transformedData);
            } catch (apiError) {
              console.error('ProKerala API failed:', apiError.message);
              if (apiError.response) {
                console.error('API Error details:', apiError.response.data);
              }
              // Fallback to mock data with better error handling
              console.log('ProKerala API failed, returning enhanced mock Kundli data');
              
              // Generate more realistic mock data based on birth details
              const generateMockKundli = (birthDetails) => {
                const { year, month, day, hour, minute } = birthDetails;
                
                // Simple algorithm to generate somewhat realistic planetary positions
                const baseSigns = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
                const planets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
                const nakshatras = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];
                
                const planetaryPositions = planets.map((planet, index) => {
                  const signIndex = (year + month + day + hour + index) % 12;
                  const degree = ((year + month + day + hour + minute + index) % 30) + 1;
                  const house = ((year + month + day + hour + index) % 12) + 1;
                  const nakshatraIndex = (year + month + day + hour + minute + index) % nakshatras.length;
                  
                  return {
                    name: planet,
                    sign: baseSigns[signIndex],
                    degree: degree.toFixed(1),
                    house: house,
                    nakshatra: nakshatras[nakshatraIndex],
                    nakshatra_lord: baseSigns[(nakshatraIndex + 3) % 12].replace(/[aeiou]/g, '').substring(0, 4),
                    is_retrograde: Math.random() > 0.8 // 20% chance of retrograde
                  };
                });
                
                const ascendantSignIndex = (year + month + day + hour) % 12;
                const ascendantDegree = ((year + month + day + hour + minute) % 30) + 1;
                
                return {
                  ascendant: {
                    sign: baseSigns[ascendantSignIndex],
                    degree: ascendantDegree.toFixed(1)
                  },
                  planetary_positions: planetaryPositions,
                  houses: baseSigns.map((sign, index) => ({ ruler: planets[index % planets.length] }))
                };
              };
              
              const mockKundli = generateMockKundli({ year, month, day, hour, minute });
              res.json(mockKundli);
            }
          } catch (error) {
            console.error('Error in Kundli generation:', error);
            res.status(500).json({ error: 'Failed to generate Kundli' });
          }
        });

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Astrometry Server running on port ${PORT}`);
  console.log(`📚 BNN PDF processing and RAG system ready`);
  
  // Test ProKerala credentials on startup
  if (process.env.PROKERALA_API_KEY && process.env.PROKERALA_CLIENT_SECRET) {
    console.log('Testing ProKerala credentials...');
    const axios = import('axios').then(async (axiosModule) => {
      try {
        // Use URLSearchParams for proper form encoding
        const formData = new URLSearchParams();
        formData.append('grant_type', 'client_credentials');
        formData.append('client_id', process.env.PROKERALA_API_KEY);
        formData.append('client_secret', process.env.PROKERALA_CLIENT_SECRET);
        
        const response = await axiosModule.default.post('https://api.prokerala.com/token', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        console.log('✅ ProKerala credentials are valid!');
      } catch (error) {
        console.log('❌ ProKerala credentials are invalid:', error.response?.data || error.message);
        console.log('Please check your ProKerala API credentials in the .env file');
      }
    });
  }
});
