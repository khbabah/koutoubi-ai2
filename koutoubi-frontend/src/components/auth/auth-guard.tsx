'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function AuthGuard({ children, requiredRoles, redirectTo = '/login' }: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push(redirectTo);
      return;
    }

    // Check if user has required role
    if (requiredRoles && requiredRoles.length > 0) {
      const userRole = session.user.role;
      if (!requiredRoles.includes(userRole)) {
        router.push('/dashboard');
      }
    }
  }, [session, status, router, requiredRoles, redirectTo]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authorized
  if (!session) {
    return null;
  }

  // Check role requirements
  if (requiredRoles && requiredRoles.length > 0) {
    const userRole = session.user.role;
    if (!requiredRoles.includes(userRole)) {
      return null;
    }
  }

  // Render children if authorized
  return <>{children}</>;
}