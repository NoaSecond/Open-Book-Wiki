// Service d'authentification simulant une base de données
// En production, ceci communiquerait avec un vrai backend

import { CryptoUtils } from '../utils/cryptoUtils';
import activityService from './activityService';
import logger from '../utils/logger';

export interface User {
  id: number;
  username: string;
  tags: string[];
  email?: string;
  avatar?: string;
}

interface StoredUser {
  id: number;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  tags: string[];
  email?: string;
  emailHash?: string; // Hash de l'email pour les recherches sécurisées
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
}

// Simulation d'une base de données locale (localStorage)
class AuthService {
  private storageKey = 'wiki_users';
  private sessionKey = 'wiki_session';
  private initialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (!this.initialized) {
      await this.initializeDefaultUsers();
      this.initialized = true;
    }
  }

  // S'assurer que l'initialisation est terminée
  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private async initializeDefaultUsers() {
    const existingUsers = this.getStoredUsers();
    if (existingUsers.length === 0) {
      // Créer l'utilisateur admin par défaut avec un mot de passe haché
      const adminPassword = await CryptoUtils.hashPassword('admin');

      const defaultUsers: StoredUser[] = [
        {
          id: 1,
          username: 'admin',
          passwordHash: adminPassword.hash,
          passwordSalt: adminPassword.salt,
          tags: ['Administrateur', 'Contributeur'],
          email: 'admin@openbook.wiki',
          emailHash: await CryptoUtils.hashEmail('admin@openbook.wiki'),
          avatar: '/avatars/avatar-red.svg',
          createdAt: new Date().toISOString(),
          lastLogin: undefined
        }
      ];
      
      localStorage.setItem(this.storageKey, JSON.stringify(defaultUsers));
      console.log('✅ Utilisateur admin par défaut créé avec mot de passe sécurisé');
    } else {
      // Mettre à jour l'avatar de l'admin s'il n'en a pas
      let updated = false;
      
      existingUsers.forEach(user => {
        if (!user.avatar && user.username === 'admin') {
          user.avatar = '/avatars/avatar-red.svg';
          updated = true;
          console.log(`✅ Avatar ajouté pour ${user.username}: ${user.avatar}`);
        }
      });
      
      if (updated) {
        localStorage.setItem(this.storageKey, JSON.stringify(existingUsers));
        console.log('✅ Avatar mis à jour pour l\'utilisateur admin');
      }
    }
  }

  private getStoredUsers(): StoredUser[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  private saveUsers(users: StoredUser[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(users));
  }

  // Authentification
  async authenticate(username: string, password: string): Promise<User | null> {
    await this.ensureInitialized();
    const users = this.getStoredUsers();
    const user = users.find(u => u.username === username);
    
    if (user && await CryptoUtils.verifyPassword(password, user.passwordHash, user.passwordSalt)) {
      // Mettre à jour la dernière connexion
      user.lastLogin = new Date().toISOString();
      this.saveUsers(users);
      
      const userSession: User = {
        id: user.id,
        username: user.username,
        tags: user.tags,
        email: user.email,
        avatar: user.avatar
      };
      
      // Sauvegarder la session
      localStorage.setItem(this.sessionKey, JSON.stringify(userSession));
      
      // Logger l'activité de connexion
      logger.auth('✅ Connexion réussie', username);
      activityService.addLog({
        userId: user.id,
        username: user.username,
        action: 'login',
        details: `Connexion réussie`
      });
      
      return userSession;
    }
    
    logger.auth('❌ Échec de connexion', username);
    return null;
  }

  // Récupérer la session actuelle
  getCurrentUser(): User | null {
    const session = localStorage.getItem(this.sessionKey);
    if (!session) return null;
    
    const user = JSON.parse(session);
    
    // Si l'utilisateur n'a pas d'avatar, essayer de rafraîchir la session
    if (!user.avatar) {
      console.log(`🔄 Avatar manquant pour ${user.username}, rafraîchissement de la session...`);
      return this.refreshUserSession();
    }
    
    return user;
  }

  // Rafraîchir la session avec les données utilisateur les plus récentes
  refreshUserSession(): User | null {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return null;

    const users = this.getStoredUsers();
    const updatedUser = users.find(u => u.username === currentUser.username);
    
    if (updatedUser) {
      const refreshedSession: User = {
        id: updatedUser.id,
        username: updatedUser.username,
        tags: updatedUser.tags,
        email: updatedUser.email,
        avatar: updatedUser.avatar
      };
      
      localStorage.setItem(this.sessionKey, JSON.stringify(refreshedSession));
      console.log(`✅ Session rafraîchie pour ${updatedUser.username} avec avatar: ${updatedUser.avatar}`);
      return refreshedSession;
    }
    
    return currentUser;
  }

  // Déconnexion
  logout() {
    const currentUser = this.getCurrentUser();
    
    // Logger l'activité de déconnexion
    if (currentUser) {
      logger.auth('👋 Déconnexion', currentUser.username);
      activityService.addLog({
        userId: currentUser.id,
        username: currentUser.username,
        action: 'logout',
        details: `Déconnexion`
      });
    }
    
    localStorage.removeItem(this.sessionKey);
  }

  // Récupérer tous les utilisateurs (pour l'admin)
  getAllUsers(): User[] {
    const users = this.getStoredUsers();
    return users.map(user => ({
      id: user.id,
      username: user.username,
      tags: user.tags,
      email: user.email,
      avatar: user.avatar
    }));
  }

  // Mettre à jour les tags d'un utilisateur
  updateUserTags(userId: number, tags: string[]): boolean {
    try {
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        users[userIndex].tags = tags;
        this.saveUsers(users);
        
        // Mettre à jour la session si c'est l'utilisateur connecté
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const updatedSession = { ...currentUser, tags };
          localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tags:', error);
      return false;
    }
  }

  // Mettre à jour complètement un utilisateur
  async updateUser(userId: number, updates: {
    username?: string;
    email?: string;
    avatar?: string;
    tags?: string[];
    password?: string;
  }): Promise<boolean> {
    try {
      const users = this.getStoredUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex !== -1) {
        // Vérifier si le nom d'utilisateur n'existe pas déjà (sauf pour le même utilisateur)
        if (updates.username && users.some(u => u.username === updates.username && u.id !== userId)) {
          return false; // Nom d'utilisateur déjà pris
        }

        const user = users[userIndex];
        if (updates.username !== undefined) user.username = updates.username;
        if (updates.email !== undefined) {
          user.email = updates.email;
          user.emailHash = await CryptoUtils.hashEmail(updates.email);
        }
        if (updates.avatar !== undefined) user.avatar = updates.avatar;
        if (updates.tags !== undefined) user.tags = updates.tags;
        if (updates.password !== undefined) {
          const hashedPassword = await CryptoUtils.hashPassword(updates.password);
          user.passwordHash = hashedPassword.hash;
          user.passwordSalt = hashedPassword.salt;
        }

        this.saveUsers(users);
        
        // Mettre à jour la session si c'est l'utilisateur connecté
        const currentUser = this.getCurrentUser();
        if (currentUser && currentUser.id === userId) {
          const updatedSession: User = {
            id: user.id,
            username: user.username,
            tags: user.tags,
            email: user.email,
            avatar: user.avatar
          };
          localStorage.setItem(this.sessionKey, JSON.stringify(updatedSession));
        }
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      return false;
    }
  }

  // Créer un nouvel utilisateur
  async createUser(
    username: string, 
    password: string, 
    tags: string[] = ['Visiteur'],
    email?: string
  ): Promise<User | null> {
    try {
      await this.ensureInitialized();
      const users = this.getStoredUsers();
      
      // Vérifier si l'utilisateur existe déjà
      if (users.some(u => u.username === username)) {
        return null;
      }
      
      const hashedPassword = await CryptoUtils.hashPassword(password);
      
      const newUser: StoredUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        username,
        passwordHash: hashedPassword.hash,
        passwordSalt: hashedPassword.salt,
        tags,
        email,
        emailHash: email ? await CryptoUtils.hashEmail(email) : undefined,
        createdAt: new Date().toISOString(),
        lastLogin: undefined
      };
      
      users.push(newUser);
      this.saveUsers(users);
      
      // Logger l'activité d'inscription
      activityService.addLog({
        userId: newUser.id,
        username: newUser.username,
        action: 'register',
        details: `Nouvel utilisateur inscrit avec les rôles: ${tags.join(', ')}`
      });
      
      return {
        id: newUser.id,
        username: newUser.username,
        tags: newUser.tags,
        email: newUser.email
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      return null;
    }
  }

  // Supprimer un utilisateur
  deleteUser(userId: number): boolean {
    try {
      const users = this.getStoredUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      
      if (filteredUsers.length < users.length) {
        this.saveUsers(filteredUsers);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      return false;
    }
  }

  // Vérifier si un utilisateur est connecté
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  // Obtenir tous les utilisateurs pour l'administration (avec emails masqués)
  async getAdminUserList(): Promise<Array<{
    id: number;
    username: string;
    tags: string[];
    emailMasked?: string;
    createdAt?: string;
    lastLogin?: string;
  }>> {
    await this.ensureInitialized();
    const users = this.getStoredUsers();
    
    return users.map(user => ({
      id: user.id,
      username: user.username,
      tags: user.tags,
      emailMasked: user.email ? CryptoUtils.maskEmail(user.email) : undefined,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));
  }

  // Obtenir tous les utilisateurs avec les hashes pour l'administration (accès complet)
  async getAdminUserListWithHashes(): Promise<Array<{
    id: number;
    username: string;
    passwordHash: string;
    passwordSalt: string;
    tags: string[];
    emailMasked?: string;
    createdAt?: string;
    lastLogin?: string;
  }>> {
    await this.ensureInitialized();
    const users = this.getStoredUsers();
    
    return users.map(user => ({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      tags: user.tags,
      emailMasked: user.email ? CryptoUtils.maskEmail(user.email) : undefined,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    }));
  }

  // Vérifier la force d'un mot de passe
  validatePasswordStrength(password: string) {
    return CryptoUtils.validatePasswordStrength(password);
  }

  // Générer un mot de passe sécurisé
  generateSecurePassword(length: number = 12): string {
    return CryptoUtils.generateSecurePassword(length);
  }

  // Réinitialiser les données utilisateur (pour le développement)
  async resetUserData() {
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem(this.sessionKey);
    this.initialized = false;
    await this.initialize();
    console.log('🔄 Données utilisateur réinitialisées');
  }
}

// Instance singleton
const authService = new AuthService();
export default authService;
