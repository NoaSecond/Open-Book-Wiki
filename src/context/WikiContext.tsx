import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../services/authService';
import authService from '../services/authService';
import { WikiPage } from '../services/wikiService';
import wikiService from '../services/wikiService';
import logger from '../utils/logger';

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
  
  // Fonctions utilitaires
  refreshWikiData: () => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  canContribute: () => boolean;
  
  // Fonction pour enrichir une page avec des sections temporaires
  enrichPageWithSections: (page: WikiPage) => WikiPage;
  
  // Fonctions de gestion des pages
  addPage: (title: string) => Promise<string | null>;
  updatePage: (pageId: string, content: string) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;
  renamePage: (pageId: string, newTitle: string) => Promise<void>;
  
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
  // États
  const [user, setUser] = useState<User | null>(null);
  const [wikiData, setWikiData] = useState<WikiData>({});
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<string>('Accueil');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingPageTitle, setEditingPageTitle] = useState<string | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<WikiPage[]>([]);

  // Fonction de recherche dans les pages
  const searchInPages = (term: string): WikiPage[] => {
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
  };

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
      const defaultSection = {
        id: 'main-content',
        title: 'Contenu principal',
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
  const refreshWikiData = async () => {
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

  // Effect pour initialiser l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        logger.info('🚀 Initialisation de l\'application...');
        
        // Timeout global pour éviter un blocage
        const initTimeout = setTimeout(() => {
          logger.warn('⚠️ Timeout d\'initialisation - continuons sans backend');
          setIsLoading(false);
        }, 5000); // 5 secondes max
        
        try {
          // Vérifier l'authentification avec timeout
          const currentUser = await Promise.race([
            authService.getCurrentUser(),
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout auth')), 3000)
            )
          ]);
          
          if (currentUser) {
            setUser(currentUser);
            logger.info('👤 Utilisateur connecté:', currentUser.username);
          }
        } catch (authError) {
          logger.info('ℹ️ Pas d\'utilisateur connecté ou backend indisponible');
        }
        
        try {
          // Charger les données wiki avec timeout
          await Promise.race([
            refreshWikiData(),
            new Promise<void>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout wiki')), 3000)
            )
          ]);
        } catch (wikiError) {
          logger.info('ℹ️ Chargement des données par défaut');
          // Les données par défaut sont déjà gérées dans refreshWikiData
        }
        
        // Charger les préférences utilisateur depuis localStorage
        const savedDarkMode = localStorage.getItem('wiki_dark_mode');
        if (savedDarkMode !== null) {
          setIsDarkMode(savedDarkMode === 'true');
        }
        
        const savedCurrentPage = localStorage.getItem('wiki_current_page');
        if (savedCurrentPage) {
          setCurrentPage(savedCurrentPage);
        }
        
        clearTimeout(initTimeout);
        
      } catch (error) {
        logger.error('❌ Erreur lors de l\'initialisation', error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
        logger.success('✅ Application initialisée');
      }
    };

    initializeApp();
  }, []);

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
      // Vérifier si c'est une mise à jour de section (format: "pageTitle:sectionId")
      if (pageId.includes(':')) {
        const [pageTitle, sectionId] = pageId.split(':');
        const page = wikiData[pageTitle];
        
        if (!page) {
          throw new Error(`Page "${pageTitle}" non trouvée`);
        }
        
        // Remplacer le contenu de la section spécifique
        const sectionRegex = new RegExp(
          `(<!-- SECTION:${sectionId}:[^-]+ -->)[\\s\\S]*?(<!-- END_SECTION:${sectionId} -->)`,
          'g'
        );
        
        const updatedContent = page.content.replace(sectionRegex, `$1\n${content}\n$2`);
        await wikiService.updatePage(pageTitle, updatedContent);
        logger.success(`✅ Section mise à jour`);
      } else {
        // Mise à jour de page complète
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
    
    // Fonctions utilitaires
    refreshWikiData,
    logout,
    isAdmin,
    canContribute,
    
    // Fonctions de gestion des pages
    addPage,
    updatePage,
    deletePage,
    renamePage,
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
