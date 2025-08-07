const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Configuration de la base de données
const DatabaseManager = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const activityRoutes = require('./routes/activities');
const wikiRoutes = require('./routes/wiki');

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialiser la base de données
const dbManager = new DatabaseManager();

// Middleware de sécurité
app.use(helmet({
  crossOriginEmbedderPolicy: false // Pour permettre les requêtes cross-origin
}));

// Middleware de limitation de taux
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite à 100 requêtes par fenêtre par IP
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.'
});
app.use(limiter);

// Middleware CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use(morgan('combined'));

// Trust proxy pour obtenir les vraies IP derrière un reverse proxy
app.set('trust proxy', 1);

// Middleware pour attacher la base de données aux requêtes
app.use((req, res, next) => {
  req.db = dbManager;
  next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/wiki', wikiRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Route par défaut
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

// Middleware de gestion d'erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Erreur interne du serveur' 
  });
});

// Initialiser la base de données et démarrer le serveur
async function startServer() {
  try {
    console.log('🚀 Initialisation de la base de données...');
    await dbManager.connect();
    await dbManager.initializeTables();
    
    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📊 Interface API disponible sur http://localhost:${PORT}`);
      console.log(`🔗 Frontend attendu sur ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion de l'arrêt propre
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

// Démarrer le serveur
startServer();

module.exports = app;
