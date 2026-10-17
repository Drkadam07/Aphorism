export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface PostAuthor {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface QuotedPost {
  id: number;
  content: string;
  created_at: string;
  author: PostAuthor;
}

export interface PostResponse {
  id: number;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked_by_me: boolean;
  is_saved_by_me: boolean;
  parent_id: number | null;
  author: PostAuthor;
  quoted_post: QuotedPost | null;
}

export interface CommentResponse {
  id: number;
  content: string;
  created_at: string;
  user: PostAuthor;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp_code: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface LoginPayload {
  username_or_email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  message?: string;
}

export interface UpdateProfilePayload {
  name?: string;
  bio?: string;
  avatar_url?: string;
}

export interface CreatePostPayload {
  content: string;
  quoted_post_id?: number | null;
  parent_id?: number | null;
}

export type FeedTab = 'discover' | 'bookmarks' | 'following';
