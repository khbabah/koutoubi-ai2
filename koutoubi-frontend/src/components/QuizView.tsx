'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useQuiz } from '@/hooks/useQuiz';
import { Loader2, ChevronRight, RotateCcw, Check, X } from 'lucide-react';

interface QuizViewProps {
  chapterId?: string;
  chapterTitle?: string;
}

export default function QuizView({ chapterId, chapterTitle }: QuizViewProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Array<{question_id: string; answer: number; time_spent?: number}>>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  const { questions, loading, submitQuiz } = useQuiz(chapterId);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = async () => {
    if (selectedAnswer !== null && questions[currentQuestion]) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      const newAnswer = {
        question_id: questions[currentQuestion].id,
        answer: selectedAnswer,
        time_spent: timeSpent
      };
      
      const updatedAnswers = [...userAnswers, newAnswer];
      setUserAnswers(updatedAnswers);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setStartTime(Date.now());
      } else {
        // Submit quiz
        setShowResult(true);
        const result = await submitQuiz(updatedAnswers);
        if (result) {
          setQuizResult(result);
        }
      }
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setUserAnswers([]);
    setQuizResult(null);
    setStartTime(Date.now());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <h2 className="text-2xl font-semibold mb-4">Aucun quiz disponible</h2>
        <p className="text-gray-600 text-center">
          Il n'y a pas de questions de quiz disponibles pour ce chapitre.
        </p>
      </div>
    );
  }

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-3 sm:p-4 lg:p-6 pb-20 sm:pb-6">
      {!showResult ? (
        <>
          {/* Header - Responsive */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold">Quiz - {chapterTitle}</h2>
              <Badge variant="outline" className="text-xs sm:text-sm self-start sm:self-auto">
                Question {currentQuestion + 1} sur {questions.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2" />
          </div>

          {/* Question - Responsive */}
          <div className="flex-1 flex items-center justify-center px-2 sm:px-0">
            <div className="w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
              <div className="bg-white rounded-lg shadow-lg border p-4 sm:p-6 lg:p-8">
                <h3 className="text-base sm:text-lg lg:text-xl font-medium mb-4 sm:mb-6">
                  {questions[currentQuestion]?.question}
                </h3>
                
                <div className="space-y-2 sm:space-y-3">
                  {questions[currentQuestion]?.choices.map((choice, index) => (
                    <Button
                      key={index}
                      variant={selectedAnswer === index ? "default" : "outline"}
                      className="w-full justify-start text-left p-3 sm:p-4 h-auto text-sm sm:text-base min-h-[3rem] sm:min-h-[3.5rem]"
                      onClick={() => handleAnswerSelect(index)}
                    >
                      <span className="mr-2 sm:mr-3 font-semibold">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="text-wrap">{choice}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mt-4 sm:mt-6 flex justify-end">
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswer === null}
                  size="default"
                  className="gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
                >
                  {currentQuestion === questions.length - 1 ? 'Terminer' : 'Suivant'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Results - Responsive */
        <div className="flex-1 flex items-center justify-center px-4 sm:px-0">
          <div className="w-full max-w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg border p-4 sm:p-6 lg:p-8 text-center">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4">Quiz Terminé!</h2>
              
              <div className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                <span className="text-blue-600">{quizResult?.score || 0}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{questions.length}</span>
              </div>
              
              <p className="text-lg sm:text-xl text-gray-600 mb-2">
                Pourcentage: {quizResult?.percentage || 0}%
              </p>
              
              <div className="my-4 sm:my-6 lg:my-8 space-y-1.5 sm:space-y-2 max-h-[40vh] overflow-y-auto">
                {quizResult?.answers.map((answer: any, index: number) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded text-sm sm:text-base"
                  >
                    <span className="font-medium">Question {index + 1}</span>
                    {answer.is_correct ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                  </div>
                ))}
              </div>

              <Button 
                onClick={handleRestart}
                size="default"
                className="gap-2 text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3"
              >
                <RotateCcw className="h-4 w-4" />
                Réessayer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}