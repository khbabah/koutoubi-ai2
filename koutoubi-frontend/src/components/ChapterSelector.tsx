'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  ChevronRight, 
  CheckCircle2,
  PlayCircle,
  FileText
} from 'lucide-react';
import { pdfStructure, getChapterProgress, getTotalProgress, type Chapter } from '@/lib/pdfStructure';

interface ChapterSelectorProps {
  onSelectChapter: (chapter: Chapter) => void;
  completedPages?: number[];
  currentChapterId?: string;
}

export default function ChapterSelector({ 
  onSelectChapter, 
  completedPages = [],
  currentChapterId
}: ChapterSelectorProps) {
  const router = useRouter();
  const [hoveredChapter, setHoveredChapter] = useState<string | null>(null);
  
  const totalProgress = getTotalProgress(completedPages);
  
  const getChapterIcon = (progress: number) => {
    if (progress === 100) return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (progress > 0) return <PlayCircle className="w-5 h-5 text-blue-600" />;
    return <BookOpen className="w-5 h-5 text-gray-400" />;
  };
  
  const getEstimatedTime = (chapter: Chapter) => {
    const pages = chapter.endPage - chapter.startPage + 1;
    const minutesPerPage = 2; // Estimation
    const totalMinutes = pages * minutesPerPage;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{pdfStructure.metadata.subject}</h1>
        <p className="text-gray-600">{pdfStructure.metadata.level} • {pdfStructure.totalPages} pages</p>
        
        {/* Overall Progress */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progression globale</span>
              <span className="text-sm text-gray-600">{totalProgress}%</span>
            </div>
            <Progress value={totalProgress} className="h-2" />
            <p className="text-xs text-gray-500 mt-2">
              {completedPages.length} pages complétées sur {pdfStructure.totalPages}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chapters Grid */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Chapitres disponibles</h2>
        
        {pdfStructure.chapters.map((chapter) => {
          const progress = getChapterProgress(chapter.id, completedPages);
          const isActive = chapter.id === currentChapterId;
          const pageCount = chapter.endPage - chapter.startPage + 1;
          
          return (
            <Card 
              key={chapter.id}
              className={`cursor-pointer transition-all duration-200 ${
                isActive ? 'ring-2 ring-blue-500' : ''
              } ${hoveredChapter === chapter.id ? 'shadow-lg' : ''}`}
              onMouseEnter={() => setHoveredChapter(chapter.id)}
              onMouseLeave={() => setHoveredChapter(null)}
              onClick={() => onSelectChapter(chapter)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getChapterIcon(progress)}
                      <h3 className="text-lg font-semibold">{chapter.title}</h3>
                      {isActive && (
                        <Badge variant="default" className="bg-blue-600">
                          En cours
                        </Badge>
                      )}
                    </div>
                    
                    {chapter.description && (
                      <p className="text-sm text-gray-600 mb-3">{chapter.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {pageCount} pages
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {getEstimatedTime(chapter)}
                      </span>
                      {chapter.sections.length > 0 && (
                        <span>{chapter.sections.length} sections</span>
                      )}
                    </div>
                    
                    {progress > 0 && (
                      <div className="mt-3">
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4">
                    <Button 
                      variant={progress === 0 ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                    >
                      {progress === 0 ? 'Commencer' : 'Continuer'}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Chapter sections preview on hover */}
                {hoveredChapter === chapter.id && chapter.sections.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">Sections :</p>
                    <div className="grid grid-cols-2 gap-2">
                      {chapter.sections.slice(0, 4).map((section) => (
                        <div key={section.id} className="text-xs text-gray-600">
                          • {section.title}
                        </div>
                      ))}
                      {chapter.sections.length > 4 && (
                        <div className="text-xs text-gray-500">
                          +{chapter.sections.length - 4} autres...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Quick Actions */}
      <div className="mt-8 flex gap-4">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard')}
          className="flex-1"
        >
          Retour au tableau de bord
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            // Continuer où on s'est arrêté
            const lastPage = completedPages[completedPages.length - 1] || 1;
            const chapter = pdfStructure.chapters.find(
              ch => lastPage >= ch.startPage && lastPage <= ch.endPage
            );
            if (chapter) onSelectChapter(chapter);
          }}
          className="flex-1"
          disabled={completedPages.length === 0}
        >
          Reprendre où j'étais
        </Button>
      </div>
    </div>
  );
}