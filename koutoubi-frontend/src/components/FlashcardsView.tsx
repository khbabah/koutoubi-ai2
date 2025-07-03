'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Eye, Trash2, Smile, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useFlashcards } from '@/hooks/useFlashcards';
import toast from 'react-hot-toast';

interface FlashcardsViewProps {
  chapterId?: string;
  chapterTitle?: string;
}

export default function FlashcardsView({ chapterId, chapterTitle }: FlashcardsViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'due' | 'all'>('due');
  
  const { flashcards: apiFlashcards, loading, submitFeedback, dueCount } = useFlashcards(chapterId, practiceMode);

  // Map API flashcards to display format
  const flashcards = apiFlashcards.map(fc => ({
    id: fc.id,
    front: fc.question || fc.front,
    back: fc.answer || fc.back,
    category: chapterTitle || fc.category,
    type: fc.type || fc.subcategory
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
    if (currentCard) {
      await submitFeedback(currentCard.id, { feedback: 'remembered' });
      toast.success('Marqué comme mémorisé');
      if (currentIndex < flashcards.length - 1) {
        setTimeout(() => handleNext(), 500);
      }
    }
  };

  const handleForgot = async () => {
    if (currentCard) {
      await submitFeedback(currentCard.id, { feedback: 'forgot' });
      toast.error('Marqué comme oublié');
      if (currentIndex < flashcards.length - 1) {
        setTimeout(() => handleNext(), 500);
      }
    }
  };

  const handleDisableCard = async () => {
    if (currentCard) {
      await submitFeedback(currentCard.id, { feedback: 'disabled' });
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
        <h2 className="text-2xl font-semibold mb-4">Aucune flashcard disponible</h2>
        <p className="text-gray-600 text-center">
          {practiceMode === 'due' 
            ? "Congratulations! You have no flashcards to review at the moment."
            : "Aucune flashcard n'est disponible pour ce chapitre."}
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
              À réviser {dueCount > 0 && `(${dueCount})`}
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

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <div 
          className="w-full max-w-2xl bg-white rounded-lg shadow-lg border p-8 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="mb-4">
            <p className="text-sm text-gray-500">{currentCard?.category}</p>
            {currentCard?.type && (
              <p className="text-xs text-gray-400">{currentCard.type}</p>
            )}
          </div>

          <div className="min-h-[200px] flex items-center justify-center">
            <p className="text-xl text-center">
              {isFlipped ? currentCard?.back : currentCard?.front}
            </p>
          </div>

          {!isFlipped && (
            <div className="mt-8 text-center">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Voir la réponse
              </Button>
            </div>
          )}
        </div>
        
        {/* Mobile Swipe Indicator */}
        <div className="sm:hidden flex justify-center gap-1 mt-2">
          <ChevronLeft className="h-4 w-4 text-gray-400" />
          <span className="text-xs text-gray-400">Glisser</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Action buttons - Responsive */}
      {isFlipped && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2"
            onClick={handleDisableCard}
          >
            <Trash2 className="h-6 w-6" />
            <span>Désactiver</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 border-red-500 text-red-600 hover:bg-red-50"
            onClick={handleForgot}
          >
            <X className="h-6 w-6" />
            <span>Oublié</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 border-green-500 text-green-600 hover:bg-green-50"
            onClick={handleRemembered}
          >
            <Smile className="h-6 w-6" />
            <span>Mémorisé</span>
          </Button>
        </div>
      )}
    </div>
  );
}