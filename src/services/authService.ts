// Service d'authentification utilisant l'API backend
import { logger } from '../utils/logger';
import { getConfigService } from './configService';

export interface User {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean | number; // SQLite peut retourner 0/1 ou true/false
  avatar: string;
  lastLogin?: string;
  // Propriétés étendues pour compatibilité
  tags?: string[];
  bio?: string;
  contributions?: number;
  joinDate?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

interface VerifyResponse {
  success: boolean;
  user?: User;
  message?: string;
}

class AuthService {
  private configService = getConfigService();
  private tokenKey = 'wiki_token';
  private userKey = 'wiki_user';

  private getBaseUrl(): string {
    return this.configService.getApiUrl('/auth');
  }

  constructor() {
    // Nettoyer l'ancien localStorage au démarrage
    this.cleanOldStorage();
  }

  private cleanOldStorage(): void {
    // Supprimer les anciennes clés localStorage
    const oldKeys = [
      'wiki_users_v2',
      'wiki_session_v2',
      'wiki_activity_logs_v2',
      'wikiUsers',
      'wikiPages',
      'wikiSections',
      'currentUser',
      'activityLogs'
    ];
    
    oldKeys.forEach(key => {
      localStorage.removeItem(key);
    });
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  private setUser(user: User): void {
    // Ajouter des valeurs par défaut pour compatibilité
    const enhancedUser: User = {
      ...user,
      tags: user.tags || (user.isAdmin ? ['Administrateur'] : ['Contributeur']),
      bio: user.bio || '',
      contributions: user.contributions || 0,
      joinDate: user.joinDate || new Date().toISOString()
    };
    localStorage.setItem(this.userKey, JSON.stringify(enhancedUser));
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem(this.userKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/login`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username, password })
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.token && data.user) {
        this.setToken(data.token);
        
        // Récupérer les données complètes de l'utilisateur via /me
        const completeUser = await this.verifyToken();
        if (completeUser) {
          logger.info('Connexion réussie', { username: completeUser.username });
          return { success: true, message: data.message, user: completeUser };
        } else {
          // Fallback vers les données de login si /me échoue
          this.setUser(data.user);
          logger.info('Connexion réussie (fallback)', { username: data.user.username });
          return { success: true, message: data.message, user: data.user };
        }
      } else {
        logger.warn('Échec de connexion', { username, message: data.message });
        return { success: false, message: data.message };
      }
    } catch (error) {
      logger.error('Erreur lors de la connexion', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async register(username: string, email: string, password: string, avatar: string = 'avatar-openbookwiki.svg'): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/register`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ username, email, password, avatar })
      });

      const data: RegisterResponse = await response.json();

      if (data.success && data.token && data.user) {
        this.setToken(data.token);
        this.setUser(data.user);
        logger.info('Inscription réussie', { username: data.user.username });
        return { success: true, message: data.message, user: data.user };
      } else {
        logger.warn('Échec d\'inscription', { username, message: data.message });
        return { success: false, message: data.message };
      }
    } catch (error) {
      logger.error('Erreur lors de l\'inscription', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { success: false, message: 'Erreur de connexion au serveur' };
    }
  }

  async verifyToken(): Promise<User | null> {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/me`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: VerifyResponse = await response.json();

      if (data.success && data.user) {
        this.setUser(data.user);
        return data.user;
      } else {
        this.removeToken();
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la vérification du token', { error: error instanceof Error ? error.message : 'Unknown error' });
      this.removeToken();
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${this.getBaseUrl()}/logout`, {
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', { error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      this.removeToken();
      logger.info('Déconnexion effectuée');
    }
  }

  getCurrentUser(): User | null {
    return this.getStoredUser();
  }

  isAuthenticated(): boolean {
    return this.getToken() !== null && this.getStoredUser() !== null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    // Gérer à la fois boolean et number (SQLite stocke 0/1)
    return user?.isAdmin === true || user?.isAdmin === 1;
  }

  // Méthode pour vérifier si l'utilisateur est connecté et valide
  async checkAuth(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    // Vérifier le token avec le serveur
    return await this.verifyToken();
  }

  // Méthodes pour la gestion des utilisateurs (compatibilité)
  async getAllUsers(): Promise<User[]> {
    // Pour l'instant, retourner l'utilisateur actuel uniquement
    // Dans une version future, créer un endpoint backend pour lister tous les utilisateurs
    const currentUser = this.getCurrentUser();
    return currentUser ? [currentUser] : [];
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<boolean> {
    // Pour l'instant, mettre à jour l'utilisateur actuel en local
    // Dans une version future, créer un endpoint backend pour mettre à jour les utilisateurs
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      const updatedUser = { ...currentUser, ...updates };
      this.setUser(updatedUser);
      return true;
    }
    return false;
  }

  updateUserTags(userId: number, tags: string[]): boolean {
    // Compatibilité avec l'ancien système
    const currentUser = this.getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      currentUser.tags = tags;
      this.setUser(currentUser);
      return true;
    }
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deleteUser(_userId: number): Promise<boolean> {
    // Pour l'instant, ne pas permettre la suppression
    // Dans une version future, créer un endpoint backend pour supprimer les utilisateurs
    return false;
  }
}

const authService = new AuthService();
export default authService;
