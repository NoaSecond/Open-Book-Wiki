import React, { useState, useEffect, useMemo } from 'react';
import { X, Activity, Users, Database, Eye, EyeOff, FileText, Edit3, Tag, Plus, Trash2, Save, Shield, Search } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import activityService, { ActivityLog } from '../services/activityService';
import { UserProfileModal } from './UserProfileModal';
import logger from '../utils/logger';
import { getConfigService } from '../services/configService';
import type { Tag as TagType, Permission, User, WikiPage, DatabaseActivity } from '../types';

interface CategoryGroup {
  [category: string]: Permission[];
}

// Component to edit tag permissions
const PermissionEditor: React.FC<{
  tag: TagType;
  allPermissions: Permission[];
  onUpdate: (tagId: number, permissionIds: number[]) => void;
  isDarkMode: boolean;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}> = ({ tag, allPermissions, onUpdate, isDarkMode, onUnsavedChanges }) => {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    tag.permissions?.map((p: Permission) => p.id) || []
  );
  const [originalPermissions, setOriginalPermissions] = useState<number[]>(
    tag.permissions?.map((p: Permission) => p.id) || []
  );

  // Update selected permissions when tag changes
  useEffect(() => {
    const newPermissions = tag.permissions?.map((p: Permission) => p.id) || [];
    setSelectedPermissions(newPermissions);
    setOriginalPermissions(newPermissions);
  }, [tag.id, tag.permissions]);

  // Detect unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (selectedPermissions.length !== originalPermissions.length) return true;
    return selectedPermissions.some(id => !originalPermissions.includes(id)) ||
           originalPermissions.some(id => !selectedPermissions.includes(id));
  }, [selectedPermissions, originalPermissions]);

  // Notify parent of unsaved changes
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onUnsavedChanges]);

  const handlePermissionToggle = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSave = () => {
    onUpdate(tag.id, selectedPermissions);
    setOriginalPermissions([...selectedPermissions]);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment annuler ?')) {
        setSelectedPermissions([...originalPermissions]);
      }
    }
  };

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc: CategoryGroup, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as CategoryGroup);

  const categoryLabels: Record<string, string> = {
    admin: 'Administration',
    content: 'Contenu',
    user: 'Utilisateur',
    general: 'Général'
  };

  return (
    <div className="space-y-4">
      {Object.entries(permissionsByCategory).map(([category, permissions]) => (
        <div key={category} className={`p-4 rounded-lg border ${
          isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
        }`}>
          <h5 className={`font-medium mb-3 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {categoryLabels[category] || category}
          </h5>
          <div className="space-y-2">
            {permissions.map((permission: Permission) => (
              <label key={permission.id} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(permission.id)}
                  onChange={() => handlePermissionToggle(permission.id)}
                  className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {permission.name}
                  </div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {permission.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
      
      {/* Indicateur de changements non sauvegardés */}
      {hasUnsavedChanges && (
        <div className={`p-3 rounded-lg mb-4 border-l-4 ${
          isDarkMode 
            ? 'bg-yellow-900/30 border-yellow-500 text-yellow-300' 
            : 'bg-yellow-50 border-yellow-400 text-yellow-800'
        }`}>
          <div className="flex items-center">
            <div className={`w-2 h-2 rounded-full mr-2 ${
              isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm font-medium">
              Vous avez des modifications non sauvegardées
            </span>
          </div>
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        {hasUnsavedChanges && (
          <button
            onClick={handleCancel}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isDarkMode
                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
          >
            Annuler
          </button>
        )}
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg transition-colors ${
            hasUnsavedChanges
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              : isDarkMode
                ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-600'
          }`}
          disabled={!hasUnsavedChanges}
        >
          {hasUnsavedChanges ? 'Sauvegarder les modifications' : 'Aucun changement'}
        </button>
      </div>
    </div>
  );
};

export const SimpleAdminPanel: React.FC<{ isOpenFromMenu?: boolean; onClose?: () => void }> = ({ 
  isOpenFromMenu = false, 
  onClose 
}) => {
  const { isDarkMode, isAdmin, user, setUser } = useWiki();
  const configService = getConfigService();
  const [isOpen, setIsOpen] = useState(isOpenFromMenu);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'database' | 'tags' | 'permissions'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  // Grouper les logs par jour (YYYY-MM-DD)
  const groupedActivityLogs = useMemo(() => {
    return activityLogs.reduce((acc: Record<string, ActivityLog[]>, log) => {
      const date = new Date(log.timestamp).toLocaleDateString('fr-CA');
      if (!acc[date]) acc[date] = [];
      acc[date].push(log);
      return acc;
    }, {});
  }, [activityLogs]);

  // Pour gérer l'ouverture/fermeture des jours
  const [openDays, setOpenDays] = useState<Record<string, boolean>>({});
  const toggleDay = (date: string) => {
    setOpenDays(prev => ({ ...prev, [date]: !prev[date] }));
  };
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // States for Database tab
  const [dbStats, setDbStats] = useState<{users: User[], pages: WikiPage[], activities: DatabaseActivity[]}>({ users: [], pages: [], activities: [] });
  const [dbActiveTab, setDbActiveTab] = useState<'users' | 'pages' | 'activities'>('users');
  const [showPasswords, setShowPasswords] = useState(false);

  // States for user profile modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // States for Tags tab
  const [tags, setTags] = useState<TagType[]>([]);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [isAddingTag, setIsAddingTag] = useState(false);

  // States for Permissions tab
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [tagPermissions, setTagPermissions] = useState<TagType[]>([]);
  const [selectedTagForPermissions, setSelectedTagForPermissions] = useState<TagType | null>(null);
  const [hasUnsavedPermissionChanges, setHasUnsavedPermissionChanges] = useState(false);

  // States for user sorting and search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSortBy, setUserSortBy] = useState<'permissions' | 'name' | 'email' | 'contributions' | 'joinDate'>('permissions');
  const [userSortOrder, setUserSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fonction pour obtenir le nombre de permissions d'un tag
  const getTagPermissionCount = (tagName: string): number => {
    const tagPerm = tagPermissions.find(tp => tp.name === tagName);
    return tagPerm ? (tagPerm.permissions?.length || 0) : 0;
  };

  // Fonction pour obtenir le score de permissions maximum d'un utilisateur
  const getUserMaxPermissionScore = (user: User): number => {
    if (!user.tags || user.tags.length === 0) return 0;
    return Math.max(...user.tags.map((tag: string) => getTagPermissionCount(tag)));
  };

  // Fonction de tri des utilisateurs
  const sortUsers = (users: User[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    return [...users].sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'permissions':
          valueA = getUserMaxPermissionScore(a);
          valueB = getUserMaxPermissionScore(b);
          break;
        case 'name':
          valueA = a.username.toLowerCase();
          valueB = b.username.toLowerCase();
          break;
        case 'email':
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case 'contributions':
          valueA = a.contributions || 0;
          valueB = b.contributions || 0;
          break;
        case 'joinDate':
          valueA = new Date(a.created_at || 0).getTime();
          valueB = new Date(b.created_at || 0).getTime();
          break;
        default:
          valueA = getUserMaxPermissionScore(a);
          valueB = getUserMaxPermissionScore(b);
      }
      
      if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
      
      // Tri secondaire par nom d'utilisateur
      return a.username.localeCompare(b.username);
    });
  };

  // Filtrer les utilisateurs par terme de recherche
  const filteredUsers = allUsers.filter(user => {
    if (!userSearchTerm) return true;
    
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      (user.tags || []).some((tag: string) => tag.toLowerCase().includes(searchLower))
    );
  });

  // Appliquer le tri aux utilisateurs filtrés
  const sortedUsers = sortUsers(filteredUsers, userSortBy, userSortOrder);

  useEffect(() => {
    setIsOpen(isOpenFromMenu);
  }, [isOpenFromMenu]);

  useEffect(() => {
    if (isOpen) {
      // Charger les logs d'activité
      const loadLogs = async () => {
        try {
          const logs = await activityService.getLogs(50);
          setActivityLogs(logs);
        } catch (error) {
          console.error('Erreur lors du chargement des logs:', error);
        }
      };

      // Charger les utilisateurs
      const loadUsers = async () => {
        try {
          const response = await fetch(configService.getApiUrl('/auth/users'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setAllUsers(data.users || []);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des utilisateurs:', error);
        }
      };

      // Charger les données BDD
      const loadDatabaseData = async () => {
        try {
          // Charger les utilisateurs pour l'onglet BDD
          const usersResponse = await fetch(configService.getApiUrl('/auth/users'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            setDbStats(prev => ({ ...prev, users: usersData.users || [] }));
          }

          // Charger les pages
          const pagesResponse = await fetch(configService.getApiUrl('/wiki'));
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            setDbStats(prev => ({ ...prev, pages: pagesData.pages || [] }));
          }

          // Charger les activités
          const activitiesResponse = await fetch(configService.getApiUrl('/activities/admin/all'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (activitiesResponse.ok) {
            const activitiesData = await activitiesResponse.json();
            setDbStats(prev => ({ ...prev, activities: activitiesData.activities || [] }));
          }
        } catch (error) {
          logger.error('Erreur lors du chargement des données BDD', { error: error instanceof Error ? error.message : String(error) });
        }
      };

      // Charger les tags
      const loadTags = async () => {
        try {
          const response = await fetch(configService.getApiUrl('/tags'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setTags(data.tags || []);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des tags:', error);
        }
      };

      // Charger les permissions et les permissions des tags
      const loadPermissions = async () => {
        try {
          // Charger toutes les permissions
          const permissionsResponse = await fetch(configService.getApiUrl('/permissions'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (permissionsResponse.ok) {
            const permissionsData = await permissionsResponse.json();
            setPermissions(permissionsData.permissions || []);
          }

          // Charger les permissions des tags
          const tagPermissionsResponse = await fetch(configService.getApiUrl('/permissions/tags'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (tagPermissionsResponse.ok) {
            const tagPermissionsData = await tagPermissionsResponse.json();
            setTagPermissions(tagPermissionsData.tagPermissions || []);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des permissions:', error);
        }
      };

      loadLogs();
      loadUsers();
      loadDatabaseData();
      loadTags();
      loadPermissions();
    }
  }, [isOpen, configService]);

  // Fonction pour ouvrir la modal de profil utilisateur
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  // Fonction pour sauvegarder les modifications de profil utilisateur
  const handleSaveUserProfile = async (userData: Partial<User>) => {
    try {
      const response = await fetch(`http://' + getConfigService().getApiBaseUrl().replace('http://', '').replace('https://', '') + '/api/auth/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          bio: userData.bio,
          tags: userData.tags,
          avatar: userData.avatar
        })
      });

      if (response.ok) {
        // Recharger la liste des utilisateurs
        const usersResponse = await fetch(configService.getApiUrl('/auth/users'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setAllUsers(data.users || []);
          setDbStats(prev => ({ ...prev, users: data.users || [] }));
        }

        // Si l'utilisateur modifié est l'utilisateur connecté, mettre à jour le contexte
        if (user && userData.id === user.id) {
          // Récupérer les données mises à jour de l'utilisateur connecté
          const meResponse = await fetch(configService.getApiUrl('/auth/me'), {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (meResponse.ok) {
            const meData = await meResponse.json();
            if (meData.success && meData.user) {
              setUser(meData.user);
            }
          }
        }
        
        setIsProfileModalOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil utilisateur:', error);
      throw error;
    }
  };

  // Fonction pour obtenir la couleur d'un tag depuis la base de données
  const getTagColor = (tagName: string) => {
    const tag = tags.find(t => t.name === tagName);
    return tag ? tag.color : '#6B7280'; // Couleur par défaut si tag non trouvé
  };

  // Fonctions de gestion des tags
  const handleCreateTag = async () => {
    if (!newTag.name.trim()) return;
    
    try {
      const response = await fetch(configService.getApiUrl('/tags'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTag)
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch(configService.getApiUrl('/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tagsResponse.ok) {
          const data = await tagsResponse.json();
          setTags(data.tags || []);
        }
        
        setNewTag({ name: '', color: '#3B82F6' });
        setIsAddingTag(false);
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + errorData.message);
      }
    } catch (error) {
      console.error('Erreur lors de la création du tag:', error);
      alert('Erreur lors de la création du tag');
    }
  };

  const handleUpdateTag = async (tag: TagType) => {
    try {
      const response = await fetch(`http://' + getConfigService().getApiBaseUrl().replace('http://', '').replace('https://', '') + '/api/tags/${tag.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: tag.name, color: tag.color })
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch(configService.getApiUrl('/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tagsResponse.ok) {
          const data = await tagsResponse.json();
          setTags(data.tags || []);
        }
        
        setEditingTag(null);
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + errorData.message);
      }
    } catch (error) {
      console.error('Erreur lors de la modification du tag:', error);
      alert('Erreur lors de la modification du tag');
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tag ?')) {
      return;
    }
    
    try {
      const response = await fetch(`http://' + getConfigService().getApiBaseUrl().replace('http://', '').replace('https://', '') + '/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch(configService.getApiUrl('/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tagsResponse.ok) {
          const data = await tagsResponse.json();
          setTags(data.tags || []);
        }
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + errorData.message);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du tag:', error);
      alert('Erreur lors de la suppression du tag');
    }
  };

  const handleUpdateTagPermissions = async (tagId: number, permissionIds: number[]) => {
    try {
      const response = await fetch(`http://' + getConfigService().getApiBaseUrl().replace('http://', '').replace('https://', '') + '/api/permissions/tags/${tagId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ permissionIds })
      });

      if (response.ok) {
        // Recharger les permissions des tags
        const tagPermissionsResponse = await fetch(configService.getApiUrl('/permissions/tags'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tagPermissionsResponse.ok) {
          const tagPermissionsData = await tagPermissionsResponse.json();
          setTagPermissions(tagPermissionsData.tagPermissions || []);
          
          // Mettre à jour le tag sélectionné
          const updatedTag = tagPermissionsData.tagPermissions.find((tp: TagType) => tp.id === tagId);
          if (updatedTag) {
            setSelectedTagForPermissions(updatedTag);
          }
        }
      } else {
        const errorData = await response.json();
        alert('Erreur: ' + errorData.message);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
      alert('Erreur lors de la mise à jour des permissions');
    }
  };

  const handleTagSelectionForPermissions = (newTag: TagType) => {
    if (hasUnsavedPermissionChanges) {
      if (confirm('Vous avez des modifications non sauvegardées. Voulez-vous vraiment changer de tag sans sauvegarder ?')) {
        setSelectedTagForPermissions(newTag);
        setHasUnsavedPermissionChanges(false);
      }
    } else {
      setSelectedTagForPermissions(newTag);
    }
  };

  const handlePermissionEditorUpdate = (tagId: number, permissionIds: number[]) => {
    handleUpdateTagPermissions(tagId, permissionIds);
    setHasUnsavedPermissionChanges(false);
  };

  // Vérifier que l'utilisateur est admin (après tous les hooks)
  if (!isAdmin()) {
    return null;
  }

  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-11/12 max-w-6xl h-5/6 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-lg shadow-xl flex flex-col overflow-hidden`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h1 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Panel d'Administration
          </h1>
          <button
            onClick={handleClose}
            className={`p-2 rounded-md transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {[
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'activity', label: 'Activité', icon: Activity },
            { id: 'database', label: 'Base de données', icon: Database },
            { id: 'tags', label: 'Tags', icon: Tag },
            { id: 'permissions', label: 'Permissions', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'users' | 'activity' | 'database' | 'tags' | 'permissions')}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? isDarkMode
                    ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800'
                    : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : isDarkMode
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'users' && (
            <div>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <h2 className={`text-lg font-semibold mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Utilisateurs ({filteredUsers.length}/{allUsers.length})
                  </h2>
                  
                  {/* Barre de recherche */}
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, email ou tag..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    />
                    {userSearchTerm && (
                      <button
                        onClick={() => setUserSearchTerm('')}
                        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                          isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                        } transition-colors`}
                        title="Effacer la recherche"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Contrôles de tri */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex flex-col">
                    <label className={`text-xs font-medium mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Trier par
                    </label>
                    <select
                      value={userSortBy}
                      onChange={(e) => setUserSortBy(e.target.value as 'permissions' | 'name' | 'email' | 'contributions' | 'joinDate')}
                      className={`px-3 py-2 rounded-lg border text-sm ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
                    >
                      <option value="permissions">Permissions</option>
                      <option value="name">Nom</option>
                      <option value="email">Email</option>
                      <option value="contributions">Contributions</option>
                      <option value="joinDate">Date d'inscription</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col">
                    <label className={`text-xs font-medium mb-1 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Ordre
                    </label>
                    <button
                      onClick={() => setUserSortOrder(userSortOrder === 'asc' ? 'desc' : 'asc')}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                          : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                      } focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-1`}
                    >
                      {userSortOrder === 'asc' ? (
                        <>↑ Croissant</>
                      ) : (
                        <>↓ Décroissant</>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {sortedUsers.length > 0 ? (
                  sortedUsers.map(u => (
                    <div
                      key={u.id}
                      className={`p-4 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center overflow-hidden">
                              {u.avatar ? (
                                <img 
                                  src={u.avatar} 
                                  alt="Avatar" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div>
                              <h3 className={`font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {u.username}
                              </h3>
                              <p className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {u.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(u.tags || []).map((tag: string) => {
                              const permissionCount = getTagPermissionCount(tag);
                              return (
                                <span
                                  key={tag}
                                  className="px-2 py-1 text-xs rounded text-white font-medium flex items-center gap-1"
                                  style={{ backgroundColor: getTagColor(tag) }}
                                  title={`${tag} - ${permissionCount} permissions`}
                                >
                                  {tag}
                                  <span className="bg-white bg-opacity-20 px-1 rounded text-xs">
                                    {permissionCount}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className={`text-sm flex items-center gap-3 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            <span>Contributions: {u.contributions || 0}</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-700'
                            }`}>
                              Max permissions: {getUserMaxPermissionScore(u)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleEditUser(u)}
                            className={`p-2 rounded-lg transition-colors ${
                              isDarkMode
                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                            title="Modifier le profil"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {userSearchTerm ? (
                      <div>
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun utilisateur trouvé pour "{userSearchTerm}"</p>
                        <p className="text-sm mt-1">Essayez avec d'autres termes de recherche</p>
                      </div>
                    ) : (
                      <div>
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Aucun utilisateur trouvé</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Logs d'activité récents
              </h2>
              <div className="space-y-4">
                {Object.keys(groupedActivityLogs).length === 0 && (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Aucun log d'activité trouvé
                  </div>
                )}
                {Object.entries(groupedActivityLogs)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .map(([date, logs]) => (
                  <div key={date}>
                    <button
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border font-semibold text-left transition-colors ${
                        isDarkMode
                          ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700'
                          : 'bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200'
                      }`}
                      onClick={() => toggleDay(date)}
                    >
                      <span>{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span className="ml-2 text-xs opacity-70">{logs.length} activité{logs.length > 1 ? 's' : ''}</span>
                      <span className="ml-auto">{openDays[date] ? '▲' : '▼'}</span>
                    </button>
                    {openDays[date] && (
                      <div className="space-y-2 mt-2">
                        {logs.map(log => (
                          <div
                            key={log.id}
                            className={`p-3 rounded-lg border ${
                              isDarkMode 
                                ? 'bg-gray-700 border-gray-600' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg">
                                  {activityService.getActionIcon(log.action)}
                                </span>
                                <div>
                                  <span className={`font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {log.username}
                                  </span>
                                  <span className={`ml-2 ${
                                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                  }`}>
                                    {activityService.formatAction(log.action)}
                                  </span>
                                  {log.target && (
                                    <span className={`ml-2 font-medium ${
                                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                    }`}>
                                      "{log.target}"
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                              </span>
                            </div>
                            {log.details && (
                              <div className={`mt-2 text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {log.details}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div>
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Base de données
              </h2>
              
              {/* Sous-onglets pour la BDD */}
              <div className={`flex space-x-4 mb-6 border-b ${
                isDarkMode ? 'border-gray-600' : 'border-gray-300'
              }`}>
                {[
                  { id: 'users', label: 'Utilisateurs', icon: Users, count: dbStats.users.length },
                  { id: 'pages', label: 'Pages', icon: FileText, count: dbStats.pages.length },
                  { id: 'activities', label: 'Activités', icon: Activity, count: dbStats.activities.length }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setDbActiveTab(tab.id as 'users' | 'pages' | 'activities')}
                    className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors ${
                      dbActiveTab === tab.id
                        ? isDarkMode
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-600 border-b-2 border-blue-600'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label} ({tab.count})</span>
                  </button>
                ))}
              </div>

              {/* Contenu des sous-onglets BDD */}
              {dbActiveTab === 'users' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-md font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Utilisateurs ({dbStats.users.length})
                    </h3>
                    <button
                      onClick={() => setShowPasswords(!showPasswords)}
                      className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${
                        isDarkMode
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span>{showPasswords ? 'Masquer' : 'Afficher'} mots de passe</span>
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    {dbStats.users.map(user => (
                      <div
                        key={user.id}
                        className={`p-4 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>ID:</strong> {user.id}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Username:</strong> {user.username}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Email:</strong> {user.email}
                          </div>
                          {showPasswords && (
                            <div>
                              <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Password Hash:</strong>
                              <span className={`text-xs font-mono break-all ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {user.password_hash}
                              </span>
                            </div>
                          )}
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Créé le:</strong> {new Date(user.created_at).toLocaleString('fr-FR')}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Tags:</strong> {user.tags || 'Aucun'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dbActiveTab === 'pages' && (
                <div>
                  <h3 className={`text-md font-medium mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Pages ({dbStats.pages.length})
                  </h3>
                  
                  <div className="grid gap-4">
                    {dbStats.pages.map(page => (
                      <div
                        key={page.id}
                        className={`p-4 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>ID:</strong> {page.id}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Titre:</strong> {page.title}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Auteur:</strong> {page.author_username}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Créé le:</strong> {page.created_at ? new Date(page.created_at).toLocaleString('fr-FR') : 'N/A'}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Modifié le:</strong> {page.updated_at ? new Date(page.updated_at).toLocaleString('fr-FR') : 'N/A'}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Taille:</strong> {page.content?.length || 0} caractères
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {dbActiveTab === 'activities' && (
                <div>
                  <h3 className={`text-md font-medium mb-4 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Activités ({dbStats.activities.length})
                  </h3>
                  
                  <div className="grid gap-2">
                    {dbStats.activities.map(activity => (
                      <div
                        key={activity.id}
                        className={`p-3 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                              {activity.username}
                            </strong>
                            <span className={`ml-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {activity.action}
                            </span>
                            {activity.target && (
                              <span className={`ml-2 font-medium ${
                                isDarkMode ? 'text-blue-400' : 'text-blue-600'
                              }`}>
                                "{activity.target}"
                              </span>
                            )}
                          </div>
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {new Date(activity.timestamp).toLocaleString('fr-FR')}
                          </span>
                        </div>
                        {activity.details && (
                          <div className={`mt-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {activity.details}
                          </div>
                        )}
                      </div>
                    ))}
                    {dbStats.activities.length === 0 && (
                      <div className={`text-center py-8 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Aucune activité trouvée
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tags' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Gestion des Tags ({tags.length})
                </h2>
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter un tag</span>
                </button>
              </div>

              {/* Formulaire d'ajout de tag */}
              {isAddingTag && (
                <div className={`p-4 rounded-lg border mb-4 ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`font-medium mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Nouveau tag
                  </h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={newTag.name}
                      onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                      placeholder="Nom du tag"
                      className={`flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isDarkMode 
                          ? 'bg-slate-700 text-white border-slate-600' 
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                    />
                    <input
                      type="color"
                      value={newTag.color}
                      onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                      className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    />
                    <button
                      onClick={handleCreateTag}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Créer</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingTag(false);
                        setNewTag({ name: '', color: '#3B82F6' });
                      }}
                      className={`px-4 py-2 rounded transition-colors ${
                        isDarkMode 
                          ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                          : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                      }`}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Liste des tags */}
              <div className="grid gap-3">
                {tags.map(tag => (
                  <div
                    key={tag.id}
                    className={`p-4 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {editingTag?.id === tag.id ? (
                      <div className="flex items-center space-x-3">
                        <input
                          type="text"
                          value={editingTag.name}
                          onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                          className={`flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode 
                              ? 'bg-slate-700 text-white border-slate-600' 
                              : 'bg-white text-gray-900 border-gray-300'
                          }`}
                        />
                        <input
                          type="color"
                          value={editingTag.color}
                          onChange={(e) => setEditingTag({ ...editingTag, color: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <button
                          onClick={() => handleUpdateTag(editingTag)}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Sauver</span>
                        </button>
                        <button
                          onClick={() => setEditingTag(null)}
                          className={`px-3 py-2 rounded transition-colors ${
                            isDarkMode 
                              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                              : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                          }`}
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: tag.color }}
                          ></div>
                          <span className={`font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {tag.name}
                          </span>
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {tag.color}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEditingTag({ ...tag })}
                            className={`p-2 rounded transition-colors ${
                              isDarkMode
                                ? 'bg-gray-600 hover:bg-gray-500 text-white'
                                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                            }`}
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {tags.length === 0 && (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Aucun tag trouvé
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Permissions */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <div className={`p-6 border rounded-lg ${
                isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
              }`}>
                <h3 className={`text-lg font-medium mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  Gestion des Permissions par Tag
                </h3>
                <p className={`text-sm mb-6 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Configurez les permissions pour chaque tag. Les utilisateurs héritent automatiquement des permissions de leurs tags.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Liste des tags */}
                  <div>
                    <h4 className={`text-md font-medium mb-3 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      Tags
                    </h4>
                    <div className="space-y-2">
                      {tagPermissions.map(tagPerm => (
                        <button
                          key={tagPerm.id}
                          onClick={() => handleTagSelectionForPermissions(tagPerm)}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedTagForPermissions?.id === tagPerm.id
                              ? isDarkMode
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                              : isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-4 h-4 rounded"
                              style={{ backgroundColor: tagPerm.color }}
                            ></div>
                            <div>
                              <div className="font-medium">{tagPerm.name}</div>
                              <div className={`text-sm ${
                                selectedTagForPermissions?.id === tagPerm.id
                                  ? isDarkMode ? 'text-blue-200' : 'text-blue-700'
                                  : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {tagPerm.permissions?.length || 0} permission(s)
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Permissions du tag sélectionné */}
                  <div>
                    {selectedTagForPermissions ? (
                      <>
                        <div className="flex items-center space-x-3 mb-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: selectedTagForPermissions.color }}
                          ></div>
                          <h4 className={`text-md font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Permissions de "{selectedTagForPermissions.name}"
                          </h4>
                        </div>
                        <PermissionEditor
                          tag={selectedTagForPermissions}
                          allPermissions={permissions}
                          onUpdate={handlePermissionEditorUpdate}
                          isDarkMode={isDarkMode}
                          onUnsavedChanges={setHasUnsavedPermissionChanges}
                        />
                      </>
                    ) : (
                      <div className={`text-center py-8 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Sélectionnez un tag pour voir et modifier ses permissions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de profil utilisateur */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUserProfile}
          isAdmin={true}
          availableTags={tags}
        />
      )}
    </div>
  );
};

export default SimpleAdminPanel;
