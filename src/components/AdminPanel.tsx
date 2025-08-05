import React, { useState, useEffect, useCallback } from 'react';
import { Database, Users, FileText, Settings, X, Eye, EyeOff, Trash2, Activity, Download, Upload, RefreshCw } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import AdminService, { 
  DatabaseUser as AdminDatabaseUser, 
  DatabaseStats as AdminDatabaseStats, 
  SystemInfo 
} from '../services/adminService';
import activityService, { ActivityLog } from '../services/activityService';
import logger from '../utils/logger';

export const AdminPanel: React.FC<{ isOpenFromMenu?: boolean; onClose?: () => void }> = ({ 
  isOpenFromMenu = false, 
  onClose 
}) => {
  const { isDarkMode, user, wikiData, isAdmin } = useWiki();
  const [isOpen, setIsOpen] = useState(isOpenFromMenu);
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
  const [isDragOver, setIsDragOver] = useState(false);

  // Formater la taille en octets avec les unités appropriées
  const formatFileSize = (characters: number): string => {
    // UTF-8: en moyenne 1 caractère = 1-4 octets, on estime 1.5 octets par caractère
    const bytes = Math.round(characters * 1.5);
    
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
    
    return `${formattedSize} ${sizes[i]}`;
  };

  const loadDatabaseInfo = useCallback(async () => {
    setIsLoading(true);
    const adminService = AdminService.getInstance();
    
    try {
      const [usersData, statsData, systemData] = await Promise.all([
        adminService.getUsers(),
        adminService.getStats(wikiData),
        adminService.getSystemInfo()
      ]);
      
      // Charger les vraies données d'activité
      const activityData = activityService.getRecentLogs(50);
      
      setUsers(usersData);
      setStats(statsData);
      setSystemInfo(systemData);
      setActivityLogs(activityData);
    } catch (error) {
      console.error('Erreur lors du chargement des données admin:', error);
    } finally {
      setIsLoading(false);
    }
  }, [wikiData]);

  useEffect(() => {
    setIsOpen(isOpenFromMenu);
  }, [isOpenFromMenu]);

  useEffect(() => {
    if (isOpen && isAdmin()) {
      loadDatabaseInfo();
    }
  }, [isOpen, isAdmin, loadDatabaseInfo]);

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

  const processImportFile = async (file: File) => {
    // Vérifier le type de fichier
    if (!file.name.endsWith('.json')) {
      logger.admin('❌ Tentative d\'import avec format invalide', file.name);
      alert('❌ Format de fichier non supporté. Seuls les fichiers .json sont acceptés.');
      return;
    }
    
    // Vérifier la taille du fichier (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      logger.admin('❌ Fichier trop volumineux pour l\'import', `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
      alert('❌ Le fichier est trop volumineux (max 5MB)');
      return;
    }
    
    try {
      logger.admin('📥 Début d\'importation', `${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      const text = await file.text();
      const adminService = AdminService.getInstance();
      
      // Afficher une confirmation avant l'importation
      const confirmImport = confirm(
        `⚠️ Confirmation d'importation\n\n` +
        `Fichier : ${file.name}\n` +
        `Taille : ${(file.size / 1024).toFixed(1)} KB\n\n` +
        `Cette action va importer de nouveaux utilisateurs dans la base de données.\n` +
        `Les utilisateurs existants ne seront pas modifiés.\n\n` +
        `Continuer ?`
      );
      
      if (!confirmImport) {
        logger.admin('🚫 Import annulé par l\'utilisateur', file.name);
        return;
      }
      
      const result = await adminService.importData(text);
      
      if (result.success) {
        logger.admin('✅ Import réussi', result.message || 'Données importées avec succès');
        alert(
          `✅ Importation réussie !\n\n` +
          `${result.message}\n\n` +
          `📌 Note importante :\n` +
          `Les utilisateurs importés ont un mot de passe temporaire "temp123" qu'ils devront changer lors de leur première connexion.`
        );
        // Recharger les données
        await loadDatabaseInfo();
      } else {
        logger.admin('❌ Erreur d\'import', result.message || 'Erreur inconnue');
        alert(`❌ Erreur d'importation :\n\n${result.message}`);
      }
    } catch (error) {
      logger.admin('❌ Erreur lors de la lecture du fichier', `${file.name}: ${error}`);
      alert(`❌ Erreur lors de la lecture du fichier :\n\n${error}`);
    }
  };

  const handleImportData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await processImportFile(file);
    };
    input.click();
  };

  // Gestionnaires d'événements pour le drag & drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Vérifier que nous quittons vraiment la zone (pas un enfant)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Ne traiter que le premier fichier
    const file = files[0];
    await processImportFile(file);
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
          <div 
            className={`rounded-lg shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col relative ${
              isDarkMode ? 'bg-slate-800' : 'bg-white'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {/* Drag & Drop Overlay */}
            {isDragOver && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-90 flex items-center justify-center z-10 rounded-lg border-4 border-dashed border-white">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-white mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">Déposez votre fichier ici</h3>
                  <p className="text-white text-lg">Fichiers .json acceptés (max 5MB)</p>
                </div>
              </div>
            )}

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
                  onClick={handleImportData}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-green-700 hover:bg-green-600 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                  title="Importer un fichier .json ou glisser-déposer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer</span>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (onClose) onClose();
                  }}
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
                            Caractères ({formatFileSize(stats.totalContent)})
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
                            Taille totale estimée:
                          </span>
                          <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {formatFileSize(stats.totalContent)}
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
                            <span className={`text-xs ml-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                              ({formatFileSize(stats.totalSections > 0 ? Math.round(stats.totalContent / stats.totalSections) : 0)})
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section Import/Export */}
                  <div className={`p-6 rounded-lg border ${
                    isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <h4 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Import/Export des données
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Section Export */}
                      <div>
                        <h5 className={`text-md font-medium mb-2 flex items-center ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                          <Download className="w-4 h-4 mr-2" />
                          Exportation
                        </h5>
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          Téléchargez une sauvegarde complète des données utilisateur au format JSON.
                        </p>
                        <ul className={`text-xs space-y-1 mb-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                          <li>• Inclut tous les utilisateurs et leurs permissions</li>
                          <li>• Les mots de passe sont masqués pour la sécurité</li>
                          <li>• Format compatible pour la réimportation</li>
                          <li>• Horodatage automatique du fichier</li>
                        </ul>
                      </div>

                      {/* Section Import */}
                      <div>
                        <h5 className={`text-md font-medium mb-2 flex items-center ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                          <Upload className="w-4 h-4 mr-2" />
                          Importation
                        </h5>
                        <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          Importez des utilisateurs depuis un fichier JSON d'export précédent.
                        </p>
                        <ul className={`text-xs space-y-1 mb-3 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                          <li>• Cliquez sur "Importer" ou glissez-déposez un fichier .json</li>
                          <li>• Seuls les nouveaux utilisateurs sont ajoutés</li>
                          <li>• Les utilisateurs existants ne sont pas modifiés</li>
                          <li>• Mot de passe temporaire "temp123" assigné</li>
                          <li>• Limite de fichier : 5MB maximum</li>
                        </ul>
                      </div>
                    </div>

                    {/* Avertissement de sécurité */}
                    <div className={`mt-4 p-3 rounded-md border-l-4 ${
                      isDarkMode 
                        ? 'bg-yellow-900/20 border-yellow-500 text-yellow-300' 
                        : 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    }`}>
                      <p className="text-sm font-medium">⚠️ Avertissement de sécurité</p>
                      <p className="text-xs mt-1">
                        Les fichiers d'export peuvent contenir des informations sensibles. 
                        Stockez-les en sécurité et ne les partagez qu'avec des administrateurs autorisés.
                      </p>
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
                        <span>{showPasswords ? 'Masquer' : 'Afficher'} hash mots de passe</span>
                      </button>
                    </div>
                  </div>

                  <div className={`rounded-lg border overflow-hidden ${
                    isDarkMode ? 'border-slate-600' : 'border-gray-200'
                  }`}>
                    <div className="overflow-x-auto mini-scrollbar">
                      <table className="w-full min-w-max">
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
                            Hash Mot de passe
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
                            <td className={`px-6 py-4 text-sm font-mono ${
                              isDarkMode ? 'text-slate-300' : 'text-gray-900'
                            }`}>
                              <div 
                                className="max-w-xs overflow-x-auto scrollbar-thin"
                                title={showPasswords ? `Hash complet: ${dbUser.passwordHash}` : 'Cliquez sur "Afficher hash mots de passe" pour voir le hash'}
                              >
                                <div className="whitespace-nowrap min-w-max">
                                  {showPasswords ? dbUser.passwordHash : '••••••••'}
                                </div>
                              </div>
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
                            <span className="text-2xl">{activityService.getActionIcon(log.action)}</span>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {log.username}
                                </span>
                                <span className={`text-sm px-2 py-1 rounded-full ${activityService.getActionColor(log.action)} bg-opacity-20`}>
                                  {activityService.formatAction(log.action)}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                {log.details}
                              </p>
                              {log.target && (
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                  Cible: {log.target}
                                </p>
                              )}
                              <div className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                {formatDate(log.timestamp)} • IP: {log.ip || 'N/A'}
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
