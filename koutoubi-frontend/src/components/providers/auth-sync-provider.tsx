'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Cookies from 'js-cookie';

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    // Synchronize NextAuth token with cookies for legacy API client
    if (session?.access_token) {
      console.log('[AuthSync] Syncing token to cookies');
      Cookies.set('auth-token', session.access_token, {
        expires: 7, // 7 days
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
    } else {
      // Remove cookie if no session
      console.log('[AuthSync] Removing token from cookies');
      Cookies.remove('auth-token');
    }
  }, [session]);

  return <>{children}</>;
}