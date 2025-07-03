'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import OptimizedPDFViewer from './OptimizedPDFViewer';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function AuthenticatedPDFViewer() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show message
  if (status === 'unauthenticated') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Authentification requise</h2>
          <p className="text-gray-600 mb-6">
            Vous devez être connecté pour accéder au contenu du cours.
          </p>
          <Button 
            onClick={() => {
              const redirectUrl = encodeURIComponent(pathname);
              router.push(`/login?redirect=${redirectUrl}`);
            }}
            className="w-full"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  // If authenticated, show the PDF viewer
  return <OptimizedPDFViewer />;
}