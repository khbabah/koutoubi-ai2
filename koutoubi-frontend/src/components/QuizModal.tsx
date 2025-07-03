import React, { useState, useEffect } from 'react';
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
import { useQuiz } from '@/hooks/useQuiz';
import { Loader2 } from 'lucide-react';

interface QuizModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId?: string;
  chapterTitle?: string;
}

export default function QuizModal({ open, onOpenChange, chapterId, chapterTitle }: QuizModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Array<{question_id: string; answer: number; time_spent?: number}>>([]);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // Use the quiz hook
  const { questions, loading, submitQuiz } = useQuiz(chapterId);
  
  // Reset when modal opens
  useEffect(() => {
    if (open) {
      setCurrentQuestion(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setUserAnswers([]);
      setQuizResult(null);
      setStartTime(Date.now());
    }
  }, [open]);
  
  const totalQuestions = questions.length;
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

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

      if (currentQuestion < totalQuestions - 1) {
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

  const handleClose = () => {
    handleRestart();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{chapterTitle || 'Quiz'}</DialogTitle>
          <DialogDescription>
            {showResult 
              ? `Quiz terminé! Score: ${quizResult?.score || 0}/${totalQuestions}`
              : loading ? 'Chargement des questions...' : `Question ${currentQuestion + 1} sur ${totalQuestions}`
            }
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : !showResult && questions.length > 0 ? (
          <>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    {questions[currentQuestion]?.question}
                  </h3>
                  
                  <div className="space-y-2">
                    {questions[currentQuestion]?.choices.map((choice, index) => (
                      <Button
                        key={index}
                        variant={selectedAnswer === index ? "default" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => handleAnswerSelect(index)}
                      >
                        <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                        {choice}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null}
              >
                {currentQuestion === totalQuestions - 1 ? 'Finish' : 'Next'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center space-y-4">
                    <h3 className="text-2xl font-bold">Quiz Terminé!</h3>
                    <p className="text-4xl font-bold text-blue-600">
                      {quizResult?.score || 0}/{totalQuestions}
                    </p>
                    <p className="text-gray-600">
                      Vous avez répondu correctement à {quizResult?.score || 0} questions sur {totalQuestions}
                    </p>
                    <div className="text-sm text-gray-500">
                      Pourcentage: {quizResult?.percentage || 0}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h4 className="font-medium">Révision des réponses:</h4>
                {quizResult?.answers.map((answer: any, index: number) => (
                  <div key={index} className="text-sm">
                    <span className={answer.is_correct ? "text-green-600" : "text-red-600"}>
                      Q{index + 1}: {answer.is_correct ? "✓" : "✗"}
                      {!answer.is_correct && answer.explanation && (
                        <span className="text-gray-500 ml-2">({answer.explanation})</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
              <Button onClick={handleRestart}>
                Réessayer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}