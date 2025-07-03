'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Hook de compatibilité pour remplacer useAuthStore
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    full_name: session.user.name,
    username: session.user.name,
    role: session.user.role,
    is_active: session.user.is_active,
  } : null;

  const login = async (credentials: { username: string; password: string }) => {
    try {
      const result = await signIn('credentials', {
        email: credentials.username,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Email ou mot de passe incorrect');
        return false;
      }

      toast.success('Connexion réussie !');
      return true;
    } catch (error) {
      toast.error('Erreur de connexion');
      return false;
    }
  };

  const logout = async () => {
    await signOut({ redirect: false });
    toast.success('Déconnexion réussie');
    router.push('/login');
  };

  const checkAuth = async () => {
    return status === 'authenticated';
  };

  return {
    user,
    token: session?.access_token || null,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    logout,
    checkAuth,
    setUser: () => {}, // No-op pour compatibilité
    updateUser: () => {}, // No-op pour compatibilité
  };
}

// Alias pour compatibilité
export const useAuthStore = useAuth;
