import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import authService, { User as AuthUser } from '../services/authService';
import activityService from '../services/activityService';
import logger from '../utils/logger';
import DateUtils from '../utils/dateUtils';

interface ReadmeSection {
  id: string;
  title: string;
  content: string;
  lastModified: string;
  author: string;
}

interface WikiData {
  [key: string]: {
    title: string;
    content?: string; // Pour les pages simples
    sections?: ReadmeSection[]; // Pour les pages avec sections multiples
    lastModified: string;
    author: string;
  };
}

// Utilisation de l'interface User du service d'authentification
interface User extends AuthUser {
  email?: string;
  avatar?: string;
  bio?: string;
  joinDate?: string;
  contributions?: number;
}

interface WikiContextType {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  wikiData: WikiData;
  updatePage: (pageId: string, content: string) => void;
  addSection: (pageId: string, sectionTitle: string) => string; // Retourne l'ID de la nouvelle section
  addPage: (pageTitle: string) => string; // Ajouter une nouvelle page/catégorie
  renamePage: (oldPageId: string, newTitle: string) => string; // Renommer une page
  deletePage: (pageId: string) => boolean; // Supprimer une page
  renameSection: (pageId: string, sectionId: string, newTitle: string) => boolean; // Renommer une section
  deleteSection: (pageId: string, sectionId: string) => boolean; // Supprimer une section
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editingPage: string;
  setEditingPage: (page: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  // États d'authentification
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  // Panel d'administration
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: (open: boolean) => void;
  openAdminPanel: () => void;
  // Gestion des utilisateurs et permissions
  allUsers: User[];
  setAllUsers: (users: User[]) => void;
  updateUserTags: (username: string, tags: string[]) => Promise<void>;
  updateUserProfile: (userId: number, updates: Partial<User & { password?: string }>) => Promise<boolean>;
  deleteUserProfile: (userId: number) => Promise<boolean>;
  hasPermission: (requiredTag: string) => boolean;
  canContribute: () => boolean;
  isAdmin: () => boolean;
  // Thème
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const WikiContext = createContext<WikiContextType | undefined>(undefined);

const initialWikiData: WikiData = {
  home: {
    title: "Accueil",
    sections: [
      {
        id: "welcome",
        title: "Bienvenue",
        content: `# Bienvenue

Bienvenue sur ce wiki simple et épuré. 

Ce wiki contient uniquement deux catégories principales :
- **Accueil** - Page d'accueil et informations générales
- **Développement** - Informations sur le développement et les contributions

Vous pouvez naviguer entre ces sections à l'aide du menu de gauche.`,
        lastModified: DateUtils.getCurrentDateISO(),
        author: "Admin"
      }
    ],
    lastModified: DateUtils.getCurrentDateISO(),
    author: "Admin"
  },
  development: {
    title: "Développement",
    sections: [
      {
        id: "overview",
        title: "Vue d'ensemble",
        content: `# Développement

## À propos de ce projet

Ce wiki est développé avec les technologies suivantes :
- **React 18** avec TypeScript
- **Tailwind CSS** pour le style
- **Vite** comme outil de build
- **Lucide React** pour les icônes

## Structure du projet

Le projet est organisé de manière modulaire avec :
- Composants React réutilisables
- Service d'authentification
- Gestion d'état centralisée
- Thème sombre/clair`,
        lastModified: DateUtils.getCurrentDateISO(),
        author: "DevTeam"
      },
      {
        id: "contribution",
        title: "Contribuer",
        content: `# Comment contribuer

## Prérequis

- Node.js 18+ 
- npm ou yarn
- Git

## Installation

1. Clonez le repository
2. Installez les dépendances : \`npm install\`
3. Lancez le serveur de développement : \`npm run dev\`

## Contribution

Pour contribuer au projet :
1. Forkez le repository
2. Créez une branche feature
3. Effectuez vos modifications
4. Soumettez une pull request

Les contributions sont les bienvenues !`,
        lastModified: DateUtils.getCurrentDateISO(),
        author: "DevTeam"
      }
    ],
    lastModified: DateUtils.getCurrentDateISO(),
    author: "DevTeam"
  }
};

export const WikiProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [wikiData, setWikiData] = useState<WikiData>(initialWikiData);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPage, setEditingPage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // États d'authentification
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Panel d'administration
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  
  // Gestion des utilisateurs
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Thème sombre/clair
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved !== null ? JSON.parse(saved) : true; // Thème sombre par défaut
  });

  // Synchroniser avec authService au montage
  useEffect(() => {
    const initializeAuth = async () => {
      const currentUser = authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setIsLoggedIn(true);
        logger.info('👤 Utilisateur connecté au chargement', currentUser.username);
      }
      
      // Charger tous les utilisateurs
      const users = await authService.getAllUsers();
      setAllUsers(users);
    };
    
    initializeAuth();
  }, []);

  // Persister le thème
  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Fonctions d'authentification
  const updateUser = async (updates: Partial<User>): Promise<void> => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await authService.updateUser(user.id, updates);
    }
  };

  const updateUserTags = async (username: string, tags: string[]): Promise<void> => {
    // Trouver l'utilisateur par nom
    const targetUser = allUsers.find(u => u.username === username);
    if (!targetUser) return;
    
    const success = authService.updateUserTags(targetUser.id, tags);
    if (success && user?.username === username) {
      setUser(prev => prev ? { ...prev, tags } : null);
    }
    // Recharger la liste des utilisateurs
    const users = await authService.getAllUsers();
    setAllUsers(users);
  };

  const updateUserProfile = async (userId: number, updates: Partial<User & { password?: string }>): Promise<boolean> => {
    const success = await authService.updateUser(userId, updates);
    if (success) {
      // Recharger la liste des utilisateurs
      const users = await authService.getAllUsers();
      setAllUsers(users);
      
      // Si c'est l'utilisateur connecté, mettre à jour ses données
      if (user && user.id === userId) {
        const updatedUser = { ...user, ...updates };
        delete (updatedUser as any).password; // Ne pas stocker le mot de passe
        setUser(updatedUser);
      }
    }
    return success;
  };

  const deleteUserProfile = async (userId: number): Promise<boolean> => {
    const success = await authService.deleteUser(userId);
    if (success) {
      // Recharger la liste des utilisateurs
      const users = await authService.getAllUsers();
      setAllUsers(users);
    }
    return success;
  };

  // Gestion des permissions
  const hasPermission = (requiredTag: string): boolean => {
    if (!user || !user.tags) return false;
    return user.tags.includes(requiredTag) || user.tags.includes('Administrateur');
  };

  const canContribute = (): boolean => {
    return hasPermission('Contributeur');
  };

  const isAdmin = (): boolean => {
    return hasPermission('Administrateur');
  };

  // Fonction pour ouvrir le panel d'administration
  const openAdminPanel = () => {
    if (isAdmin()) {
      setIsAdminPanelOpen(true);
    }
  };

  const updatePage = (pageId: string, content: string) => {
    // Si pageId contient ":", c'est une section (format: "pageId:sectionId")
    if (pageId.includes(':')) {
      const [mainPageId, sectionId] = pageId.split(':');
      setWikiData(prev => {
        const currentPage = prev[mainPageId];
        if (currentPage?.sections) {
          const sectionToUpdate = currentPage.sections.find(s => s.id === sectionId);
          const updatedSections = currentPage.sections.map(section =>
            section.id === sectionId
              ? {
                  ...section,
                  content,
                  lastModified: new Date().toISOString().split('T')[0],
                  author: user?.username || "Contributeur"
                }
              : section
          );
          
          // Logger l'activité d'édition de section
          if (user && sectionToUpdate) {
            logger.info('✏️ Section modifiée', `"${sectionToUpdate.title}" dans "${currentPage.title}" par ${user.username}`);
            activityService.addLog({
              userId: user.id,
              username: user.username,
              action: 'edit_section',
              target: currentPage.title,
              details: `Modification de la section "${sectionToUpdate.title}"`
            });
          }
          
          return {
            ...prev,
            [mainPageId]: {
              ...currentPage,
              sections: updatedSections,
              lastModified: new Date().toISOString().split('T')[0],
            }
          };
        }
        return prev;
      });
    } else {
      // Mise à jour normale pour les pages simples (cas rare maintenant)
      setWikiData(prev => {
        const currentPage = prev[pageId];
        
        // Logger l'activité d'édition de page
        if (user && currentPage) {
          activityService.addLog({
            userId: user.id,
            username: user.username,
            action: 'edit_page',
            target: currentPage.title,
            details: `Modification de la page "${currentPage.title}"`
          });
        }
        
        return {
          ...prev,
          [pageId]: {
            ...prev[pageId],
            content,
            lastModified: new Date().toISOString().split('T')[0],
            author: user?.username || "Contributeur"
          }
        };
      });
    }
    
    // Incrémenter le compteur de contributions
    if (user) {
      updateUser({ contributions: (user.contributions || 0) + 1 });
    }
  };

  const addSection = (pageId: string, sectionTitle: string): string => {
    const newSectionId = `section-${Date.now()}`;
    const newSection: ReadmeSection = {
      id: newSectionId,
      title: sectionTitle,
      content: `# ${sectionTitle}\n\nContenu de la nouvelle section...`,
      lastModified: new Date().toISOString().split('T')[0],
      author: user?.username || "Contributeur"
    };

    setWikiData(prev => {
      const currentPage = prev[pageId];
      if (currentPage) {
        // Si la page n'a pas encore de sections, en créer un tableau
        const sections = currentPage.sections || [];
        
        // Logger l'activité de création de section
        if (user) {
          activityService.addLog({
            userId: user.id,
            username: user.username,
            action: 'create_section',
            target: currentPage.title,
            details: `Création de la section "${sectionTitle}"`
          });
        }
        
        return {
          ...prev,
          [pageId]: {
            ...currentPage,
            sections: [...sections, newSection],
            lastModified: new Date().toISOString().split('T')[0],
          }
        };
      }
      return prev;
    });

    // Incrémenter le compteur de contributions
    if (user) {
      updateUser({ contributions: (user.contributions || 0) + 1 });
    }

    return newSectionId;
  };

  const addPage = (pageTitle: string): string => {
    // Créer un ID unique basé sur le titre
    const pageId = pageTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Vérifier si la page existe déjà
    if (wikiData[pageId]) {
      logger.warn('⚠️ Page déjà existante', pageTitle);
      console.warn(`La page "${pageTitle}" existe déjà`);
      return pageId;
    }

    const newPage = {
      title: pageTitle,
      sections: [], // Commencer avec une page vide avec sections
      lastModified: new Date().toISOString().split('T')[0],
      author: user?.username || "Contributeur"
    };

    setWikiData(prev => ({
      ...prev,
      [pageId]: newPage
    }));

    // Incrémenter le compteur de contributions
    if (user) {
      updateUser({ contributions: (user.contributions || 0) + 1 });
      logger.success('📄 Nouvelle page créée', `"${pageTitle}" par ${user.username}`);
    }

    return pageId;
  };

  const renamePage = (oldPageId: string, newTitle: string): string => {
    // Créer un nouvel ID basé sur le nouveau titre
    const newPageId = newTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Vérifier si la page existe
    if (!wikiData[oldPageId]) {
      console.warn(`La page "${oldPageId}" n'existe pas`);
      return oldPageId;
    }

    // Vérifier si le nouvel ID est différent et n'existe pas déjà
    if (newPageId !== oldPageId && wikiData[newPageId]) {
      console.warn(`Une page avec l'ID "${newPageId}" existe déjà`);
      return oldPageId;
    }

    setWikiData(prev => {
      const updatedData = { ...prev };
      
      // Si l'ID change, créer une nouvelle entrée et supprimer l'ancienne
      if (newPageId !== oldPageId) {
        updatedData[newPageId] = {
          ...updatedData[oldPageId],
          title: newTitle,
          lastModified: new Date().toISOString().split('T')[0],
        };
        delete updatedData[oldPageId];
      } else {
        // Si seul le titre change
        updatedData[oldPageId] = {
          ...updatedData[oldPageId],
          title: newTitle,
          lastModified: new Date().toISOString().split('T')[0],
        };
      }
      
      return updatedData;
    });

    // Si l'ID a changé et que c'est la page actuelle, naviguer vers le nouvel ID
    if (newPageId !== oldPageId && currentPage === oldPageId) {
      setCurrentPage(newPageId);
    }

    return newPageId;
  };

  const deletePage = (pageId: string): boolean => {
    // Vérifier si la page existe
    if (!wikiData[pageId]) {
      console.warn(`La page "${pageId}" n'existe pas`);
      return false;
    }

    // Empêcher la suppression des pages essentielles
    const protectedPages = ['home', 'development'];
    if (protectedPages.includes(pageId)) {
      console.warn(`La page "${pageId}" est protégée et ne peut pas être supprimée`);
      return false;
    }

    setWikiData(prev => {
      const updatedData = { ...prev };
      delete updatedData[pageId];
      return updatedData;
    });

    // Si c'est la page actuelle qui est supprimée, naviguer vers l'accueil
    if (currentPage === pageId) {
      setCurrentPage('home');
    }

    return true;
  };

  const renameSection = (pageId: string, sectionId: string, newTitle: string): boolean => {
    if (!wikiData[pageId]?.sections) {
      console.warn(`La page "${pageId}" n'a pas de sections`);
      return false;
    }

    setWikiData(prev => {
      const currentPage = prev[pageId];
      if (currentPage?.sections) {
        const updatedSections = currentPage.sections.map(section =>
          section.id === sectionId
            ? {
                ...section,
                title: newTitle,
                lastModified: new Date().toISOString().split('T')[0],
                author: user?.username || "Contributeur"
              }
            : section
        );

        return {
          ...prev,
          [pageId]: {
            ...currentPage,
            sections: updatedSections,
            lastModified: new Date().toISOString().split('T')[0],
          }
        };
      }
      return prev;
    });

    return true;
  };

  const deleteSection = (pageId: string, sectionId: string): boolean => {
    if (!wikiData[pageId]?.sections) {
      console.warn(`La page "${pageId}" n'a pas de sections`);
      return false;
    }

    const sections = wikiData[pageId].sections!;
    // Empêcher la suppression s'il ne reste qu'une section
    if (sections.length <= 1) {
      console.warn(`Impossible de supprimer la dernière section de la page "${pageId}"`);
      return false;
    }

    setWikiData(prev => {
      const currentPage = prev[pageId];
      if (currentPage?.sections) {
        const updatedSections = currentPage.sections.filter(section => section.id !== sectionId);

        return {
          ...prev,
          [pageId]: {
            ...currentPage,
            sections: updatedSections,
            lastModified: new Date().toISOString().split('T')[0],
          }
        };
      }
      return prev;
    });

    return true;
  };

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => !prev);
  };

  return (
    <WikiContext.Provider value={{
      currentPage,
      setCurrentPage,
      wikiData,
      updatePage,
      addSection,
      addPage,
      renamePage,
      deletePage,
      renameSection,
      deleteSection,
      isEditing,
      setIsEditing,
      editingPage,
      setEditingPage,
      searchTerm,
      setSearchTerm,
      isLoggedIn,
      setIsLoggedIn,
      user,
      setUser,
      updateUser,
      isAdminPanelOpen,
      setIsAdminPanelOpen,
      openAdminPanel,
      allUsers,
      setAllUsers,
      updateUserTags,
      updateUserProfile,
      deleteUserProfile,
      hasPermission,
      canContribute,
      isAdmin,
      isDarkMode,
      toggleTheme
    }}>
      {children}
    </WikiContext.Provider>
  );
};

export const useWiki = () => {
  const context = useContext(WikiContext);
  if (context === undefined) {
    throw new Error('useWiki must be used within a WikiProvider');
  }
  return context;
};
