'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  MessageSquare,
  Sparkles,
  Highlighter,
  MoreHorizontal,
  X,
  Copy,
  Bold,
  Italic,
  List,
  Loader2
} from 'lucide-react';
import { type Chapter } from '@/lib/pdfStructure';

interface ModernPDFViewerProps {
  chapter: Chapter;
  onClose?: () => void;
}

interface Summary {
  id: string;
  pageNum: number;
  title: string;
  content: string;
  arabic?: string;
  keyPoints?: string[];
}

export default function ModernPDFViewer({ chapter, onClose }: ModernPDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('learn');
  const [currentPage, setCurrentPage] = useState(chapter.startPage);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  
  // Mock summaries for demonstration
  const [summaries, setSummaries] = useState<Summary[]>([
    {
      id: '1',
      pageNum: chapter.startPage,
      title: 'Introduction',
      content: `Ce chapitre introduit ${chapter.title}. Les concepts fondamentaux seront explorés avec des exemples pratiques et des exercices.`,
      keyPoints: ['Concepts de base', 'Applications pratiques', 'Exercices guidés']
    }
  ]);

  const totalPages = chapter.endPage - chapter.startPage + 1;
  const relativePageNum = currentPage - chapter.startPage + 1;

  const handlePageChange = (newPage: number) => {
    if (newPage >= chapter.startPage && newPage <= chapter.endPage) {
      setCurrentPage(newPage);
    }
  };

  const createFlashcard = () => {
    if (selectedText) {
      // TODO: Implement flashcard creation
      console.log('Creating flashcard from:', selectedText);
    }
  };

  const generateAICards = async () => {
    // TODO: Implement AI card generation
    console.log('Generating AI cards for page:', currentPage);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm">
            <Menu className="h-4 w-4 mr-2" />
            Menu
          </Button>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-9">
            <TabsList className="h-9">
              <TabsTrigger value="learn" className="text-xs">
                <span className="mr-1">1</span> Learn
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="text-xs">
                <span className="mr-1">2</span> Flashcards
              </TabsTrigger>
              <TabsTrigger value="quiz" className="text-xs">
                <span className="mr-1">3</span> Quiz
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Center Section */}
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-medium truncate max-w-xs">
            {chapter.title}
          </h2>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === chapter.startPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm font-medium px-2">
              {relativePageNum} / {totalPages}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === chapter.endPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Summary
          </Button>
          <Button variant="ghost" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            AI Tutor
          </Button>
          <Button variant="ghost" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Editor
          </Button>
          <Button variant="ghost" size="sm">
            <Highlighter className="h-4 w-4 mr-2" />
            Highlights
          </Button>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className={`flex-1 bg-gray-100 relative ${showSidePanel ? 'mr-96' : ''}`}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
          
          <iframe
            src={`/api/pdf-proxy/pdf-chapter/${chapter.id}/pdf#page=${relativePageNum}`}
            className="w-full h-full"
            onLoad={() => setLoading(false)}
          />
        </div>

        {/* Side Panel */}
        {showSidePanel && (
          <div className="w-96 bg-white border-l flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Understand and Remember This PDF</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSidePanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Instructions */}
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <Badge variant="secondary" className="shrink-0">1</Badge>
                  <p className="text-gray-600">
                    <span className="font-medium">Learn:</span> Read the PDF and add flashcards by clicking on sentences that you want to remember.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="shrink-0">2</Badge>
                  <p className="text-gray-600">
                    <span className="font-medium">Practice:</span> After reading, practice the flashcards to solidify your memory.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="shrink-0">3</Badge>
                  <p className="text-gray-600">
                    <span className="font-medium">Quiz:</span> Check your understanding with a multiple-choice quiz.
                  </p>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
              <div className="p-4">
                {/* Toolbar */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Bold className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Italic className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <List className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={generateAICards}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create AI Cards
                  </Button>
                </div>

                {/* Chapter Title */}
                <div className="mb-6">
                  <h2 className="text-xl font-bold mb-2">
                    {chapter.title}
                  </h2>
                  {chapter.description && (
                    <p className="text-gray-600 text-sm">{chapter.description}</p>
                  )}
                </div>

                {/* Summaries */}
                <div className="space-y-6">
                  {summaries.map((summary, index) => (
                    <div key={summary.id}>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold">
                          {index + 1}. {summary.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            P{summary.pageNum - chapter.startPage + 1}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {summary.arabic && (
                        <p className="text-sm text-gray-600 mb-2 text-right" dir="rtl">
                          {summary.arabic}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-700 mb-2">
                        {summary.content}
                      </p>
                      
                      {summary.keyPoints && summary.keyPoints.length > 0 && (
                        <ul className="text-sm text-gray-600 space-y-1">
                          {summary.keyPoints.map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-600 mt-0.5">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add more summary button */}
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={() => {
                    // TODO: Load more summaries
                  }}
                >
                  Charger plus de résumés
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}