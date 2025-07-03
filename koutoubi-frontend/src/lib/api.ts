import axios, { AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api/${API_VERSION}`,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Set default Content-Type for JSON requests (but not for form data)
    if (!config.headers['Content-Type'] && !(config.data instanceof URLSearchParams)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Don't redirect on 401 for auth endpoints
    const isAuthEndpoint = error.config?.url?.includes('/auth/');
    
    // Mark the request to prevent retries on 401
    if (error.response?.status === 401) {
      // Set a flag to prevent retries
      if (error.config) {
        (error.config as any)._retry = true;
        (error.config as any)._retryCount = 999; // Set high to prevent any retry logic
      }
      
      if (!isAuthEndpoint) {
        // Token expired or invalid
        Cookies.remove('auth-token');
        window.location.href = '/login';
        toast.error('Session expirée. Veuillez vous reconnecter.');
      }
    } else if (error.response?.status === 500) {
      toast.error('Erreur serveur. Veuillez réessayer plus tard.');
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/token', new URLSearchParams(credentials), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }),
  
  register: (data: any) =>
    api.post('/auth/register', data),
  
  getProfile: () => {
    // Force read the token from cookies before making the request
    const token = Cookies.get('auth-token');
    return api.get('/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
  },
  
  updateProfile: (data: any) =>
    api.put('/auth/me', data),
  
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/auth/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteAvatar: () =>
    api.delete('/auth/me/avatar'),
};

export const chaptersApi = {
  getAll: (params?: { niveau?: string; matiere?: string }) =>
    api.get('/chapters/', { params }),
  
  getById: (id: string) =>
    api.get(`/chapters/${id}`),
  
  getStats: (id: string) =>
    api.get(`/chapters/${id}/stats`),
};

export const flashcardsApi = {
  getByChapter: (chapterId: string) =>
    api.get(`/flashcards/chapter/${chapterId}`),
  
  getById: (id: string) =>
    api.get(`/flashcards/${id}`),
  
  getProgress: (id: string) =>
    api.get(`/flashcards/${id}/progress`),
  
  submitFeedback: (id: string, feedback: string) =>
    api.post(`/flashcards/${id}/feedback`, { flashcard_id: id, feedback }),
  
  getDueCards: (chapterId: string) =>
    api.get(`/flashcards/chapter/${chapterId}/due`),
};

export const quizApi = {
  getByChapter: (chapterId: string) =>
    api.get(`/quiz/chapter/${chapterId}`),
  
  getById: (id: string) =>
    api.get(`/quiz/${id}`),
  
  submitAnswers: (answers: any[]) =>
    api.post('/quiz/submit', answers),
  
  getHistory: (chapterId: string) =>
    api.get(`/quiz/chapter/${chapterId}/history`),
};

export const summaryApi = {
  getByChapter: (chapterId: string) =>
    api.get(`/summary/chapter/${chapterId}`),
  
  regenerate: (chapterId: string) =>
    api.post(`/summary/chapter/${chapterId}/regenerate`),
};

export const explainApi = {
  explain: (data: {
    action: string;
    content: string;
    context?: string;
    question?: string;
    options?: any;
  }) => api.post('/explain/', data),
  
  generateQuiz: (data: {
    content: string;
    num_questions?: number;
    difficulty?: string;
  }) => api.post('/explain/quiz', data),
  
  generateExercise: (data: {
    content: string;
    exercise_type?: string;
    difficulty?: string;
  }) => api.post('/explain/exercise', data),
  
  checkAnswer: (data: {
    content: string;
    user_answer: string;
    expected_answer?: string;
  }) => api.post('/explain/check-answer', data),
  
  checkHealth: () => api.get('/explain/health'),
};

export const pdfApi = {
  getInfo: () => api.get('/pdf/test-pdf/info'),
  
  getPage: (pageNumber: number) => 
    api.get(`/pdf/test-pdf/page/${pageNumber}`),
  
  search: (query: string, maxResults: number = 5) =>
    api.post('/pdf/test-pdf/search', { query, max_results: maxResults }),
  
  ask: (data: {
    question: string;
    page_number?: number;
    context_pages?: number;
  }) => api.post('/pdf/test-pdf/ask', data),
  
  explainPage: (pageNumber: number, focusTopic?: string) =>
    api.post(`/pdf/test-pdf/explain-page/${pageNumber}`, focusTopic),
  
  generateQuiz: (pageNumber: number, numQuestions: number = 5, difficulty: string = 'medium') =>
    api.post(`/pdf/test-pdf/generate-quiz/${pageNumber}?num_questions=${numQuestions}&difficulty=${difficulty}`),
};

export const pdfSummaryApi = {
  generatePageSummary: (pageNumber: number, forceRefresh: boolean = false) =>
    api.post('/pdf-summary/page', { page_number: pageNumber, force_refresh: forceRefresh }),
  
  generateDocumentSummary: (data: {
    page_numbers?: number[];
    max_pages?: number;
    force_refresh?: boolean;
  }) => api.post('/pdf-summary/document', data),
  
  getSummaryStatus: (pageNumbers?: number[]) =>
    api.get('/pdf-summary/document/status', { 
      params: pageNumbers ? { page_numbers: pageNumbers } : undefined 
    }),
  
  clearCache: (pageNumbers?: number[]) =>
    api.delete('/pdf-summary/cache', {
      params: pageNumbers ? { page_numbers: pageNumbers } : undefined
    }),
};

// Content API for course management
export const contentApi = {
  getCourses: (params?: { niveau?: string; annee?: string; matiere?: string }) =>
    api.get('/content/courses', { params }),
  
  getLevels: () =>
    api.get('/content/levels'),
  
  getSubjects: () =>
    api.get('/content/subjects'),
  
  getCourse: (niveau: string, annee: string, matiere: string) =>
    api.get(`/content/course/${niveau}/${annee}/${matiere}`),
  
  getCourseInfo: (niveau: string, annee: string, matiere: string) =>
    api.get(`/content/course/${niveau}/${annee}/${matiere}`),
  
  getCoursePage: (niveau: string, annee: string, matiere: string, pageNum: number) =>
    api.get(`/content/${niveau}/${annee}/${matiere}/page/${pageNum}`),
  
  searchCourse: (niveau: string, annee: string, matiere: string, query: string, maxResults: number = 5) =>
    api.post(`/content/${niveau}/${annee}/${matiere}/search`, { query, max_results: maxResults }),
};

// Favorites API
export const favoritesApi = {
  getAll: () => api.get('/favorites/'),
  
  add: (course: { course_id: string; niveau: string; annee: string; matiere: string }) =>
    api.post('/favorites/add', {
      course_id: course.course_id,
      niveau: course.niveau,
      annee: course.annee,
      matiere: course.matiere
    }),
  
  remove: (courseId: string) => api.delete(`/favorites/remove/${courseId}`),
  
  check: (courseId: string) => api.get(`/favorites/check/${courseId}`),
};

// Subscriptions API
export const subscriptionsApi = {
  getPlans: () => api.get('/subscriptions/plans'),
  
  getStatus: () => api.get('/subscriptions/status'),
  
  subscribe: (planId: number, paymentMethod?: string, paymentReference?: string) =>
    api.post('/subscriptions/subscribe', {
      plan_id: planId,
      payment_method: paymentMethod,
      payment_reference: paymentReference
    }),
  
  checkLimit: (feature: string) =>
    api.post(`/subscriptions/check-limit/${feature}`),
  
  trackUsage: (data: {
    feature_name: string;
    action?: string;
    resource_id?: string;
    resource_type?: string;
    metadata?: any;
  }) => api.post('/subscriptions/track-usage', data),
  
  cancel: () => api.post('/subscriptions/cancel'),
};

// Mindmap API
export const mindmapApi = {
  getByPdfId: (pdfId: string) =>
    api.get(`/mindmap/${pdfId}`),
  
  generate: (pdfId: string) =>
    api.post(`/mindmap/generate/${pdfId}`),
  
  updateNode: (pdfId: string, nodeId: string, updates: any) =>
    api.put(`/mindmap/${pdfId}/nodes/${nodeId}`, updates),
};

// Quiz API
export const quizGenerationApi = {
  generate: (data: {
    chapter_id?: string;
    content: string;
    num_questions?: number;
    difficulty?: string;
  }) => api.post('/quiz/generate', data),
  
  getByChapter: (chapterId: string) =>
    api.get(`/quiz/chapter/${chapterId}`),
  
  submit: (answers: Array<{question_id: string; answer: number; time_spent?: number}>) =>
    api.post('/quiz/submit', answers),
  
  getHistory: (chapterId: string) =>
    api.get(`/quiz/history/${chapterId}`),
};

// Flashcards API
export const flashcardsGenerationApi = {
  generate: (data: {
    chapter_id?: string;
    content: string;
    num_cards?: number;
    difficulty?: string;
  }) => api.post('/flashcards/generate', data),
  
  getByChapter: (chapterId: string) =>
    api.get(`/flashcards/chapter/${chapterId}`),
  
  getDueCards: (chapterId: string) =>
    api.get(`/flashcards/chapter/${chapterId}/due`),
  
  getDueCount: () =>
    api.get('/flashcards/due/count'),
  
  submitFeedback: (flashcardId: string, feedback: { feedback: 'forgot' | 'remembered' | 'disabled' }) =>
    api.post(`/flashcards/${flashcardId}/feedback`, feedback),
};

// Educator API for custom content management
export const educatorApi = {
  // Quiz management
  createQuiz: (data: any) =>
    api.post('/educational/quizzes', data),
  
  getQuizzes: (params?: { skip?: number; limit?: number; my_quizzes?: boolean; public_only?: boolean; chapter_id?: string }) =>
    api.get('/educational/quizzes', { params }),
  
  getQuiz: (quizId: string) =>
    api.get(`/educational/quizzes/${quizId}`),
  
  updateQuiz: (quizId: string, data: any) =>
    api.put(`/educational/quizzes/${quizId}`, data),
  
  deleteQuiz: (quizId: string) =>
    api.delete(`/educational/quizzes/${quizId}`),
  
  // Flashcard deck management
  createFlashcardDeck: (data: any) =>
    api.post('/educational/flashcard-decks', data),
  
  getFlashcardDecks: (params?: { skip?: number; limit?: number; my_decks?: boolean; public_only?: boolean; chapter_id?: string }) =>
    api.get('/educational/flashcard-decks', { params }),
  
  getFlashcardDeck: (deckId: string) =>
    api.get(`/educational/flashcard-decks/${deckId}`),
  
  updateFlashcardDeck: (deckId: string, data: any) =>
    api.put(`/educational/flashcard-decks/${deckId}`, data),
  
  deleteFlashcardDeck: (deckId: string) =>
    api.delete(`/educational/flashcard-decks/${deckId}`),
  
  // Study group management
  createStudyGroup: (data: any) =>
    api.post('/educational/study-groups', data),
  
  getStudyGroups: () =>
    api.get('/educational/study-groups'),
  
  getGroupMembers: (groupId: string) =>
    api.get(`/educational/study-groups/${groupId}/members`),
  
  joinStudyGroup: (code: string) =>
    api.post(`/educational/study-groups/join/${code}`),
  
  // Quiz attempts
  submitQuizAttempt: (data: any) =>
    api.post('/educational/quiz-attempts', data),
  
  // Import/Export
  importQuiz: (file: File, chapterId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (chapterId) formData.append('chapter_id', chapterId);
    return api.post('/educational/quizzes/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // Sharing
  shareQuiz: (quizId: string, data: { user_email: string; permission: string }) =>
    api.post(`/educational/quizzes/${quizId}/share`, data),
};