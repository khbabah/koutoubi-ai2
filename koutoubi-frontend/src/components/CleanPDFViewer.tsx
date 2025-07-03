'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Brain,
  FileText,
  Highlighter,
  MoreHorizontal,
  Sparkles,
  X,
  ChevronDown,
  Hash,
  Type,
  Calculator,
  Loader2,
  Copy,
  List
} from 'lucide-react';
import { pdfStructure } from '@/lib/pdfStructure';
import toast from 'react-hot-toast';

interface CleanPDFViewerProps {
  chapterId?: string;
}

interface PDFSummary {
  title: string;
  total_pages: number;
  sections: Array<{
    type: string;
    title: string;
    page: number;
    subsections: Array<{
      type: string;
      title: string;
      page: number;
      content: Array<{
        type: string;
        content: string;
        page: number;
      }>;
    }>;
    content: Array<{
      type: string;
      content: string;
      page: number;
    }>;
  }>;
}

export default function CleanPDFViewer({ chapterId = 'ch1' }: CleanPDFViewerProps) {
  const { data: session } = useSession();
  const [showPanel, setShowPanel] = useState(true); // Panel ouvert par défaut
  const [currentPage, setCurrentPage] = useState(2); // Page 2 comme dans l'image
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [pdfSummary, setPdfSummary] = useState<PDFSummary | null>(null);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  
  const totalPages = pdfSummary?.total_pages || 248; // Total pages from summary or default

  useEffect(() => {
    // Charger le summary automatiquement
    loadSummary();
  }, []);

  const handlePageChange = (delta: number) => {
    const newPage = currentPage + delta;
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      setLoading(true);
    }
  };

  const loadSummary = async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/pdf-content/extract-summary', {
        headers: {
          'Authorization': `Bearer ${session?.access_token || ''}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setPdfSummary(data);
        toast.success('Summary chargé avec succès');
      } else {
        console.error('Summary error:', response.status, response.statusText);
        toast.error('Erreur lors du chargement du summary');
      }
    } catch (error) {
      console.error('Error loading summary:', error);
      toast.error('Erreur de connexion');
    } finally {
      setSummaryLoading(false);
    }
  };

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  const navigateToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    setLoading(true);
    toast.success(`Navigation vers la page ${pageNum}`);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'formula':
        return <Calculator className="h-3 w-3" />;
      case 'definition':
        return <Type className="h-3 w-3" />;
      case 'paragraph':
        return <FileText className="h-3 w-3" />;
      default:
        return <Hash className="h-3 w-3" />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Minimal Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b">
        {/* Left: Menu and Tabs */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            Menu
          </Button>
          
          <div className="flex gap-6 text-sm">
            <button className="text-blue-600 font-medium">1 Learn</button>
            <button className="text-gray-500">2 Flashcards</button>
            <button className="text-gray-500">3 Quiz</button>
          </div>
        </div>

        {/* Center: Document Title and Page */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mathématiques 4ème Secondaire</span>
          <div className="flex items-center ml-4">
            <span className="px-3 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 ml-2">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Tools */}
        <div className="flex items-center gap-1">
          <Button 
            variant={showPanel ? "default" : "ghost"} 
            size="sm" 
            className="gap-2"
            onClick={togglePanel}
          >
            <BookOpen className="h-4 w-4" />
            Summary
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Brain className="h-4 w-4" />
            AI Tutor
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <FileText className="h-4 w-4" />
            Editor
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <Highlighter className="h-4 w-4" />
            Highlights
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          
          <iframe
            src={`http://localhost:8000/api/v1/pdf-viewer/secondaire-2eme-cycle/4eme/mathematiques#page=${currentPage}`}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            style={{ 
              backgroundColor: '#f5f5f5',
              maxWidth: '900px',
              margin: '0 auto'
            }}
          />
        </div>

        {/* Right Panel - Understand and Remember + Content */}
        {showPanel && (
          <div className="w-[500px] bg-white border-l flex flex-col">
            {/* Understand and Remember Header */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Understand and Remember This PDF</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => setShowPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold">1. Learn:</span>
                  <span className="text-gray-600">Read the PDF and add flashcards by clicking on sentences that you want to remember.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">2. Practice:</span>
                  <span className="text-gray-600">After reading, practice the flashcards to solidify your memory.</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">3. Quiz:</span>
                  <span className="text-gray-600">Check your understanding with a multiple-choice quiz.</span>
                </div>
              </div>
            </div>

            {/* Document Content */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Document Title */}
                <div className="mb-4">
                  <h2 className="text-lg font-bold mb-2">
                    {pdfSummary?.title || 'Mathématiques 4ème Secondaire'}
                  </h2>
                  <div className="flex items-center justify-end gap-2 mb-4">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      Create AI Cards
                    </Button>
                  </div>
                </div>

                {/* Loading Summary */}
                {summaryLoading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span className="text-sm text-gray-600">Chargement du contenu...</span>
                  </div>
                )}

                {/* Summary Content */}
                {pdfSummary && !summaryLoading && (
                  <div className="space-y-4">
                    {pdfSummary.sections.map((section, sectionIdx) => (
                      <div key={`section-${sectionIdx}`}>
                        <div 
                          className="flex items-center justify-between mb-3 cursor-pointer hover:bg-gray-50 p-2 -mx-2 rounded"
                          onClick={() => navigateToPage(section.page)}
                        >
                          <h3 className="text-lg font-bold">
                            {section.title}
                          </h3>
                          <Badge variant="outline" className="text-xs">P{section.page}</Badge>
                        </div>
                        
                        {/* Subsections */}
                        <div className="space-y-3 ml-4">
                          {section.subsections.map((subsection, subIdx) => (
                            <div key={`subsection-${sectionIdx}-${subIdx}`}>
                              <div 
                                className="flex items-center justify-between mb-2 cursor-pointer hover:bg-gray-50 p-1 -mx-1 rounded"
                                onClick={() => navigateToPage(subsection.page)}
                              >
                                <h4 className="font-medium">{subsection.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">P{subsection.page}</Badge>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Content items */}
                              <div className="space-y-2 ml-4">
                                {subsection.content.map((item, itemIdx) => (
                                  <div 
                                    key={`content-${sectionIdx}-${subIdx}-${itemIdx}`}
                                    className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => navigateToPage(item.page)}
                                  >
                                    <div className="flex items-start gap-2">
                                      <span className="mt-0.5">{getContentIcon(item.type)}</span>
                                      <p className="text-sm text-gray-700 flex-1">
                                        {item.content}
                                      </p>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs text-gray-500">P{item.page}</span>
                                      <Button variant="ghost" size="icon" className="h-5 w-5">
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}