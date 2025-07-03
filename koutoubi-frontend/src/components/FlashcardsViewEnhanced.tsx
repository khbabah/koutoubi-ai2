'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Eye, Trash2, Smile, ChevronLeft, ChevronRight, Loader2, Layers, BookOpen } from 'lucide-react';
import { useFlashcards } from '@/hooks/useFlashcards';
import { StudyModeSelector } from './StudyModeSelector';
import { contentApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import useSWR from 'swr';

interface FlashcardsViewEnhancedProps {
  chapterId?: string;
  chapterTitle?: string;
  courseId?: string;
  mode: 'chapter' | 'course' | 'smart';
  onModeChange: (mode: 'chapter' | 'course' | 'smart') => void;
  totalChapters?: number;
}

export default function FlashcardsViewEnhanced({ 
  chapterId, 
  chapterTitle,
  courseId,
  mode,
  onModeChange,
  totalChapters
}: FlashcardsViewEnhancedProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'due' | 'all'>('due');
  
  // Use different hooks based on mode
  const chapterFlashcards = useFlashcards(
    mode === 'chapter' ? chapterId : undefined, 
    practiceMode
  );

  // Fetch course flashcards when in course mode
  const { data: courseFlashcardsData, error: courseError, isLoading: courseLoading } = useSWR(
    mode === 'course' && courseId ? 
      [`course-flashcards-${courseId}`, courseId] : null,
    ([_, id]) => contentApi.getCourseFlashcards(id, { 
      random: practiceMode === 'due',
      limit: practiceMode === 'due' ? 20 : undefined 
    })
  );

  // Determine which flashcards to use
  const loading = mode === 'chapter' ? chapterFlashcards.loading : courseLoading;
  const apiFlashcards = mode === 'chapter' 
    ? chapterFlashcards.flashcards 
    : (courseFlashcardsData || []);

  // Map API flashcards to display format
  const flashcards = apiFlashcards.map((fc: any) => ({
    id: fc.id,
    front: fc.question || fc.front,
    back: fc.answer || fc.back,
    category: mode === 'chapter' ? (chapterTitle || fc.category) : fc.chapter_title || fc.category,
    type: fc.type || fc.subcategory,
    chapterId: fc.chapter_id
  }));

  const currentCard = flashcards[currentIndex];

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRemembered = async () => {
    if (currentCard && mode === 'chapter') {
      await chapterFlashcards.submitFeedback(currentCard.id, { feedback: 'remembered' });
      toast.success('Well done!', { icon: '✨' });
      if (currentIndex < flashcards.length - 1) {
        setTimeout(() => handleNext(), 500);
      }
    }
  };

  const handleForgot = async () => {
    if (currentCard && mode === 'chapter') {
      await chapterFlashcards.submitFeedback(currentCard.id, { feedback: 'forgot' });
      toast('Keep practicing!', { icon: '💪' });
      if (currentIndex < flashcards.length - 1) {
        setTimeout(() => handleNext(), 500);
      }
    }
  };

  const handleDisableCard = async () => {
    if (currentCard && mode === 'chapter') {
      await chapterFlashcards.submitFeedback(currentCard.id, { feedback: 'disabled' });
      toast('Flashcard disabled', { icon: 'ℹ️' });
      if (currentIndex < flashcards.length - 1) {
        setTimeout(() => handleNext(), 500);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-semibold mb-4">No flashcards available</h2>
        <p className="text-gray-600 text-center">
          {practiceMode === 'due' 
            ? "Congratulations! You have no flashcards to review at the moment."
            : mode === 'chapter' 
              ? "No flashcards available for this chapter."
              : "No flashcards available for this course."}
        </p>
        {practiceMode === 'due' && (
          <Button 
            className="mt-4"
            onClick={() => setPracticeMode('all')}
          >
            View all flashcards
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Flashcards</h2>
          <Badge variant="outline">{currentIndex + 1} / {flashcards.length}</Badge>
          
          {/* Study Mode Selector */}
          <StudyModeSelector
            mode={mode}
            onModeChange={onModeChange}
            currentChapter={chapterTitle}
            totalChapters={totalChapters}
            feature="flashcards"
          />
          
          {/* Practice Mode Selector */}
          <div className="flex gap-1 bg-gray-100 rounded p-0.5">
            <button
              className={`px-3 py-1 text-sm rounded transition-colors ${
                practiceMode === 'due' 
                  ? 'bg-white text-blue-600 font-medium shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setPracticeMode('due')}
            >
              Due ({mode === 'chapter' ? chapterFlashcards.dueCount : 0})
            </button>
            <button
              className={`px-3 py-1 text-sm rounded transition-colors ${
                practiceMode === 'all' 
                  ? 'bg-white text-blue-600 font-medium shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setPracticeMode('all')}
            >
              All flashcards
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleNext}
            disabled={currentIndex === flashcards.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Flashcard */}
      {currentCard && (
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Card Category & Type */}
          <div className="flex gap-2 mb-4">
            {mode === 'course' && currentCard.chapterId && (
              <Badge variant="secondary" className="text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                Chapter {currentCard.chapterId.split('ch')[1]}
              </Badge>
            )}
            <Badge variant="secondary">{currentCard.category}</Badge>
            {currentCard.type && (
              <Badge variant="outline">{currentCard.type}</Badge>
            )}
          </div>

          {/* Card */}
          <div 
            className="w-full max-w-2xl h-96 relative cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`absolute inset-0 w-full h-full transition-all duration-500 transform-gpu ${
              isFlipped ? 'rotate-y-180' : ''
            }`} style={{ transformStyle: 'preserve-3d' }}>
              {/* Front */}
              <div className="absolute inset-0 w-full h-full backface-hidden">
                <div className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 flex flex-col items-center justify-center">
                  <p className="text-xl text-center">{currentCard.front}</p>
                  <div className="absolute bottom-4 text-sm text-gray-400">
                    Click to reveal answer
                  </div>
                </div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
                <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border border-blue-200 p-8 flex flex-col items-center justify-center">
                  <p className="text-xl text-center">{currentCard.back}</p>
                  <div className="absolute bottom-4 text-sm text-gray-400">
                    Click to flip back
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions - Only show for chapter mode */}
          {mode === 'chapter' && isFlipped && (
            <div className="flex gap-4 mt-8">
              <Button 
                variant="outline" 
                onClick={handleForgot}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                I forgot
              </Button>
              <Button 
                onClick={handleRemembered}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Eye className="h-4 w-4" />
                I remembered
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDisableCard}
                className="flex items-center gap-2 text-gray-500"
              >
                <Trash2 className="h-4 w-4" />
                Disable
              </Button>
            </div>
          )}

          {/* Info for course mode */}
          {mode === 'course' && isFlipped && (
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>In course mode, flashcards are for review only.</p>
              <p>Switch to chapter mode to track your progress.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}