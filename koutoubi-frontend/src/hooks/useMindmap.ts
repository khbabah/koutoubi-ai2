import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { mindmapApi, subscriptionsApi } from '@/lib/api';
import { useSubscription } from '@/hooks/useSubscription';
import { useRouter } from 'next/navigation';

interface MindmapNode {
  id: string;
  text: string;
  children?: MindmapNode[];
  note?: string;
  color?: string;
  page?: number;
  expanded?: boolean;
  level?: number;
}

interface MindmapData {
  root: MindmapNode;
  markdown: string;
  theme: {
    colorScheme: string[];
    fontFamily: string;
    fontSize: number;
    nodeSpacing: {
      vertical: number;
      horizontal: number;
    };
  };
}

interface MindmapResponse {
  id: string;
  pdf_id: string;
  content: string;
  markdown?: string;
  version: number;
  is_ai_generated: boolean;
  created_at: string;
  updated_at?: string;
}

// Request cache to prevent duplicate requests
const mindmapCache = new Map<string, Promise<MindmapResponse>>();
const cacheExpiry = 5 * 60 * 1000; // 5 minutes

export function useMindmap(pdfId: string) {
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isPremium, getFeatureUsage } = useSubscription();
  const router = useRouter();

  const fetchMindmap = async () => {
    if (!pdfId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Check cache first
      const cacheKey = `mindmap-${pdfId}`;
      const cached = mindmapCache.get(cacheKey);
      
      let data: MindmapResponse;
      
      if (cached) {
        // Use cached promise
        data = await cached;
      } else {
        // Create new request promise
        const requestPromise = (async () => {
          try {
            const response = await mindmapApi.getByPdfId(pdfId);
            return response.data;
          } catch (error: any) {
            if (error.response?.status === 404) {
              // Check if user can generate a new mindmap
              const usage = getFeatureUsage('mindmap_generation');
              if (usage && usage.remaining === 0 && !isPremium) {
                toast.error('Limite de génération de cartes mentales atteinte. Passez à Premium pour continuer.');
                router.push('/pricing');
                throw new Error('Limite atteinte');
              }
              
              // Track usage before generating
              await subscriptionsApi.trackUsage({
                feature_name: 'mindmap_generation',
                action: 'generate',
                resource_id: pdfId,
                resource_type: 'pdf'
              });
              
              // Generate new mindmap
              const generateResponse = await mindmapApi.generate(pdfId);
              return generateResponse.data;
            }
            throw error;
          }
        })();
        
        // Cache the promise
        mindmapCache.set(cacheKey, requestPromise);
        
        // Clear cache after expiry
        setTimeout(() => {
          mindmapCache.delete(cacheKey);
        }, cacheExpiry);
        
        data = await requestPromise;
      }
      
      // Parse content JSON
      const content = JSON.parse(data.content) as MindmapData;
      setMindmapData(content);
      
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'An error occurred';
      setError(message);
      if (message !== 'Limite atteinte') {
        toast.error(`Erreur: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateNode = async (nodeId: string, updates: { note?: string; color?: string; expanded?: boolean }) => {
    if (!pdfId) return;
    
    try {
      const response = await mindmapApi.updateNode(pdfId, nodeId, updates);
      const data: MindmapResponse = response.data;
      const content = JSON.parse(data.content) as MindmapData;
      setMindmapData(content);
      
      toast.success('Nœud mis à jour');
    } catch (err: any) {
      toast.error('Erreur lors de la mise à jour du nœud');
    }
  };

  const regenerateMindmap = async () => {
    if (!pdfId) return;
    
    // Check if user can regenerate
    const usage = getFeatureUsage('mindmap_generation');
    if (usage && usage.remaining === 0 && !isPremium) {
      toast.error('Limite de génération de cartes mentales atteinte. Passez à Premium pour continuer.');
      router.push('/pricing');
      return;
    }
    
    setLoading(true);
    
    // Clear cache for this PDF
    const cacheKey = `mindmap-${pdfId}`;
    mindmapCache.delete(cacheKey);
    
    try {
      // Track usage before regenerating
      await subscriptionsApi.trackUsage({
        feature_name: 'mindmap_generation',
        action: 'regenerate',
        resource_id: pdfId,
        resource_type: 'pdf'
      });
      
      const response = await mindmapApi.generate(pdfId);
      const data: MindmapResponse = response.data;
      const content = JSON.parse(data.content) as MindmapData;
      setMindmapData(content);
      
      toast.success('Carte mentale régénérée');
    } catch (err: any) {
      toast.error('Erreur lors de la régénération de la carte mentale');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMindmap();
  }, [pdfId]);

  return {
    mindmapData,
    loading,
    error,
    updateNode,
    regenerateMindmap,
    refetch: fetchMindmap,
  };
}