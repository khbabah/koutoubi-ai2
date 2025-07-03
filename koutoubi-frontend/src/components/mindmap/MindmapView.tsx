'use client';

import { Loader2 } from 'lucide-react';
import { useMindmap } from '@/hooks/useMindmap';
import MindmapDesktopView from './MindmapDesktopView';
import MindmapMobileView from './MindmapMobileView';
import { useEffect, useState } from 'react';
import { MindmapErrorBoundary } from '@/components/ErrorBoundary';

interface MindmapViewProps {
  pdfId: string;
}

export default function MindmapView({ pdfId }: MindmapViewProps) {
  const { mindmapData, loading, error, regenerateMindmap } = useMindmap(pdfId);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-blue-600" />
          <p className="text-gray-600">Génération de la carte mentale...</p>
          <p className="text-sm text-gray-500 mt-1">Cela peut prendre quelques secondes</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-3">Erreur lors du chargement</p>
          <button 
            onClick={regenerateMindmap}
            className="text-blue-600 hover:underline text-sm"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!mindmapData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Aucune donnée disponible</p>
      </div>
    );
  }

  const handleNodeClick = (node: any) => {
    // Just for expansion/collapse, no navigation
  };

  return (
    <MindmapErrorBoundary>
      {/* Desktop View */}
      {!isMobile && (
        <MindmapDesktopView 
          data={mindmapData}
          onNodeClick={handleNodeClick}
          onRegenerateClick={regenerateMindmap}
        />
      )}
      
      {/* Mobile View */}
      {isMobile && (
        <MindmapMobileView
          data={mindmapData}
          onNodeClick={handleNodeClick}
        />
      )}
    </MindmapErrorBoundary>
  );
}