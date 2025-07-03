'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import OptimizedPDFViewer from '@/components/OptimizedPDFViewer';

export default function ChapterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  // Get chapter from URL params, default to ch1
  const chapterId = searchParams.get('id') || 'ch1';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <OptimizedPDFViewer />;
}