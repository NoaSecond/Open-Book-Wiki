import React, { useState } from 'react';
import { User, Mail, Calendar, Edit3, Save, X, Award, Tag, Shield, UserCheck, Eye } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { AvatarEditor } from './AvatarEditor';
import { DateUtils } from '../utils/dateUtils';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, isDarkMode } = useWiki();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Administrateur':
        return isDarkMode ? 'bg-red-600' : 'bg-red-500';
      case 'Contributeur':
        return isDarkMode ? 'bg-blue-600' : 'bg-blue-500';
      case 'Visiteur':
        return isDarkMode ? 'bg-gray-600' : 'bg-gray-500';
      default:
        return isDarkMode ? 'bg-slate-600' : 'bg-slate-500';
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
        return <Tag className="w-3 h-3" />;
    }
  };

  if (!user) {
    return (
      <div className={`flex-1 p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <User className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Profil non disponible</h2>
            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Vous devez être connecté pour voir votre profil.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    updateUser({
      username: formData.username,
      email: formData.email,
      bio: formData.bio
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: user.username,
      email: user.email || '',
      bio: user.bio || ''
    });
    setIsEditing(false);
  };

  const handleAvatarSave = (newAvatar: string) => {
    updateUser({ avatar: newAvatar });
    setShowAvatarEditor(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className={`flex-1 p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* En-tête du profil */}
        <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Avatar utilisateur" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-white" />
                  )}
                </div>
                {/* Bouton pour changer l'avatar */}
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-cyan-600 hover:bg-cyan-700 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Changer la photo de profil"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              
              {/* Informations de base */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className={`text-2xl font-bold rounded px-3 py-1 w-full max-w-md border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode 
                          ? 'bg-slate-700 text-white border-slate-600' 
                          : 'bg-gray-100 text-gray-900 border-gray-300'
                      }`}
                      placeholder="Nom d'utilisateur"
                    />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`rounded px-3 py-1 w-full max-w-md border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                        isDarkMode 
                          ? 'bg-slate-700 text-slate-300 border-slate-600' 
                          : 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                      placeholder="Email"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.username}</h1>
                    <p className={`flex items-center ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      <Mail className="w-4 h-4 mr-2" />
                      {user.email}
                    </p>
                  </div>
                )}
                
                <div className={`flex items-center space-x-4 mt-3 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Membre depuis {user.joinDate ? DateUtils.formatDateShort(user.joinDate) : 'N/A'}
                  </span>
                  <span className="flex items-center">
                    <Award className="w-4 h-4 mr-1" />
                    {user.contributions} contributions
                  </span>
                </div>

                {/* Tags utilisateur */}
                <div className="mt-3">
                  <div className="flex flex-wrap gap-2">
                    {(user.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                      >
                        {getTagIcon(tag)}
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Sauvegarder</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>Annuler</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Modifier le profil</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Biographie */}
        <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>À propos</h2>
          {isEditing ? (
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={4}
              className={`w-full rounded-lg p-3 border focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none ${
                isDarkMode 
                  ? 'bg-slate-700 text-white border-slate-600' 
                  : 'bg-gray-100 text-gray-900 border-gray-300'
              }`}
              placeholder="Parlez-nous de vous..."
            />
          ) : (
            <div className={isDarkMode ? 'text-slate-300' : 'text-gray-700'}>
              {user.bio ? (
                <p className="whitespace-pre-wrap">{user.bio}</p>
              ) : (
                <p className={`italic ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Aucune biographie renseignée.</p>
              )}
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`rounded-lg p-6 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-3xl font-bold text-cyan-400 mb-2">{user.contributions}</div>
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Contributions</div>
          </div>
          
          <div className={`rounded-lg p-6 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-3xl font-bold text-violet-400 mb-2">
              {Math.floor(Math.random() * 50) + 10}
            </div>
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Articles édités</div>
          </div>
          
          <div className={`rounded-lg p-6 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="text-3xl font-bold text-green-400 mb-2">
              {user.joinDate ? DateUtils.formatDateShort(user.joinDate) : 'N/A'}
            </div>
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>Membre depuis</div>
          </div>
        </div>
      </div>

      {/* Modal d'édition d'avatar */}
      {showAvatarEditor && (
        <AvatarEditor
          currentAvatar={user.avatar}
          onSave={handleAvatarSave}
          onCancel={() => setShowAvatarEditor(false)}
        />
      )}
    </div>
  );
};
