'use client';

import { useState } from 'react';

interface BasicPDFViewerProps {
  chapterId: string;
}

export default function BasicPDFViewer({ chapterId }: BasicPDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const pdfUrl = `/api/pdf-direct/pdf-chapter/chapter/${chapterId}/pdf`;

  return (
    <div className="w-full h-[800px] bg-gray-100 relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Chargement du PDF...</p>
          </div>
        </div>
      )}
      
      <iframe
        src={pdfUrl}
        className="w-full h-full border-0"
        onLoad={() => {
          console.log('PDF loaded successfully');
          setLoading(false);
        }}
        onError={(e) => {
          console.error('PDF loading error:', e);
          setLoading(false);
        }}
        title={`PDF Chapter ${chapterId}`}
      />
    </div>
  );
}