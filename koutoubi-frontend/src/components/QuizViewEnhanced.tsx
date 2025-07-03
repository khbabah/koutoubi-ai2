'use client';

import { useState, useEffect } from 'react';
import { useQuiz } from '@/hooks/useQuiz';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { StudyModeSelector } from './StudyModeSelector';
import { contentApi } from '@/lib/api-client';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RotateCcw, 
  Trophy,
  BookOpen,
  Layers
} from 'lucide-react';
import toast from 'react-hot-toast';
import useSWR from 'swr';

interface QuizViewEnhancedProps {
  chapterId?: string;
  chapterTitle?: string;
  courseId?: string;
  mode: 'chapter' | 'course' | 'smart';
  onModeChange: (mode: 'chapter' | 'course' | 'smart') => void;
  totalChapters?: number;
}

export default function QuizViewEnhanced({ 
  chapterId, 
  chapterTitle,
  courseId,
  mode,
  onModeChange,
  totalChapters
}: QuizViewEnhancedProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showFinalScore, setShowFinalScore] = useState(false);

  // Use different data sources based on mode
  const chapterQuiz = useQuiz(mode === 'chapter' ? chapterId : undefined);
  
  // Fetch course quiz when in course mode
  const { data: courseQuizData, error: courseError, isLoading: courseLoading } = useSWR(
    mode === 'course' && courseId ? 
      [`course-quiz-${courseId}`, courseId] : null,
    ([_, id]) => contentApi.getCourseQuiz(id, { 
      limit: 20,
      random: true 
    })
  );

  // Determine which data to use
  const loading = mode === 'chapter' ? chapterQuiz.loading : courseLoading;
  const questions = mode === 'chapter' 
    ? chapterQuiz.questions 
    : (courseQuizData || []);
  const currentQuestionIndex = mode === 'chapter' 
    ? chapterQuiz.currentQuestionIndex 
    : Array.from(answeredQuestions).length;

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? (currentQuestionIndex / questions.length) * 100 : 0;

  const handleAnswerSelect = (index: number) => {
    if (!showResult) {
      setSelectedAnswer(index);
    }
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion) return;

    setShowResult(true);
    setAnsweredQuestions(new Set([...answeredQuestions, currentQuestionIndex]));

    const isCorrect = selectedAnswer === currentQuestion.correct_answer;
    if (isCorrect) {
      setScore(score + 1);
      toast.success('Correct!', { icon: '✅' });
    } else {
      toast.error('Incorrect', { icon: '❌' });
    }

    // Submit to API for tracking (chapter mode only)
    if (mode === 'chapter') {
      await chapterQuiz.submitAnswer({
        question_id: currentQuestion.id,
        answer: selectedAnswer,
        time_spent: 10 // TODO: Track actual time
      });
    }
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      setShowFinalScore(true);
    } else {
      if (mode === 'chapter') {
        chapterQuiz.nextQuestion();
      }
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handleRestartQuiz = () => {
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowFinalScore(false);
    setAnsweredQuestions(new Set());
    if (mode === 'chapter') {
      chapterQuiz.resetQuiz();
    }
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
        <h2 className="text-2xl font-semibold mb-4">No quiz available</h2>
        <p className="text-gray-600 text-center">
          {mode === 'chapter' 
            ? "No quiz questions available for this chapter."
            : "No quiz questions available for this course."}
        </p>
      </div>
    );
  }

  if (showFinalScore) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Trophy className={`h-20 w-20 mb-4 ${percentage >= 70 ? 'text-yellow-500' : 'text-gray-400'}`} />
        <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
        <p className="text-xl mb-6">
          Your score: {score} / {questions.length} ({percentage}%)
        </p>
        {percentage >= 70 && (
          <Badge className="mb-4 bg-green-600">Great job! 🎉</Badge>
        )}
        <Button onClick={handleRestartQuiz} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">Quiz</h2>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} / {questions.length}
            </Badge>
            
            {/* Study Mode Selector */}
            <StudyModeSelector
              mode={mode}
              onModeChange={onModeChange}
              currentChapter={chapterTitle}
              totalChapters={totalChapters}
              feature="quiz"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Score: {score}/{questions.length}</span>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="flex-1 flex flex-col">
          <Card className="p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-medium pr-4">{currentQuestion.question}</h3>
              {mode === 'course' && currentQuestion.chapter_id && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Chapter {currentQuestion.chapter_id.split('ch')[1]}
                </Badge>
              )}
            </div>
            
            {currentQuestion.context && (
              <p className="text-sm text-gray-600 mb-4 italic">
                Context: {currentQuestion.context}
              </p>
            )}
          </Card>

          {/* Answer Options */}
          <div className="grid gap-3 mb-6">
            {currentQuestion.choices.map((choice: string, index: number) => (
              <Card
                key={index}
                className={`p-4 cursor-pointer transition-all ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-gray-300'
                } ${
                  showResult && index === currentQuestion.correct_answer
                    ? 'border-green-500 bg-green-50'
                    : ''
                } ${
                  showResult && selectedAnswer === index && index !== currentQuestion.correct_answer
                    ? 'border-red-500 bg-red-50'
                    : ''
                }`}
                onClick={() => handleAnswerSelect(index)}
              >
                <div className="flex items-center justify-between">
                  <span>{choice}</span>
                  {showResult && index === currentQuestion.correct_answer && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {showResult && selectedAnswer === index && index !== currentQuestion.correct_answer && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Explanation */}
          {showResult && currentQuestion.explanation && (
            <Card className="p-4 bg-blue-50 border-blue-200 mb-6">
              <p className="text-sm">
                <strong>Explanation:</strong> {currentQuestion.explanation}
              </p>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {!showResult ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {isLastQuestion ? 'View Results' : 'Next Question'}
              </Button>
            )}
          </div>

          {/* Info for course mode */}
          {mode === 'course' && (
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>Course mode shows questions from all chapters.</p>
              <p>Progress is not saved in this mode.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}