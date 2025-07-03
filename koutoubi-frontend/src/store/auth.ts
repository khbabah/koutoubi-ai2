import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import { User, LoginCredentials, RegisterData } from '@/types';
import { toast } from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          // Call login API
          const { data } = await authApi.login(credentials);
          
          if (!data.access_token) {
            throw new Error('No access token received');
          }
          
          // Save token to cookies
          Cookies.set('auth-token', data.access_token, { 
            expires: 7, // 7 days
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
          });
          
          // Also save to localStorage for API calls
          localStorage.setItem('auth-token', data.access_token);
          
          // Update state with token first
          set({ token: data.access_token });
          
          // Small delay to ensure cookie is set and interceptor picks it up
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Get user profile
          try {
            const profileResponse = await authApi.getProfile();
            
            set({
              user: profileResponse.data,
              isAuthenticated: true,
              isLoading: false,
            });
            
            toast.success('Connexion réussie !');
            return true;
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            // Even if profile fails, user is authenticated
            set({
              isAuthenticated: true,
              isLoading: false,
            });
            return true;
          }
        } catch (error: any) {
          set({ 
            isLoading: false,
            isAuthenticated: false,
            token: null,
            user: null
          });
          
          // Handle specific error cases
          if (error.response?.status === 401) {
            toast.error('Email ou mot de passe incorrect');
          } else if (error.response?.status === 422) {
            const detail = error.response.data?.detail;
            if (Array.isArray(detail)) {
              const errorMessage = detail[0]?.msg || 'Erreur de validation';
              toast.error(errorMessage);
            } else {
              toast.error('Données invalides');
            }
          } else if (error.response?.status === 500) {
            toast.error('Erreur serveur. Veuillez réessayer plus tard.');
          } else {
            toast.error(error.message || 'Erreur de connexion');
          }
          
          return false;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          
          // Auto-login after registration
          const loginSuccess = await get().login({
            username: data.email,
            password: data.password
          });
          
          if (loginSuccess) {
            toast.success('Inscription réussie !');
            return true;
          }
          
          return false;
        } catch (error: any) {
          set({ isLoading: false });
          
          if (error.response?.status === 400) {
            toast.error('Cet email est déjà utilisé');
          } else if (error.response?.status === 422) {
            const detail = error.response.data?.detail;
            if (Array.isArray(detail)) {
              const errorMessage = detail[0]?.msg || 'Erreur de validation';
              toast.error(errorMessage);
            } else {
              toast.error('Données invalides');
            }
          } else {
            toast.error('Erreur lors de l\'inscription');
          }
          
          return false;
        }
      },

      logout: () => {
        // Clear cookies
        Cookies.remove('auth-token');
        
        // Clear localStorage
        localStorage.removeItem('auth-token');
        
        // Clear state
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
        
        // Clear localStorage
        localStorage.removeItem('auth-storage');
        
        toast.success('Déconnexion réussie');
      },

      checkAuth: async () => {
        // Try to get token from cookies or localStorage
        const token = Cookies.get('auth-token') || localStorage.getItem('auth-token');
        
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null });
          return false;
        }
        
        // Sync token to both storage methods
        Cookies.set('auth-token', token, { 
          expires: 7,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        });
        localStorage.setItem('auth-token', token);
        
        try {
          set({ token });
          const { data } = await authApi.getProfile();
          
          set({
            user: data,
            isAuthenticated: true,
          });
          
          return true;
        } catch (error) {
          // Token is invalid
          Cookies.remove('auth-token');
          localStorage.removeItem('auth-token');
          set({ 
            isAuthenticated: false, 
            user: null, 
            token: null 
          });
          return false;
        }
      },

      setUser: (user) => {
        set({ user });
      },
      
      updateUser: (user) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);