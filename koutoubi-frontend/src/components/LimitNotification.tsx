'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';

interface Notification {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function LimitNotification() {
  const router = useRouter();
  const { subStatus, checkLimit } = useSubscription();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!subStatus) return;

    const checkLimits = () => {
      const newNotifications: Notification[] = [];

      // Vérifier les limites de résumés IA
      if (subStatus.usage_summary) {
        const summaryUsage = subStatus.usage_summary.ai_summary || { used: 0, limit: 0 };
        const percentUsed = summaryUsage.limit > 0 ? (summaryUsage.used / summaryUsage.limit) * 100 : 0;

        if (percentUsed >= 100) {
          newNotifications.push({
            id: 'summary-limit',
            type: 'error',
            title: 'Limite de résumés atteinte',
            message: `Vous avez utilisé tous vos résumés IA (${summaryUsage.used}/${summaryUsage.limit})`,
            action: {
              label: 'Passer au Premium',
              onClick: () => router.push('/pricing')
            }
          });
        } else if (percentUsed >= 80) {
          newNotifications.push({
            id: 'summary-warning',
            type: 'warning',
            title: 'Limite de résumés bientôt atteinte',
            message: `Il vous reste ${summaryUsage.limit - summaryUsage.used} résumés IA`,
            action: {
              label: 'Voir les plans',
              onClick: () => router.push('/pricing')
            }
          });
        }
      }

      // Vérifier les limites de mindmaps
      if (subStatus.usage_summary) {
        const mindmapUsage = subStatus.usage_summary.mindmap_generation || { used: 0, limit: 0 };
        const percentUsed = mindmapUsage.limit > 0 ? (mindmapUsage.used / mindmapUsage.limit) * 100 : 0;

        if (percentUsed >= 100) {
          newNotifications.push({
            id: 'mindmap-limit',
            type: 'error',
            title: 'Limite de mindmaps atteinte',
            message: `Vous avez créé le maximum de mindmaps (${mindmapUsage.used}/${mindmapUsage.limit})`,
            action: {
              label: 'Débloquer plus',
              onClick: () => router.push('/pricing')
            }
          });
        }
      }

      setNotifications(newNotifications);
    };

    checkLimits();
    // Vérifier toutes les 5 minutes
    const interval = setInterval(checkLimits, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [subStatus, router]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AnimatePresence>
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`
                bg-white rounded-lg shadow-lg border p-4
                ${notification.type === 'error' ? 'border-red-200' : ''}
                ${notification.type === 'warning' ? 'border-yellow-200' : ''}
                ${notification.type === 'info' ? 'border-blue-200' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`
                  p-2 rounded-full flex-shrink-0
                  ${notification.type === 'error' ? 'bg-red-100' : ''}
                  ${notification.type === 'warning' ? 'bg-yellow-100' : ''}
                  ${notification.type === 'info' ? 'bg-blue-100' : ''}
                `}>
                  {notification.type === 'error' || notification.type === 'warning' ? (
                    <AlertTriangle className={`h-5 w-5 ${
                      notification.type === 'error' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                  ) : (
                    <Zap className="h-5 w-5 text-blue-600" />
                  )}
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">
                    {notification.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {notification.message}
                  </p>
                  {notification.action && (
                    <Button
                      size="sm"
                      variant={notification.type === 'error' ? 'default' : 'outline'}
                      onClick={notification.action.onClick}
                    >
                      {notification.action.label}
                    </Button>
                  )}
                </div>

                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}