import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../services/authService';
import authService from '../services/authService';
import { WikiPage } from '../types';
import wikiService from '../services/wikiService';
import logger from '../utils/logger';
import { getConfigService } from '../services/configService';

// Interfaces
export interface WikiData {
  [key: string]: WikiPage;
}

interface WikiContextType {
  // État utilisateur
  user: User | null;
  setUser: (user: User | null) => void;

  // État des données wiki
  wikiData: WikiData;
  setWikiData: (data: WikiData) => void;

  // État de l'interface
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;
  toggleDarkMode: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;

  // Modales
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (isOpen: boolean) => void;
  isEditModalOpen: boolean;
  setIsEditModalOpen: (isOpen: boolean) => void;
  editingPageTitle: string | null;
  setEditingPageTitle: (title: string | null) => void;

  // Panel administrateur
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (isOpen: boolean) => void;

  // État de chargement
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  loadingMessage: string;
  setLoadingMessage: (message: string) => void;
  isBackendConnected: boolean;
  setIsBackendConnected: (connected: boolean) => void;

  // Fonctions utilitaires
  refreshWikiData: () => Promise<void>;
  retryConnection: () => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  isAdmin: () => boolean;
  canContribute: () => boolean;
  hasPermission: (permission: string) => boolean;

  // Fonction pour enrichir une page avec des sections temporaires
  enrichPageWithSections: (page: WikiPage) => WikiPage;

  // Fonctions de gestion des pages
  addPage: (title: string) => Promise<string | null>;
  updatePage: (pageId: string, content: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  renamePage: (pageId: string, newTitle: string) => Promise<void>;
  reorderPages: (pageIds: string[]) => Promise<void>;
  getFirstNavigationPage: () => string | null;
  renameSectionTitle: (pageId: string, sectionId: string, newTitle: string) => Promise<void>;

  // Fonctions de gestion des sections (pour compatibilité)
  addSection: (title: string) => Promise<string | null>;

  // États de recherche
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchResults: WikiPage[];
  searchInPages: (term: string) => WikiPage[];
}

// Créer le contexte
const WikiContext = createContext<WikiContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
// eslint-disable-next-line react-refresh/only-export-components
export const useWiki = () => {
  const context = useContext(WikiContext);
  if (context === undefined) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
};

// Props du provider
interface WikiProviderProps {
  children: ReactNode;
}

// Provider component
export const WikiProvider: React.FC<WikiProviderProps> = ({ children }) => {
  // Instance du service de configuration
  const configService = getConfigService();

  // États
  const [user, setUser] = useState<User | null>(null);
  const [guestPermissions, setGuestPermissions] = useState<string[]>([]);
  const [wikiData, setWikiData] = useState<WikiData>({});
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<string>('Accueil');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingPageTitle, setEditingPageTitle] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Chargement du guide complet...');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<WikiPage[]>([]);

  // Fonction de recherche dans les pages
  const searchInPages = useCallback((term: string): WikiPage[] => {
    if (!term || term.length < 2) {
      return [];
    }

    const results: WikiPage[] = [];
    const searchTermLower = term.toLowerCase();

    for (const [, page] of Object.entries(wikiData)) {
      // Rechercher dans le titre
      if (page.title.toLowerCase().includes(searchTermLower)) {
        results.push(page);
        continue;
      }

      // Rechercher dans le contenu
      if (page.content.toLowerCase().includes(searchTermLower)) {
        results.push(page);
        continue;
      }

      // Rechercher dans les sections si elles existent
      if (page.sections) {
        const sectionMatch = page.sections.some(section =>
          section.title.toLowerCase().includes(searchTermLower) ||
          section.content.toLowerCase().includes(searchTermLower)
        );
        if (sectionMatch) {
          results.push(page);
        }
      }
    }

    return results;
  }, [wikiData]);

  // Mettre à jour les résultats de recherche quand le terme ou les données changent
  useEffect(() => {
    if (searchTerm && searchTerm.length >= 2) {
      const results = searchInPages(searchTerm);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, wikiData, searchInPages]);

  // Fonction pour enrichir une page avec des sections temporaires
  const enrichPageWithSections = (page: WikiPage): WikiPage => {
    // Si la page a déjà des sections, les utiliser
    if (page.sections) {
      return page;
    }

    // Parser le contenu pour extraire les sections
    const content = page.content || '';
    const sections = [];

    // Regex pour trouver les sections délimitées
    const sectionRegex = /<!-- SECTION:([^:]+):([^-]+) -->([\s\S]*?)<!-- END_SECTION:\1 -->/g;
    let match;

    // Extraire toutes les sections délimitées
    while ((match = sectionRegex.exec(content)) !== null) {
      const [, sectionId, sectionTitle, sectionContent] = match;

      sections.push({
        id: sectionId,
        title: sectionTitle.trim(),
        content: sectionContent.trim(),
        lastModified: page.updated_at,
        author: page.author_username
      });
    }

    // Si aucune section délimitée n'est trouvée, créer une section par défaut
    if (sections.length === 0) {
      // Vérifier s'il y a déjà des balises de section main-content dans le contenu
      const mainContentMatch = content.match(/<!-- SECTION:main-content:([^-]+?) -->/);
      const defaultTitle = mainContentMatch ? mainContentMatch[1].trim() : 'Contenu principal';

      const defaultSection = {
        id: 'main-content',
        title: defaultTitle,
        content: content || '',
        lastModified: page.updated_at,
        author: page.author_username
      };
      sections.push(defaultSection);
    } else {
      // Ajouter le contenu avant la première section comme section principale (si il y en a)
      const firstSectionMatch = content.match(/<!-- SECTION:[^:]+:[^-]+ -->/);
      if (firstSectionMatch && typeof firstSectionMatch.index === 'number' && firstSectionMatch.index > 0) {
        const mainContent = content.substring(0, firstSectionMatch.index).trim();
        if (mainContent) {
          sections.unshift({
            id: 'main-content',
            title: 'Contenu principal',
            content: mainContent,
            lastModified: page.updated_at,
            author: page.author_username
          });
        }
      }
    }

    return {
      ...page,
      sections: sections
    };
  };

  // Fonction pour rafraîchir les données wiki
  const refreshWikiData = useCallback(async () => {
    try {
      logger.info('🔄 Actualisation des données wiki...');

      // Appel avec timeout pour éviter un blocage
      const pages = await Promise.race([
        wikiService.getAllPages(),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout getAllPages')), 3000)
        )
      ]);

      if (pages) {
        const wikiDataMap: WikiData = {};
        pages.forEach(page => {
          // Enrichir chaque page avec des sections lors du chargement
          const enrichedPage = enrichPageWithSections(page);
          wikiDataMap[page.title] = enrichedPage;
        });
        setWikiData(wikiDataMap);
        logger.success(`✅ ${pages.length} pages chargées et enrichies avec des sections`);
      } else {
        // Si aucune page n'est retournée, afficher un message d'information
        logger.info('ℹ️ Aucune page trouvée dans la base de données');
        setWikiData({});
      }
    } catch (error) {
      logger.error('❌ Erreur lors du chargement des pages wiki', error instanceof Error ? error.message : String(error));
      // En cas d'erreur, laisser vide pour forcer la reconnexion
      setWikiData({});
    }
  }, []);

  // Fonction pour réessayer la connexion au backend
  const retryConnection = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Tentative de reconnexion...');
      logger.info('🔄 Tentative de reconnexion au backend...');

      try {
        // Test de connectivité backend simple (même logique que l'initialisation)
        await Promise.race([
          fetch(configService.getApiUrl('/auth/verify'), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('wiki_token') || 'test'}`
            }
          }),
          new Promise<Response>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout backend')), 3000)
          )
        ]);

        // Si on arrive ici, le backend répond, vérifier l'authentification
        logger.info('✅ Backend disponible, vérification authentification...');
        const currentUser = await authService.checkAuth();

        // Backend à nouveau disponible
        setIsBackendConnected(true);
        setLoadingMessage('Reconnecté ! Chargement des données...');

        if (currentUser) {
          setUser(currentUser);
          logger.info('👤 Utilisateur reconnecté:', currentUser.username);
        }

        // Recharger les données wiki
        await refreshWikiData();

        // Charger les préférences
        const savedDarkMode = localStorage.getItem('wiki_dark_mode');
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }

        const savedCurrentPage = localStorage.getItem('wiki_current_page');
        if (savedCurrentPage) {
          setCurrentPage(savedCurrentPage);
        }

        // Fetch guest permissions
        try {
          const response = await fetch(configService.getApiUrl('/auth/guest-permissions'));
          const data = await response.json();
          if (data.success) {
            setGuestPermissions(data.permissions);
          }
        } catch (error: any) {
          logger.error('Erreur lors de la récupération des permissions invité:', error);
        }

        setIsLoading(false);
        logger.success('✅ Reconnexion réussie');

      } catch (backendError) {
        // Backend toujours indisponible
        logger.warn('⚠️ Backend toujours indisponible:', backendError instanceof Error ? backendError.message : String(backendError));
        setIsBackendConnected(false);
        setLoadingMessage('Connexion à la base de données...');
        // On reste en mode chargement, on ne fait PAS setIsLoading(false)
        return;
      }

    } catch {
      logger.warn('⚠️ Échec de la reconnexion');
      setIsBackendConnected(false);
      setLoadingMessage('Connexion à la base de données...');
      // On reste en mode chargement
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAdminPanelOpen(false);
      logger.info('👋 Utilisateur déconnecté');
    } catch (error) {
      logger.error('❌ Erreur lors de la déconnexion', error instanceof Error ? error.message : String(error));
    }
  };

  // Fonction de mise à jour de l'utilisateur
  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) {
        throw new Error('Aucun utilisateur connecté');
      }

      // Mise à jour locale immédiate pour une meilleure UX
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);

      // Envoyer la mise à jour au serveur
      const token = localStorage.getItem('wiki_token');
      if (!token) {
        throw new Error('Token d\'authentification manquant');
      }

      const response = await fetch(configService.getApiUrl('/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // En cas d'erreur serveur, remettre l'ancien état
        setUser(user);
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour avec les données du serveur
      setUser(data.user);
      logger.info('✅ Profil utilisateur mis à jour avec succès');

    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour du profil', error instanceof Error ? error.message : String(error));
      // Remettre l'ancien état en cas d'erreur
      if (user) {
        setUser(user);
      }
      throw error;
    }
  };

  // Effect pour initialiser l'application
  useEffect(() => {
    const continueInitialization = async () => {
      try {
        setLoadingMessage('Chargement des pages wiki...');
        // Charger les données wiki avec timeout
        await Promise.race([
          refreshWikiData(),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout wiki')), 3000)
          )
        ]);
      } catch {
        logger.info('ℹ️ Chargement des données par défaut');
        // Les données par défaut sont déjà gérées dans refreshWikiData
      }

      // Charger les préférences utilisateur depuis localStorage
      setLoadingMessage('Chargement des préférences...');
      const savedDarkMode = localStorage.getItem('wiki_dark_mode');
      if (savedDarkMode !== null) {
        setIsDarkMode(savedDarkMode === 'true');
      }

      const savedCurrentPage = localStorage.getItem('wiki_current_page');
      if (savedCurrentPage) {
        setCurrentPage(savedCurrentPage);
      }

      // Fetch guest permissions
      try {
        const response = await fetch(configService.getApiUrl('/auth/guest-permissions'));
        const data = await response.json();
        if (data.success) {
          setGuestPermissions(data.permissions);
        }
      } catch (error: any) {
        logger.error('Erreur lors de la récupération des permissions invité:', error);
      }

      // Fin de l'initialisation réussie
      setIsLoading(false);
      logger.success('✅ Application initialisée');
    };

    const initializeApp = async () => {
      try {
        logger.info('🚀 Initialisation de l\'application...');
        setLoadingMessage('Chargement du guide complet...');

        // Tentative de connexion au backend
        setLoadingMessage('Connexion à la base de données...');
        logger.info('🔍 Tentative de connexion au backend...');

        try {
          // Test de connectivité backend simple
          await Promise.race([
            fetch(configService.getApiUrl('/auth/verify'), {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('wiki_token') || 'test'}`
              }
            }),
            new Promise<Response>((_, reject) =>
              setTimeout(() => reject(new Error('Timeout backend')), 3000)
            )
          ]);

          // Si on arrive ici, le backend répond (même si auth échoue)
          logger.info('✅ Backend disponible, vérification authentification...');

          // Maintenant vérifier l'authentification proprement
          const currentUser = await authService.checkAuth();

          setIsBackendConnected(true);
          setLoadingMessage('Chargement des données utilisateur...');

          if (currentUser) {
            setUser(currentUser);
            logger.info('👤 Utilisateur connecté:', currentUser.username);
          }

          // Continuer l'initialisation seulement si le backend est connecté
          logger.info('📋 Continuation de l\'initialisation...');
          await continueInitialization();

        } catch (backendError) {
          logger.warn('❌ Échec de connexion au backend:', backendError instanceof Error ? backendError.message : String(backendError));
          logger.info('ℹ️ Backend indisponible - mode hors ligne');
          setIsBackendConnected(false);
          setLoadingMessage('Connexion à la base de données...');

          // En mode hors ligne, on reste en chargement indéfiniment
          // L'utilisateur pourra relancer manuellement ou attendre
          // On ne fait PAS setIsLoading(false) ici
          logger.info('🔄 Attente de reconnexion...');
          return;
        }

      } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation', error instanceof Error ? error.message : String(error));
        // En cas d'erreur générale, on reste aussi en chargement
        setIsBackendConnected(false);
        setLoadingMessage('Connexion à la base de données...');
        logger.info('🔄 Attente de reconnexion après erreur...');
      }
    };

    initializeApp();
  }, [configService, refreshWikiData]);

  // Effect pour sauvegarder les préférences
  useEffect(() => {
    localStorage.setItem('wiki_dark_mode', isDarkMode.toString());
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('wiki_current_page', currentPage);
  }, [currentPage]);

  // Fonctions utilitaires
  const isAdmin = (): boolean => {
    // Accepter both true et 1 pour is_admin (SQLite stocke les boolean comme 0/1)
    return user?.isAdmin === true || user?.isAdmin === 1;
  };

  const canContribute = (): boolean => {
    // Un utilisateur peut contribuer s'il est connecté
    return user !== null;
  };

  const hasPermission = (permission: string): boolean => {
    // Les admins ont toutes les permissions
    if (isAdmin()) return true;

    // Si l'utilisateur est connecté, vérifier ses permissions
    if (user) {
      return user.permissions?.includes(permission) || false;
    }

    // Si l'utilisateur n'est pas connecté, vérifier les permissions invité
    return guestPermissions.includes(permission);
  };

  const toggleDarkMode = (): void => {
    setIsDarkMode(!isDarkMode);
  };

  // Fonctions de gestion des pages
  const addPage = async (title: string): Promise<string | null> => {
    try {
      const newPage = await wikiService.createPage(title, '# ' + title + '\n\nContenu de la page...', false);
      if (newPage) {
        await refreshWikiData(); // Recharger les données
        logger.success(`✅ Page "${title}" créée`);
        return newPage.id.toString();
      }
      return null;
    } catch (error) {
      logger.error('❌ Erreur lors de la création de page', error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  const updatePage = async (pageId: string, content: string): Promise<void> => {
    try {
      logger.debug('🔧 updatePage appelée', { pageId, contentLength: content.length, contentPreview: content.substring(0, 100) });

      // Vérifier si c'est une mise à jour de section (format: "pageTitle:sectionId")
      if (pageId.includes(':')) {
        const [pageTitle, sectionId] = pageId.split(':');

        // Récupérer les données les plus fraîches depuis le backend au lieu du cache
        logger.debug('🔧 Récupération des données fraîches pour la section', { pageTitle, sectionId });
        const configService = getConfigService();
        const response = await fetch(configService.getApiUrl('/wiki'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur lors de la récupération des pages: ${response.status}`);
        }

        const freshPages = await response.json();
        const page = freshPages.find((p: WikiPage) => p.id === pageTitle);

        if (!page) {
          throw new Error(`Page "${pageTitle}" non trouvée`);
        }

        logger.debug('🔧 Mise à jour de section avec données fraîches', {
          pageTitle,
          sectionId,
          pageContentLength: page.content.length,
          contentHasSectionTags: page.content.includes(`<!-- SECTION:${sectionId}:`)
        });

        // Remplacer le contenu de la section spécifique
        const sectionRegex = new RegExp(
          `(<!-- SECTION:${sectionId}:[^-]+ -->)[\\s\\S]*?(<!-- END_SECTION:${sectionId} -->)`,
          'g'
        );

        const updatedContent = page.content.replace(sectionRegex, `$1\n${content}\n$2`);

        logger.debug('🔧 Contenu de section remplacé', {
          originalLength: page.content.length,
          updatedLength: updatedContent.length,
          wasModified: updatedContent !== page.content
        });

        await wikiService.updatePage(pageTitle, updatedContent);
        logger.success(`✅ Section mise à jour`);
      } else {
        // Mise à jour de page complète
        logger.debug('🔧 Mise à jour de page complète', { pageId, contentLength: content.length });
        await wikiService.updatePage(pageId, content);
        logger.success(`✅ Page mise à jour`);
      }

      await refreshWikiData(); // Recharger les données
    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour', error instanceof Error ? error.message : String(error));
    }
  };

  const deletePage = async (pageId: string): Promise<void> => {
    try {
      const success = await wikiService.deletePage(pageId);
      if (success) {
        await refreshWikiData(); // Recharger les données
        logger.success(`✅ Page supprimée`);
      }
    } catch (error) {
      logger.error('❌ Erreur lors de la suppression', error instanceof Error ? error.message : String(error));
    }
  };

  const renamePage = async (pageId: string, newTitle: string): Promise<void> => {
    try {
      const renamedPage = await wikiService.renamePage(pageId, newTitle);
      if (renamedPage) {
        await refreshWikiData(); // Recharger les données
        logger.success(`✅ Page renommée en "${newTitle}"`);
      }
    } catch (error) {
      logger.error('❌ Erreur lors du renommage', error instanceof Error ? error.message : String(error));
    }
  };

  const reorderPages = async (pageIds: string[]): Promise<void> => {
    try {
      // Pour l'instant, nous allons simplement stocker l'ordre dans localStorage
      // car le backend n'a pas encore de support pour l'ordre des pages
      localStorage.setItem('wiki_pages_order', JSON.stringify(pageIds));
      logger.success(`✅ Ordre des pages sauvegardé`);
    } catch (error) {
      logger.error('❌ Erreur lors de la réorganisation', error instanceof Error ? error.message : String(error));
    }
  };

  const renameSectionTitle = async (pageId: string, sectionId: string, newTitle: string): Promise<void> => {
    try {
      const page = wikiData[pageId];
      if (!page) {
        throw new Error(`Page "${pageId}" non trouvée`);
      }

      logger.debug('🔧 renameSectionTitle appelée', { pageId, sectionId, newTitle, contentLength: page.content.length });

      // Vérifier si les balises de section existent déjà
      const sectionPattern = `<!-- SECTION:${sectionId}:`;
      const hasSectionTags = page.content.includes(sectionPattern);

      let updatedContent = page.content;

      if (!hasSectionTags) {
        // Les balises n'existent pas, les créer pour la première fois
        logger.debug('🔧 Création des balises de section pour la première fois', { sectionId, newTitle });
        updatedContent = `<!-- SECTION:${sectionId}:${newTitle} -->\n${page.content.trim()}\n<!-- END_SECTION:${sectionId} -->`;
      } else {
        // Les balises existent, modifier seulement le titre
        const sectionRegex = new RegExp(
          `(<!-- SECTION:${sectionId}:)([^-]+?)(-->)`,
          'g'
        );

        updatedContent = page.content.replace(sectionRegex, `$1${newTitle}$3`);
        logger.debug('🔧 Titre modifié dans balises existantes', { sectionId, newTitle });
      }

      // Vérifier si le contenu a été modifié
      if (updatedContent === page.content) {
        logger.warn(`⚠️ Aucune modification détectée pour la section "${sectionId}" dans la page "${pageId}"`);
        return;
      }

      logger.debug('🔧 Contenu modifié, sauvegarde en cours', {
        originalLength: page.content.length,
        updatedLength: updatedContent.length,
        hasSectionTags
      });

      // Mettre à jour la page avec le nouveau contenu
      await wikiService.updatePage(pageId, updatedContent);
      await refreshWikiData(); // Recharger les données

      logger.success(`✅ Titre de section modifié en "${newTitle}"`);
    } catch (error) {
      logger.error('❌ Erreur lors du renommage de section', error instanceof Error ? error.message : String(error));
    }
  };

  const addSection = async (title: string): Promise<string | null> => {
    try {
      // Générer un ID unique pour la section
      const sectionId = `section-${Date.now()}`;

      // Obtenir la page actuelle
      const currentPageTitle = currentPage;
      const page = wikiData[currentPageTitle];

      if (!page) {
        logger.error('❌ Page courante non trouvée');
        return null;
      }

      // Ajouter la nouvelle section au contenu existant
      const newSectionContent = `\n\n<!-- SECTION:${sectionId}:${title} -->\n# ${title}\n\nContenu de la nouvelle section...\n<!-- END_SECTION:${sectionId} -->\n`;
      const updatedContent = page.content + newSectionContent;

      // Mettre à jour la page avec le nouveau contenu
      await wikiService.updatePage(currentPageTitle, updatedContent);
      await refreshWikiData(); // Recharger les données

      logger.success(`✅ Section "${title}" ajoutée`);
      return sectionId;
    } catch (error) {
      logger.error('❌ Erreur lors de l\'ajout de section', error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  // Fonction pour obtenir la première page de navigation
  const getFirstNavigationPage = useCallback((): string | null => {
    // Récupérer l'ordre sauvegardé dans localStorage
    try {
      const savedOrder = localStorage.getItem('wiki_pages_order');
      if (savedOrder) {
        const pageOrder = JSON.parse(savedOrder) as string[];
        if (pageOrder.length > 0 && wikiData[pageOrder[0]]) {
          return pageOrder[0];
        }
      }
    } catch (error) {
      logger.warn('Erreur lors de la lecture de l\'ordre des pages:', { error: String(error) });
    }

    // Si pas d'ordre sauvegardé, chercher la page "Accueil" en priorité
    for (const [pageId, pageData] of Object.entries(wikiData)) {
      if (pageData.title === 'Accueil') {
        return pageId;
      }
    }

    // Sinon, retourner la première page disponible
    const firstPageId = Object.keys(wikiData)[0];
    return firstPageId || null;
  }, [wikiData]);

  // Valeurs du contexte
  const contextValue: WikiContextType = {
    // État utilisateur
    user,
    setUser,

    // État des données wiki
    wikiData,
    setWikiData,

    // État de l'interface
    isDarkMode,
    setIsDarkMode,
    currentPage,
    setCurrentPage,

    // Modales
    isLoginModalOpen,
    setIsLoginModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    editingPageTitle,
    setEditingPageTitle,

    // Panel administrateur
    isAdminPanelOpen,
    setIsAdminPanelOpen,

    // État de chargement
    isLoading,
    setIsLoading,
    loadingMessage,
    setLoadingMessage,
    isBackendConnected,
    setIsBackendConnected,

    // Fonctions utilitaires
    refreshWikiData,
    retryConnection,
    logout,
    updateUser,
    isAdmin,
    canContribute,
    hasPermission,
    toggleDarkMode,

    // Fonctions de gestion des pages
    addPage,
    updatePage,
    deletePage,
    renamePage,
    reorderPages,
    getFirstNavigationPage,
    renameSectionTitle,
    addSection,

    // Fonctions utilitaires pour les sections
    enrichPageWithSections,

    // États de recherche
    searchTerm,
    setSearchTerm,
    searchResults,
    searchInPages
  };

  return (
    <WikiContext.Provider value={contextValue}>
      {children}
    </WikiContext.Provider>
  );
};

export default WikiContext;
