import { api } from '@/lib/api';
import type { Chapter } from '@/lib/pdfStructure';

export interface ChapterInfo {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
  pageCount: number;
  preview?: Record<string, string>;
}

export interface ChapterSummary {
  title: string;
  overview: string;
  keyPoints: string[];
  objectives: string[];
}

export interface ChapterPage {
  chapter: {
    id: string;
    title: string;
  };
  pageNumber: number;
  relativePageNumber: number;
  totalChapterPages: number;
  content: string;
  structuredContent?: any;
}

export interface ChapterSearchResult {
  chapter: {
    id: string;
    title: string;
  };
  query: string;
  results: Array<{
    page_number: number;
    content: string;
    score: number;
  }>;
  totalResults: number;
}

export const chaptersApi = {
  // Get all chapters
  getChapters: () => 
    api.get<{ chapters: ChapterInfo[] }>('/pdf-chapter/chapters'),

  // Get chapter info
  getChapterInfo: (chapterId: string) =>
    api.get<ChapterInfo>(`/pdf-chapter/chapter/${chapterId}`),

  // Get chapter PDF URL
  getChapterPdfUrl: (chapterId: string) =>
    `/api/v1/pdf-chapter/chapter/${chapterId}/pdf`,

  // Get specific page from chapter
  getChapterPage: (chapterId: string, pageNum: number) =>
    api.get<ChapterPage>(`/pdf-chapter/chapter/${chapterId}/page/${pageNum}`),

  // Search within chapter
  searchInChapter: (chapterId: string, query: string, maxResults: number = 10) =>
    api.post<ChapterSearchResult>(`/pdf-chapter/chapter/${chapterId}/search`, {
      query,
      max_results: maxResults
    }),

  // Get chapter summary
  getChapterSummary: (chapterId: string) =>
    api.get<ChapterSummary>(`/pdf-chapter/chapter/${chapterId}/summary`),
};