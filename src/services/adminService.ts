// Service pour simuler l'API d'administration de la base de données
// En production, ceci communiquerait avec un vrai backend

export interface DatabaseUser {
  id: number;
  username: string;
  password: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  last_login?: string;
  login_count?: number;
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
  private mockUsers: DatabaseUser[] = [
    {
      id: 1,
      username: 'admin',
      password: 'admin123',
      tags: ['Administrateur'],
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-27T18:00:00Z',
      last_login: '2025-01-27T18:00:00Z',
      login_count: 45
    },
    {
      id: 2,
      username: 'contributeur1',
      password: 'contrib123',
      tags: ['Contributeur'],
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-26T10:30:00Z',
      last_login: '2025-01-26T10:30:00Z',
      login_count: 12
    },
    {
      id: 3,
      username: 'visiteur1',
      password: 'visit123',
      tags: ['Visiteur'],
      created_at: '2025-01-20T00:00:00Z',
      updated_at: '2025-01-25T14:15:00Z',
      last_login: '2025-01-25T14:15:00Z',
      login_count: 3
    },
    {
      id: 4,
      username: 'testuser',
      password: 'test123',
      tags: ['Contributeur'],
      created_at: '2025-01-22T00:00:00Z',
      updated_at: '2025-01-24T16:45:00Z',
      last_login: '2025-01-24T16:45:00Z',
      login_count: 7
    },
    {
      id: 5,
      username: 'moderator',
      password: 'mod123',
      tags: ['Contributeur', 'Modérateur'],
      created_at: '2025-01-10T00:00:00Z',
      updated_at: '2025-01-27T12:30:00Z',
      last_login: '2025-01-27T12:30:00Z',
      login_count: 28
    }
  ];

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
    return [...this.mockUsers];
  }

  public async getStats(wikiData: any): Promise<DatabaseStats> {
    await this.delay(200);
    
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

    // Calculer l'utilisateur le plus actif
    const mostActiveUser = this.mockUsers.reduce((prev, current) => {
      return (prev.login_count || 0) > (current.login_count || 0) ? prev : current;
    });

    // Trouver la page la plus grande
    const largestPage = Object.entries(wikiData).reduce((prev, [key, page]: [string, any]) => {
      const pageSize = page.sections?.reduce((acc: number, section: any) => acc + (section.content?.length || 0), 0) || page.content?.length || 0;
      const prevSize = wikiData[prev]?.sections?.reduce((acc: number, section: any) => acc + (section.content?.length || 0), 0) || wikiData[prev]?.content?.length || 0;
      return pageSize > prevSize ? key : prev;
    }, Object.keys(wikiData)[0]);

    return {
      totalUsers: this.mockUsers.length,
      totalPages,
      totalSections,
      totalContent,
      lastActivity: new Date().toISOString(),
      activeUsers: this.mockUsers.filter(user => {
        const lastLogin = new Date(user.last_login || user.updated_at);
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
    
    const index = this.mockUsers.findIndex(user => user.id === userId);
    if (index !== -1) {
      this.mockUsers.splice(index, 1);
      return true;
    }
    return false;
  }

  public async createUser(userData: Omit<DatabaseUser, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseUser> {
    await this.delay(600);
    
    const newUser: DatabaseUser = {
      ...userData,
      id: Math.max(...this.mockUsers.map(u => u.id)) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      login_count: 0
    };
    
    this.mockUsers.push(newUser);
    return newUser;
  }

  public async updateUser(userId: number, updates: Partial<DatabaseUser>): Promise<DatabaseUser | null> {
    await this.delay(500);
    
    const index = this.mockUsers.findIndex(user => user.id === userId);
    if (index !== -1) {
      this.mockUsers[index] = {
        ...this.mockUsers[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      return this.mockUsers[index];
    }
    return null;
  }

  public async exportData(): Promise<string> {
    await this.delay(800);
    
    const exportData = {
      users: this.mockUsers,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(exportData, null, 2);
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
