import { useQuery } from '@tanstack/react-query';
import { chaptersApi } from '@/lib/api';
import type { Chapter, ChapterStats } from '@/types';

export function useChapters(params?: { niveau?: string; matiere?: string }) {
  return useQuery({
    queryKey: ['chapters', params],
    queryFn: async () => {
      const { data } = await chaptersApi.getAll(params);
      return data;
    },
  });
}

export function useChapter(id: string) {
  return useQuery({
    queryKey: ['chapter', id],
    queryFn: async () => {
      const { data } = await chaptersApi.getById(id);
      return data as Chapter;
    },
    enabled: !!id,
  });
}

export function useChapterStats(id: string) {
  return useQuery({
    queryKey: ['chapter-stats', id],
    queryFn: async () => {
      const { data } = await chaptersApi.getStats(id);
      return data as ChapterStats;
    },
    enabled: !!id,
  });
}