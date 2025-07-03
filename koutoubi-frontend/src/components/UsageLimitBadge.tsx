'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UsageLimitBadgeProps {
  feature: string;
  label?: string;
  className?: string;
}

export default function UsageLimitBadge({ feature, label, className = '' }: UsageLimitBadgeProps) {
  const { getFeatureUsage, isPremium } = useSubscription();
  const router = useRouter();
  const usage = getFeatureUsage(feature);
  
  if (!usage || usage.limit === null || isPremium) {
    return null;
  }
  
  const percentage = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = usage.remaining === 0;
  
  const periodLabels: Record<string, string> = {
    daily: 'par jour',
    weekly: 'par semaine',
    monthly: 'par mois',
    total: 'au total'
  };
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={() => router.push('/pricing')}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          transition-all hover:scale-105
          ${isAtLimit 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : isNearLimit
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
      >
        {isAtLimit ? (
          <Crown className="h-3 w-3" />
        ) : (
          <Zap className="h-3 w-3" />
        )}
        <span>
          {usage.used}/{usage.limit} {label || feature} {periodLabels[usage.period] || ''}
        </span>
      </button>
      
      {isAtLimit && (
        <span className="text-xs text-red-600 font-medium">
          Limite atteinte
        </span>
      )}
    </div>
  );
}