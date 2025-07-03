'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Menu,
  Search,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Brain,
  FileText,
  Highlighter,
  MoreHorizontal,
  X,
  ChevronRight,
  ChevronDown,
  Loader2,
  Copy,
  Calculator,
  Type,
  Lightbulb,
  AlertCircle,
  Hash,
  GraduationCap,
  ChevronLeft,
  PanelRightClose,
  MoreVertical
} from 'lucide-react';
import toast from 'react-hot-toast';
import AITutorModal from './AITutorModal';
import FlashcardsView from './FlashcardsView';
import QuizView from './QuizView';
import MindmapView from './mindmap/MindmapView';
import { useSubscription } from '@/hooks/useSubscription';
import UsageLimitBadge from './UsageLimitBadge';

interface Chapter {
  id: string;
  title: string;
  page: number;
  end_page: number;
}

interface ChapterSummary {
  chapter_id: string;
  title: string;
  summary: string;
  sections: Array<{
    title: string;
    page: number;
    key_points: Array<{
      type: string;
      content: string;
    }>;
  }>;
}

interface HighLevelStructure {
  title: string;
  total_pages: number;
  chapters: Chapter[];
}

export default function OptimizedPDFViewer() {
  const params = useParams();
  const { data: session } = useSession();
  const { isPremium, status: subStatus } = useSubscription();
  
  // Normaliser le niveau depuis l'URL pour correspondre à la structure des dossiers
  let niveau = params.niveau as string;
  if (niveau === 'secondaire-1er-cycle') {
    niveau = 'secondaire1';
  } else if (niveau === 'secondaire-2eme-cycle') {
    niveau = 'secondaire2';
  }
  const annee = params.annee as string;
  const matiere = params.matiere as string;
  
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Default to page 1
  const [loading, setLoading] = useState(true);
  const [structure, setStructure] = useState<HighLevelStructure | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<string[]>([]);
  const [chapterSummaries, setChapterSummaries] = useState<Record<string, ChapterSummary>>({});
  const [loadingChapters, setLoadingChapters] = useState<string[]>([]);
  const [summaryMode, setSummaryMode] = useState<'ai' | 'quick'>('quick'); // Mode par défaut
  const [showAITutor, setShowAITutor] = useState(false);
  const [activeTab, setActiveTab] = useState<'learn' | 'flashcards' | 'quiz' | 'mindmap'>('learn');
  const [showMenu, setShowMenu] = useState(false);
  const [courseError, setCourseError] = useState<string | null>(null);

  useEffect(() => {
    // First, find the course ID based on URL parameters
    if (niveau && annee && matiere && session?.access_token) {
      findCourseId();
    }
  }, [niveau, annee, matiere, session?.access_token]);
  
  useEffect(() => {
    // Once we have a course ID, load the structure
    if (courseId && session?.access_token) {
      loadHighLevelStructure();
    }
  }, [courseId, session?.access_token]);

  const findCourseId = async () => {
    try {
      if (!session?.access_token) {
        console.error('No access token available');
        setCourseError('Session expirée');
        return;
      }
      
      // Call the content API to get courses matching our parameters
      const response = await fetch(`http://localhost:8000/api/v1/content/courses?niveau=${niveau}&annee=${annee}&matiere=${matiere}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.courses && data.courses.length > 0) {
          const course = data.courses[0];
          setCourseId(course.id);
          setCourseTitle(course.title);
          
          // Set initial page based on first chapter if available
          if (course.chapters && course.chapters.length > 0) {
            setCurrentPage(course.chapters[0].page || 1);
          }
        } else {
          setCourseError('Cours non trouvé');
          toast.error('Cours non trouvé');
        }
      } else {
        setCourseError('Erreur lors de la recherche du cours');
        toast.error('Erreur lors de la recherche du cours');
      }
    } catch (error) {
      console.error('Error finding course:', error);
      setCourseError('Erreur de connexion');
      toast.error('Erreur de connexion');
    }
  };
  
  const loadHighLevelStructure = async () => {
    if (!courseId || !session?.access_token) return;
    
    try {
      console.log('Loading structure for course:', courseId);
      
      const response = await fetch(`http://localhost:8000/api/v1/pdf-content/course/${courseId}/high-level-structure`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStructure(data);
        
        // Update current page to first chapter's page if not set
        if (currentPage === 1 && data.chapters && data.chapters.length > 0) {
          setCurrentPage(data.chapters[0].page);
        }
      } else {
        console.error('Response status:', response.status);
        toast.error('Erreur lors du chargement de la structure du cours');
      }
    } catch (error) {
      console.error('Error loading structure:', error);
      toast.error('Erreur de connexion');
    }
  };

  const loadChapterSummary = async (chapterId: string) => {
    if (!courseId || chapterSummaries[chapterId] || loadingChapters.includes(chapterId) || !session?.access_token) {
      return;
    }

    setLoadingChapters(prev => [...prev, chapterId]);

    try {
      const response = await fetch(`http://localhost:8000/api/v1/pdf-content/course/${courseId}/chapter-summary/${chapterId}?mode=${summaryMode}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setChapterSummaries(prev => ({ ...prev, [chapterId]: data }));
      } else {
        toast.error('Erreur lors du chargement du résumé du chapitre');
      }
    } catch (error) {
      console.error('Error loading chapter summary:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoadingChapters(prev => prev.filter(id => id !== chapterId));
    }
  };

  const toggleChapter = async (chapterId: string) => {
    if (expandedChapters.includes(chapterId)) {
      setExpandedChapters(prev => prev.filter(id => id !== chapterId));
    } else {
      setExpandedChapters(prev => [...prev, chapterId]);
      // Charger le résumé si pas déjà chargé
      if (!chapterSummaries[chapterId]) {
        await loadChapterSummary(chapterId);
      }
    }
  };

  const navigateToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    setLoading(true);
    // Petit délai pour l'animation
    setTimeout(() => setLoading(false), 500);
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'formula':
        return <Calculator className="h-3 w-3 text-blue-600" />;
      case 'definition':
        return <Type className="h-3 w-3 text-green-600" />;
      case 'example':
        return <Lightbulb className="h-3 w-3 text-yellow-600" />;
      case 'tip':
      case 'concept':
        return <Lightbulb className="h-3 w-3 text-purple-600" />;
      case 'warning':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      default:
        return <Hash className="h-3 w-3 text-gray-600" />;
    }
  };

  const totalPages = structure?.total_pages || 1;
  
  // Show error state if course not found
  if (courseError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold mb-4">Cours non trouvé</h2>
          <p className="text-gray-600 mb-6">
            Le cours demandé n'a pas été trouvé: {niveau} / {annee} / {matiere}
          </p>
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full"
          >
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }
  
  // Show loading state while finding course
  if (!courseId && !courseError) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header amélioré */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm">
        {/* Gauche: Retour et informations du cours */}
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()} 
            className="h-9 w-9 p-0 hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex flex-col min-w-0 max-w-[200px] sm:max-w-[300px]">
            <h1 className="font-semibold text-base sm:text-lg leading-tight text-gray-900 truncate">
              {courseTitle || 'Chargement...'}
            </h1>
            <p className="text-xs text-gray-500 capitalize">
              {matiere && annee ? `${matiere.replace(/-/g, ' ')} • ${annee}` : ''}
            </p>
          </div>
        </div>
        
        {/* Centre: Navigation */}
        <div className="flex items-center gap-4">
          
          {/* Desktop/Tablet - Navigation principale */}
          <nav className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                activeTab === 'learn' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('learn')}
            >
              <BookOpen className="h-4 w-4" />
              <span>Cours</span>
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all relative ${
                activeTab === 'flashcards' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('flashcards')}
            >
              <Brain className="h-4 w-4" />
              <span>Flashcards</span>
              {!isPremium && subStatus && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {subStatus.usage_stats.flashcards?.limit || 0}
                  </div>
                </div>
              )}
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all relative ${
                activeTab === 'quiz' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('quiz')}
            >
              <GraduationCap className="h-4 w-4" />
              <span>Quiz</span>
              {!isPremium && subStatus && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {subStatus.usage_stats.quiz_generation?.remaining || 0}
                  </div>
                </div>
              )}
            </button>
            <button 
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all relative ${
                activeTab === 'mindmap' 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('mindmap')}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="19" r="2" />
                <circle cx="5" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <path d="M12 9v6M9 12h6" />
              </svg>
              <span>Mindmap</span>
              {!isPremium && subStatus && (
                <div className="absolute -top-1 -right-1">
                  <div className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {subStatus.usage_stats.mindmap_generation?.remaining || 0}
                  </div>
                </div>
              )}
            </button>
          </nav>
          
          {/* Mobile - Titre simplifié */}
          <div className="sm:hidden flex items-center gap-2 text-sm">
            <span className="text-gray-600">
              {activeTab === 'learn' && 'Cours'}
              {activeTab === 'flashcards' && 'Flashcards'}
              {activeTab === 'quiz' && 'Quiz'}
              {activeTab === 'mindmap' && 'Mindmap'}
            </span>
          </div>
        </div>

        <div className="flex-1"></div>

        {/* Droite: Boutons */}
        <div className="flex items-center gap-2">
          {/* Bouton pour afficher la sidebar quand elle est cachée */}
          {activeTab === 'learn' && panelCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPanelCollapsed(false)}
              className="flex items-center gap-2"
            >
              <PanelRightClose className="h-4 w-4 rotate-180" />
              <span className="hidden sm:inline text-sm">Afficher la barre</span>
            </Button>
          )}
          
          {/* Menu mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>


      {/* Main Content */}
      <div className={`flex-1 flex overflow-hidden relative transition-all duration-300 ${
        activeTab === 'learn' && !panelCollapsed ? 'pr-0 sm:pr-[400px]' : 'pr-0'
      }`}>
        {/* Content Area */}
        <div className="flex-1 relative">
          {/* PDF Viewer - Always mounted but hidden when not active */}
          <div className={`absolute inset-0 flex flex-col bg-gray-900 ${activeTab === 'learn' ? 'block' : 'hidden'}`}>
              {/* PDF Controls Bar */}
              <div className="bg-gray-800 text-white flex items-center justify-between px-4 py-2 z-10 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">{courseTitle || 'Chargement...'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-700 rounded px-2 py-1">
                    <span className="text-sm">{currentPage}</span>
                    <span className="text-sm text-gray-400">/</span>
                    <span className="text-sm">{totalPages}</span>
                  </div>
                </div>
              </div>
              
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              )}
              
              <iframe
                src={`http://localhost:8000/api/v1/pdf-viewer/${niveau}/${annee}/${matiere}?token=${session?.access_token || ''}#page=${currentPage}`}
                className="w-full flex-1 border-0"
                onLoad={() => setLoading(false)}
                style={{ 
                  backgroundColor: '#f5f5f5'
                }}
              />
          </div>
          
          {/* Flashcards View - Always mounted but hidden when not active */}
          <div className={`absolute inset-0 bg-white ${activeTab === 'flashcards' ? 'block' : 'hidden'}`}>
              <FlashcardsView 
                chapterId={
                  structure?.chapters.find(ch => 
                    currentPage >= ch.page && currentPage <= ch.end_page
                  )?.id
                }
                chapterTitle={
                  structure?.chapters.find(ch => 
                    currentPage >= ch.page && currentPage <= ch.end_page
                  )?.title || 'Document'
                }
              />
          </div>
          
          {/* Quiz View - Always mounted but hidden when not active */}
          <div className={`absolute inset-0 bg-white ${activeTab === 'quiz' ? 'block' : 'hidden'}`}>
              <QuizView 
                chapterId={
                  structure?.chapters.find(ch => 
                    currentPage >= ch.page && currentPage <= ch.end_page
                  )?.id
                }
                chapterTitle={
                  structure?.chapters.find(ch => 
                    currentPage >= ch.page && currentPage <= ch.end_page
                  )?.title || 'Quiz'
                }
              />
          </div>
          
          {/* Mindmap View - Always mounted but hidden when not active */}
          <div className={`absolute inset-0 bg-white ${activeTab === 'mindmap' ? 'block' : 'hidden'}`}>
              <MindmapView 
                pdfId={`${niveau}-${annee}-${matiere}`} 
              />
          </div>
        </div>

        {/* Right Panel - Summary Drawer (only in learn tab) */}
        {activeTab === 'learn' && (
          <>
            {/* Overlay mobile */}
            {!panelCollapsed && (
              <div 
                className="sm:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
                onClick={() => setPanelCollapsed(true)}
              />
            )}
            
            <div className={`fixed right-0 top-[64px] ${activeTab === 'learn' ? 'bottom-[60px] sm:bottom-0' : 'bottom-0'} flex transition-all duration-300 z-30 ${
              panelCollapsed ? 'translate-x-full' : 'translate-x-0'
            }`}>
              {/* Drawer */}
              <div className="bg-white border-l shadow-lg flex flex-col w-[280px] sm:w-[400px] h-full overflow-hidden">
                
                {/* Header avec bouton masquer */}
                <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                  <h3 className="font-medium text-sm">Table des matières</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                    onClick={() => setPanelCollapsed(true)}
                  >
                    <PanelRightClose className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">Masquer</span>
                  </Button>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 bg-white">
                  <div className="p-3 sm:p-4">

                  {/* Toolbar */}
                  <div className="flex items-center gap-2 mb-3 sm:mb-4">
                    <button className="flex items-center gap-1 text-xs sm:text-sm p-1">
                      <span>H1</span>
                    </button>
                    <button className="flex items-center gap-1 text-xs sm:text-sm p-1">
                      <Hash className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <button className="flex items-center gap-1 text-xs sm:text-sm p-1">
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    <div className="ml-auto">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2">
                        <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Créer des cartes IA</span>
                        <span className="sm:hidden">AI Flashcards</span>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Chapters */}
                  {structure && (
                    <div className="space-y-2">
                      {structure.chapters.map((chapter) => (
                        <div key={chapter.id} className="border rounded-lg overflow-hidden bg-white">
                          <div 
                            className="flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleChapter(chapter.id)}
                          >
                            <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                              <ChevronRight 
                                className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform flex-shrink-0 ${
                                  expandedChapters.includes(chapter.id) ? 'rotate-90' : ''
                                }`}
                              />
                              <span className="text-xs sm:text-sm truncate">{chapter.title}</span>
                            </div>
                            <Badge 
                              variant="outline" 
                              className="text-xs ml-2 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToPage(chapter.page);
                              }}
                            >
                              P{chapter.page}
                            </Badge>
                          </div>
                          
                          {expandedChapters.includes(chapter.id) && chapterSummaries[chapter.id] && (
                            <div className="border-t px-3 pb-3 pt-2">
                              <p className="text-xs text-gray-600 mb-2">{chapterSummaries[chapter.id].summary}</p>
                              
                              {chapterSummaries[chapter.id].sections.map((section, idx) => (
                                <div key={idx} className="mb-2">
                                  <div 
                                    className="flex items-center justify-between mb-1 cursor-pointer hover:bg-gray-50 p-1 -mx-1 rounded"
                                    onClick={() => navigateToPage(section.page)}
                                  >
                                    <h4 className="font-medium text-xs">{section.title}</h4>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            
            </div>
          </>
        )}
      </div>
      
      {/* AI Tutor Button - Hidden on mobile when drawer is open */}
      <Button 
        className={`fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg z-40 ${
          activeTab === 'learn' && !panelCollapsed ? 'hidden sm:flex' : 'flex'
        }`}
        size="icon"
        onClick={() => setShowAITutor(true)}
      >
        <Brain className="h-5 w-5" />
      </Button>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-30">
        <div className="flex justify-around py-2">
          <button
            className={`flex flex-col items-center gap-1 px-4 py-1 ${
              activeTab === 'learn' ? 'text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('learn')}
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs">Cours</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 px-4 py-1 ${
              activeTab === 'flashcards' ? 'text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('flashcards')}
          >
            <Brain className="h-5 w-5" />
            <span className="text-xs">Cartes</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 px-4 py-1 ${
              activeTab === 'quiz' ? 'text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('quiz')}
          >
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs">Quiz</span>
          </button>
          <button
            className={`flex flex-col items-center gap-1 px-4 py-1 ${
              activeTab === 'mindmap' ? 'text-blue-600' : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('mindmap')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="19" r="2" />
              <circle cx="5" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
              <path d="M12 9v6M9 12h6" />
            </svg>
            <span className="text-xs">Mindmap</span>
          </button>
        </div>
      </div>

      {/* AI Tutor Modal */}
      <AITutorModal 
        isOpen={showAITutor}
        onClose={() => setShowAITutor(false)}
        currentPage={currentPage}
        chapterTitle={
          structure?.chapters.find(ch => 
            currentPage >= ch.page && currentPage <= ch.end_page
          )?.title || 'Document'
        }
      />

    </div>
  );
}