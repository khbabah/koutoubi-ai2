'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create a dedicated axios instance for admin
export const adminApi = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
});

interface AdminContextType {
  isReady: boolean;
}

const AdminContext = createContext<AdminContextType>({
  isReady: false,
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !session) {
      router.push('/login');
      return;
    }

    if (session?.access_token) {
      // Configure axios instance with the token
      adminApi.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
      setIsReady(true);
    }
  }, [session, status, router]);

  // Add response interceptor for error handling
  useEffect(() => {
    const interceptor = adminApi.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired - redirect to login
          router.push('/login');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      adminApi.interceptors.response.eject(interceptor);
    };
  }, [router]);

  if (status === 'loading' || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ isReady }}>
      {children}
    </AdminContext.Provider>
  );
}

export const useAdmin = () => useContext(AdminContext);