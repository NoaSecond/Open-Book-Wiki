import React, { useState, useEffect } from 'react';
import { Database, Users, FileText, Settings, X, Eye, EyeOff, Trash2, Activity, Download, RefreshCw } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import AdminService, { 
  DatabaseUser as AdminDatabaseUser, 
  DatabaseStats as AdminDatabaseStats, 
  SystemInfo 
} from '../services/adminService';

interface ActivityLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

export const AdminPanel: React.FC = () => {
  const { isDarkMode, user, wikiData } = useWiki();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'pages' | 'stats' | 'activity'>('stats');
  const [users, setUsers] = useState<AdminDatabaseUser[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [stats, setStats] = useState<AdminDatabaseStats>({
    totalUsers: 0,
    totalPages: 0,
    totalSections: 0,
    totalContent: 0,
    lastActivity: '',
    activeUsers: 0,
    mostActiveUser: '',
    largestPage: ''
  });
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: '',
    database: '',
    environment: '',
    framework: '',
    uptime: '',
    memoryUsage: ''
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur est admin
  const isAdmin = () => user?.tags?.includes('Administrateur');

  useEffect(() => {
    if (isOpen && isAdmin()) {
      loadDatabaseInfo();
    }
  }, [isOpen]);

  const loadDatabaseInfo = async () => {
    setIsLoading(true);
    const adminService = AdminService.getInstance();
    
    try {
      const [usersData, statsData, systemData, activityData] = await Promise.all([
        adminService.getUsers(),
        adminService.getStats(wikiData),
        adminService.getSystemInfo(),
        adminService.getActivityLogs()
      ]);
      
      setUsers(usersData);
      setStats(statsData);
      setSystemInfo(systemData);
      setActivityLogs(activityData);
    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const adminService = AdminService.getInstance();
    const success = await adminService.deleteUser(userId);
    if (success) {
      setUsers(prev => prev.filter(user => user.id !== userId));
    }
  };

  const handleExportData = async () => {
    const adminService = AdminService.getInstance();
    const data = await adminService.exportData();
    
    // Créer et télécharger le fichier
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wiki-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (tags: string[]) => {
    if (tags.includes('Administrateur')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (tags.includes('Contributeur')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'page_edit': return '✏️';
      case 'section_created': return '➕';
      case 'user_login': return '🔑';
      case 'page_deleted': return '🗑️';
      case 'section_renamed': return '📝';
      default: return '📋';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'page_edit': return 'text-blue-600 dark:text-blue-400';
      case 'section_created': return 'text-green-600 dark:text-green-400';
      case 'user_login': return 'text-purple-600 dark:text-purple-400';
      case 'page_deleted': return 'text-red-600 dark:text-red-400';
      case 'section_renamed': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!isAdmin()) {
    return null;
  }

  return (
    <>
      {/* Bouton pour ouvrir le panel */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg transition-colors z-40 ${
          isDarkMode 
            ? 'bg-slate-700 hover:bg-slate-600 text-white' 
            : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
        }`}
        title="Panel d'administration"
      >
        <Database className="w-6 h-6" />
      </button>

      {/* Panel d'administration */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col ${
            isDarkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b ${
              isDarkMode ? 'border-slate-700' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <Database className={`w-6 h-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Panel d'Administration
                </h2>
                {isLoading && (
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={loadDatabaseInfo}
                  disabled={isLoading}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  } disabled:opacity-50`}
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Actualiser</span>
                </button>
                <button
                  onClick={handleExportData}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-blue-700 hover:bg-blue-600 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-slate-700 text-white' 
                      : 'hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
                  activeTab === 'stats'
                    ? `border-b-2 border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Statistiques</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
                  activeTab === 'users'
                    ? `border-b-2 border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Utilisateurs ({users.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
                  activeTab === 'pages'
                    ? `border-b-2 border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Pages ({stats.totalPages})</span>
              </button>
              <button
                onClick={() => setActiveTab('activity')}
                className={`flex items-center space-x-2 px-6 py-3 transition-colors ${
                  activeTab === 'activity'
                    ? `border-b-2 border-blue-500 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`
                    : isDarkMode ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Activité</span>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Statistiques du Wiki
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Users className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.totalUsers}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            Utilisateurs
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            {stats.activeUsers} actifs
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-green-500" />
                        <div>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {stats.totalPages}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            Pages
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            {stats.totalSections} sections
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Database className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {(stats.totalContent / 1000).toFixed(1)}k
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            Caractères
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            Contenu total
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Activity className="w-8 h-8 text-orange-500" />
                        <div>
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatDate(stats.lastActivity)}
                          </p>
                          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            Dernière activité
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-lg border ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Informations Système
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Version:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {systemInfo.version}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Base de données:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {systemInfo.database}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Environnement:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {systemInfo.environment}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Framework:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {systemInfo.framework}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Uptime:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {systemInfo.uptime}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Mémoire:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {systemInfo.memoryUsage}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-6 rounded-lg border ${
                      isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Statistiques Avancées
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Utilisateur le plus actif:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {stats.mostActiveUser}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Plus grande page:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {stats.largestPage}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Sections moyennes/page:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {stats.totalPages > 0 ? (stats.totalSections / stats.totalPages).toFixed(1) : '0'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            Contenu moyen/section:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {stats.totalSections > 0 ? Math.round(stats.totalContent / stats.totalSections) : 0} chars
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'users' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Gestion des Utilisateurs
                    </h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowPasswords(!showPasswords)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          isDarkMode 
                            ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        <span>{showPasswords ? 'Masquer' : 'Afficher'} mots de passe</span>
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-lg border overflow-hidden ${
                    isDarkMode ? 'border-slate-600' : 'border-gray-200'
                  }`}>
                    <table className="w-full">
                      <thead className={`${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                        <tr>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                          }`}>
                            ID
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                          }`}>
                            Utilisateur
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                          }`}>
                            Mot de passe
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                          }`}>
                            Rôle
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                          }`}>
                            Dernière connexion
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                          }`}>
                            Connexions
                          </th>
                          <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-slate-300' : 'text-gray-500'
                          }`}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-600' : 'divide-gray-200'}`}>
                        {users.map((dbUser) => (
                          <tr key={dbUser.id} className={isDarkMode ? 'bg-slate-800' : 'bg-white'}>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isDarkMode ? 'text-slate-300' : 'text-gray-900'
                            }`}>
                              {dbUser.id}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {dbUser.username}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${
                              isDarkMode ? 'text-slate-300' : 'text-gray-900'
                            }`}>
                              {showPasswords ? (dbUser.passwordHash || '••••••••') : '••••••••'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                getRoleColor(dbUser.tags)
                              }`}>
                                {dbUser.tags.join(', ')}
                              </span>
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                              {dbUser.last_login ? formatDate(dbUser.last_login) : 'Jamais'}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                              isDarkMode ? 'text-slate-400' : 'text-gray-500'
                            }`}>
                              {dbUser.login_count || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleDeleteUser(dbUser.id)}
                                  className="text-red-600 hover:text-red-700"
                                  title="Supprimer l'utilisateur"
                                  disabled={dbUser.id === user?.id} // Ne pas pouvoir se supprimer soi-même
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'pages' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Structure des Pages
                  </h3>
                  
                  <div className="space-y-4">
                    {Object.entries(wikiData).map(([pageId, page]) => {
                      const pageContentLength = page.sections?.reduce((acc, section) => acc + section.content.length, 0) || page.content?.length || 0;
                      return (
                        <div key={pageId} className={`rounded-lg border p-4 ${
                          isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {page.title} <span className="text-sm text-gray-500">({pageId})</span>
                            </h4>
                            <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                              {page.sections?.length || 0} sections • {pageContentLength.toLocaleString()} caractères
                            </div>
                          </div>
                          
                          {page.sections && page.sections.length > 0 && (
                            <div className="space-y-2">
                              {page.sections.map((section) => (
                                <div key={section.id} className={`p-3 rounded border ${
                                  isDarkMode ? 'bg-slate-800 border-slate-500' : 'bg-white border-gray-300'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {section.title}
                                    </span>
                                    <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                      {section.lastModified} par {section.author}
                                    </div>
                                  </div>
                                  <div className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                    ID: {section.id} • {section.content.length.toLocaleString()} caractères
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="space-y-6">
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Journal d'Activité
                  </h3>
                  
                  <div className="space-y-3">
                    {activityLogs.map((log) => (
                      <div key={log.id} className={`p-4 rounded-lg border ${
                        isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">{getActionIcon(log.action)}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {log.user}
                                </span>
                                <span className={`text-sm px-2 py-1 rounded-full ${getActionColor(log.action)} bg-opacity-20`}>
                                  {log.action.replace('_', ' ')}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                {log.details}
                              </p>
                              <div className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                {formatDate(log.timestamp)} • IP: {log.ip}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
