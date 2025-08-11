const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { requireAuth, requireAdmin, JWT_SECRET } = require('../middleware/auth');

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Auth API works!' });
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    // Find user in database
    const user = await req.db.findUserByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides'
      });
    }

    // Update last login
    await req.db.updateLastLogin(user.id);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        isAdmin: user.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user data (without password hash)
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      lastLogin: new Date().toISOString(),
      tags: user.is_admin ? ['Administrateur'] : ['Contributeur']
    };

    // Log login activity
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

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    // Check if user already exists
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

    // Create new user
    const userId = await req.db.createUser({
      username,
      email,
      password,
      isAdmin: false,
      avatar: 'avatar-openbookwiki.svg'
    });

    // Get created user
    const newUser = await req.db.findUserById(userId);

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        username: newUser.username, 
        isAdmin: newUser.is_admin 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare user data
    const userData = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.is_admin,
      avatar: newUser.avatar,
      lastLogin: new Date().toISOString(),
      tags: newUser.is_admin ? ['Administrateur'] : ['Contributeur']
    };

    // Log registration activity
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

// Token verification route (current user)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await req.db.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Parse tags from database (stored as comma-separated string)
    let userTags = [];
    try {
      if (user.tags) {
        // If it's a string, split by commas
        if (typeof user.tags === 'string') {
          userTags = user.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else {
          // If it's already an array (shouldn't happen)
          userTags = Array.isArray(user.tags) ? user.tags : [];
        }
      } else {
        // Default tags based on role
        userTags = user.is_admin ? ['Administrateur'] : ['Contributeur'];
      }
    } catch (error) {
      console.error('Erreur lors du parsing des tags:', error);
      userTags = user.is_admin ? ['Administrateur'] : ['Contributeur'];
    }

    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      bio: user.bio,
      lastLogin: user.last_login,
      tags: userTags,
      contributions: user.contributions || 0,
      joinDate: user.created_at
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

// Token verification route (alias for /me)
router.get('/verify', requireAuth, async (req, res) => {
  try {
    const user = await req.db.findUserById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Parse tags from database (stored as comma-separated string)
    let userTags = [];
    try {
      if (user.tags) {
        // If it's a string, split by commas
        if (typeof user.tags === 'string') {
          userTags = user.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        } else if (Array.isArray(user.tags)) {
          userTags = user.tags;
        }
      }
    } catch (tagError) {
      console.warn('Erreur lors du parsing des tags:', tagError);
      userTags = [];
    }

    // Create user object with all properties
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: !!user.is_admin, // Convert to boolean
      avatar: user.avatar || 'avatar-openbookwiki.svg',
      lastLogin: user.last_login,
      tags: userTags,
      bio: user.bio || '',
      contributions: user.contributions || 0,
      joinDate: user.created_at
    };

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// User profile update route
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { avatar, username, email } = req.body;
    
    // Data validation
    const updates = {};
    if (avatar) updates.avatar = avatar;
    if (username) updates.username = username;
    if (email) updates.email = email;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }
    
    // Update profile
    const updatedUser = await req.db.updateUserProfile(req.user.userId, updates);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Prepare user data (without password hash)
    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.is_admin,
      avatar: updatedUser.avatar,
      lastLogin: updatedUser.last_login,
      tags: updatedUser.is_admin ? ['Administrateur'] : ['Contributeur']
    };
    
    // Log update activity
    await req.db.createActivity({
      userId: updatedUser.id,
      type: 'auth',
      title: 'Profil mis à jour',
      description: `Mise à jour du profil de ${updatedUser.username}`,
      icon: 'user'
    });
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

// Logout route
router.post('/logout', requireAuth, async (req, res) => {
  try {
    // Log logout activity
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

// Admin route: list all users
router.get('/users', requireAuth, requireAdmin, async (req, res) => {
  try {
    // This method must be added to DatabaseManager
    const users = await req.db.getAllUsers();
    
    const userData = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isAdmin: user.is_admin,
      avatar: user.avatar,
      bio: user.bio,
      tags: user.tags ? user.tags.split(',').filter(tag => tag.trim()) : [],
      contributions: 0, // TODO: calculate real contributions
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

// Admin route: update specific user
router.put('/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, bio, tags, avatar } = req.body;
    
    // Data validation
    const updates = {};
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    if (tags) updates.tags = Array.isArray(tags) ? tags.join(',') : tags;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }
    
    // Check if user exists
    const existingUser = await req.db.getUserById(parseInt(id));
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Update profile
    const updatedUser = await req.db.updateUserProfile(parseInt(id), updates);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Erreur lors de la mise à jour'
      });
    }
    
    // Prepare user data
    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      isAdmin: updatedUser.is_admin,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      tags: updatedUser.tags ? updatedUser.tags.split(',') : [],
      lastLogin: updatedUser.last_login,
      created_at: updatedUser.created_at
    };
    
    // Log update activity
    await req.db.createActivity({
      userId: req.user.userId,
      type: 'admin',
      title: 'Profil utilisateur modifié',
      description: `Modification du profil de ${updatedUser.username} par ${req.user.username}`,
      icon: 'user'
    });
    
    res.json({
      success: true,
      message: 'Profil utilisateur mis à jour avec succès',
      user: userData
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;
