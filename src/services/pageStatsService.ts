// Service pour gérer les statistiques des pages (vues, etc.)
import logger from '../utils/logger';

export interface PageStats {
  pageId: string;
  views: number;
  lastViewed: string;
  viewsToday: number;
  viewsThisWeek: number;
  viewHistory: Array<{
    date: string;
    count: number;
  }>;
}

class PageStatsService {
  private storageKey = 'wiki_page_stats';
  private sessionKey = 'wiki_session_views'; // Pour éviter de compter plusieurs vues par session

  // Récupérer les statistiques stockées
  private getStoredStats(): Record<string, PageStats> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      logger.error('❌ Erreur lors de la lecture des stats', error);
      return {};
    }
  }

  // Sauvegarder les statistiques
  private saveStats(stats: Record<string, PageStats>): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(stats));
      logger.debug('💾 Stats sauvegardées', Object.keys(stats).length + ' pages');
    } catch (error) {
      logger.error('❌ Erreur lors de la sauvegarde des stats', error);
    }
  }

  // Récupérer les vues de session pour éviter les doublons
  private getSessionViews(): Set<string> {
    try {
      const stored = sessionStorage.getItem(this.sessionKey);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch (error) {
      return new Set();
    }
  }

  // Sauvegarder les vues de session
  private saveSessionViews(views: Set<string>): void {
    try {
      sessionStorage.setItem(this.sessionKey, JSON.stringify([...views]));
    } catch (error) {
      logger.warn('⚠️ Impossible de sauvegarder les vues de session', error);
    }
  }

  // Enregistrer une vue de page
  recordPageView(pageId: string): void {
    const sessionViews = this.getSessionViews();
    
    // Si cette page a déjà été vue dans cette session, ne pas compter
    if (sessionViews.has(pageId)) {
      return;
    }

    const stats = this.getStoredStats();
    const today = new Date().toISOString().split('T')[0];
    const thisWeekStart = this.getWeekStart().toISOString().split('T')[0];

    if (!stats[pageId]) {
      stats[pageId] = {
        pageId,
        views: 0,
        lastViewed: today,
        viewsToday: 0,
        viewsThisWeek: 0,
        viewHistory: []
      };
    }

    const pageStats = stats[pageId];

    // Incrémenter les vues totales
    pageStats.views++;
    pageStats.lastViewed = today;

    // Réinitialiser les compteurs si c'est un nouveau jour
    if (pageStats.lastViewed !== today) {
      pageStats.viewsToday = 0;
    }

    // Incrémenter les vues du jour
    pageStats.viewsToday++;

    // Gérer les vues de la semaine
    if (pageStats.lastViewed >= thisWeekStart) {
      pageStats.viewsThisWeek++;
    } else {
      pageStats.viewsThisWeek = 1;
    }

    // Ajouter à l'historique des vues
    const existingHistoryEntry = pageStats.viewHistory.find(h => h.date === today);
    if (existingHistoryEntry) {
      existingHistoryEntry.count++;
    } else {
      pageStats.viewHistory.push({ date: today, count: 1 });
    }

    // Limiter l'historique à 30 jours
    pageStats.viewHistory = pageStats.viewHistory
      .filter(h => {
        const entryDate = new Date(h.date);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return entryDate >= thirtyDaysAgo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    // Sauvegarder
    this.saveStats(stats);
    
    // Marquer comme vu dans cette session
    sessionViews.add(pageId);
    this.saveSessionViews(sessionViews);

    logger.debug('👁️ Vue enregistrée', `${pageId} (${pageStats.views} vues totales)`);
  }

  // Récupérer les statistiques d'une page
  getPageStats(pageId: string): PageStats | null {
    const stats = this.getStoredStats();
    return stats[pageId] || null;
  }

  // Récupérer le nombre de vues d'une page
  getPageViews(pageId: string): number {
    const pageStats = this.getPageStats(pageId);
    return pageStats ? pageStats.views : 0;
  }

  // Récupérer toutes les statistiques
  getAllStats(): Record<string, PageStats> {
    return this.getStoredStats();
  }

  // Obtenir le début de la semaine courante (lundi)
  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour commencer le lundi
    return new Date(now.setDate(diff));
  }

  // Nettoyer les anciennes statistiques
  cleanupOldStats(): void {
    const stats = this.getStoredStats();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    Object.keys(stats).forEach(pageId => {
      const pageStats = stats[pageId];
      if (new Date(pageStats.lastViewed) < oneMonthAgo && pageStats.views < 5) {
        delete stats[pageId];
      }
    });

    this.saveStats(stats);
    logger.info('🧹 Nettoyage des anciennes statistiques effectué');
  }

  // Obtenir les pages les plus vues
  getTopViewedPages(limit: number = 10): Array<{ pageId: string; views: number }> {
    const stats = this.getStoredStats();
    return Object.values(stats)
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)
      .map(stat => ({ pageId: stat.pageId, views: stat.views }));
  }

  // Initialiser avec des données de base si aucune statistique n'existe
  initializeDefaultStats(): void {
    const stats = this.getStoredStats();
    
    // Si aucune statistique n'existe, créer des données de base pour les pages principales
    if (Object.keys(stats).length === 0) {
      const defaultPages = ['home', 'gameplay', 'characters', 'items'];
      
      defaultPages.forEach((pageId) => {
        const baseViews = Math.floor(Math.random() * 200) + 50; // Entre 50 et 250 vues
        stats[pageId] = {
          pageId,
          views: baseViews,
          lastViewed: new Date().toISOString().split('T')[0],
          viewsToday: Math.floor(Math.random() * 10) + 1,
          viewsThisWeek: Math.floor(Math.random() * 50) + 10,
          viewHistory: this.generateFakeHistory(baseViews)
        };
      });
      
      this.saveStats(stats);
      logger.info('📊 Statistiques par défaut initialisées', Object.keys(stats).length + ' pages');
    }
  }

  // Générer un historique fictif pour les données initiales
  private generateFakeHistory(totalViews: number): Array<{ date: string; count: number }> {
    const history: Array<{ date: string; count: number }> = [];
    const days = Math.min(30, Math.floor(totalViews / 3)); // Répartir sur maximum 30 jours
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const count = Math.floor(Math.random() * 8) + 1; // 1-8 vues par jour
      
      history.push({
        date: date.toISOString().split('T')[0],
        count
      });
    }
    
    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
}

// Instance singleton
const pageStatsService = new PageStatsService();

// Initialiser les données par défaut au démarrage
pageStatsService.initializeDefaultStats();

// Nettoyer les anciennes données de temps en temps
if (Math.random() < 0.1) { // 10% de chance à chaque chargement
  pageStatsService.cleanupOldStats();
}

export default pageStatsService;
