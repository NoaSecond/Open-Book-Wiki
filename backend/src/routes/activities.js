const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Récupérer toutes les activités de l'utilisateur connecté
router.get('/', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = req.db;
    const activities = await db.getActivitiesByUser(req.user.userId, parseInt(limit), offset);
    
    // Parser les métadonnées JSON
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({ 
      success: true, 
      activities: parsedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: activities.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des activités:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Récupérer les activités d'aujourd'hui
router.get('/today', requireAuth, async (req, res) => {
  try {
    const db = req.db;
    const activities = await db.getTodayActivitiesByUser(req.user.userId);
    
    // Parser les métadonnées JSON
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({ 
      success: true, 
      activities: parsedActivities 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des activités du jour:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Rechercher des activités
router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q: searchTerm, limit = 50 } = req.query;
    
    if (!searchTerm) {
      return res.status(400).json({ 
        success: false, 
        message: 'Terme de recherche requis' 
      });
    }

    const db = req.db;
    const activities = await db.searchActivities(req.user.userId, searchTerm, parseInt(limit));
    
    // Parser les métadonnées JSON
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({ 
      success: true, 
      activities: parsedActivities,
      searchTerm 
    });

  } catch (error) {
    console.error('Erreur lors de la recherche d\'activités:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Créer une nouvelle activité
router.post('/', requireAuth, async (req, res) => {
  try {
    const { type, title, description, icon, metadata } = req.body;

    // Validation des données
    if (!type || !title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type et titre requis' 
      });
    }

    const db = req.db;
    
    const activityId = await db.createActivity({
      userId: req.user.userId,
      type,
      title,
      description: description || '',
      icon: icon || 'star',
      metadata: metadata || {}
    });

    // Récupérer l'activité créée pour la retourner
    const newActivity = await db.getActivitiesByUser(req.user.userId, 1, 0);
    const activity = newActivity[0];

    // Parser les métadonnées JSON
    const parsedActivity = {
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    };

    res.status(201).json({ 
      success: true, 
      message: 'Activité créée avec succès',
      activity: parsedActivity
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'activité:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Route admin : récupérer toutes les activités de tous les utilisateurs
router.get('/admin/all', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 100 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = req.db;
    const activities = await db.getAllActivities(parseInt(limit), offset);
    
    // Parser les métadonnées JSON
    const parsedActivities = activities.map(activity => ({
      ...activity,
      metadata: activity.metadata ? JSON.parse(activity.metadata) : {}
    }));

    res.json({ 
      success: true, 
      activities: parsedActivities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: activities.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des activités (admin):', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

module.exports = router;
