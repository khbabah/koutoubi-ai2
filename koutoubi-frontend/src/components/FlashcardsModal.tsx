import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { X, Eye, Trash2, Frown, Smile, ChevronLeft, ChevronRight, MoreHorizontal, Edit, FileText } from 'lucide-react';
import { useFlashcards } from '@/hooks/useFlashcards';
import toast from 'react-hot-toast';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  subcategory?: string;
  lastReviewed?: Date;
  reviewCount?: number;
}

interface FlashcardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flashcards?: Flashcard[];
  documentTitle?: string;
  chapterId?: string;
  currentPage?: number;
}

export default function FlashcardsModal({ 
  open, 
  onOpenChange, 
  flashcards: providedFlashcards,
  documentTitle,
  chapterId,
  currentPage
}: FlashcardsModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [practiceMode, setPracticeMode] = useState<'due' | 'all'>('due');
  
  // Use the hook to fetch flashcards
  const { flashcards: apiFlashcards, loading, submitFeedback, dueCount } = useFlashcards(chapterId, practiceMode);

  // Default flashcards for demo
  const defaultFlashcards: Flashcard[] = [
    {
      id: '1',
      category: 'Bachagha Si Khelladi Ben Miloud, Un Chef Indigène À Mi-Chemin Du Nationalisme (1895-1991)',
      subcategory: 'Le Bachagha Si Khelladi Ben Miloud',
      front: 'What was Si Khelladi\'s family background?',
      back: 'He was born into a prestigious family with ties to the French colonial administration.'
    },
    {
      id: '2',
      category: 'Bachagha Si Khelladi Ben Miloud, Un Chef Indigène À Mi-Chemin Du Nationalisme (1895-1991)',
      subcategory: 'Le Bachagha Si Khelladi Ben Miloud',
      front: 'How did Si Khelladi\'s relationship with Abdelkader Bourouis affect him?',
      back: 'It helped shape his political views and his stance on nationalism and colonial administration.'
    },
    {
      id: '3',
      category: 'Python Programming',
      subcategory: 'Les bases',
      front: 'Qu\'est-ce qu\'une variable en Python?',
      back: 'Un conteneur pour stocker des données qui peuvent être modifiées pendant l\'exécution du programme.'
    }
  ];

  // Map API flashcards to the expected format
  const mappedFlashcards: Flashcard[] = apiFlashcards.map(fc => ({
    id: fc.id,
    front: fc.question || fc.front,
    back: fc.answer || fc.back,
    category: documentTitle || fc.category,
    subcategory: fc.type || fc.subcategory
  }));
  
  const cards = providedFlashcards || (mappedFlashcards.length > 0 ? mappedFlashcards : defaultFlashcards);
  
  // No additional filtering needed since API already filters based on practiceMode
  const filteredCards = cards;

  const currentCard = filteredCards[currentIndex];
  const progress = filteredCards.length > 0 
    ? ((currentIndex + 1) / filteredCards.length) * 100 
    : 0;

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleMarkAsMastered = () => {
    if (currentCard) {
      const newMastered = new Set(masteredCards);
      if (masteredCards.has(currentCard.id)) {
        newMastered.delete(currentCard.id);
      } else {
        newMastered.add(currentCard.id);
      }
      setMasteredCards(newMastered);
    }
  };

  const handleShuffle = () => {
    // Simple shuffle - in a real app, you'd want a proper shuffle algorithm
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setMasteredCards(new Set());
  };

  const handleRemembered = async () => {
    if (currentCard) {
      handleMarkAsMastered();
      // Send feedback to API
      await submitFeedback(currentCard.id, { feedback: 'remembered' });
    }
    if (currentIndex < filteredCards.length - 1) {
      setTimeout(() => handleNext(), 500);
    }
  };

  const handleForgot = async () => {
    if (currentCard) {
      // Mark as not mastered if it was
      if (masteredCards.has(currentCard.id)) {
        const newMastered = new Set(masteredCards);
        newMastered.delete(currentCard.id);
        setMasteredCards(newMastered);
      }
      // Send feedback to API
      await submitFeedback(currentCard.id, { feedback: 'forgot' });
    }
    if (currentIndex < filteredCards.length - 1) {
      setTimeout(() => handleNext(), 500);
    }
  };
  
  const handleDisableCard = async () => {
    if (currentCard) {
      // Send feedback to API
      await submitFeedback(currentCard.id, { feedback: 'disabled' });
      toast('Carte désactivée', { icon: 'ℹ️' });
    }
    if (currentIndex < filteredCards.length - 1) {
      setTimeout(() => handleNext(), 500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[10px] border-l-red-500"></div>
              <span className="text-lg font-medium">{filteredCards.length}</span>
            </div>
            <h2 className="text-xl font-semibold">Flashcards</h2>
            
            {/* Practice Mode Selector */}
            <div className="flex gap-1 bg-gray-100 rounded p-0.5 ml-4">
              <button
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  practiceMode === 'due' 
                    ? 'bg-white text-blue-600 font-medium shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setPracticeMode('due')}
              >
                Practice Due {dueCount > 0 && `(${dueCount})`}
              </button>
              <button
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  practiceMode === 'all' 
                    ? 'bg-white text-blue-600 font-medium shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                onClick={() => setPracticeMode('all')}
              >
                Practice All
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevious} disabled={currentIndex === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNext} disabled={currentIndex === filteredCards.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {filteredCards.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 mb-4">
              {practiceMode === 'due' 
                ? "Great job! You've mastered all flashcards."
                : "No flashcards available."}
            </p>
            {practiceMode === 'due' && (
              <Button onClick={() => setPracticeMode('all')}>
                Review All Cards
              </Button>
            )}
          </div>
        ) : currentCard && (
          <>
            {/* Progress Bar */}
            <div className="relative h-1 bg-gray-200">
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Card Content */}
            <div className="p-8">
              {/* Category */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{currentCard.category || 'General'}</span>
                </div>
                
                {/* Subcategory */}
                {currentCard.subcategory && (
                  <div className="ml-6">
                    <span className="text-gray-800 font-medium">• {currentCard.subcategory}</span>
                  </div>
                )}
              </div>

              {/* Question/Answer Section */}
              <div className="space-y-4">
                {!isFlipped ? (
                  /* Front of card - Question */
                  <div>
                    <div className="mb-2">
                      <span className="text-gray-800 font-medium">
                        {currentCard.subcategory && '• '}Family Background and Influence
                      </span>
                    </div>
                    <div className="ml-6 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-800">•</span>
                        <span className="text-gray-800">
                          {currentCard.front} 
                          <span className="text-gray-600 ml-2">→</span>
                          <span className="text-blue-600 ml-2">?</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Back of card - Answer */
                  <div>
                    <div className="mb-2">
                      <span className="text-gray-800 font-medium">
                        {currentCard.subcategory && '• '}Connection with Nationalist Movements
                      </span>
                    </div>
                    <div className="ml-6 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-800">•</span>
                        <span className="text-gray-800">
                          {currentCard.front} 
                          <span className="text-gray-600 ml-2">→</span>
                          <span className="text-green-600 ml-2">{currentCard.back}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Show Answer Button */}
              {!isFlipped && (
                <div className="mt-16">
                  <Button 
                    onClick={handleFlip}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Show Answer
                  </Button>
                </div>
              )}
            </div>

            {/* Bottom Action Buttons */}
            {isFlipped && (
              <div className="border-t p-6">
                <div className="grid grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2"
                    onClick={handleDisableCard}
                  >
                    <Trash2 className="h-6 w-6" />
                    <span className="text-sm">Disable Card</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2 border-red-500 text-red-600 hover:bg-red-50"
                    onClick={handleForgot}
                  >
                    <X className="h-6 w-6" />
                    <span className="text-sm">Forgot</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-24 flex flex-col gap-2 border-green-500 text-green-600 hover:bg-green-50"
                    onClick={handleRemembered}
                  >
                    <Smile className="h-6 w-6" />
                    <span className="text-sm">Remembered</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}