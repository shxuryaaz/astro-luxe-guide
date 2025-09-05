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

// ProKerala API proxy endpoint
app.post('/api/prokerala/*', async (req, res) => {
  try {
    const targetPath = req.params[0];
    const targetUrl = `https://api.prokerala.com/v2/astrology/${targetPath}`;
    
    console.log(`🔄 Proxying request to: ${targetUrl}`);
    console.log(`📤 Request body:`, JSON.stringify(req.body, null, 2));
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.PROKERALA_API_KEY}`,
        'X-API-KEY': process.env.PROKERALA_API_KEY
      },
      body: JSON.stringify(req.body)
    });
    
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
    
    const data = await response.json();
    console.log(`📥 Response data:`, JSON.stringify(data, null, 2));
    
    // Validate critical fields and provide fallbacks
    if (data && typeof data === 'object') {
      // Ensure ascendant field exists
      if (!data.ascendant || !data.ascendant.sign || !data.ascendant.degree) {
        console.warn('⚠️ Ascendant field missing or invalid, providing fallback');
        data.ascendant = { sign: "Unknown", degree: "0°" };
      }
      
      // Ensure planetary_positions exists
      if (!data.planetary_positions || !Array.isArray(data.planetary_positions)) {
        console.warn('⚠️ Planetary positions missing or invalid, providing fallback');
        data.planetary_positions = [];
      }
      
      // Ensure houses exists
      if (!data.houses || !Array.isArray(data.houses)) {
        console.warn('⚠️ Houses missing or invalid, providing fallback');
        data.houses = [];
      }
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
