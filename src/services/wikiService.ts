// Service de gestion des pages wiki utilisant l'API backend
import logger from '../utils/logger';

export interface WikiPage {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_username: string;
  created_at: string;
  updated_at: string;
  is_protected: boolean;
}

interface WikiPagesResponse {
  success: boolean;
  pages?: WikiPage[];
  page?: WikiPage;
  message?: string;
}

class WikiService {
  private baseUrl = 'http://localhost:3001/api/wiki';

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

  async getAllPages(): Promise<WikiPage[] | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: WikiPagesResponse = await response.json();

      if (data.success && data.pages) {
        return data.pages;
      } else {
        logger.warn('Échec de récupération des pages', { message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération des pages', { error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async getPage(title: string): Promise<WikiPage | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(title)}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data: WikiPagesResponse = await response.json();

      if (data.success && data.page) {
        return data.page;
      } else {
        // Ne pas logger comme erreur si c'est juste une page non trouvée
        if (response.status !== 404) {
          logger.warn('Échec de récupération de la page', { title, message: data.message });
        }
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la récupération de la page', { title, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async createPage(title: string, content: string, isProtected: boolean = false): Promise<WikiPage | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          title,
          content,
          isProtected
        })
      });

      const data: WikiPagesResponse = await response.json();

      if (data.success && data.page) {
        logger.info('Page créée', { title });
        return data.page;
      } else {
        logger.warn('Échec de création de page', { title, message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la création de page', { title, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  async updatePage(pageId: string, content: string): Promise<WikiPage | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(pageId)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({
          content
        })
      });

      const data: WikiPagesResponse = await response.json();

      if (data.success && data.page) {
        logger.info('Page mise à jour', { pageId });
        return data.page;
      } else {
        logger.warn('Échec de mise à jour de page', { pageId, message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors de la mise à jour de page', { pageId, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }

  // Méthodes de compatibilité avec l'ancien système
  formatPageData(pages: WikiPage[]): Record<string, any> {
    const formatted: Record<string, any> = {};
    
    pages.forEach(page => {
      formatted[page.title] = {
        title: page.title,
        content: page.content,
        lastModified: page.updated_at,
        author: page.author_username
      };
    });

    return formatted;
  }
}

const wikiService = new WikiService();
export default wikiService;
