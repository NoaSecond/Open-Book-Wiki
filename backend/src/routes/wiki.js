const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

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
router.post('/', requireAuth, async (req, res) => {
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
      authorId: req.user.userId,
      isProtected
    });

    // Créer une activité de création de page
    await db.createActivity({
      userId: req.user.userId,
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
router.put('/:id', requireAuth, async (req, res) => {
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
      userId: req.user.userId,
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

// Renommer une page wiki
router.put('/:id/rename', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nouveau titre requis' 
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

    // Vérifier qu'une page avec le nouveau titre n'existe pas déjà
    const existingPage = await db.findWikiPageByTitle(title);
    if (existingPage && existingPage.id !== page.id) {
      return res.status(409).json({ 
        success: false, 
        message: 'Une page avec ce titre existe déjà' 
      });
    }

    await db.renameWikiPage(page.id, title);

    // Créer une activité de renommage de page
    await db.createActivity({
      userId: req.user.userId,
      type: 'wiki',
      title: 'Page renommée',
      description: `Renommage de la page "${page.title}" en "${title}"`,
      icon: 'edit',
      metadata: { oldTitle: page.title, newTitle: title, pageId: page.id }
    });

    const renamedPage = await db.findWikiPageById(page.id);

    res.json({ 
      success: true, 
      message: 'Page renommée avec succès',
      page: renamedPage
    });

  } catch (error) {
    console.error('Erreur lors du renommage de la page:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

module.exports = router;
