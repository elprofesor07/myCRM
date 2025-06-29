import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import { logout } from '../slices/authSlice';

// Create base query with auth headers
const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL || '/api',
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken || localStorage.getItem('accessToken');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

// Add retry wrapper with exponential backoff
const baseQueryWithRetry = retry(baseQuery, { maxRetries: 2 });

// Base query with re-authentication
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQueryWithRetry(args, api, extraOptions);

  // If access token expired, try to refresh
  if (result.error && result.error.status === 401) {
    // Don't retry auth endpoints
    if (typeof args === 'string' && args.includes('/auth/')) {
      return result;
    }

    console.log('Access token expired, attempting refresh...');
    
    // Try to refresh the token
    const refreshResult = await baseQueryWithRetry(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      // Store the new token
      const { accessToken } = refreshResult.data.data;
      localStorage.setItem('accessToken', accessToken);
      
      // Retry the original query
      result = await baseQueryWithRetry(args, api, extraOptions);
    } else {
      // Refresh failed, logout user
      api.dispatch(logout());
      window.location.href = '/login';
    }
  }

  return result;
};

// Helper function to handle common query params
export const buildQueryParams = (filters = {}, pagination = {}) => {
  const params = new URLSearchParams();
  
  // Add pagination
  if (pagination.page) params.append('page', pagination.page);
  if (pagination.limit) params.append('limit', pagination.limit);
  
  // Add filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        value.forEach(v => params.append(key, v));
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        // Handle object filters (like date ranges)
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue) params.append(`${key}[${subKey}]`, subValue);
        });
      } else if (value instanceof Date) {
        params.append(key, value.toISOString());
      } else {
        params.append(key, value);
      }
    }
  });
  
  return params.toString();
};

// Common tag types
export const tagTypes = [
  'Auth',
  'User',
  'Contact',
  'Company',
  'Deal',
  'Activity',
  'Task',
  'Dashboard',
  'Report',
  'Notification',
];

// Base API setup (not exported directly, extended by feature APIs)
export const baseApi = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes,
  endpoints: () => ({}),
});

// Transform response helper for pagination
export const transformPaginatedResponse = (response) => {
  return {
    data: response.data || [],
    pagination: {
      page: response.page || 1,
      limit: response.limit || 20,
      total: response.total || 0,
      totalPages: response.totalPages || 1,
    },
  };
};

// Common error handler
export const handleApiError = (error) => {
  if (error.data?.message) {
    return error.data.message;
  } else if (error.data?.errors) {
    const errors = error.data.errors;
    if (Array.isArray(errors)) {
      return errors.map(e => e.message || e.msg).join(', ');
    }
  } else if (error.error) {
    return error.error;
  }
  return 'An unexpected error occurred';
};