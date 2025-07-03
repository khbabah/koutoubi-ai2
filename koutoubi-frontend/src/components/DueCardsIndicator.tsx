'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Badge } from '@/components/ui/badge';
import { GraduationCap } from 'lucide-react';

export default function DueCardsIndicator() {
  const { data: session } = useSession();
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.access_token) {
      fetchDueCount();
      // Refresh every 5 minutes
      const interval = setInterval(fetchDueCount, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session?.access_token]);

  const fetchDueCount = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch('http://localhost:8000/api/v1/flashcards/due/count', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDueCount(data.total_due);
      }
    } catch (err) {
      console.error('Failed to fetch due count:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || dueCount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="ml-2 animate-pulse">
      {dueCount}
    </Badge>
  );
}