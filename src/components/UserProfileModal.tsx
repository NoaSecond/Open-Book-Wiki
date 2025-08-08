import React, { useState, useEffect } from 'react';
import { User, Mail, Save, X, Shield, UserCheck, Eye, Tag, Edit3 } from 'lucide-react';
import { useWiki } from '../context/WikiContext';
import { AvatarEditor } from './AvatarEditor';

interface UserProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
  isAdmin?: boolean;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave,
  isAdmin = false
}) => {
  const { isDarkMode } = useWiki();
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    tags: [] as string[]
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        tags: user.tags || []
      });
    }
  }, [user]);

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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave({
        ...formData,
        id: user.id
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || '',
      email: user.email || '',
      bio: user.bio || '',
      tags: user.tags || []
    });
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleTagToggle = (tag: string) => {
    if (!isAdmin) return;
    
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  const handleAvatarSave = async (newAvatar: string) => {
    setIsLoading(true);
    try {
      await onSave({
        ...formData,
        id: user.id,
        avatar: newAvatar
      });
      setShowAvatarEditor(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'avatar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      } rounded-lg shadow-xl`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h1 className={`text-xl font-bold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Profil de {user.username}
          </h1>
          <button
            onClick={onClose}
            className={`p-2 rounded-md transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-6 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-full flex items-center justify-center overflow-hidden">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Avatar utilisateur" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              {(isEditing || isAdmin) && (
                <button
                  onClick={() => setShowAvatarEditor(true)}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-600 hover:bg-cyan-700 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Changer l'avatar"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              )}
            </div>
            
            {/* Basic Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className={`text-xl font-bold rounded px-3 py-2 w-full border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
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
                    className={`rounded px-3 py-2 w-full border focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      isDarkMode 
                        ? 'bg-slate-700 text-slate-300 border-slate-600' 
                        : 'bg-gray-100 text-gray-700 border-gray-300'
                    }`}
                    placeholder="Email"
                  />
                </div>
              ) : (
                <div>
                  <h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.username}
                  </h2>
                  <p className={`flex items-center ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    {user.email}
                  </p>
                </div>
              )}
              
              <div className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Contributions: {user.contributions || 0}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Tags utilisateur
            </h3>
            <div className="space-y-2">
              {['Administrateur', 'Contributeur', 'Visiteur'].map((tag) => (
                <label
                  key={tag}
                  className={`flex items-center space-x-3 ${
                    isAdmin && isEditing ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.tags.includes(tag)}
                    onChange={() => handleTagToggle(tag)}
                    disabled={!isAdmin || !isEditing}
                    className="rounded focus:ring-cyan-500"
                  />
                  <span
                    className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium text-white ${getTagColor(tag)}`}
                  >
                    {getTagIcon(tag)}
                    <span>{tag}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div className="mb-6">
            <h3 className={`font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Biographie
            </h3>
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
                placeholder="Biographie de l'utilisateur..."
              />
            ) : (
              <div className={`p-3 rounded-lg ${
                isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700'
              }`}>
                {user.bio ? (
                  <p className="whitespace-pre-wrap">{user.bio}</p>
                ) : (
                  <p className={`italic ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                    Aucune biographie renseignée.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isLoading}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    isDarkMode 
                      ? 'bg-slate-600 hover:bg-slate-700 text-white' 
                      : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                  } disabled:opacity-50`}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isLoading ? 'Sauvegarde...' : 'Sauvegarder'}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Modifier</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Editor Modal */}
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
