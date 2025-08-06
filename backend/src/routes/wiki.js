const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token d\'accès manquant' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token invalide' 
    });
  }
}

// Récupérer toutes les pages wiki
router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const pages = await db.getAllWikiPages();

    res.json({ 
      success: true, 
      pages: pages 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des pages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Récupérer une page wiki par titre
router.get('/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const db = req.db;
    
    const page = await db.findWikiPageByTitle(title);

    if (!page) {
      return res.status(404).json({ 
        success: false, 
        message: 'Page non trouvée' 
      });
    }

    res.json({ 
      success: true, 
      page: page 
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la page:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Créer une nouvelle page wiki
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, isProtected = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Titre et contenu requis' 
      });
    }

    const db = req.db;
    
    // Vérifier si la page existe déjà
    const existingPage = await db.findWikiPageByTitle(title);
    if (existingPage) {
      return res.status(409).json({ 
        success: false, 
        message: 'Une page avec ce titre existe déjà' 
      });
    }

    const pageId = await db.createWikiPage({
      title,
      content,
      authorId: req.userId,
      isProtected
    });

    // Créer une activité de création de page
    await db.createActivity({
      userId: req.userId,
      type: 'wiki',
      title: 'Page créée',
      description: `Création de la page "${title}"`,
      icon: 'file-plus',
      metadata: { pageTitle: title, pageId }
    });

    const newPage = await db.findWikiPageByTitle(title);

    res.status(201).json({ 
      success: true, 
      message: 'Page créée avec succès',
      page: newPage
    });

  } catch (error) {
    console.error('Erreur lors de la création de la page:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Mettre à jour une page wiki
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Contenu requis' 
      });
    }

    const db = req.db;
    
    // Vérifier que la page existe
    const page = await db.findWikiPageByTitle(id); // On utilise le titre comme ID pour l'instant
    if (!page) {
      return res.status(404).json({ 
        success: false, 
        message: 'Page non trouvée' 
      });
    }

    await db.updateWikiPage(page.id, content);

    // Créer une activité de modification de page
    await db.createActivity({
      userId: req.userId,
      type: 'wiki',
      title: 'Page modifiée',
      description: `Modification de la page "${page.title}"`,
      icon: 'edit',
      metadata: { pageTitle: page.title, pageId: page.id }
    });

    const updatedPage = await db.findWikiPageByTitle(page.title);

    res.json({ 
      success: true, 
      message: 'Page mise à jour avec succès',
      page: updatedPage
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la page:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

module.exports = router;
