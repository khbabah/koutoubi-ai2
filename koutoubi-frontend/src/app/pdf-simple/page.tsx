'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function PDFSimplePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const chapterId = 'ch1';
  const totalPages = 26;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Test PDF Simple</h1>
        
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="px-3 text-sm">
            Page {currentPage} / {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Container */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '80vh' }}>
          <iframe
            src={`/api/pdf-direct/pdf-chapter/chapter/${chapterId}/pdf#page=${currentPage}`}
            className="w-full h-full border-0"
            title="PDF Viewer"
          />
        </div>
      </div>
    </div>
  );
}