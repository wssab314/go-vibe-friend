import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthContextType, User, LoginRequest, RegisterRequest } from '../types/auth';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to check if token is expired
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true; // If we can't parse it, consider it expired
    }
  };

  // Helper function to clear auth data
  const clearAuthData = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiry');
  };

  // Verify token validity on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        // Check if token is expired
        if (isTokenExpired(storedToken)) {
          console.log('Token expired, clearing auth data');
          clearAuthData();
        } else {
          // Verify token with server
          try {
            const response = await apiService.getProfile();
            setToken(storedToken);
            setUser(response.user);
          } catch (error) {
            console.log('Token validation failed, clearing auth data');
            clearAuthData();
          }
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Listen for logout events from API interceptor
  useEffect(() => {
    const handleLogout = () => {
      clearAuthData();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiry = () => {
      if (token && isTokenExpired(token)) {
        console.log('Token expired, logging out');
        clearAuthData();
        return;
      }

      // Check if token expires in the next 5 minutes
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - currentTime;
        
        if (timeUntilExpiry < 300) { // 5 minutes
          console.log('Token expires soon, consider implementing refresh logic');
          // TODO: Implement token refresh logic here
        }
      } catch (error) {
        console.warn('Could not check token expiry:', error);
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [token]);

  const login = async (credentials: LoginRequest) => {
    try {
      setIsLoading(true);
      const response = await apiService.login(credentials);
      
      setToken(response.token);
      setUser(response.user);
      
      // Store in localStorage with expiry info
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Store token expiry time for easier checking
      try {
        const payload = JSON.parse(atob(response.token.split('.')[1]));
        localStorage.setItem('tokenExpiry', payload.exp.toString());
      } catch (error) {
        console.warn('Could not parse token expiry:', error);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      setIsLoading(true);
      const response = await apiService.register(data);
      
      setToken(response.token);
      setUser(response.user);
      
      // Store in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user');
    clearAuthData();
  };

  // Add a function to check if user is still authenticated
  const checkAuthStatus = async (): Promise<boolean> => {
    if (!token) return false;
    
    if (isTokenExpired(token)) {
      clearAuthData();
      return false;
    }

    try {
      await apiService.getProfile();
      return true;
    } catch (error) {
      clearAuthData();
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};