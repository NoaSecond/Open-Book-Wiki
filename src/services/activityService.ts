// Service de gestion des logs d'activité
// Enregistre toutes les actions des utilisateurs dans le wiki

export interface ActivityLog {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  action: 'login' | 'logout' | 'create_page' | 'edit_page' | 'delete_page' | 'create_section' | 'edit_section' | 'delete_section' | 'register' | 'admin_action';
  target?: string; // Nom de la page/section affectée
  details: string;
  ip?: string;
  userAgent?: string;
}

class ActivityService {
  private storageKey = 'wiki_activity_logs';
  private maxLogs = 500; // Garder seulement les 500 derniers logs

  // Ajouter un log d'activité
  addLog(activity: Omit<ActivityLog, 'id' | 'timestamp' | 'ip' | 'userAgent'>): void {
    const logs = this.getLogs();
    
    const newLog: ActivityLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ip: this.getClientIP(),
      userAgent: navigator.userAgent.substring(0, 100), // Limiter la taille
      ...activity
    };

    logs.unshift(newLog); // Ajouter au début
    
    // Garder seulement les logs récents
    if (logs.length > this.maxLogs) {
      logs.splice(this.maxLogs);
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(logs));
  }

  // Récupérer tous les logs
  getLogs(): ActivityLog[] {
    const stored = localStorage.getItem(this.storageKey);
    return stored ? JSON.parse(stored) : [];
  }

  // Récupérer les logs récents (par défaut 20)
  getRecentLogs(limit: number = 20): ActivityLog[] {
    return this.getLogs().slice(0, limit);
  }

  // Récupérer les logs d'un utilisateur spécifique
  getUserLogs(userId: number, limit: number = 10): ActivityLog[] {
    return this.getLogs()
      .filter(log => log.userId === userId)
      .slice(0, limit);
  }

  // Récupérer les logs d'une page spécifique
  getPageLogs(pageName: string, limit: number = 10): ActivityLog[] {
    return this.getLogs()
      .filter(log => log.target === pageName)
      .slice(0, limit);
  }

  // Récupérer les logs par type d'action
  getLogsByAction(action: ActivityLog['action'], limit: number = 10): ActivityLog[] {
    return this.getLogs()
      .filter(log => log.action === action)
      .slice(0, limit);
  }

  // Effacer tous les logs (admin seulement)
  clearLogs(): void {
    localStorage.removeItem(this.storageKey);
  }

  // Obtenir des statistiques d'activité
  getActivityStats() {
    const logs = this.getLogs();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: logs.length,
      today: logs.filter(log => new Date(log.timestamp) >= todayStart).length,
      thisWeek: logs.filter(log => new Date(log.timestamp) >= weekStart).length,
      thisMonth: logs.filter(log => new Date(log.timestamp) >= monthStart).length,
      mostActiveUser: this.getMostActiveUser(logs),
      mostCommonAction: this.getMostCommonAction(logs)
    };
  }

  // Générateur d'ID simple
  private generateId(): number {
    return Date.now() + Math.random() * 1000;
  }

  // Obtenir l'IP du client (simulée)
  private getClientIP(): string {
    // En production, ceci viendrait du serveur
    return '192.168.1.' + Math.floor(Math.random() * 255);
  }

  // Trouver l'utilisateur le plus actif
  private getMostActiveUser(logs: ActivityLog[]): string {
    const userCounts = logs.reduce((acc, log) => {
      acc[log.username] = (acc[log.username] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Aucun';
  }

  // Trouver l'action la plus commune
  private getMostCommonAction(logs: ActivityLog[]): string {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionLabels: Record<string, string> = {
      login: 'Connexion',
      logout: 'Déconnexion',
      create_page: 'Création de page',
      edit_page: 'Édition de page',
      delete_page: 'Suppression de page',
      create_section: 'Création de section',
      edit_section: 'Édition de section',
      delete_section: 'Suppression de section',
      register: 'Inscription',
      admin_action: 'Action admin'
    };

    const mostCommon = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return actionLabels[mostCommon] || 'Aucune';
  }

  // Formater une action pour l'affichage
  formatAction(action: ActivityLog['action']): string {
    const actionLabels: Record<ActivityLog['action'], string> = {
      login: 'Connexion',
      logout: 'Déconnexion',
      create_page: 'Création de page',
      edit_page: 'Édition de page',
      delete_page: 'Suppression de page',
      create_section: 'Création de section',
      edit_section: 'Édition de section',
      delete_section: 'Suppression de section',
      register: 'Inscription',
      admin_action: 'Action admin'
    };

    return actionLabels[action] || action;
  }

  // Obtenir une icône pour chaque type d'action
  getActionIcon(action: ActivityLog['action']): string {
    const actionIcons: Record<ActivityLog['action'], string> = {
      login: '🔐',
      logout: '🚪',
      create_page: '📄',
      edit_page: '✏️',
      delete_page: '🗑️',
      create_section: '📝',
      edit_section: '📋',
      delete_section: '❌',
      register: '👤',
      admin_action: '⚙️'
    };

    return actionIcons[action] || '📝';
  }

  // Obtenir une couleur pour chaque type d'action
  getActionColor(action: ActivityLog['action']): string {
    const actionColors: Record<ActivityLog['action'], string> = {
      login: 'text-green-600',
      logout: 'text-gray-600',
      create_page: 'text-blue-600',
      edit_page: 'text-yellow-600',
      delete_page: 'text-red-600',
      create_section: 'text-purple-600',
      edit_section: 'text-orange-600',
      delete_section: 'text-red-500',
      register: 'text-teal-600',
      admin_action: 'text-indigo-600'
    };

    return actionColors[action] || 'text-gray-600';
  }
}

// Instance singleton
const activityService = new ActivityService();
export default activityService;
