import React, { useState } from 'react';
import { Edit3, Calendar, Trophy, Shield, UserCheck, Eye, Trash2 } from 'lucide-react';
import { useWiki } from '../context/WikiContext';

interface EditingUserData {
  id: number;
  username: string;
  email: string;
  avatar: string;
  tags: string[];
  password?: string;
}

export const MembersPage: React.FC = () => {
  const { allUsers, updateUserProfile, deleteUserProfile, isAdmin, isDarkMode } = useWiki();
  const [editingUserData, setEditingUserData] = useState<EditingUserData | null>(null);

  const availableTags = ['Visiteur', 'Contributeur', 'Administrateur'];

  if (!isAdmin()) {
    return (
      <main className={`flex-1 p-6 content-scrollbar ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <h1 className={`text-2xl font-bold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Accès refusé
          </h1>
          <p className={`${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Vous devez être administrateur pour accéder à cette page.
          </p>
        </div>
      </main>
    );
  }

  const handleEditProfile = (user: any) => {
    setEditingUserData({
      id: user.id,
      username: user.username,
      email: user.email || '',
      avatar: user.avatar || '',
      tags: [...user.tags],
      password: ''
    });
  };

  const handleSaveProfile = () => {
    if (!editingUserData) return;
    
    try {
      const success = updateUserProfile(editingUserData.id, {
        username: editingUserData.username,
        email: editingUserData.email,
        avatar: editingUserData.avatar,
        tags: editingUserData.tags,
        password: editingUserData.password || undefined
      });
      
      if (success) {
        setEditingUserData(null);
      } else {
        alert('Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      alert('Erreur lors de la mise à jour du profil');
    }
  };

  const handleDeleteUser = (userId: number) => {
    try {
      const success = deleteUserProfile(userId);
      if (!success) {
        alert('Erreur lors de la suppression du compte');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du compte');
    }
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return 'bg-red-500';
      case 'Contributeur':
        return 'bg-blue-500';
      case 'Visiteur':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTagIcon = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return <Shield className="w-3 h-3" />;
      case 'Contributeur':
        return <UserCheck className="w-3 h-3" />;
      case 'Visiteur':
        return <Eye className="w-3 h-3" />;
      default:
        return <Eye className="w-3 h-3" />;
    }
  };

  return (
    <main className={`flex-1 p-6 content-scrollbar ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      <div className="max-w-6xl mx-auto">
        <h1 className={`text-3xl font-bold mb-8 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Gestion des membres
        </h1>

        <div className="space-y-6">
          {allUsers.map((user: any) => (
            <div
              key={user.id}
              className={`p-6 rounded-lg border transition-all duration-200 ${
                isDarkMode
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                  : 'bg-white border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                {/* Informations utilisateur */}
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                    {user.avatar ? (
                      <img 
                        src={user.avatar} 
                        alt={user.username} 
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      user.username.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Nom et email */}
                  <div>
                    <h3 className={`text-xl font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {user.username}
                    </h3>
                    {user.email && (
                      <p className={`text-sm ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}>
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {user.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                      >
                        {getTagIcon(tag)}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>

                  {/* Boutons d'actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditProfile(user)}
                      className={`p-2 rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-slate-700 text-slate-300' 
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                      title="Modifier le profil"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${user.username} ?`)) {
                          handleDeleteUser(user.id);
                        }
                      }}
                      className={`p-2 rounded-md transition-colors ${
                        isDarkMode 
                          ? 'hover:bg-red-700 text-red-400' 
                          : 'hover:bg-red-100 text-red-600'
                      }`}
                      title="Supprimer le compte"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className={`mt-4 flex items-center space-x-6 text-sm ${
                isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis le {user.joinDate}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-4 h-4" />
                  <span>{user.contributions} contributions</span>
                </div>
              </div>

              {user.bio && (
                <div className={`mt-3 p-3 rounded-lg ${
                  isDarkMode ? 'bg-slate-700' : 'bg-gray-50'
                }`}>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-slate-300' : 'text-gray-700'
                  }`}>
                    {user.bio}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modal d'édition du profil */}
      {editingUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg shadow-xl w-96 max-w-90vw max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Modifier le profil de {editingUserData.username}
            </h2>
            
            <div className="space-y-4">
              {/* Nom d'utilisateur */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={editingUserData.username}
                  onChange={(e) => setEditingUserData(prev => 
                    prev ? { ...prev, username: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Email */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Email
                </label>
                <input
                  type="email"
                  value={editingUserData.email || ''}
                  onChange={(e) => setEditingUserData(prev => 
                    prev ? { ...prev, email: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Avatar URL */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  URL de l'avatar
                </label>
                <input
                  type="url"
                  value={editingUserData.avatar || ''}
                  onChange={(e) => setEditingUserData(prev => 
                    prev ? { ...prev, avatar: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Nouveau mot de passe (optionnel)
                </label>
                <input
                  type="password"
                  value={editingUserData.password || ''}
                  onChange={(e) => setEditingUserData(prev => 
                    prev ? { ...prev, password: e.target.value } : null
                  )}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Laisser vide pour conserver l'actuel"
                />
              </div>

              {/* Tags */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Rôles
                </label>
                <div className="space-y-2">
                  {availableTags.map((tag) => (
                    <label
                      key={tag}
                      className="flex items-center space-x-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editingUserData.tags.includes(tag)}
                        onChange={() => {
                          setEditingUserData(prev => {
                            if (!prev) return null;
                            const newTags = prev.tags.includes(tag)
                              ? prev.tags.filter(t => t !== tag)
                              : [...prev.tags, tag];
                            return { ...prev, tags: newTags };
                          });
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium text-white ${getTagColor(tag)}`}>
                        {getTagIcon(tag)}
                        <span>{tag}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setEditingUserData(null)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                }`}
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
