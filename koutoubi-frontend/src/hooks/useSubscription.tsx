'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscriptionsApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface UsageStats {
  feature: string;
  used: number;
  limit: number | null;
  remaining: number | null;
  period: string;
  reset_date: string | null;
}

interface SubscriptionStatus {
  has_subscription: boolean;
  plan_type: string;
  plan_name: string;
  is_active: boolean;
  end_date: string | null;
  usage_stats: Record<string, UsageStats>;
  can_upgrade: boolean;
}

export function useSubscription() {
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [hasAuth, setHasAuth] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = () => {
      const token = Cookies.get('auth-token');
      setHasAuth(!!token);
    };
    
    checkAuth();
    // Check auth status when window focuses
    window.addEventListener('focus', checkAuth);
    return () => window.removeEventListener('focus', checkAuth);
  }, []);

  // Fetch subscription status
  const fetchStatus = useCallback(async () => {
    // Don't fetch if not authenticated
    if (!hasAuth) {
      setLoading(false);
      return;
    }

    // Don't retry more than 3 times
    if (retryCount >= 3) {
      setLoading(false);
      setError('Max retry attempts reached');
      return;
    }

    try {
      setLoading(true);
      const response = await subscriptionsApi.getStatus();
      setStatus(response.data);
      setError(null);
      setRetryCount(0); // Reset retry count on success
    } catch (err: any) {
      console.error('Error fetching subscription status:', err);
      
      // Don't retry on 401 errors
      if (err.response?.status === 401) {
        setError('Authentication required');
        setLoading(false);
        setRetryCount(3); // Set to max to prevent retries
        return;
      }
      
      setError(err.message);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, [hasAuth, retryCount]);

  useEffect(() => {
    if (hasAuth && retryCount < 3) {
      fetchStatus();
    }
  }, [fetchStatus, hasAuth]);

  // Check if user can use a feature
  const checkFeatureLimit = useCallback(async (feature: string): Promise<boolean> => {
    try {
      const response = await subscriptionsApi.checkLimit(feature);
      return response.data.can_use;
    } catch (err) {
      console.error(`Error checking limit for ${feature}:`, err);
      return false;
    }
  }, []);

  // Track feature usage
  const trackUsage = useCallback(async (
    feature: string,
    options?: {
      action?: string;
      resource_id?: string;
      resource_type?: string;
      metadata?: any;
    }
  ): Promise<boolean> => {
    try {
      await subscriptionsApi.trackUsage({
        feature_name: feature,
        action: options?.action || 'use',
        resource_id: options?.resource_id,
        resource_type: options?.resource_type,
        metadata: options?.metadata
      });
      
      // Refresh status after tracking
      await fetchStatus();
      return true;
    } catch (err: any) {
      if (err.response?.status === 403) {
        const detail = err.response.data.detail;
        
        // Show upgrade modal or toast
        toast.error(
          <div>
            <p className="font-semibold">{detail.message}</p>
            <p className="text-sm mt-1">
              Utilisé: {detail.used}/{detail.limit}
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Passer à Premium
            </button>
          </div>,
          { duration: 5000 }
        );
        
        return false;
      }
      
      console.error(`Error tracking usage for ${feature}:`, err);
      toast.error('Erreur lors du suivi d\'utilisation');
      return false;
    }
  }, [fetchStatus, router]);

  // Check and track combined (for convenience)
  const useFeature = useCallback(async (
    feature: string,
    options?: {
      action?: string;
      resource_id?: string;
      resource_type?: string;
      metadata?: any;
    }
  ): Promise<boolean> => {
    // First check if user can use the feature
    const canUse = await checkFeatureLimit(feature);
    
    if (!canUse) {
      // Get current usage stats for better error message
      const stats = status?.usage_stats[feature];
      if (stats) {
        toast.error(
          <div>
            <p className="font-semibold">Limite atteinte pour {feature}</p>
            <p className="text-sm mt-1">
              Utilisé: {stats.used}/{stats.limit} ({stats.period})
            </p>
            <button
              onClick={() => router.push('/pricing')}
              className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Débloquer avec Premium
            </button>
          </div>,
          { duration: 5000 }
        );
      }
      return false;
    }
    
    // Track usage
    return await trackUsage(feature, options);
  }, [checkFeatureLimit, trackUsage, status, router]);

  // Helper functions
  const isPremium = status?.plan_type !== 'free';
  const canDownloadPDF = isPremium;
  const canUseOfflineMode = isPremium;
  
  const getFeatureUsage = (feature: string) => {
    return status?.usage_stats[feature] || null;
  };

  return {
    status,
    loading,
    error,
    isPremium,
    canDownloadPDF,
    canUseOfflineMode,
    checkFeatureLimit,
    trackUsage,
    useFeature,
    getFeatureUsage,
    refreshStatus: fetchStatus,
    // Add aliases for backward compatibility
    subStatus: status,
    checkLimit: checkFeatureLimit
  };
}