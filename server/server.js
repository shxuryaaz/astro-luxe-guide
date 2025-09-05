import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateBNNReading, loadBNNPDF, getBNNServiceStatus } from './services/bnnService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

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
    version: '1.0.0'
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
    const { question, kundliData } = req.body;
    
    if (!question || !kundliData) {
      return res.status(400).json({ 
        error: 'Question and kundli data are required' 
      });
    }

    console.log('🔮 Generating BNN reading for question:', question);
    
    // Generate the reading
    const reading = await generateBNNReading(question, kundliData);
    
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
    res.status(500).json({ 
      error: 'Failed to generate BNN reading',
      details: error.message 
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
      
      // For now, provide fallbacks for missing fields
      data.ascendant = { sign: "Unknown", degree: "0°" }; // Will be populated when we get the right endpoint
      data.planetary_positions = []; // Will be populated when we get the right endpoint
      data.houses = []; // Will be populated when we get the right endpoint
      
      console.log('✅ Mapped ProKerala data successfully');
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
