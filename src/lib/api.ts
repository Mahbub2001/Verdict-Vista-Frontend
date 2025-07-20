import { auth } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

let globalUserRefresh: (() => Promise<void>) | null = null;

export const setGlobalUserRefresh = (refreshCallback: () => Promise<void>) => {
  globalUserRefresh = refreshCallback;
};

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class AuthService {
  private static TOKEN_KEY = 'debate_platform_token';
  private static USER_KEY = 'debate_platform_user';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem(this.TOKEN_KEY);
    console.log('Retrieved token:', token ? 'Token exists' : 'No token found');
    return token;
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    console.log('Setting token:', token ? 'Token provided' : 'No token');
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static getCurrentUser(): any | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  static setCurrentUser(user: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    let token = AuthService.getToken();
    
    console.log('API Request:', endpoint, 'Token present:', !!token);
    if (token) {
      console.log('Token preview:', token.substring(0, 50) + '...');
    }

    const makeRequest = async (authToken: string | null) => {
      const config: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
          ...options.headers,
        },
        ...options,
      };

      return fetch(url, config);
    };

    try {
      let response = await makeRequest(token);
      let data = await response.json();

      if (response.status === 401 && auth.currentUser) {
        console.log('401 Unauthorized - attempting token refresh for user:', auth.currentUser.email);
        try {
          const newToken = await auth.currentUser.getIdToken(true); // Force refresh
          console.log('New token obtained:', newToken.substring(0, 50) + '...');
          AuthService.setToken(newToken);
          
          if (globalUserRefresh) {
            console.log('Refreshing user data...');
            await globalUserRefresh();
          }
          
          console.log('Retrying request with new token...');
          response = await makeRequest(newToken);
          data = await response.json();
          
          if (response.status === 401) {
            console.log('Still getting 401 after refresh - user needs to be re-synced with backend');
            if (typeof window !== 'undefined') {
              window.location.reload();
            }
          } else {
            console.log('Retry successful with status:', response.status);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
        }
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export { AuthService };

export const authApi = {
  register: async (userData: { name: string; email: string; password: string }) => {
    const response = await api.post<{ user: any; token: string }>('/auth/register', userData);
    if (response.success && response.data) {
      AuthService.setToken(response.data.token);
      AuthService.setCurrentUser(response.data.user);
    }
    return response;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post<{ user: any; token: string }>('/auth/login', credentials);
    if (response.success && response.data) {
      AuthService.setToken(response.data.token);
      AuthService.setCurrentUser(response.data.user);
    }
    return response;
  },

  syncFirebaseUser: async (firebaseData: {
    uid: string;
    name: string;
    email: string;
    avatarUrl: string;
    idToken: string;
  }) => {
    const response = await api.post<any>('/auth/firebase-sync', firebaseData);
    return response;
  },

  logout: () => {
    AuthService.removeToken();
  },

  getCurrentUser: () => {
    return AuthService.getCurrentUser();
  },

  isAuthenticated: () => {
    return AuthService.isAuthenticated();
  }
};

// Users API
export const usersApi = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const endpoint = `/users${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<{ users: any[]; total: number; page: number; limit: number }>(endpoint);
  },

  getUserById: async (id: string) => {
    return api.get<any>(`/users/${id}`);
  },

  getCurrentUserProfile: async () => {
    return api.get<any>('/users/me');
  },

  updateProfile: async (userData: { name?: string; avatarUrl?: string }) => {
    return api.put<any>('/users/me', userData);
  },

  getLeaderboard: async (period: 'weekly' | 'monthly' | 'all-time' = 'all-time', limit: number = 50) => {
    const params = new URLSearchParams({
      period,
      limit: limit.toString()
    });
    return api.get<any[]>(`/users/leaderboard?${params.toString()}`);
  }
};

// Debates API
export const debatesApi = {
  getDebates: async (params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
    category?: string;
    tags?: string;
    search?: string;
    isActive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const endpoint = `/debates${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<{ debates: any[]; total: number; page: number; limit: number }>(endpoint);
  },

  getDebateById: async (id: string) => {
    return api.get<any>(`/debates/${id}`);
  },

  createDebate: async (debateData: {
    title: string;
    description: string;
    category: string;
    tags?: string[];
    duration: number;
    imageUrl?: string;
  }) => {
    return api.post<any>('/debates', debateData);
  },

  updateDebate: async (id: string, debateData: {
    title?: string;
    description?: string;
    tags?: string[];
    imageUrl?: string;
    isActive?: boolean;
  }) => {
    return api.put<any>(`/debates/${id}`, debateData);
  },

  deleteDebate: async (id: string) => {
    return api.delete<any>(`/debates/${id}`);
  },

  getCategories: async () => {
    return api.get<string[]>('/debates/categories');
  }
};

// Arguments API
export const argumentsApi = {
  getArgumentsForDebate: async (debateId: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const endpoint = `/debates/${debateId}/arguments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<{ arguments: any[]; total: number; page: number; limit: number }>(endpoint);
  },

  getArgumentsWithVotes: async (debateId: string, params?: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const endpoint = `/debates/${debateId}/arguments/with-votes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return api.get<{ arguments: any[]; total: number; page: number; limit: number }>(endpoint);
  },

  createArgument: async (debateId: string, argumentData: {
    text: string;
    side: 'support' | 'oppose';
  }) => {
    return api.post<any>(`/debates/${debateId}/arguments`, argumentData);
  },

  getArgumentById: async (id: string) => {
    return api.get<any>(`/arguments/${id}`);
  },

  updateArgument: async (id: string, argumentData: { text: string }) => {
    return api.put<any>(`/arguments/${id}`, argumentData);
  },

  deleteArgument: async (id: string) => {
    return api.delete<any>(`/arguments/${id}`);
  },

  voteOnArgument: async (id: string, voteType: 'upvote' | 'downvote') => {
    return api.post<any>(`/arguments/${id}/vote`, { voteType });
  },

  // Get user's side for a debate
  getUserSide: async (debateId: string) => {
    return api.get<{ side: 'support' | 'oppose' | null; joinedAt?: string }>(`/debates/${debateId}/user-side`);
  },

  // Join a side in a debate
  joinSide: async (debateId: string, side: 'support' | 'oppose') => {
    return api.post<{ side: 'support' | 'oppose' }>(`/debates/${debateId}/join-side`, { side });
  }
};
