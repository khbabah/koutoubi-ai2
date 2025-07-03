'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'super_admin';
}

export function AdminGuard({ children, requiredRole = 'admin' }: AdminGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/login');
      return;
    }

    const userRole = session.user.role;
    const isAdmin = userRole === 'admin' || userRole === 'super_admin';
    
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }

    // If specific role is required, check for it
    if (requiredRole === 'super_admin' && userRole !== 'super_admin') {
      router.push('/dashboard');
    }
  }, [session, status, router, requiredRole]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Don't render anything if not authorized
  if (!session || !['admin', 'super_admin'].includes(session.user.role)) {
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}