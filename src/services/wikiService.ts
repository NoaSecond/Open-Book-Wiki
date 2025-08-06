// Service de gestion des pages wiki utilisant l'API backend
import logger from '../utils/logger';

export interface WikiSection {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  author: string;
}

export interface WikiPage {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_username: string;
  created_at: string;
  updated_at: string;
  is_protected: boolean;
  sections?: WikiSection[]; // Sections optionnelles
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

  async deletePage(pageId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${pageId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });

      const data: WikiPagesResponse = await response.json();

      if (data.success) {
        logger.success('Page supprimée avec succès', { pageId });
        return true;
      } else {
        logger.warn('Échec de suppression de page', { pageId, message: data.message });
        return false;
      }
    } catch (error) {
      logger.error('Erreur lors de la suppression de page', { pageId, error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  async renamePage(pageId: string, newTitle: string): Promise<WikiPage | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${pageId}/rename`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ title: newTitle })
      });

      const data: WikiPagesResponse = await response.json();

      if (data.success && data.page) {
        logger.success('Page renommée avec succès', { pageId, newTitle });
        return data.page;
      } else {
        logger.warn('Échec de renommage de page', { pageId, newTitle, message: data.message });
        return null;
      }
    } catch (error) {
      logger.error('Erreur lors du renommage de page', { pageId, newTitle, error: error instanceof Error ? error.message : 'Unknown error' });
      return null;
    }
  }
}

const wikiService = new WikiService();
export default wikiService;
