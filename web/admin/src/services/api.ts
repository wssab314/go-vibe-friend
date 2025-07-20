import axios from 'axios';
import type { LoginRequest, RegisterRequest, User } from '../types/auth';

interface AuthResponse {
  token: string;
  user: User;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiService {
  private client: ReturnType<typeof axios.create>;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Only clear auth data if it's not a login request
          const isLoginRequest = error.config?.url?.includes('/login');
          if (!isLoginRequest) {
            console.log('401 error received, clearing auth data');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('tokenExpiry');
            
            // Dispatch a custom event to notify AuthContext
            window.dispatchEvent(new CustomEvent('auth:logout'));
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/admin/login', credentials);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/admin/register', data);
    return response.data;
  }

  async getProfile(): Promise<{ user: User }> {
    const response = await this.client.get<{ user: User }>('/api/admin/profile');
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Generic request method
  async request<T>(config: any): Promise<T> {
    const response = await this.client.request<T>(config);
    return response.data;
  }

  // Storage endpoints
  async getStorageObjects(prefix = '', recursive = true): Promise<any> {
    const response = await this.client.get('/api/admin/storage/objects', {
      params: { prefix, recursive },
    });
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;