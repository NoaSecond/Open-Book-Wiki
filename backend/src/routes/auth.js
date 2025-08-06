const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { requireAuth, requireAdmin, JWT_SECRET } = require('../middleware/auth');

// Route de test
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth API works!' });
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Trouver l'utilisateur dans la base de données
    const user = await req.db.findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Mettre à jour la dernière connexion
    await req.db.updateLastLogin(user.id);

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        isAdmin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Préparer les données utilisateur (sans le hash du mot de passe)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      lastLogin: new Date().toISOString()
    };

    // Enregistrer l'activité de connexion
    await req.db.createActivity({
      userId: user.id,
      type: 'auth',
      title: 'Connexion réussie',
      description: `Connexion de ${user.username}`,
      icon: 'shield'
    });

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await req.db.findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Ce nom d\'utilisateur est déjà pris'
      });
    }

    const existingEmail = await req.db.findUserByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Cette adresse email est déjà utilisée'
      });
    }

    // Créer le nouvel utilisateur
    const userId = await req.db.createUser({
      username,
      email,
      password,
      isAdmin: false,
      avatar: 'avatar-openbookwiki.svg'
    });

    // Récupérer l'utilisateur créé
    const newUser = await req.db.findUserById(userId);

    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        username: newUser.username, 
        isAdmin: newUser.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Préparer les données utilisateur
    const userData = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.is_admin,
      avatar: newUser.avatar,
      lastLogin: new Date().toISOString()
    };

    // Enregistrer l'activité d'inscription
    await req.db.createActivity({
      userId: newUser.id,
      type: 'auth',
      title: 'Inscription réussie',
      description: `Nouvel utilisateur: ${newUser.username}`,
      icon: 'user'
    });

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route de vérification du token (utilisateur actuel)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await req.db.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      lastLogin: user.last_login
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route de déconnexion
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Enregistrer l'activité de déconnexion
    await req.db.createActivity({
      userId: req.user.userId,
      type: 'auth',
      title: 'Déconnexion',
      description: `Déconnexion de ${req.user.username}`,
      icon: 'shield'
    });

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Route admin : lister tous les utilisateurs
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Cette méthode doit être ajoutée au DatabaseManager
    const users = await req.db.getAllUsers();
    
    const userData = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      lastLogin: user.last_login,
      created_at: user.created_at
    }));

    res.json({
      success: true,
      users: userData
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;
