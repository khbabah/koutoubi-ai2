'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/hooks/use-auth';
import { useRouter, usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import LimitNotification from '@/components/LimitNotification';

const PUBLIC_ROUTES = ['/login', '/register', '/', '/test-login', '/test-pdf', '/debug-pdf', '/test-pdf-viewer'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } finally {
        setIsChecking(false);
      }
    };
    
    verifyAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isChecking) {
      const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));
      
      if (!isAuthenticated && !isPublicRoute) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, pathname, router, isChecking]);

  if (isChecking && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            style: {
              background: '#10b981',
            },
          },
          error: {
            duration: 4000,
            style: {
              background: '#ef4444',
            },
          },
        }}
      />
      {children}
      <LimitNotification />
    </>
  );
}