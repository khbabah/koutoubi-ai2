'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface PDFViewerWithCheckProps {
  pdfUrl: string;
  className?: string;
}

export default function PDFViewerWithCheck({ pdfUrl, className = '' }: PDFViewerWithCheckProps) {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    checkPdfAvailability();
  }, [pdfUrl]);

  const checkPdfAvailability = async () => {
    try {
      // Ensure we send cookies with the request
      const response = await fetch(pdfUrl, {
        method: 'HEAD',
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf',
        }
      });

      const contentType = response.headers.get('content-type');
      
      if (!response.ok) {
        setStatus('error');
        if (response.status === 401) {
          setErrorMessage('Non authentifié. Veuillez vous connecter.');
        } else {
          setErrorMessage(`Erreur ${response.status}: ${response.statusText}`);
        }
        return;
      }

      if (!contentType?.includes('application/pdf')) {
        setStatus('error');
        setErrorMessage(`Type de contenu incorrect: ${contentType}`);
        return;
      }

      setStatus('success');
    } catch (error) {
      setStatus('error');
      setErrorMessage(`Erreur de connexion: ${(error as Error).message}`);
    }
  };

  if (status === 'checking') {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Vérification du PDF...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-50 ${className}`}>
        <div className="text-center p-6">
          <p className="text-red-600 font-semibold mb-2">Impossible de charger le PDF</p>
          <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>
          <div className="space-y-2">
            <Button onClick={checkPdfAvailability} variant="outline">
              Réessayer
            </Button>
            <br />
            <a 
              href={pdfUrl} 
              target="_blank" 
              className="text-blue-600 underline text-sm"
            >
              Ouvrir dans un nouvel onglet
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <object
        data={pdfUrl}
        type="application/pdf"
        className="w-full h-full"
      >
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="PDF Viewer"
        />
      </object>
      
      {/* Debug info - remove in production */}
      <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs p-2 rounded">
        PDF: {pdfUrl.split('/').pop()}
      </div>
    </div>
  );
}