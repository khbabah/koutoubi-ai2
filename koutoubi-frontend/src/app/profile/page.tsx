'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import { authApi } from '@/lib/api';
import { useSubscription } from '@/hooks/useSubscription';
import { 
  ArrowLeft, 
  Camera, 
  Save, 
  User, 
  Mail, 
  Shield,
  Trash2,
  Loader2,
  Check,
  X,
  Crown,
  Zap,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function ProfilePage() {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const { status: subStatus, isPremium, getFeatureUsage } = useSubscription();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        email: user.email || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation du mot de passe
    if (formData.new_password) {
      // Vérifier que le mot de passe actuel est fourni
      if (!formData.current_password) {
        toast.error('Veuillez entrer votre mot de passe actuel');
        return;
      }
      
      if (formData.new_password.length < 6) {
        toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      if (formData.new_password !== formData.confirm_password) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
    }

    setLoading(true);
    try {
      const updateData: any = {
        full_name: formData.full_name,
        username: formData.username,
        email: formData.email
      };

      if (formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
      }

      const response = await authApi.updateProfile(updateData);
      updateUser(response.data);
      toast.success('Profil mis à jour avec succès');
      setEditMode(false);
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la mise à jour';
      toast.error(errorMessage);
      
      // Si c'est une erreur de mot de passe, ne pas fermer le mode édition
      if (errorMessage.toLowerCase().includes('mot de passe')) {
        // Garder le mode édition actif
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await authApi.uploadAvatar(file);
      
      // Mettre à jour l'utilisateur avec la nouvelle URL de l'avatar
      const profileResponse = await authApi.getProfile();
      updateUser(profileResponse.data);
      
      toast.success('Avatar mis à jour avec succès');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erreur lors du téléchargement');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre avatar ?')) return;

    setUploadingAvatar(true);
    try {
      await authApi.deleteAvatar();
      
      // Mettre à jour l'utilisateur
      const profileResponse = await authApi.getProfile();
      updateUser(profileResponse.data);
      
      toast.success('Avatar supprimé');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
            </div>
            
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Modifier
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      full_name: user.full_name || '',
                      username: user.username || '',
                      email: user.email || '',
                      current_password: '',
                      new_password: '',
                      confirm_password: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Avatar Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-6">
              <div className="relative">
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.full_name || 'Avatar'}
                    width={96}
                    height={96}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                    {user.full_name ? getInitials(user.full_name) : <User className="h-12 w-12" />}
                  </div>
                )}
                
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                
                {editMode && !uploadingAvatar && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user.full_name || 'Utilisateur'}
                </h2>
                <p className="text-gray-500">
                  {user.role === 'admin' ? 'Administrateur' : 'Étudiant'}
                </p>
                {editMode && user.avatar_url && (
                  <button
                    onClick={handleDeleteAvatar}
                    className="mt-2 text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Supprimer l'avatar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Informations personnelles
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={!editMode}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-gray-500" />
                Contact
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!editMode}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {/* Sécurité */}
            {editMode && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-gray-500" />
                  Sécurité
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe actuel <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.current_password}
                      onChange={(e) => setFormData({ ...formData, current_password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Requis pour changer le mot de passe"
                      required={!!formData.new_password}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Requis uniquement si vous voulez changer votre mot de passe
                    </p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={formData.new_password}
                        onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Account Info */}
            <div className="pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 space-y-1">
                <p>Membre depuis : {new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
                {user.last_login && (
                  <p>Dernière connexion : {new Date(user.last_login).toLocaleDateString('fr-FR')}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Subscription Section */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Abonnement
            </h2>
            
            {subStatus ? (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {subStatus.plan_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {isPremium ? (
                        <>
                          Actif jusqu'au {subStatus.end_date ? 
                            new Date(subStatus.end_date).toLocaleDateString('fr-FR') : 
                            'Illimité'
                          }
                        </>
                      ) : (
                        'Plan gratuit avec fonctionnalités limitées'
                      )}
                    </p>
                  </div>
                  
                  {subStatus.can_upgrade && (
                    <button
                      onClick={() => router.push('/pricing')}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
                    >
                      <Zap className="h-4 w-4" />
                      Passer à Premium
                    </button>
                  )}
                </div>

                {/* Usage Stats */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    Utilisation ce mois
                  </h4>
                  
                  <div className="space-y-3">
                    {/* AI Summaries */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Résumés IA</span>
                      <div className="flex items-center gap-2">
                        {subStatus.usage_stats.ai_summary.limit ? (
                          <>
                            <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, (subStatus.usage_stats.ai_summary.used / subStatus.usage_stats.ai_summary.limit) * 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {subStatus.usage_stats.ai_summary.used}/{subStatus.usage_stats.ai_summary.limit}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Illimité</span>
                        )}
                      </div>
                    </div>

                    {/* AI Questions */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Questions IA (par jour)</span>
                      <div className="flex items-center gap-2">
                        {subStatus.usage_stats.ai_question.limit ? (
                          <>
                            <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, (subStatus.usage_stats.ai_question.used / subStatus.usage_stats.ai_question.limit) * 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {subStatus.usage_stats.ai_question.used}/{subStatus.usage_stats.ai_question.limit}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Illimité</span>
                        )}
                      </div>
                    </div>

                    {/* Quiz Generation */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quiz générés (par semaine)</span>
                      <div className="flex items-center gap-2">
                        {subStatus.usage_stats.quiz_generation.limit ? (
                          <>
                            <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, (subStatus.usage_stats.quiz_generation.used / subStatus.usage_stats.quiz_generation.limit) * 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {subStatus.usage_stats.quiz_generation.used}/{subStatus.usage_stats.quiz_generation.limit}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Illimité</span>
                        )}
                      </div>
                    </div>

                    {/* Mindmaps */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cartes mentales générées</span>
                      <div className="flex items-center gap-2">
                        {subStatus.usage_stats.mindmap_generation.limit ? (
                          <>
                            <div className="flex-1 w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-orange-600 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, (subStatus.usage_stats.mindmap_generation.used / subStatus.usage_stats.mindmap_generation.limit) * 100)}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-gray-700 font-medium">
                              {subStatus.usage_stats.mindmap_generation.used}/{subStatus.usage_stats.mindmap_generation.limit}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Illimité</span>
                        )}
                      </div>
                    </div>

                    {/* Favorites */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Favoris</span>
                      <div className="flex items-center gap-2">
                        {subStatus.usage_stats.favorites.limit ? (
                          <span className="text-sm text-gray-700 font-medium">
                            {subStatus.usage_stats.favorites.used}/{subStatus.usage_stats.favorites.limit}
                          </span>
                        ) : (
                          <span className="text-sm text-green-600 font-medium">Illimité</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Premium Features */}
                {isPremium && (
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Fonctionnalités Premium</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Téléchargement PDF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Mode hors-ligne</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Support prioritaire</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600">Accès anticipé</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chargement des informations d'abonnement...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}