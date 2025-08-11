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

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false // Allow cross-origin requests
}));

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit to 100 requests per window per IP
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use(limiter);

// CORS middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5176',
    // In development, accept localhost on any port
    /^http:\/\/localhost:\d+$/,
    // In production, accept same domain
    process.env.NODE_ENV === 'production' ? `https://${process.env.HOST || 'localhost'}` : null
  ].filter(Boolean),
  credentials: true
}));

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

// Middleware de gestion d'erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route non trouvée' 
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Erreur interne du serveur' 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Initialisation de la base de données...');
    await dbManager.connect();
    await dbManager.initializeTables();
    
    // Start server
    app.listen(PORT, () => {
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.HOST || 'localhost';
      console.log(`✅ Serveur démarré sur ${protocol}://${host}:${PORT}`);
      console.log(`📊 Interface API disponible sur ${protocol}://${host}:${PORT}`);
      console.log(`🔗 Frontend attendu sur ${process.env.FRONTEND_URL || `http://${host}:5176`}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await dbManager.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await dbManager.close();
  process.exit(0);
});

// Start server
startServer();

module.exports = app;
