'use client';

import { 
  BookOpen, 
  Brain, 
  FileQuestion, 
  GitBranch,
  ChevronRight,
  Info
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ContentHierarchyProps {
  niveau: string;
  annee: string;
  matiere: string;
  currentChapter?: {
    numero: number;
    title: string;
  };
}

export function ContentHierarchy({
  niveau,
  annee,
  matiere,
  currentChapter
}: ContentHierarchyProps) {
  const formatNiveau = (n: string) => {
    return n === 'secondaire1' ? 'Secondary 1' : 'Secondary 2';
  };

  const formatAnnee = (a: string) => {
    const years: Record<string, string> = {
      '1ere': '1st Year',
      '2eme': '2nd Year',
      '3eme': '3rd Year',
      '4eme': '4th Year',
      '5eme': '5th Year',
      '6eme': '6th Year',
      '7eme': '7th Year'
    };
    return years[a] || a;
  };

  const formatMatiere = (m: string) => {
    const subjects: Record<string, string> = {
      'mathematiques': 'Mathematics',
      'physique': 'Physics',
      'chimie': 'Chemistry',
      'francais': 'French',
      'anglais': 'English',
      'arabe': 'Arabic',
      'sciences': 'Sciences'
    };
    return subjects[m] || m;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 text-sm">
        <BookOpen className="h-4 w-4 text-gray-500" />
        <span className="font-medium">{formatNiveau(niveau)}</span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="font-medium">{formatAnnee(annee)}</span>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="font-medium">{formatMatiere(matiere)}</span>
        {currentChapter && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-medium text-blue-600">
              Chapter {currentChapter.numero}: {currentChapter.title}
            </span>
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TooltipProvider>
          {/* Flashcards - Chapter Level */}
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-sm">Flashcards</span>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Organized by chapter for focused study</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Badge variant="secondary" className="text-xs">
              Chapter-based
            </Badge>
          </div>

          {/* Quiz - Chapter Level */}
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileQuestion className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Quiz</span>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Practice questions for each chapter</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Badge variant="secondary" className="text-xs">
              Chapter-based
            </Badge>
          </div>

          {/* Mindmap - Course Level */}
          <div className="bg-white rounded-md p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Mindmap</span>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Overview of the entire course</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Badge variant="secondary" className="text-xs">
              Course-wide
            </Badge>
          </div>
        </TooltipProvider>
      </div>

      <div className="mt-3 text-xs text-gray-500 italic">
        💡 Tip: Use chapter mode for focused study, course mode for comprehensive review
      </div>
    </div>
  );
}