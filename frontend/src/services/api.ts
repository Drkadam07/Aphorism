import type {
  User,
  PostResponse,
  CommentResponse,
  RegisterPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  LoginPayload,
  AuthResponse,
  UpdateProfilePayload,
  CreatePostPayload,
} from '../types/index.ts';

const TOKEN_KEY = 'aphorism_token';
const API_BASE_URL_KEY = 'aphorism_api_base_url';

export const DEFAULT_API_BASE_URL = '/api/v1';

// Token helpers
export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

export function getApiBaseUrl(): string {
  try {
    return localStorage.getItem(API_BASE_URL_KEY) || DEFAULT_API_BASE_URL;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

export function setApiBaseUrl(url: string): void {
  try {
    localStorage.setItem(API_BASE_URL_KEY, url);
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.name = 'ApiError';
  }
}

// -------------------------------------------------------------
// STRICT LIVE BACKEND API CLIENT
// -------------------------------------------------------------
class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = getApiBaseUrl();
    const token = getStoredToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${baseUrl}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent('aphorism:unauthorized'));
      const errorData = await res.json().catch(() => ({ detail: 'Unauthorized' }));
      throw new ApiError(401, errorData.detail || 'Unauthorized');
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(res.status, errorData.detail || 'Request failed');
    }

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    return (await res.json()) as T;
  }

  // 1. Authentication Endpoints
  async register(payload: RegisterPayload): Promise<{ message: string; otp?: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async verifyOtp(payload: VerifyOtpPayload): Promise<AuthResponse & { user?: User }> {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async resendOtp(payload: ResendOtpPayload): Promise<{ message: string; otp?: string }> {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async login(payload: LoginPayload): Promise<AuthResponse & { user?: User }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // 2. User Profile Endpoints
  async getMe(): Promise<User> {
    return this.request('/users/me', {
      method: 'GET',
    });
  }

  async patchMe(updates: UpdateProfilePayload): Promise<User> {
    return this.request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async getUser(username: string): Promise<User> {
    return this.request(`/users/${encodeURIComponent(username)}`, {
      method: 'GET',
    });
  }

  // 3. Feed & Timeline Endpoints
  async getFeed(cursor?: number, limit = 20): Promise<PostResponse[]> {
    const query = new URLSearchParams();
    if (cursor !== undefined) query.set('cursor', String(cursor));
    query.set('limit', String(limit));

    return this.request(`/feed?${query.toString()}`, {
      method: 'GET',
    });
  }

  // 4. Post, Quote & Thread Operations
  async createPost(payload: CreatePostPayload): Promise<PostResponse> {
    return this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPost(postId: number): Promise<PostResponse> {
    return this.request(`/posts/${postId}`, {
      method: 'GET',
    });
  }

  async getThread(postId: number): Promise<PostResponse[]> {
    return this.request(`/posts/${postId}/thread`, {
      method: 'GET',
    });
  }

  async deletePost(postId: number): Promise<void> {
    return this.request(`/posts/${postId}`, {
      method: 'DELETE',
    });
  }

  // 5. Likes, Bookmarks & Comments
  async toggleLike(postId: number): Promise<{ post_id: number; liked: boolean }> {
    return this.request(`/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async toggleSave(postId: number): Promise<{ post_id: number; saved: boolean }> {
    return this.request(`/posts/${postId}/save`, {
      method: 'POST',
    });
  }

  async getSavedPosts(): Promise<PostResponse[]> {
    return this.request('/posts/saved/all', {
      method: 'GET',
    });
  }

  async addComment(postId: number, content: string): Promise<CommentResponse> {
    return this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getComments(postId: number): Promise<CommentResponse[]> {
    return this.request(`/posts/${postId}/comments`, {
      method: 'GET',
    });
  }
}

export const api = new ApiClient();
