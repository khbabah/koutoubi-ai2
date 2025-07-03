import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { quizGenerationApi, subscriptionsApi } from '@/lib/api';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';

interface QuizQuestion {
  id: string;
  question: string;
  choices: string[];
  correct_answer: number;
  explanation?: string;
  type?: string;
}

interface QuizAnswer {
  question_id: string;
  answer: number;
  time_spent?: number;
}

interface QuizResult {
  chapter_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  answers: Array<{
    question_id: string;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation?: string;
  }>;
}

export function useQuiz(chapterId?: string) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isPremium, getFeatureUsage } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (chapterId) {
      fetchQuizQuestions(chapterId);
    }
  }, [chapterId]);

  const fetchQuizQuestions = async (chapterId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await quizGenerationApi.getByChapter(chapterId);
      const data = response.data;
      
      if (data && data.length > 0) {
        setQuestions(data);
      } else {
        // No existing quiz, generate one if within limits
        const usage = getFeatureUsage('quiz_generation');
        if (usage && usage.remaining === 0 && !isPremium) {
          toast.error('Limite de génération de quiz atteinte. Passez à Premium pour continuer.');
          router.push('/pricing');
          setError('Limite atteinte');
          return;
        }
        
        // Track usage before generating
        await subscriptionsApi.trackUsage({
          feature_name: 'quiz_generation',
          action: 'generate',
          resource_id: chapterId,
          resource_type: 'chapter'
        });
        
        // Generate new quiz
        toast.info('Génération du quiz en cours...');
        const generateResponse = await quizGenerationApi.generate({
          chapter_id: chapterId,
          content: '', // Will be filled by backend based on chapter
          num_questions: 10,
          difficulty: 'medium'
        });
        
        setQuestions(generateResponse.data);
        toast.success('Quiz généré avec succès!');
      }
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to load quiz';
      setError(message);
      
      // Use demo data as fallback
      toast.error('Utilisation des données de démonstration');
      setQuestions([
        {
          id: '1',
          question: "Quel mot-clé est utilisé pour définir une fonction en Python?",
          choices: ["function", "def", "func", "define"],
          correct_answer: 1,
          explanation: "En Python, on utilise le mot-clé 'def' pour définir une fonction."
        },
        {
          id: '2',
          question: "Quelle est la sortie de: print(type([]))?",
          choices: ["<class 'list'>", "<class 'array'>", "<class 'tuple'>", "<class 'dict'>"],
          correct_answer: 0,
          explanation: "[] représente une liste vide en Python, donc type([]) retourne <class 'list'>."
        },
        {
          id: '3',
          question: "Comment créer un dictionnaire vide en Python?",
          choices: ["dict = []", "dict = {}", "dict = ()", "dict = <>"],
          correct_answer: 1,
          explanation: "Les accolades {} sont utilisées pour créer un dictionnaire vide en Python."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async (answers: QuizAnswer[]): Promise<QuizResult | null> => {
    try {
      const response = await quizGenerationApi.submit(answers);
      const data = response.data;
      toast.success(`Score: ${data.score}/${data.total_questions} (${data.percentage}%)`);
      return data;
    } catch (err: any) {
      toast.error('Erreur lors de la soumission du quiz');
      
      // Return mock result for demo
      const mockResult: QuizResult = {
        chapter_id: chapterId || 'demo',
        score: answers.filter((a, i) => a.answer === questions[i]?.correct_answer).length,
        total_questions: answers.length,
        percentage: Math.round((answers.filter((a, i) => a.answer === questions[i]?.correct_answer).length / answers.length) * 100),
        answers: answers.map((answer, i) => ({
          question_id: answer.question_id,
          user_answer: answer.answer,
          correct_answer: questions[i]?.correct_answer || 0,
          is_correct: answer.answer === questions[i]?.correct_answer,
          explanation: questions[i]?.explanation
        }))
      };
      
      return mockResult;
    }
  };

  return {
    questions,
    loading,
    error,
    submitQuiz,
    refetch: () => chapterId && fetchQuizQuestions(chapterId),
  };
}