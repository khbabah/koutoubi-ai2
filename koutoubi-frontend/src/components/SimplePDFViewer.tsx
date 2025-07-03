'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Loader2,
  Download,
  Maximize2,
  Layers,
  ListPlus,
  HelpCircle,
  Zap,
  StickyNote
} from 'lucide-react';
import { pdfStructure, type Chapter } from '@/lib/pdfStructure';
import PDFViewerWithCheck from './PDFViewerWithCheck';

interface SimplePDFViewerProps {
  pdfUrl?: string;
  chapterId?: string;
  className?: string;
}

interface PageSummary {
  pageNum: number;
  arabic?: string;
  french: string;
  keyPoints?: string[];
}

export default function SimplePDFViewer({ pdfUrl, chapterId = 'ch1', className }: SimplePDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [chapterMode, setChapterMode] = useState(false);

  // Initialize chapter on mount
  useEffect(() => {
    const chapter = pdfStructure.chapters.find(ch => ch.id === chapterId);
    if (chapter) {
      setSelectedChapter(chapter);
      setCurrentPage(chapter.startPage);
      setTotalPages(chapter.endPage - chapter.startPage + 1);
      setSummaries(getSummariesForChapter(chapter.id));
    }
  }, [chapterId]);
  
  // Mock summaries for math content - in production these would come from API
  const getSummariesForChapter = (chapterId: string): PageSummary[] => {
    switch (chapterId) {
      case 'ch1':
        return [
          {
            pageNum: 22,
            french: 'Les types de variables en Python incluent les entiers (int), les nombres à virgule flottante (float), les chaînes de caractères (str) et les booléens (bool).',
            keyPoints: ['int', 'float', 'str', 'bool']
          },
          {
            pageNum: 24,
            french: 'Les instructions conditionnelles permettent d\'exécuter du code selon des conditions. La structure if/elif/else est fondamentale en programmation.',
            keyPoints: ['if', 'elif', 'else', 'conditions']
          },
          {
            pageNum: 26,
            french: 'Les fonctions permettent de réutiliser du code. Elles sont définies avec def et peuvent recevoir des paramètres et retourner des valeurs.',
            keyPoints: ['def', 'paramètres', 'return']
          }
        ];
      case 'ch2':
        return [
          {
            pageNum: 48,
            french: 'Les puissances entières suivent des règles précises : aⁿ × aᵐ = aⁿ⁺ᵐ et (aⁿ)ᵐ = aⁿˣᵐ',
            keyPoints: ['puissances', 'exposants', 'règles de calcul']
          },
          {
            pageNum: 50,
            french: 'Un nombre premier est un entier naturel qui admet exactement deux diviseurs : 1 et lui-même. Les premiers nombres premiers sont 2, 3, 5, 7, 11...',
            keyPoints: ['nombres premiers', 'diviseurs', 'divisibilité']
          }
        ];
      case 'ch3':
        return [
          {
            pageNum: 74,
            french: 'Un intervalle est un ensemble de nombres réels compris entre deux valeurs. On note [a,b] pour un intervalle fermé et ]a,b[ pour un intervalle ouvert.',
            keyPoints: ['intervalles', 'fermé', 'ouvert', 'notation']
          },
          {
            pageNum: 78,
            french: 'La valeur absolue d\'un nombre réel x, notée |x|, est sa distance à zéro. Elle est toujours positive ou nulle.',
            keyPoints: ['valeur absolue', 'distance', 'positive']
          }
        ];
      default:
        return [];
    }
  };

  const [summaries, setSummaries] = useState<PageSummary[]>([]);

  const handlePageChange = (newPage: number) => {
    if (selectedChapter && newPage >= selectedChapter.startPage && newPage <= selectedChapter.endPage) {
      setCurrentPage(newPage);
    }
  };

  const handleChapterChange = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentPage(chapter.startPage);
    setTotalPages(chapter.endPage - chapter.startPage + 1);
    setSummaries(getSummariesForChapter(chapter.id));
    setLoading(true);
  };

  if (!selectedChapter) return null;

  return (
    <div className={`h-screen flex flex-col bg-gray-50 ${className}`}>
      {/* Top Toolbar */}
      <div className="bg-white border-b px-4 py-2 flex items-center justify-between flex-shrink-0">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <Menu className="h-4 w-4" />
            Menu
          </Button>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9">
              <TabsTrigger value="1" className="text-xs gap-1">
                <span className="text-gray-500">1</span> Learn
              </TabsTrigger>
              <TabsTrigger value="2" className="text-xs gap-1">
                <span className="text-gray-500">2</span> Flashcards
              </TabsTrigger>
              <TabsTrigger value="3" className="text-xs gap-1">
                <span className="text-gray-500">3</span> Quiz
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Center Section */}
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-sm font-medium">
                {selectedChapter.title}
                <ChevronRight className="ml-2 h-3 w-3 rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-80">
              {pdfStructure.chapters.map((chapter) => (
                <DropdownMenuItem
                  key={chapter.id}
                  onClick={() => handleChapterChange(chapter)}
                  className={`cursor-pointer ${chapter.id === selectedChapter.id ? 'bg-gray-100' : ''}`}
                >
                  <div className="flex-1">
                    <div className="font-medium">{chapter.title}</div>
                    <div className="text-xs text-gray-500">
                      {chapter.description} • Pages {chapter.startPage}-{chapter.endPage}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= selectedChapter.startPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm font-medium">
              Page {currentPage - selectedChapter.startPage + 1} / {totalPages}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= selectedChapter.endPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
            <BookOpen className="h-4 w-4" />
            Summary
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
            <Brain className="h-4 w-4" />
            AI Tutor
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
            <FileText className="h-4 w-4" />
            Editor
          </Button>
          <Button variant="ghost" size="sm" className="hidden md:flex gap-2">
            <Highlighter className="h-4 w-4" />
            Highlights
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer (Left) */}
        <div className="flex-1 bg-gray-100 relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
            </div>
          )}
          
          <PDFViewerWithCheck
            pdfUrl={`/api/pdf-direct/pdf-chapter/chapter/${selectedChapter.id}/pdf`}
            className="w-full h-full"
          />
        </div>

        {/* Right Panel */}
        {showRightPanel && (
        <div className="w-[480px] bg-white border-l flex flex-col">
          {/* Actions Rapides */}
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm mb-3">Actions Rapides</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={chapterMode ? "default" : "outline"} 
                size="sm" 
                className="justify-start gap-2"
                onClick={() => setChapterMode(!chapterMode)}
              >
                <Layers className="h-4 w-4" />
                Mode Apprentissage
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2">
                <Copy className="h-4 w-4" />
                Flashcards <Badge variant="secondary" className="ml-auto">0</Badge>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2">
                <Zap className="h-4 w-4" />
                Générer Quiz <Badge variant="secondary" className="ml-auto">0 Q</Badge>
              </Button>
              <Button variant="outline" size="sm" className="justify-start gap-2">
                <StickyNote className="h-4 w-4" />
                Ajouter Note
              </Button>
            </div>
          </div>

          {/* PDF Content Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Contenu du Cours</h3>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <FileText className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                >
                  <Layers className="h-4 w-4" />
                  PDF
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Chapter Mode Toggle */}
            {chapterMode && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Mode Chapitre (Nouveau)
                </Button>
                <p className="text-xs text-blue-700 mt-2 text-center">
                  Navigation optimisée par chapitre avec résumés IA
                </p>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {/* Chapter Title */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-bold">
                    {selectedChapter.title}
                  </h2>
                  <Badge className="bg-purple-100 text-purple-700">
                    Page {currentPage}
                  </Badge>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentPage - selectedChapter.startPage + 1) / totalPages) * 100}%` }}
                  />
                </div>
              </div>

              {/* Chapter Content */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Contenu du chapitre</h3>
                  
                  <div className="space-y-4">
                    {/* Points clés */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Points clés</h4>
                        <Badge variant="outline" className="text-xs">P{currentPage}</Badge>
                      </div>
                      
                      {/* Content blocks */}
                      {summaries
                        .filter(s => s.pageNum >= currentPage - 2 && s.pageNum <= currentPage + 2)
                        .map((summary, index) => (
                        <Card key={index} className="p-3 mb-3">
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {summary.french}
                          </p>
                          {summary.keyPoints && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {summary.keyPoints.map((point, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {point}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex justify-between items-center mt-2">
                            <Badge variant="outline" className="text-xs">
                              Page {summary.pageNum}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6">
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Outils IA */}
                <div>
                  <h3 className="font-semibold mb-3">Outils IA</h3>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                      <Brain className="h-4 w-4" />
                      Générer un résumé
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                      <HelpCircle className="h-4 w-4" />
                      Poser une question
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                      <ListPlus className="h-4 w-4" />
                      Créer un quiz
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                      <FileText className="h-4 w-4" />
                      Extraire les concepts clés
                    </Button>
                  </div>
                </div>

                {/* Progression d'Étude */}
                <div>
                  <h3 className="font-semibold mb-3">Progression d'Étude</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Pages lues</span>
                        <span className="font-medium">{currentPage - selectedChapter.startPage + 1}/{totalPages}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${((currentPage - selectedChapter.startPage + 1) / totalPages) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Flashcards créées</span>
                        <span className="font-medium">0</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: '0%' }} />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Quiz complétés</span>
                        <span className="font-medium">12/20</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
        )}
      </div>
    </div>
  );
}