export interface ServerUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  password?: string;
}

export interface ServerAuthor {
  id: number;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface ServerQuotedPost {
  id: number;
  content: string;
  created_at: string;
  author: ServerAuthor;
}

export interface ServerPost {
  id: number;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  parent_id: number | null;
  quoted_post_id?: number | null;
  author_id: number;
}

export interface ServerComment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: string;
}

// Initial In-Memory State
export const usersDb: Record<number, ServerUser> = {
  1: {
    id: 1,
    name: 'Jane Doe',
    username: 'janedoe',
    email: 'jane@example.com',
    bio: 'Writer, curator of timeless thoughts.',
    avatar_url: 'https://api.dicebear.com/7.x/identicon/svg?seed=janedoe',
    is_verified: true,
    created_at: '2026-10-15T09:30:00Z',
    password: 'SecurePassword123',
  },
  2: {
    id: 2,
    name: 'Marcus Aurelius',
    username: 'stoic_marcus',
    email: 'marcus@rome.org',
    bio: 'You have power over your mind - not outside events.',
    avatar_url: null,
    is_verified: true,
    created_at: '2026-10-01T12:00:00Z',
    password: 'SecurePassword123',
  },
  3: {
    id: 3,
    name: 'Tech Philosopher',
    username: 'tech_quote',
    email: 'tech@quote.org',
    bio: 'Software architecture principles.',
    avatar_url: null,
    is_verified: true,
    created_at: '2026-09-01T00:00:00Z',
    password: 'SecurePassword123',
  },
  4: {
    id: 4,
    name: 'Simone de Beauvoir',
    username: 'de_beauvoir',
    email: 'simone@sorbonne.fr',
    bio: 'Writer, intellectual, existentialist philosopher.',
    avatar_url: null,
    is_verified: true,
    created_at: '2026-08-20T10:15:00Z',
    password: 'SecurePassword123',
  },
  6: {
    id: 6,
    name: 'Ursula K. Le Guin',
    username: 'leguin_words',
    email: 'ursula@earthsea.org',
    bio: 'Novelist, essayist, visionary truth-teller.',
    avatar_url: null,
    is_verified: true,
    created_at: '2026-07-15T18:00:00Z',
    password: 'SecurePassword123',
  },
  7: {
    id: 7,
    name: 'Jorge Luis Borges',
    username: 'borges_library',
    email: 'borges@buenosaires.ar',
    bio: 'Labyrinths, infinity, and mirrors.',
    avatar_url: null,
    is_verified: true,
    created_at: '2026-08-10T14:20:00Z',
    password: 'SecurePassword123',
  },
};

export const postsDb: Record<number, ServerPost> = {
  111: {
    id: 111,
    content: 'We live in capitalism. Its power seems inescapable. So then did the divine right of kings. Any human power can be resisted and changed by human beings. — Ursula K. Le Guin',
    created_at: '2026-10-17T09:12:00Z',
    likes_count: 210,
    comments_count: 14,
    parent_id: null,
    quoted_post_id: null,
    author_id: 6,
  },
  105: {
    id: 105,
    content: 'This applies to systems design just as much as human relationships.',
    created_at: '2026-10-17T08:45:00Z',
    likes_count: 8,
    comments_count: 1,
    parent_id: null,
    quoted_post_id: 104,
    author_id: 1,
  },
  104: {
    id: 104,
    content: 'Simplicity is prerequisite for reliability. — Edsger Dijkstra',
    created_at: '2026-10-17T08:15:30Z',
    likes_count: 42,
    comments_count: 5,
    parent_id: null,
    quoted_post_id: null,
    author_id: 3,
  },
  106: {
    id: 106,
    content: 'Direct reply elaborating on point 1: complexity creeps in unnoticed when speed is prioritized over coherence.',
    created_at: '2026-10-17T08:25:00Z',
    likes_count: 2,
    comments_count: 0,
    parent_id: 104,
    quoted_post_id: null,
    author_id: 3,
  },
  108: {
    id: 108,
    content: 'I have always imagined that Paradise will be a kind of library. — Jorge Luis Borges',
    created_at: '2026-10-17T07:30:00Z',
    likes_count: 145,
    comments_count: 8,
    parent_id: null,
    quoted_post_id: null,
    author_id: 7,
  },
  107: {
    id: 107,
    content: 'You have power over your mind - not outside events. Realize this, and you will find strength. — Marcus Aurelius',
    created_at: '2026-10-17T06:00:00Z',
    likes_count: 128,
    comments_count: 12,
    parent_id: null,
    quoted_post_id: null,
    author_id: 2,
  },
  110: {
    id: 110,
    content: "Change your life today. Don't gamble on the future, act now, without delay. — Simone de Beauvoir",
    created_at: '2026-10-16T22:10:00Z',
    likes_count: 67,
    comments_count: 3,
    parent_id: null,
    quoted_post_id: null,
    author_id: 4,
  },
};

export const commentsDb: Record<number, ServerComment> = {
  12: {
    id: 12,
    post_id: 104,
    user_id: 1,
    content: 'Who originally translated this edition?',
    created_at: '2026-10-17T09:00:00Z',
  },
  13: {
    id: 13,
    post_id: 104,
    user_id: 3,
    content: "From Dijkstra's 1970 EWD series 'On the Reliability of Programs' presented at the ACM conference.",
    created_at: '2026-10-17T09:10:00Z',
  },
};

// User likes set: "userId:postId"
export const likesDb = new Set<string>(['1:104', '1:108', '1:110']);

// User saves set: "userId:postId"
export const savesDb = new Set<string>(['1:105', '1:108', '1:111']);

// Active OTPs: email -> otp_code
export const otpDb: Record<string, string> = {
  'jane@example.com': '482910',
};

// Tokens: token_string -> user_id
export const tokensDb: Record<string, number> = {
  'mock_jwt_token_1': 1,
  'mock_jwt_token_2': 2,
  'mock_jwt_token_3': 3,
};
