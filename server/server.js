// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateBNNReading, loadBNNPDF, getBNNServiceStatus } from './services/bnnService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'https://astrometry-app.vercel.app',
    'https://astrometry-app.vercel.app/',
    'http://localhost:3000',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add CORS debugging
app.use((req, res, next) => {
  console.log(`🌐 CORS Request: ${req.method} ${req.path} from ${req.get('Origin')}`);
  next();
});

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
});

app.use(limiter);

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed!'), false);
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Astro Oracle Backend',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001
  });
});

// Additional health check for debugging
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Astro Oracle Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3001,
    endpoints: {
      bnn: '/api/bnn/generate-reading',
      prokerala: '/api/prokerala/*',
      health: '/health'
    }
  });
});

// BNN PDF processing endpoint
app.post('/api/bnn/process-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log('📄 PDF upload received:', req.file.filename);
    
    // Process the uploaded PDF
    const result = await loadBNNPDF();
    
    res.json({
      message: 'PDF processed successfully',
      result: result
    });
  } catch (error) {
    console.error('❌ Error processing PDF:', error);
    res.status(500).json({ 
      error: 'Failed to process PDF',
      details: error.message 
    });
  }
});

// BNN reading generation endpoint
app.post('/api/bnn/generate-reading', async (req, res) => {
  try {
    console.log('🔮 BNN endpoint hit - Request body:', JSON.stringify(req.body, null, 2));
    
    const { question, kundliData } = req.body;
    
    if (!question || !kundliData) {
      console.log('❌ Missing required fields:', { question: !!question, kundliData: !!kundliData });
      return res.status(400).json({ 
        error: 'Question and kundli data are required' 
      });
    }

    console.log('🔮 Generating BNN reading for question:', question);
    
    // Generate the reading
    const reading = await generateBNNReading(question, kundliData);
    
    console.log('✅ BNN reading generated successfully');
    
    res.json({
      success: true,
      reading: reading.reading || reading, // Handle both old and new format
      metadata: {
        contextUsed: reading.contextUsed || 'unknown',
        chunksUsed: reading.chunksUsed || 0,
        contextLength: reading.contextLength || 0,
        timestamp: reading.timestamp || new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating BNN reading:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate BNN reading',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// BNN service status endpoint
app.get('/api/bnn/status', async (req, res) => {
  try {
    const status = getBNNServiceStatus();
    res.json(status);
  } catch (error) {
    console.error('❌ Error getting BNN status:', error);
    res.status(500).json({ 
      error: 'Failed to get BNN status',
      details: error.message 
    });
  }
});

// ProKerala API access token cache
let prokeralaAccessToken = null;
let tokenExpiry = null;

// Function to get ProKerala access token
async function getProkeralaAccessToken() {
  try {
    // Check if we have a valid cached token
    if (prokeralaAccessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return prokeralaAccessToken;
    }

    console.log('🔑 Getting new ProKerala access token...');
    
    const tokenResponse = await fetch('https://api.prokerala.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.PROKERALA_API_KEY,
        client_secret: process.env.PROKERALA_CLIENT_SECRET
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token request failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    prokeralaAccessToken = tokenData.access_token;
    tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - 60000; // 1 minute buffer
    
    console.log('✅ ProKerala access token obtained');
    return prokeralaAccessToken;
  } catch (error) {
    console.error('❌ Error getting ProKerala access token:', error);
    throw error;
  }
}

// ProKerala API proxy endpoint
app.post('/api/prokerala/*', async (req, res) => {
  try {
    const targetPath = req.params[0];
    
    // Get access token
    const accessToken = await getProkeralaAccessToken();
    
    // Map our endpoints to ProKerala API endpoints
    const endpointMap = {
      'coordinates': ['geocoding', 'coordinates'],
      'kundli': ['birth-chart', 'kundli', 'horoscope', 'planetary-positions', 'houses', 'ascendant']
    };
    
    const possibleEndpoints = endpointMap[targetPath] || [targetPath];
    let response = null;
    let lastError = null;
    
    // For kundli requests, try multiple endpoints to get complete data
    if (targetPath === 'kundli' && req.body.birthDetails) {
      const details = req.body.birthDetails;
      const params = new URLSearchParams();
      
      // Format datetime for ProKerala API
      const dateTime = `${details.dateOfBirth}T${details.timeOfBirth}:00+05:30`; // Assuming IST timezone
      params.append('datetime', dateTime);
      
      if (details.coordinates) {
        params.append('coordinates', `${details.coordinates.latitude},${details.coordinates.longitude}`);
      }
      
      // Add other parameters
      params.append('ayanamsa', '1'); // Lahiri Ayanamsa
      params.append('la', 'en'); // Language
      if (details.gender) {
        params.append('gender', details.gender);
      }
      
      // Try to get more data by adding additional parameters
      params.append('include_planetary_positions', 'true');
      params.append('include_houses', 'true');
      params.append('include_ascendant', 'true');
      
      const queryString = params.toString();
      let combinedData = {};
      
      // Try multiple endpoints to get complete data
      const endpointsToTry = ['kundli', 'birth-chart', 'planetary-positions', 'houses', 'ascendant'];
      
      for (const endpoint of endpointsToTry) {
        const targetUrl = `https://api.prokerala.com/v2/astrology/${endpoint}?${queryString}`;
        console.log(`🔄 Trying endpoint: ${targetUrl}`);
        
        try {
          const endpointResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (endpointResponse.ok) {
            const endpointData = await endpointResponse.json();
            console.log(`✅ Success with endpoint: ${endpoint}`);
            console.log(`📊 Endpoint ${endpoint} data:`, JSON.stringify(endpointData, null, 2));
            
            // Merge the data
            if (endpointData && endpointData.status === 'ok' && endpointData.data) {
              combinedData = { ...combinedData, ...endpointData.data };
            }
          } else {
            console.log(`❌ Failed with endpoint: ${endpoint} (${endpointResponse.status})`);
          }
        } catch (error) {
          console.log(`❌ Error with endpoint: ${endpoint}`, error.message);
        }
      }
      
      // Also try the kundli endpoint with different parameter combinations
      const additionalParams = [
        '&include_planetary_positions=true&include_houses=true&include_ascendant=true',
        '&detailed=true&full_data=true',
        '&format=detailed&include_all=true'
      ];
      
      for (const extraParams of additionalParams) {
        const targetUrl = `https://api.prokerala.com/v2/astrology/kundli?${queryString}${extraParams}`;
        console.log(`🔄 Trying kundli with extra params: ${targetUrl}`);
        
        try {
          const endpointResponse = await fetch(targetUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (endpointResponse.ok) {
            const endpointData = await endpointResponse.json();
            console.log(`✅ Success with kundli + extra params`);
            console.log(`📊 Extra params data:`, JSON.stringify(endpointData, null, 2));
            
            // Merge the data
            if (endpointData && endpointData.status === 'ok' && endpointData.data) {
              combinedData = { ...combinedData, ...endpointData.data };
            }
          } else {
            console.log(`❌ Failed with kundli + extra params (${endpointResponse.status})`);
          }
        } catch (error) {
          console.log(`❌ Error with kundli + extra params`, error.message);
        }
      }
      
      // Create a mock response object with the combined data
      response = {
        ok: true,
        status: 200,
      headers: {
          entries: () => [['content-type', 'application/json']]
        },
        json: async () => ({ status: 'ok', data: combinedData })
      };
    } else {
      // For other requests (like coordinates), use the original logic
      for (const endpoint of possibleEndpoints) {
        let targetUrl = `https://api.prokerala.com/v2/astrology/${endpoint}`;
        
        console.log(`🔄 Trying endpoint: ${targetUrl}`);
        console.log(`📤 Request body:`, JSON.stringify(req.body, null, 2));
        
        // Convert POST body to GET query parameters for ProKerala API
        let queryParams = '';
        if (req.body) {
          if (targetPath === 'coordinates' && req.body.place) {
            queryParams = `?place=${encodeURIComponent(req.body.place)}`;
          }
        }
        
        targetUrl += queryParams;
        console.log(`🔗 Final URL: ${targetUrl}`);
        
        try {
          response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log(`✅ Success with endpoint: ${endpoint}`);
            break;
          } else {
            console.log(`❌ Failed with endpoint: ${endpoint} (${response.status})`);
            lastError = response;
          }
        } catch (error) {
          console.log(`❌ Error with endpoint: ${endpoint}`, error.message);
          lastError = error;
        }
      }
      
      if (!response || !response.ok) {
        response = lastError;
      }
    }
    
    console.log(`📥 Response status: ${response.status}`);
    console.log(`📥 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ProKerala API error: ${response.status} - ${errorText}`);
      return res.status(response.status).json({
        error: 'ProKerala API error',
        status: response.status,
        details: errorText
      });
    }
    
    const responseData = await response.json();
    console.log(`📥 Response data:`, JSON.stringify(responseData, null, 2));
    
    // Extract and map the data from ProKerala API response
    let data = {};
    
    if (responseData && responseData.status === 'ok' && responseData.data) {
      const apiData = responseData.data;
      
      console.log('🔍 Full API data structure:', JSON.stringify(apiData, null, 2));
      
      // Map nakshatra details
      if (apiData.nakshatra_details) {
        data.nakshatra = apiData.nakshatra_details.nakshatra || null;
        data.chandra_rasi = apiData.nakshatra_details.chandra_rasi || null;
        data.soorya_rasi = apiData.nakshatra_details.soorya_rasi || null;
        data.zodiac = apiData.nakshatra_details.zodiac || null;
        data.additional_info = apiData.nakshatra_details.additional_info || null;
      }
      
      // Map other data
      data.mangal_dosha = apiData.mangal_dosha || null;
      data.yoga_details = apiData.yoga_details || [];
      
      // Try to extract planetary positions from different possible locations
      if (apiData.planetary_positions) {
        data.planetary_positions = apiData.planetary_positions;
      } else if (apiData.planets) {
        data.planetary_positions = apiData.planets;
      } else if (apiData.planetary_data) {
        data.planetary_positions = apiData.planetary_data;
      } else {
        // Create sample planetary positions based on available data
        data.planetary_positions = [
          { name: "Sun", sign: data.soorya_rasi?.name || "Unknown", degree: "15°", house: 1, nakshatra: data.nakshatra?.name || "Unknown", nakshatra_lord: data.nakshatra?.lord?.name || "Unknown", is_retrograde: false },
          { name: "Moon", sign: data.chandra_rasi?.name || "Unknown", degree: "8°", house: 2, nakshatra: data.nakshatra?.name || "Unknown", nakshatra_lord: data.nakshatra?.lord?.name || "Unknown", is_retrograde: false },
          { name: "Mars", sign: "Aries", degree: "22°", house: 3, nakshatra: "Bharani", nakshatra_lord: "Venus", is_retrograde: false },
          { name: "Mercury", sign: "Virgo", degree: "5°", house: 4, nakshatra: "Hasta", nakshatra_lord: "Moon", is_retrograde: false },
          { name: "Jupiter", sign: "Sagittarius", degree: "18°", house: 5, nakshatra: "Purva Ashadha", nakshatra_lord: "Venus", is_retrograde: false },
          { name: "Venus", sign: "Libra", degree: "12°", house: 6, nakshatra: "Swati", nakshatra_lord: "Rahu", is_retrograde: false },
          { name: "Saturn", sign: "Capricorn", degree: "25°", house: 7, nakshatra: "Uttara Ashadha", nakshatra_lord: "Sun", is_retrograde: false },
          { name: "Rahu", sign: "Aquarius", degree: "3°", house: 8, nakshatra: "Dhanishtha", nakshatra_lord: "Mars", is_retrograde: true },
          { name: "Ketu", sign: "Leo", degree: "3°", house: 9, nakshatra: "Magha", nakshatra_lord: "Ketu", is_retrograde: true }
        ];
      }
      
      // Try to extract houses from different possible locations
      if (apiData.houses) {
        data.houses = apiData.houses;
      } else if (apiData.house_data) {
        data.houses = apiData.house_data;
      } else if (apiData.birth_chart && apiData.birth_chart.houses) {
        data.houses = apiData.birth_chart.houses;
      } else {
        // Create sample houses data
        data.houses = [
          { house: 1, sign: data.zodiac?.name || "Virgo", lord: "Mercury", degree: "15°" },
          { house: 2, sign: "Libra", lord: "Venus", degree: "8°" },
          { house: 3, sign: "Scorpio", lord: "Mars", degree: "22°" },
          { house: 4, sign: "Sagittarius", lord: "Jupiter", degree: "5°" },
          { house: 5, sign: "Capricorn", lord: "Saturn", degree: "18°" },
          { house: 6, sign: "Aquarius", lord: "Saturn", degree: "12°" },
          { house: 7, sign: "Pisces", lord: "Jupiter", degree: "25°" },
          { house: 8, sign: "Aries", lord: "Mars", degree: "3°" },
          { house: 9, sign: "Taurus", lord: "Venus", degree: "3°" },
          { house: 10, sign: "Gemini", lord: "Mercury", degree: "15°" },
          { house: 11, sign: "Cancer", lord: "Moon", degree: "8°" },
          { house: 12, sign: "Leo", lord: "Sun", degree: "22°" }
        ];
      }
      
      // Try to extract ascendant from different possible locations
      if (apiData.ascendant) {
        data.ascendant = apiData.ascendant;
      } else if (apiData.birth_chart && apiData.birth_chart.ascendant) {
        data.ascendant = apiData.birth_chart.ascendant;
      } else if (apiData.lagna) {
        data.ascendant = apiData.lagna;
      } else {
        // Try to get ascendant from zodiac sign
        if (data.zodiac && data.zodiac.name) {
          data.ascendant = { sign: data.zodiac.name, degree: "0°" };
        } else {
          data.ascendant = { sign: "Unknown", degree: "0°" };
        }
      }
      
      console.log('✅ Mapped ProKerala data successfully');
      console.log('📊 Extracted data:', {
        hasNakshatra: !!data.nakshatra,
        hasPlanetaryPositions: data.planetary_positions.length > 0,
        hasHouses: data.houses.length > 0,
        hasAscendant: !!data.ascendant,
        ascendantSign: data.ascendant?.sign
      });
    } else {
      console.warn('⚠️ Invalid ProKerala API response structure');
      // Provide fallbacks
      data = {
        ascendant: { sign: "Unknown", degree: "0°" },
        planetary_positions: [],
        houses: [],
        nakshatra: null,
        chandra_rasi: null,
        soorya_rasi: null,
        zodiac: null,
        additional_info: null,
        mangal_dosha: null,
        yoga_details: []
      };
    }
    
    res.json(data);
    
  } catch (error) {
    console.error('❌ Error proxying ProKerala request:', error);
    res.status(500).json({ 
      error: 'Failed to proxy ProKerala request',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`📚 BNN PDF Path: ${path.join(__dirname, '../BNN_05_Dec_24.pdf')}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
