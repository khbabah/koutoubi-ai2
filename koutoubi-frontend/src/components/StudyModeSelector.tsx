'use client';

import { useState } from 'react';
import { 
  BookOpen, 
  Brain, 
  FileQuestion, 
  GitBranch, 
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type StudyLevel = 'chapter' | 'course' | 'smart';

interface StudyModeSelectorProps {
  mode: StudyLevel;
  onModeChange: (mode: StudyLevel) => void;
  currentChapter?: string;
  totalChapters?: number;
  feature: 'flashcards' | 'quiz' | 'mindmap';
}

export function StudyModeSelector({
  mode,
  onModeChange,
  currentChapter,
  totalChapters,
  feature
}: StudyModeSelectorProps) {
  const getModeLabel = () => {
    switch (mode) {
      case 'chapter':
        return currentChapter || 'Current Chapter';
      case 'course':
        return 'Full Course';
      case 'smart':
        return 'Smart Review';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'chapter':
        return <BookOpen className="h-4 w-4" />;
      case 'course':
        return <Layers className="h-4 w-4" />;
      case 'smart':
        return <Brain className="h-4 w-4" />;
    }
  };

  const getModeDescription = (m: StudyLevel) => {
    switch (m) {
      case 'chapter':
        return `Study ${feature} from the current chapter only`;
      case 'course':
        return `Study all ${feature} from the entire course`;
      case 'smart':
        return `AI-powered review based on your progress`;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {getModeIcon()}
          <span>{getModeLabel()}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[280px]">
        <DropdownMenuLabel>Study Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={() => onModeChange('chapter')}
          className="flex items-start gap-3 p-3"
        >
          <BookOpen className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Chapter Mode</div>
            <div className="text-xs text-gray-500">
              {getModeDescription('chapter')}
            </div>
          </div>
          {mode === 'chapter' && <Badge variant="secondary" className="ml-2">Active</Badge>}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onModeChange('course')}
          className="flex items-start gap-3 p-3"
        >
          <Layers className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-medium">Course Mode</div>
            <div className="text-xs text-gray-500">
              {getModeDescription('course')}
              {totalChapters && ` (${totalChapters} chapters)`}
            </div>
          </div>
          {mode === 'course' && <Badge variant="secondary" className="ml-2">Active</Badge>}
        </DropdownMenuItem>

        {feature !== 'mindmap' && (
          <DropdownMenuItem
            onClick={() => onModeChange('smart')}
            className="flex items-start gap-3 p-3"
          >
            <Brain className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Smart Review</div>
              <div className="text-xs text-gray-500">
                {getModeDescription('smart')}
              </div>
              <Badge variant="outline" className="mt-1" size="sm">Premium</Badge>
            </div>
            {mode === 'smart' && <Badge variant="secondary" className="ml-2">Active</Badge>}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}