// Utilitaires pour formater les dates
import logger from './logger';

export class DateUtils {
  // Formater une date au format français
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Si c'est aujourd'hui
      if (date.toDateString() === today.toDateString()) {
        return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      // Si c'est hier
      if (date.toDateString() === yesterday.toDateString()) {
        return `Hier à ${date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      // Si c'est cette semaine
      const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
        return `${dayNames[date.getDay()]} à ${date.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      }

      // Format standard français
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      logger.warn('⚠️ Erreur de formatage de date', `${dateString}: ${error}`);
      return dateString; // Retourner la chaîne originale en cas d'erreur
    }
  }

  // Formater une date courte (sans l'heure)
  static formatDateShort(dateString: string): string {
    try {
      const date = new Date(dateString);
      const today = new Date();
      
      // Si c'est aujourd'hui
      if (date.toDateString() === today.toDateString()) {
        return "Aujourd'hui";
      }

      // Si c'est cette année
      if (date.getFullYear() === today.getFullYear()) {
        return date.toLocaleDateString('fr-FR', {
          month: 'long',
          day: 'numeric'
        });
      }

      // Avec l'année
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      logger.warn('⚠️ Erreur de formatage de date courte', `${dateString}: ${error}`);
      return dateString;
    }
  }

  // Obtenir un timestamp relatif (il y a X temps)
  static getRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      if (diffMinutes < 1) {
        return "À l'instant";
      } else if (diffMinutes < 60) {
        return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else if (diffHours < 24) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffDays < 7) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffWeeks < 4) {
        return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
      } else if (diffMonths < 12) {
        return `Il y a ${diffMonths} mois`;
      } else {
        const diffYears = Math.floor(diffMonths / 12);
        return `Il y a ${diffYears} an${diffYears > 1 ? 's' : ''}`;
      }
    } catch (error) {
      logger.warn('⚠️ Erreur de calcul de temps relatif', `${dateString}: ${error}`);
      return dateString;
    }
  }

  // Obtenir la date actuelle au format ISO (YYYY-MM-DD)
  static getCurrentDateISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Obtenir le timestamp actuel complet
  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  // Générer une date récente aléatoire (dans les X derniers jours)
  static getRecentRandomDate(maxDaysAgo: number = 30): string {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    const randomDate = new Date(now);
    randomDate.setDate(randomDate.getDate() - daysAgo);
    return randomDate.toISOString().split('T')[0];
  }

  // Vérifier si une date est aujourd'hui
  static isToday(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const today = new Date();
      return date.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  }

  // Vérifier si une date est dans les 7 derniers jours
  static isThisWeek(dateString: string): boolean {
    try {
      const date = new Date(dateString);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    } catch {
      return false;
    }
  }
}

export default DateUtils;
