import React, { useState, useEffect } from 'react';
import { X, Activity, Users, Database, Eye, EyeOff, FileText } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import activityService, { ActivityLog } from '../services/activityService';
import logger from '../utils/logger';

export const SimpleAdminPanel: React.FC<{ isOpenFromMenu?: boolean; onClose?: () => void }> = ({ 
  isOpenFromMenu = false, 
  onClose 
}) => {
  const { isDarkMode, isAdmin } = useWiki();
  const [isOpen, setIsOpen] = useState(isOpenFromMenu);
  const [activeTab, setActiveTab] = useState<'users' | 'activity' | 'database'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); // TODO: Créer une interface User appropriée
  
  // États pour l'onglet Base de données
  const [dbStats, setDbStats] = useState<{users: any[], pages: any[], activities: any[]}>({ users: [], pages: [], activities: [] });
  const [dbActiveTab, setDbActiveTab] = useState<'users' | 'pages' | 'activities'>('users');
  const [showPasswords, setShowPasswords] = useState(false);

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
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
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
          const activitiesResponse = await fetch('http://localhost:3001/api/activities', {
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

      loadLogs();
      loadUsers();
      loadDatabaseData();
    }
  }, [isOpen]);

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
            { id: 'database', label: 'Base de données', icon: Database }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'users' | 'activity' | 'database')}
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
                      <div>
                        <h3 className={`font-semibold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {u.username}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(u.tags || []).map((tag: string) => (
                            <span
                              key={tag}
                              className={`px-2 py-1 text-xs rounded ${
                                tag === 'Administrateur'
                                  ? isDarkMode 
                                    ? 'bg-red-600 text-red-100'
                                    : 'bg-red-100 text-red-800'
                                  : isDarkMode
                                    ? 'bg-blue-600 text-blue-100'
                                    : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className={`text-sm ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Contributions: {u.contributions || 0}
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
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminPanel;
