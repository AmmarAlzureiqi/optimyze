// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshToken: () => Promise<boolean>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use VITE_ prefix for Vite environment variables
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const IS_DEBUG = import.meta.env.REACT_APP_DEBUG === 'true';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      const isValid = await verifyToken(token);
      if (isValid) {
        await fetchUserProfile(token);
      } else {
        // Try to refresh the token
        const refreshed = await refreshToken();
        if (!refreshed) {
          clearAuthData();
        }
      }
    }
    setLoading(false);
  };

  const verifyToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      return response.ok;
    } catch (error) {
      if (IS_DEBUG) console.error('Token verification failed:', error);
      return false;
    }
  };

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      if (IS_DEBUG) console.error('Failed to fetch user profile:', error);
      clearAuthData();
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        await fetchUserProfile(data.access);
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      if (IS_DEBUG) console.error('Token refresh failed:', error);
      clearAuthData();
      return false;
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      if (data.user) {
        setUser(data.user);
      } else {
        // Fetch user profile if not included in response
        await fetchUserProfile(data.access);
      }
      setIsAuthenticated(true);
    } else {
      const errorData = await response.json();
      const errorMessage = errorData.detail || 
                          errorData.non_field_errors?.[0] || 
                          'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: RegisterData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setUser(data.user);
      setIsAuthenticated(true);
    } else {
      const errorData = await response.json();
      // Handle different error formats
      let errorMessage = 'Registration failed';
      
      if (errorData.username) {
        errorMessage = `Username: ${errorData.username.join(', ')}`;
      } else if (errorData.email) {
        errorMessage = `Email: ${errorData.email.join(', ')}`;
      } else if (errorData.password) {
        errorMessage = `Password: ${errorData.password.join(', ')}`;
      } else if (errorData.non_field_errors) {
        errorMessage = errorData.non_field_errors.join(', ');
      } else if (typeof errorData === 'object') {
        const errors = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        errorMessage = errors || errorMessage;
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      register,
      logout,
      loading,
      refreshToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};