'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function AdminGuard({ children, allowedRoles = ['admin', 'super_admin'] }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (session?.user && !allowedRoles.includes(session.user.role)) {
      console.log('[AdminGuard] Access denied - redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [session, status, router, allowedRoles]);

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  // Check permissions
  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Accès refusé</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          {session?.user && (
            <>
              <p className="text-sm text-gray-500 mt-2">Votre rôle: {session.user.role}</p>
              <p className="text-xs text-gray-400">Rôles autorisés: {allowedRoles.join(', ')}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}