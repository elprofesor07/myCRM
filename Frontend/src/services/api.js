import axios from 'axios';
import toast from 'react-hot-toast';
import { logout } from '../store/slices/authSlice';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Token refresh promise to prevent multiple refresh calls
let refreshPromise = null;

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Setup interceptors (called from main.jsx with store)
export const setupInterceptors = (store) => {
  // Response interceptor
  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // Handle network errors
      if (!error.response) {
        toast.error('Network error. Please check your connection.');
        return Promise.reject(error);
      }

      // Handle 401 errors (unauthorized)
      if (error.response.status === 401 && !originalRequest._retry) {
        // Don't retry auth endpoints
        if (originalRequest.url.includes('/auth/') && 
            !originalRequest.url.includes('/auth/refresh')) {
          return Promise.reject(error);
        }

        originalRequest._retry = true;

        // If already refreshing, wait for it
        if (refreshPromise) {
          try {
            await refreshPromise;
            return api(originalRequest);
          } catch (refreshError) {
            store.dispatch(logout());
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Start refresh
        refreshPromise = api.post('/auth/refresh')
          .then((response) => {
            const { accessToken } = response.data.data;
            localStorage.setItem('accessToken', accessToken);
            refreshPromise = null;
            return Promise.resolve();
          })
          .catch((refreshError) => {
            refreshPromise = null;
            store.dispatch(logout());
            window.location.href = '/login';
            return Promise.reject(refreshError);
          });

        try {
          await refreshPromise;
          return api(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Handle 403 errors (forbidden)
      if (error.response.status === 403) {
        const message = error.response.data?.message || 'Access denied';
        
        // Check for email verification error
        if (error.response.data?.code === 'EMAIL_NOT_VERIFIED') {
          toast.error('Please verify your email to access this feature');
        } else {
          toast.error(message);
        }
      }

      // Handle 404 errors
      if (error.response.status === 404) {
        const message = error.response.data?.message || 'Resource not found';
        toast.error(message);
      }

      // Handle 429 errors (rate limit)
      if (error.response.status === 429) {
        const message = error.response.data?.message || 'Too many requests. Please try again later.';
        toast.error(message);
      }

      // Handle 500 errors
      if (error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      }

      return Promise.reject(error);
    }
  );
};

// Helper function to handle API errors
export const handleApiError = (error, defaultMessage = 'An error occurred') => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  } else if (error.response?.data?.errors) {
    // Handle validation errors
    const errors = error.response.data.errors;
    if (Array.isArray(errors)) {
      return errors.map(e => e.message || e.msg).join(', ');
    }
    return defaultMessage;
  } else if (error.message) {
    return error.message;
  }
  return defaultMessage;
};

// Helper function to build query string
export const buildQueryString = (params) => {
  const query = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => query.append(key, v));
      } else if (typeof value === 'object' && value instanceof Date) {
        query.append(key, value.toISOString());
      } else {
        query.append(key, value);
      }
    }
  });
  
  return query.toString();
};

// File upload helper
export const uploadFile = async (url, file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  };

  return api.post(url, formData, config);
};

export default api;