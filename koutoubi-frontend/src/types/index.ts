// User types
export interface User {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  role: string;
  created_at: string;
  last_login?: string;
}

// Chapter types
export interface Chapter {
  id: string;
  numero: number;
  title: string;
  pdf_path?: string;
  page_start?: number;
  page_end?: number;
  niveau?: string;
  matiere?: string;
  created_at: string;
}

export interface ChapterStats {
  chapter_id: string;
  total_flashcards: number;
  total_quiz_questions: number;
  flashcards_studied: number;
  quiz_taken: number;
  completion_percentage: number;
}

// Flashcard types
export interface Flashcard {
  id: string;
  chapter_id: string;
  type: string;
  question: string;
  answer: string;
  example?: string;
  source: 'pdf' | 'khan' | 'ai';
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
}

export interface FlashcardProgress {
  flashcard_id: string;
  last_seen?: string;
  next_review?: string;
  times_seen: number;
  times_forgot: number;
  times_remembered: number;
  is_disabled: boolean;
}

export type FlashcardFeedback = 'forgot' | 'remembered' | 'disabled';

// Quiz types
export interface QuizQuestion {
  id: string;
  chapter_id: string;
  type: string;
  question: string;
  choices: string[];
  correct_answer: number;
  explanation?: string;
  key_info?: string[];
  source: string;
  created_at: string;
}

export interface QuizAnswer {
  question_id: string;
  answer: number;
  time_spent?: number;
}

export interface QuizResult {
  chapter_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  time_spent?: number;
  answers: {
    question_id: string;
    user_answer: number;
    correct_answer: number;
    is_correct: boolean;
    explanation?: string;
  }[];
}

// Summary types
export interface SummaryPoint {
  id: string;
  text: string;
  pages: number[];
  primary_page: number;
  keywords?: string[];
}

export interface ChapterSummary {
  chapter_id: string;
  summary_points: SummaryPoint[];
  total_points: number;
  generated_at: string;
  expires_at?: string;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username?: string;
  password: string;
  full_name?: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}