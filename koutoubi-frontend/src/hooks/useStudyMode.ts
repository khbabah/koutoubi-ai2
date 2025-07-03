'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

export type StudyLevel = 'chapter' | 'course' | 'smart';

interface UseStudyModeOptions {
  defaultMode?: StudyLevel;
  feature: 'flashcards' | 'quiz' | 'mindmap';
}

export function useStudyMode({ 
  defaultMode = 'chapter',
  feature 
}: UseStudyModeOptions) {
  const searchParams = useSearchParams();
  
  // Initialize from URL params or default
  const [mode, setMode] = useState<StudyLevel>(() => {
    const urlMode = searchParams.get('mode') as StudyLevel;
    return urlMode && ['chapter', 'course', 'smart'].includes(urlMode) 
      ? urlMode 
      : defaultMode;
  });

  // Store mode preference in localStorage
  useEffect(() => {
    const key = `studyMode_${feature}`;
    localStorage.setItem(key, mode);
  }, [mode, feature]);

  // Load preference on mount
  useEffect(() => {
    const key = `studyMode_${feature}`;
    const saved = localStorage.getItem(key) as StudyLevel;
    if (saved && ['chapter', 'course', 'smart'].includes(saved)) {
      setMode(saved);
    }
  }, [feature]);

  const updateMode = useCallback((newMode: StudyLevel) => {
    setMode(newMode);
    
    // Update URL params
    const url = new URL(window.location.href);
    url.searchParams.set('mode', newMode);
    window.history.pushState({}, '', url);
  }, []);

  const getCourseId = useCallback((niveau: string, annee: string, matiere: string) => {
    return `${niveau}-${annee}-${matiere}`;
  }, []);

  return {
    mode,
    setMode: updateMode,
    getCourseId,
    isChapterMode: mode === 'chapter',
    isCourseMode: mode === 'course',
    isSmartMode: mode === 'smart'
  };
}