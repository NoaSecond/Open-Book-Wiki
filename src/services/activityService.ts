// Service d'activités utilisant l'API backend
import authService from './authService';
import logger from '../utils/logger';

export interface Activity {
  id: number;
  user_id: number;
  type: string;
  title: string;
  description?: string;
  icon?: string;
  metadata: Record<string, any>;
  created_at: string;
  username?: string; // Ajouté par les requêtes admin
}

// Interface de compatibilité avec l'ancien service
export interface ActivityLog {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  action: string;
  target?: string;
  details: string;
  ip?: string;
  userAgent?: string;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
  pagination?: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
  message?: string;
}

interface CreateActivityResponse {
  success: boolean;
  message: string;
  activity?: Activity;
}

class ActivityService {
  private baseUrl = 'http://localhost:3001/api/activities';

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('wiki_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async getActivities(page: number = 1, limit: number = 50): Promise<{ activities: Activity[]; hasMore: boolean } | null> {
    try {
      const response = await fetch(`${this.baseUrl}?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return {
          activities: data.activities,
          hasMore: data.pagination?.hasMore ?? false
        };
      } else {
        logger.warn('Échec de récupération des activités', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération des activités', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async getTodayActivities(): Promise<Activity[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/today`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return data.activities;
      } else {
        logger.warn('Échec de récupération des activités du jour', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération des activités du jour', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async searchActivities(searchTerm: string, limit: number = 50): Promise<Activity[] | null> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(searchTerm)}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return data.activities;
      } else {
        logger.warn('Échec de recherche d\'activités', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la recherche d\'activités', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async createActivity(
    type: string,
    title: string,
    description?: string,
    icon?: string,
    metadata?: Record<string, any>
  ): Promise<Activity | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          type,
          title,
          description: description || '',
          icon: icon || 'star',
          metadata: metadata || {}
        })
      });

      const data: CreateActivityResponse = await response.json();

      if (data.success && data.activity) {
        logger.info('Activité créée', { title, type });
        return data.activity;
      } else {
        logger.warn('Échec de création d\'activité', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la création d\'activité', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async getAllActivities(page: number = 1, limit: number = 100): Promise<{ activities: Activity[]; hasMore: boolean } | null> {
    if (!authService.isAdmin()) {
      logger.warn('Tentative d\'accès admin sans permissions');
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/admin/all?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        return {
          activities: data.activities,
          hasMore: data.pagination?.hasMore ?? false
        };
      } else {
        logger.warn('Échec de récupération de toutes les activités', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération de toutes les activités', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  // Méthodes de compatibilité avec l'ancien service
  async addLog(activity: {
    action: string;
    target?: string;
    details: string;
  }): Promise<void> {
    await this.createActivity(
      'legacy',
      activity.action,
      activity.details,
      'activity',
      { target: activity.target }
    );
  }

  async getLogs(limit: number = 50): Promise<ActivityLog[]> {
    // Pour les administrateurs, utiliser l'endpoint admin
    try {
      const response = await fetch(`${this.baseUrl}/admin/all?limit=${limit}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: ActivitiesResponse = await response.json();

      if (data.success) {
        const activities = data.activities || [];
        // Convertir les Activity en ActivityLog pour compatibilité
        return activities.map(activity => ({
          id: activity.id,
          timestamp: activity.created_at,
          userId: activity.user_id,
          username: activity.username || 'Utilisateur inconnu',
          action: activity.type,
          target: activity.metadata?.target,
          details: activity.description || activity.title,
          ip: activity.metadata?.ip,
          userAgent: activity.metadata?.userAgent
        }));
      } else {
        logger.warn('Échec de récupération des logs admin', { message: data.message });
        return [];
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération des logs admin:', { error: String(error) });
      return [];
    }
  }

  async getActivityStats(): Promise<{
    totalLogs: number;
    logsByAction: Record<string, number>;
    topUsers: Array<{ username: string; count: number }>;
    recentActivity: ActivityLog[];
  }> {
    // Pour les statistiques, on a besoin de toutes les activités
    const result = await this.getAllActivities(1, 1000);
    const activities = result?.activities ?? [];

    const logsByAction: Record<string, number> = {};
    activities.forEach(activity => {
      logsByAction[activity.type] = (logsByAction[activity.type] || 0) + 1;
    });

    const userCounts: Record<string, number> = {};
    activities.forEach(activity => {
      if (activity.username) {
        userCounts[activity.username] = (userCounts[activity.username] || 0) + 1;
      }
    });

    const topUsers = Object.entries(userCounts)
      .map(([username, count]) => ({ username, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recentActivity = activities.slice(0, 10).map(activity => ({
      id: activity.id,
      timestamp: activity.created_at,
      userId: activity.user_id,
      username: activity.username || 'Utilisateur inconnu',
      action: activity.type,
      target: activity.metadata?.target,
      details: activity.description || activity.title,
      ip: activity.metadata?.ip,
      userAgent: activity.metadata?.userAgent
    }));

    return {
      totalLogs: activities.length,
      logsByAction,
      topUsers,
      recentActivity
    };
  }

  formatAction(action: string): string {
    const actionLabels: Record<string, string> = {
      auth: 'Authentification',
      system: 'Système',
      wiki: 'Wiki',
      admin: 'Administration',
      legacy: 'Activité',
      login: 'Connexion',
      logout: 'Déconnexion',
      create_page: 'Création de page',
      edit_page: 'Modification de page',
      delete_page: 'Suppression de page',
      register: 'Inscription'
    };

    return actionLabels[action] || action;
  }

  getActionIcon(action: string): string {
    const actionIcons: Record<string, string> = {
      auth: '🔐',
      system: '⚙️',
      wiki: '📖',
      admin: '👑',
      legacy: '📝',
      login: '🚪',
      logout: '👋',
      create_page: '📄',
      edit_page: '✏️',
      delete_page: '🗑️',
      register: '👤',
      create_section: '➕',
      edit_section: '✏️',
      delete_section: '❌'
    };

    return actionIcons[action] || '📝';
  }
}

const activityService = new ActivityService();
export default activityService;
