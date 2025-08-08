const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Route publique : lister tous les tags (accessible à tous les utilisateurs connectés)
router.get('/public', requireAuth, async (req, res) => {
  try {
    const tags = await req.db.getAllTags();
    
    res.json({
      success: true,
      tags: tags
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tags:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route admin : lister tous les tags
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const tags = await req.db.getAllTags();
    
    res.json({
      success: true,
      tags: tags
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des tags:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route admin : créer un nouveau tag
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et la couleur du tag sont requis'
      });
    }
    
    const tagId = await req.db.createTag(name, color);
    
    // Enregistrer l'activité
    await req.db.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'Tag créé',
      description: `Création du tag "${name}" par ${req.user.username}`,
      icon: 'tag'
    });
    
    res.json({
      success: true,
      message: 'Tag créé avec succès',
      tagId: tagId
    });

  } catch (error) {
    console.error('Erreur lors de la création du tag:', error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Un tag avec ce nom existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route admin : modifier un tag
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    if (!name || !color) {
      return res.status(400).json({
        success: false,
        message: 'Le nom et la couleur du tag sont requis'
      });
    }
    
    // Vérifier que le tag existe
    const existingTag = await req.db.getTagById(parseInt(id));
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Tag non trouvé'
      });
    }
    
    const updatedTag = await req.db.updateTag(parseInt(id), name, color);
    
    // Enregistrer l'activité
    await req.db.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'Tag modifié',
      description: `Modification du tag "${name}" par ${req.user.username}`,
      icon: 'tag'
    });
    
    res.json({
      success: true,
      message: 'Tag mis à jour avec succès',
      tag: updatedTag
    });

  } catch (error) {
    console.error('Erreur lors de la modification du tag:', error);
    
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({
        success: false,
        message: 'Un tag avec ce nom existe déjà'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route admin : supprimer un tag
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le tag existe
    const existingTag = await req.db.getTagById(parseInt(id));
    if (!existingTag) {
      return res.status(404).json({
        success: false,
        message: 'Tag non trouvé'
      });
    }
    
    await req.db.deleteTag(parseInt(id));
    
    // Enregistrer l'activité
    await req.db.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'Tag supprimé',
      description: `Suppression du tag "${existingTag.name}" par ${req.user.username}`,
      icon: 'tag'
    });
    
    res.json({
      success: true,
      message: 'Tag supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du tag:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;
