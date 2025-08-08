import React, { useState, useEffect } from 'react';
import { X, Activity, Users, Database, Eye, EyeOff, FileText, Edit3, Tag, Plus, Trash2, Save } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import activityService, { ActivityLog } from '../services/activityService';
import { UserProfileModal } from './UserProfileModal';
import logger from '../utils/logger';

export const SimpleAdminPanel: React.FC<{ isOpenFromMenu?: boolean; onClose?: () => void }> = ({ 
  isOpenFromMenu = false, 
  onClose 
}) => {
  const { isDarkMode, isAdmin, user, setUser } = useWiki();
  const [isOpen, setIsOpen] = useState(isOpenFromMenu);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'database' | 'tags'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // TODO: Créer une interface User appropriée
  
  // États pour l'onglet Base de données
  const [dbStats, setDbStats] = useState<{users: any[], pages: any[], activities: any[]}>({ users: [], pages: [], activities: [] });
  const [dbActiveTab, setDbActiveTab] = useState<'users' | 'pages' | 'activities'>('users');
  const [showPasswords, setShowPasswords] = useState(false);

  // États pour la modal de profil utilisateur
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // États pour l'onglet Tags
  const [tags, setTags] = useState<any[]>([]);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [newTag, setNewTag] = useState({ name: '', color: '#3B82F6' });
  const [isAddingTag, setIsAddingTag] = useState(false);

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
          const response = await fetch('http://localhost:3001/api/auth/users', {
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
          const usersResponse = await fetch('http://localhost:3001/api/auth/users', {
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
          const pagesResponse = await fetch('http://localhost:3001/api/wiki');
          if (pagesResponse.ok) {
            const pagesData = await pagesResponse.json();
            setDbStats(prev => ({ ...prev, pages: pagesData.pages || [] }));
          }

          // Charger les activités
          const activitiesResponse = await fetch('http://localhost:3001/api/activities/admin/all', {
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
          const response = await fetch('http://localhost:3001/api/tags', {
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

      loadLogs();
      loadUsers();
      loadDatabaseData();
      loadTags();
    }
  }, [isOpen]);

  // Fonction pour ouvrir la modal de profil utilisateur
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsProfileModalOpen(true);
  };

  // Fonction pour sauvegarder les modifications de profil utilisateur
  const handleSaveUserProfile = async (userData: any) => {
    try {
      const response = await fetch(`http://localhost:3001/api/auth/users/${userData.id}`, {
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
        const usersResponse = await fetch('http://localhost:3001/api/auth/users', {
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
          const meResponse = await fetch('http://localhost:3001/api/auth/me', {
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
      const response = await fetch('http://localhost:3001/api/tags', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTag)
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch('http://localhost:3001/api/tags', {
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

  const handleUpdateTag = async (tag: any) => {
    try {
      const response = await fetch(`http://localhost:3001/api/tags/${tag.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: tag.name, color: tag.color })
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch('http://localhost:3001/api/tags', {
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
      const response = await fetch(`http://localhost:3001/api/tags/${tagId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('wiki_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Recharger les tags
        const tagsResponse = await fetch('http://localhost:3001/api/tags', {
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
            { id: 'tags', label: 'Tags', icon: Tag }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'users' | 'activity' | 'database' | 'tags')}
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
              <h2 className={`text-lg font-semibold mb-4 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Utilisateurs ({allUsers.length})
              </h2>
              <div className="grid gap-4">
                {allUsers.map(u => (
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
                          {(u.tags || []).map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs rounded text-white font-medium"
                              style={{ backgroundColor: getTagColor(tag) }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`text-sm ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          Contributions: {u.contributions || 0}
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
                ))}
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
              <div className="space-y-2">
                {activityLogs.map(log => (
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
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
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
                {activityLogs.length === 0 && (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Aucun log d'activité trouvé
                  </div>
                )}
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
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Créé le:</strong> {new Date(page.created_at).toLocaleString('fr-FR')}
                          </div>
                          <div>
                            <strong className={isDarkMode ? 'text-white' : 'text-gray-900'}>Modifié le:</strong> {new Date(page.updated_at).toLocaleString('fr-FR')}
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
