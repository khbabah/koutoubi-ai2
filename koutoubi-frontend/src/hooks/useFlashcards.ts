import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { flashcardsGenerationApi, subscriptionsApi } from '@/lib/api';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category?: string;
  subcategory?: string;
  chapter_id?: string;
  question?: string;
  answer?: string;
  type?: string;
}

interface FlashcardFeedback {
  feedback: 'forgot' | 'remembered' | 'disabled';
}

export function useFlashcards(chapterId?: string, mode: 'all' | 'due' = 'all') {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const { isPremium, getFeatureUsage } = useSubscription();
  const router = useRouter();

  useEffect(() => {
    if (chapterId) {
      fetchFlashcards(chapterId, mode);
    }
  }, [chapterId, mode]);

  const fetchFlashcards = async (chapterId: string, mode: 'all' | 'due' = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = mode === 'due' 
        ? await flashcardsGenerationApi.getDueCards(chapterId)
        : await flashcardsGenerationApi.getByChapter(chapterId);
        
      const data = response.data;
      
      if (data && data.length > 0) {
        setFlashcards(data);
      } else if (mode === 'all') {
        // No existing flashcards in 'all' mode, generate some if within limits
        const usage = getFeatureUsage('flashcards');
        if (usage && usage.remaining === 0 && !isPremium) {
          toast.error('Limite de création de cartes de révision atteinte. Passez à Premium pour continuer.');
          router.push('/pricing');
          setError('Limite atteinte');
          return;
        }
        
        // Track usage before generating
        await subscriptionsApi.trackUsage({
          feature_name: 'flashcards',
          action: 'generate',
          resource_id: chapterId,
          resource_type: 'chapter'
        });
        
        // Generate new flashcards
        toast.info('Génération des cartes de révision en cours...');
        const generateResponse = await flashcardsGenerationApi.generate({
          chapter_id: chapterId,
          content: '', // Will be filled by backend based on chapter
          num_cards: 20,
          difficulty: 'medium'
        });
        
        setFlashcards(generateResponse.data);
        toast.success('Flashcards generated successfully!');
      } else {
        // No due cards in 'due' mode
        setFlashcards([]);
      }
      
      // Fetch due count
      const countResponse = await flashcardsGenerationApi.getDueCount();
      setDueCount(countResponse.data.total_due || 0);
      
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Failed to load flashcards';
      setError(message);
      
      // Use demo data as fallback
      toast.error('Utilisation des données de démonstration');
      setFlashcards([
        {
          id: '1',
          category: 'Mathématiques',
          subcategory: 'Algèbre',
          front: 'Qu\'est-ce qu\'une équation du second degré?',
          back: 'Une équation de la forme ax² + bx + c = 0, où a ≠ 0',
          chapter_id: chapterId
        },
        {
          id: '2',
          category: 'Mathématiques',
          subcategory: 'Algèbre',
          front: 'Comment calcule-t-on le discriminant?',
          back: 'Δ = b² - 4ac',
          chapter_id: chapterId
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitFeedback = async (flashcardId: string, feedback: FlashcardFeedback) => {
    try {
      const response = await flashcardsGenerationApi.submitFeedback(flashcardId, feedback);
      return response.data;
    } catch (err: any) {
      toast.error('Erreur lors de l\'envoi du feedback');
      return null;
    }
  };

  const fetchDueCount = async () => {
    try {
      const response = await flashcardsGenerationApi.getDueCount();
      const data = response.data;
      setDueCount(data.total_due || 0);
      return data;
    } catch (err) {
      console.error('Failed to fetch due count:', err);
    }
    return null;
  };

  return {
    flashcards,
    loading,
    error,
    dueCount,
    submitFeedback,
    fetchDueCount,
    refetch: () => chapterId && fetchFlashcards(chapterId, mode),
  };
}