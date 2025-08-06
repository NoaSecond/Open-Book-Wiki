import React, { useState, useEffect } from 'react';
import { X, Activity, Users } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import activityService, { ActivityLog } from '../services/activityService';

export const SimpleAdminPanel: React.FC<{ isOpenFromMenu?: boolean; onClose?: () => void }> = ({ 
  isOpenFromMenu = false, 
  onClose 
}) => {
  const { isDarkMode, allUsers, isAdmin } = useWiki();
  const [isOpen, setIsOpen] = useState(isOpenFromMenu);
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Vérifier que l'utilisateur est admin
  if (!isAdmin()) {
    return null;
  }

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
      loadLogs();
    }
  }, [isOpen]);

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
            { id: 'activity', label: 'Activité', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'users' | 'activity')}
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
                          {(u.tags || []).map(tag => (
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
        </div>
      </div>
    </div>
  );
};

export default SimpleAdminPanel;
