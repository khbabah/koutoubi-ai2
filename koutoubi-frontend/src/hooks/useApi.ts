import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios, { AxiosRequestConfig } from 'axios';
import useSWR, { SWRConfiguration } from 'swr';
import { toast } from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_VERSION = process.env.NEXT_PUBLIC_API_VERSION || 'v1';

// Create a fetcher that includes authentication
export function useApi() {
  const { data: session } = useSession();
  const router = useRouter();

  const axiosInstance = axios.create({
    baseURL: `${API_URL}/api/${API_VERSION}`,
  });

  // Add auth token to requests
  axiosInstance.interceptors.request.use((config) => {
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  });

  // Handle errors
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        router.push('/login');
        toast.error('Session expirée. Veuillez vous reconnecter.');
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
}

// Custom hook for authenticated API calls with SWR
export function useAuthenticatedSWR<T = any>(
  key: string | null,
  config?: SWRConfiguration
) {
  const { data: session } = useSession();
  const router = useRouter();

  const fetcher = async (url: string) => {
    if (!session?.access_token) {
      throw new Error('No authentication token');
    }

    const response = await axios.get(`${API_URL}/api/${API_VERSION}${url}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    return response.data;
  };

  const { data, error, mutate, isLoading } = useSWR<T>(
    session?.access_token && key ? key : null,
    fetcher,
    {
      ...config,
      onError: (error) => {
        if (error.response?.status === 401) {
          router.push('/login');
          toast.error('Session expirée. Veuillez vous reconnecter.');
        }
      },
    }
  );

  return {
    data,
    error,
    mutate,
    isLoading,
  };
}

// Hook for API mutations (POST, PUT, DELETE)
export function useApiMutation() {
  const api = useApi();

  return {
    post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
      try {
        const response = await api.post<T>(url, data, config);
        return response.data;
      } catch (error: any) {
        if (error.response?.data?.detail) {
          toast.error(error.response.data.detail);
        } else {
          toast.error('Une erreur est survenue');
        }
        throw error;
      }
    },
    put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => {
      try {
        const response = await api.put<T>(url, data, config);
        return response.data;
      } catch (error: any) {
        if (error.response?.data?.detail) {
          toast.error(error.response.data.detail);
        } else {
          toast.error('Une erreur est survenue');
        }
        throw error;
      }
    },
    delete: async <T = any>(url: string, config?: AxiosRequestConfig) => {
      try {
        const response = await api.delete<T>(url, config);
        return response.data;
      } catch (error: any) {
        if (error.response?.data?.detail) {
          toast.error(error.response.data.detail);
        } else {
          toast.error('Une erreur est survenue');
        }
        throw error;
      }
    },
  };
}