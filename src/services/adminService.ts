// Service pour simuler l'API d'administration de la base de données
// En production, ceci communiquerait avec un vrai backend

import authService from './authService';

export interface DatabaseUser {
  id: number;
  username: string;
  passwordHash?: string; // Hash du mot de passe pour l'affichage admin
  passwordSalt?: string; // Sel du mot de passe
  tags: string[];
  created_at: string;
  updated_at: string;
  last_login?: string;
  login_count?: number;
  emailMasked?: string;
}

export interface DatabaseStats {
  totalUsers: number;
  totalPages: number;
  totalSections: number;
  totalContent: number; // nombre total de caractères
  lastActivity: string;
  activeUsers: number;
  mostActiveUser: string;
  largestPage: string;
}

export interface SystemInfo {
  version: string;
  database: string;
  environment: string;
  framework: string;
  uptime: string;
  memoryUsage: string;
}

class AdminService {
  private static instance: AdminService;

  private constructor() {}

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  // Simuler un délai réseau
  private async delay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async getUsers(): Promise<DatabaseUser[]> {
    await this.delay(300);
    
    // Utiliser les vraies données d'authService avec hashes
    const realUsers = await authService.getAdminUserListWithHashes();
    
    return realUsers.map(user => ({
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      tags: user.tags,
      created_at: user.createdAt || new Date().toISOString(),
      updated_at: user.lastLogin || user.createdAt || new Date().toISOString(),
      last_login: user.lastLogin,
      login_count: Math.floor(Math.random() * 50) + 1, // Simulé pour le moment
      emailMasked: user.emailMasked
    }));
  }

  public async getStats(wikiData: any): Promise<DatabaseStats> {
    await this.delay(200);
    
    const realUsers = await authService.getAdminUserList();
    const totalPages = Object.keys(wikiData).length;
    const totalSections = Object.values(wikiData).reduce((acc: number, page: any) => {
      return acc + (page.sections?.length || 0);
    }, 0);

    const totalContent = Object.values(wikiData).reduce((acc: number, page: any) => {
      if (page.sections) {
        return acc + page.sections.reduce((sectionAcc: number, section: any) => {
          return sectionAcc + (section.content?.length || 0);
        }, 0);
      }
      return acc + (page.content?.length || 0);
    }, 0);

    // Calculer l'utilisateur le plus actif (basé sur les vraies données)
    const mostActiveUser = realUsers.reduce((prev, current) => {
      const prevLogins = prev.lastLogin ? 1 : 0;
      const currentLogins = current.lastLogin ? 1 : 0;
      return prevLogins > currentLogins ? prev : current;
    });

    // Trouver la page la plus grande
    const largestPage = Object.entries(wikiData).reduce((prev, [key, page]: [string, any]) => {
      const pageSize = page.sections?.reduce((acc: number, section: any) => acc + (section.content?.length || 0), 0) || page.content?.length || 0;
      const prevSize = wikiData[prev]?.sections?.reduce((acc: number, section: any) => acc + (section.content?.length || 0), 0) || wikiData[prev]?.content?.length || 0;
      return pageSize > prevSize ? key : prev;
    }, Object.keys(wikiData)[0]);

    return {
      totalUsers: realUsers.length,
      totalPages,
      totalSections,
      totalContent,
      lastActivity: new Date().toISOString(),
      activeUsers: realUsers.filter(user => {
        if (!user.lastLogin) return false;
        const lastLogin = new Date(user.lastLogin);
        const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLogin <= 7; // Actif dans les 7 derniers jours
      }).length,
      mostActiveUser: mostActiveUser.username,
      largestPage: wikiData[largestPage]?.title || 'Inconnue'
    };
  }

  public async getSystemInfo(): Promise<SystemInfo> {
    await this.delay(100);
    
    return {
      version: '1.0.0-beta',
      database: 'SQLite (simulé)',
      environment: process.env.NODE_ENV || 'development',
      framework: 'React 18 + TypeScript + Vite',
      uptime: this.formatUptime(Date.now() - 1643673600000), // Depuis une date fixe
      memoryUsage: '24.3 MB'
    };
  }

  public async deleteUser(userId: number): Promise<boolean> {
    await this.delay(400);
    
    // Utiliser authService pour supprimer l'utilisateur
    return authService.deleteUser(userId);
  }

  public async createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseUser | null> {
    await this.delay(600);
    
    // Utiliser authService pour créer l'utilisateur
    const result = await authService.createUser(
      userData.username,
      'changeme123', // Mot de passe temporaire
      userData.tags
    );
    
    if (result) {
      return {
        id: result.id,
        username: result.username,
        passwordHash: '(hash créé automatiquement)',
        passwordSalt: '(sel créé automatiquement)',
        tags: result.tags,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        login_count: 0
      };
    }
    
    return null;
  }

  public async updateUser(userId: number, updates: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    await this.delay(500);
    
    // Utiliser authService pour mettre à jour l'utilisateur
    const success = await authService.updateUser(userId, {
      username: updates.username,
      tags: updates.tags
      // Note: les mots de passe doivent être mis à jour séparément pour des raisons de sécurité
    });
    
    if (success) {
      // Retourner les données mises à jour
      const users = await this.getUsers();
      return users.find(user => user.id === userId) || null;
    }
    
    return null;
  }

  public async exportData(): Promise<string> {
    await this.delay(800);
    
    const users = await this.getUsers();
    const exportData = {
      users: users.map(user => ({
        ...user,
        passwordHash: '[REDACTED]', // Masquer les hashes dans l'export
        passwordSalt: '[REDACTED]'
      })),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
  }

  public async importData(jsonData: string): Promise<{ success: boolean; message: string; imported: number }> {
    await this.delay(1000);
    
    try {
      const data = JSON.parse(jsonData);
      
      // Vérifier la structure des données
      if (!data.users || !Array.isArray(data.users)) {
        return {
          success: false,
          message: 'Format de données invalide : propriété "users" manquante ou incorrecte',
          imported: 0
        };
      }
      
      // Vérifier la version si présente
      if (data.version && data.version !== '1.0.0') {
        return {
          success: false,
          message: `Version non supportée : ${data.version}. Version supportée : 1.0.0`,
          imported: 0
        };
      }
      
      let importedCount = 0;
      const errors: string[] = [];
      
      // Importer chaque utilisateur
      for (const userData of data.users) {
        try {
          // Vérifier les champs requis
          if (!userData.username || !userData.tags) {
            errors.push(`Utilisateur ignoré : champs manquants (username: ${userData.username})`);
            continue;
          }
          
          // Vérifier si l'utilisateur existe déjà
          const existingUsers = authService.getAllUsers();
          const userExists = existingUsers.some(u => 
            u.username.toLowerCase() === userData.username.toLowerCase()
          );
          
          if (userExists) {
            errors.push(`Utilisateur "${userData.username}" ignoré : existe déjà`);
            continue;
          }
          
          // Créer l'utilisateur (avec un mot de passe temporaire)
          const newUser = await authService.createUser(
            userData.username,
            'temp123', // Mot de passe temporaire, l'utilisateur devra le changer
            userData.tags || ['Membre']
          );
          
          if (newUser) {
            importedCount++;
          } else {
            errors.push(`Échec de l'importation de l'utilisateur "${userData.username}"`);
          }
        } catch (error) {
          errors.push(`Erreur lors de l'importation de "${userData.username}": ${error}`);
        }
      }
      
      let message = `${importedCount} utilisateur(s) importé(s) avec succès.`;
      if (errors.length > 0) {
        message += ` ${errors.length} erreur(s) : ${errors.slice(0, 3).join(', ')}`;
        if (errors.length > 3) {
          message += `... et ${errors.length - 3} autre(s)`;
        }
      }
      
      return {
        success: importedCount > 0,
        message,
        imported: importedCount
      };
      
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors du parsing JSON : ${error}`,
        imported: 0
      };
    }
  }

  private formatUptime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  // Méthodes pour les logs d'activité (simulées)
  public async getActivityLogs(): Promise<any[]> {
    await this.delay(300);
    
    return [
      {
        id: 1,
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // Il y a 5 minutes
        user: 'admin',
        action: 'page_edit',
        details: 'Section "Combat Spatial" modifiée dans Gameplay',
        ip: '192.168.1.100'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // Il y a 15 minutes
        user: 'contributeur1',
        action: 'section_created',
        details: 'Nouvelle section "Stratégies Avancées" ajoutée',
        ip: '192.168.1.101'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // Il y a 30 minutes
        user: 'moderator',
        action: 'user_login',
        details: 'Connexion réussie',
        ip: '192.168.1.102'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // Il y a 45 minutes
        user: 'admin',
        action: 'page_deleted',
        details: 'Page "Test" supprimée',
        ip: '192.168.1.100'
      },
      {
        id: 5,
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // Il y a 1 heure
        user: 'testuser',
        action: 'section_renamed',
        details: 'Section renommée de "Ancienne" vers "Nouvelle"',
        ip: '192.168.1.103'
      }
    ];
  }
}

export default AdminService;
