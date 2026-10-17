import type { PostResponse } from '../types/index.ts';

/**
 * Format timestamp into relative short string (e.g., 'now', '3m', '2h', '4d')
 */
export function formatRelativeTime(dateString: string, nowMs = Date.now()): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = nowMs - date.getTime();

  if (diffMs < 0 || isNaN(diffMs)) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Validate 6-digit OTP string
 */
export function validateOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp.trim());
}

/**
 * Calculates remaining characters based on 500 limit
 */
export function calculateRemainingChars(text: string, limit = 500): { remaining: number; isOverLimit: boolean; percent: number } {
  const length = text.length;
  const remaining = limit - length;
  const percent = Math.min(100, Math.round((length / limit) * 100));
  return {
    remaining,
    isOverLimit: remaining < 0,
    percent,
  };
}

/**
 * Extract quote and attribution if formatted with em-dash or by-line
 */
export function parseQuotesAndAttribution(rawText: string): { quote: string; author?: string } {
  const trimmed = rawText.trim();
  const emDashMatch = trimmed.split(/\s*—\s*|\s*--\s*/);
  if (emDashMatch.length > 1) {
    const author = emDashMatch[emDashMatch.length - 1].trim();
    const quote = emDashMatch.slice(0, emDashMatch.length - 1).join(' — ').trim();
    return { quote, author };
  }
  return { quote: trimmed };
}

/**
 * Optimistic like toggle logic
 */
export function applyOptimisticLike(post: PostResponse): { updatedPost: PostResponse; liked: boolean } {
  const willBeLiked = !post.is_liked_by_me;
  const nextCount = willBeLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1);
  return {
    liked: willBeLiked,
    updatedPost: {
      ...post,
      is_liked_by_me: willBeLiked,
      likes_count: nextCount,
    },
  };
}

/**
 * Optimistic bookmark toggle logic
 */
export function applyOptimisticSave(post: PostResponse): { updatedPost: PostResponse; saved: boolean } {
  const willBeSaved = !post.is_saved_by_me;
  return {
    saved: willBeSaved,
    updatedPost: {
      ...post,
      is_saved_by_me: willBeSaved,
    },
  };
}

/**
 * Build sorted thread list: root post first, then direct and indirect replies chronologically
 */
export function buildThreadSequence(rootPostId: number, posts: PostResponse[]): PostResponse[] {
  const root = posts.find((p) => p.id === rootPostId);
  const replies = posts.filter((p) => p.id !== rootPostId);

  // Sort replies chronologically
  replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return root ? [root, ...replies] : replies;
}

/**
 * Generate a Dicebear avatar URL based on username or seed
 */
export function getAvatarUrl(username: string, customUrl?: string | null): string {
  if (customUrl && customUrl.trim().length > 0) return customUrl;
  return `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(username || 'aphorism')}`;
}
