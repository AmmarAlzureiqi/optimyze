// API configuration and utilities
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://optimyze.vercel.app/' 
  : 'http://127.0.0.1:8000';

// API endpoints
export const API_ENDPOINTS = {
  JOBS: `${API_BASE_URL}/api/jobs/`,
  JOB_DETAIL: (id: string) => `${API_BASE_URL}/api/jobs/${id}/`,
  // Add other endpoints as needed
};

// Generic fetch wrapper with error handling
export const apiCall = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Specific API functions
export const fetchJobs = (params?: URLSearchParams) => {
  const url = params ? `${API_ENDPOINTS.JOBS}?${params.toString()}` : API_ENDPOINTS.JOBS;
  return apiCall(url);
};

export const fetchJobDetail = (id: string) => {
  return apiCall(API_ENDPOINTS.JOB_DETAIL(id));
};