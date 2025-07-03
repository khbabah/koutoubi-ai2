'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/hooks/use-auth';
import SimplePDFViewer from '@/components/SimplePDFViewer';

export default function LearnChapterPage({
  params
}: {
  params: { chapterId: string }
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return null;
  }

  return <SimplePDFViewer chapterId={params.chapterId} />;
}