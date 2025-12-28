const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Database configuration
const DatabaseManager = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const wikiRoutes = require('./routes/wiki');
const tagsRoutes = require('./routes/tags');
const permissionsRoutes = require('./routes/permissions');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const dbManager = new DatabaseManager();

// CORS middleware - MUST BE BEFORE HELMET AND OTHER MIDDLEWARE
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5176',
    /^http:\/\/localhost:\d+$/,
    process.env.NODE_ENV === 'production' ? `https://${process.env.HOST || 'localhost'}` : null
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => req.method === 'OPTIONS' // Skip preflight requests
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Trust proxy to get real IPs behind reverse proxy
app.set('trust proxy', 1);

// Middleware to attach database to requests
app.use((req, res, next) => {
  req.db = dbManager;
  next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/permissions', permissionsRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Open Book Wiki API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      activities: '/api/activities',
      wiki: '/api/wiki',
      health: '/health'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Initializing database...');
    await dbManager.connect();
    await dbManager.initializeTables();

    // Start server
    app.listen(PORT, () => {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.HOST || 'localhost';
      console.log(`✅ Server started on ${protocol}://${host}:${PORT}`);
      console.log(`📊 API Interface available at ${protocol}://${host}:${PORT}`);
      console.log(`🔗 Frontend expected at ${process.env.FRONTEND_URL || `http://${host}:5176`}`);
    });

  } catch (error) {
    console.error('❌ Error during server startup:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Stopping server...');
  await dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Stopping server...');
  await dbManager.close();
  process.exit(0);
});

// Start server
startServer();

module.exports = app;
