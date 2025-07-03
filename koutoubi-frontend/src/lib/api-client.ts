import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_URL}/api/${API_VERSION}`;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Get session from NextAuth
    const session = await getSession();
    
    console.log('[ApiClient] Session:', session ? 'Present' : 'Not found');
    console.log('[ApiClient] Access token:', session?.access_token ? 'Present' : 'Not found');
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  private buildURL(path: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${path}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const url = this.buildURL(path, params);
    const headers = await this.getHeaders();

    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...headers,
        ...fetchOptions.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // NextAuth will handle this automatically
        throw new Error('Unauthorized');
      }
      
      const error = await response.text();
      throw new Error(error || response.statusText);
    }

    // Handle empty responses
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  // HTTP methods
  get<T>(path: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(path, { method: 'GET', params });
  }

  post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }

  // Special method for form data
  async postForm<T>(path: string, data: Record<string, string>): Promise<T> {
    const session = await getSession();
    const url = this.buildURL(path);
    
    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: new URLSearchParams(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || response.statusText);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export typed API methods for different domains
export const adminApi = {
  // Users
  getUsers: (params?: any) => apiClient.get('/admin/users', params),
  getUserStats: () => apiClient.get('/admin/users/stats'),
  getUser: (userId: string) => apiClient.get(`/admin/users/${userId}`),
  updateUser: (userId: string, data: any) => apiClient.put(`/admin/users/${userId}`, data),
  deleteUser: (userId: string) => apiClient.delete(`/admin/users/${userId}`),
  
  // Groups
  getGroups: (params?: any) => apiClient.get('/admin/groups', params),
  getGroupStats: () => apiClient.get('/admin/groups/stats'),
  
  // Content
  getContentStats: () => apiClient.get('/admin/content/stats'),
  
  // Reports
  getDashboardData: (period: string = '30d') => 
    apiClient.get('/admin/reports/dashboard', { period }),
};

export const contentApi = {
  getCourses: () => apiClient.get('/content/courses'),
  getCourse: (niveau: string, annee: string, matiere: string) =>
    apiClient.get(`/content/course/${niveau}/${annee}/${matiere}`),
  getChapters: () => apiClient.get('/chapters'),
  getQuizzes: (chapterId?: string) => 
    apiClient.get('/quiz', chapterId ? { chapter_id: chapterId } : undefined),
  getFlashcards: (chapterId?: string) => 
    apiClient.get('/flashcards', chapterId ? { chapter_id: chapterId } : undefined),
  getFavorites: () => apiClient.get('/favorites'),
  addFavorite: (data: any) => apiClient.post('/favorites/add', data),
  removeFavorite: (courseId: string) => apiClient.delete(`/favorites/remove/${courseId}`),
  checkFavorite: (courseId: string) => apiClient.get(`/favorites/check/${courseId}`),
};