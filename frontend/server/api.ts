import { Router, Request, Response, NextFunction } from 'express';
import {
  usersDb,
  postsDb,
  commentsDb,
  likesDb,
  savesDb,
  otpDb,
  tokensDb,
  ServerUser,
  ServerAuthor,
  ServerPost,
} from './data.ts';

export const apiRouter = Router();

// Helper: extract authenticated user from Bearer header
function getAuthUser(req: Request): ServerUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7).trim();
  const userId = tokensDb[token];
  if (!userId || !usersDb[userId]) {
    // If it's a simulated mock token e.g. mock_jwt_token_1_..., extract ID
    const match = token.match(/mock_jwt_token_(\d+)/);
    if (match) {
      const extractedId = parseInt(match[1], 10);
      if (usersDb[extractedId]) {
        return usersDb[extractedId];
      }
    }
    return null;
  }
  return usersDb[userId];
}

// Middleware: require authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ detail: 'Unauthorized' });
  }
  (req as Request & { user: ServerUser }).user = user;
  next();
}

// Helper: format public author
function toAuthor(user: ServerUser): ServerAuthor {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar_url: user.avatar_url,
    is_verified: user.is_verified,
    created_at: user.created_at,
  };
}

// Helper: format PostResponse
function formatPostResponse(postId: number, currentUserId?: number | null) {
  const post = postsDb[postId];
  if (!post) return null;

  const author = usersDb[post.author_id];
  let quotedPost = null;

  if (post.quoted_post_id && postsDb[post.quoted_post_id]) {
    const qp = postsDb[post.quoted_post_id];
    const qpAuthor = usersDb[qp.author_id];
    if (qpAuthor) {
      quotedPost = {
        id: qp.id,
        content: qp.content,
        created_at: qp.created_at,
        author: toAuthor(qpAuthor),
      };
    }
  }

  const isLiked = currentUserId ? likesDb.has(`${currentUserId}:${post.id}`) : false;
  const isSaved = currentUserId ? savesDb.has(`${currentUserId}:${post.id}`) : false;

  return {
    id: post.id,
    content: post.content,
    created_at: post.created_at,
    likes_count: post.likes_count,
    comments_count: post.comments_count,
    is_liked_by_me: isLiked,
    is_saved_by_me: isSaved,
    parent_id: post.parent_id,
    author: author ? toAuthor(author) : {
      id: post.author_id,
      name: 'Unknown',
      username: 'unknown',
      email: '',
      bio: null,
      avatar_url: null,
      is_verified: false,
      created_at: post.created_at,
    },
    quoted_post: quotedPost,
  };
}

// -------------------------------------------------------------
// 1. AUTHENTICATION ENDPOINTS
// -------------------------------------------------------------

// POST /auth/register
apiRouter.post('/auth/register', (req, res) => {
  const { name, username, email, password } = req.body;
  if (!name || !username || !email || !password) {
    return res.status(400).json({ detail: 'All fields are required' });
  }

  const emailNorm = email.toLowerCase().trim();
  const userNorm = username.toLowerCase().trim();

  const conflict = Object.values(usersDb).find(
    (u) => u.email.toLowerCase() === emailNorm || u.username.toLowerCase() === userNorm
  );

  if (conflict) {
    return res.status(400).json({ detail: 'Username or Email already registered' });
  }

  const newId = Date.now();
  const newUser: ServerUser = {
    id: newId,
    name: name.trim(),
    username: userNorm,
    email: emailNorm,
    bio: '',
    avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(userNorm)}`,
    is_verified: false,
    created_at: new Date().toISOString(),
    password,
  };

  usersDb[newId] = newUser;
  const otpCode = '482910';
  otpDb[emailNorm] = otpCode;

  res.status(201).json({
    message: "Account created. Verification OTP sent to your email.",
  });
});

// POST /auth/verify-otp
apiRouter.post('/auth/verify-otp', (req, res) => {
  const { email, otp_code } = req.body;
  if (!email || !otp_code) {
    return res.status(400).json({ detail: 'Email and otp_code are required' });
  }

  const emailNorm = email.toLowerCase().trim();
  const expectedOtp = otpDb[emailNorm] || '482910';

  if (otp_code.trim() !== expectedOtp) {
    return res.status(400).json({ detail: 'Invalid or expired OTP code' });
  }

  const user = Object.values(usersDb).find((u) => u.email.toLowerCase() === emailNorm);
  if (!user) {
    return res.status(400).json({ detail: 'User not found' });
  }

  user.is_verified = true;
  const token = `mock_jwt_token_${user.id}_${Date.now()}`;
  tokensDb[token] = user.id;

  res.status(200).json({
    message: 'Email verified successfully',
    access_token: token,
    token_type: 'bearer',
  });
});

// POST /auth/resend-otp
apiRouter.post('/auth/resend-otp', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ detail: 'Email is required' });
  }

  const emailNorm = email.toLowerCase().trim();
  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  otpDb[emailNorm] = newOtp;

  res.status(200).json({
    message: 'New OTP dispatched',
  });
});

// POST /auth/login
apiRouter.post('/auth/login', (req, res) => {
  const { username_or_email, password } = req.body;
  if (!username_or_email || !password) {
    return res.status(400).json({ detail: 'Missing credentials' });
  }

  const identifier = username_or_email.toLowerCase().trim();
  const user = Object.values(usersDb).find(
    (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );

  if (!user || user.password !== password) {
    return res.status(401).json({ detail: 'Invalid credentials' });
  }

  if (!user.is_verified) {
    return res.status(403).json({ detail: 'Please verify your email before logging in' });
  }

  const token = `mock_jwt_token_${user.id}_${Date.now()}`;
  tokensDb[token] = user.id;

  res.status(200).json({
    access_token: token,
    token_type: 'bearer',
  });
});

// POST /auth/logout
apiRouter.post('/auth/logout', requireAuth, (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    delete tokensDb[token];
  }
  res.status(200).json({ message: 'Successfully logged out' });
});

// -------------------------------------------------------------
// 2. USER PROFILE ENDPOINTS
// -------------------------------------------------------------

// GET /users/me
apiRouter.get('/users/me', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const { password: _, ...publicProfile } = user;
  res.status(200).json(publicProfile);
});

// PATCH /users/me
apiRouter.patch('/users/me', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const { name, bio, avatar_url } = req.body;

  if (name !== undefined) user.name = name.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (avatar_url !== undefined) user.avatar_url = avatar_url.trim() || null;

  const { password: _, ...publicProfile } = user;
  res.status(200).json(publicProfile);
});

// GET /users/:username
apiRouter.get('/users/:username', (req, res) => {
  const targetUsername = req.params.username.toLowerCase().trim();
  const user = Object.values(usersDb).find(
    (u) => u.username.toLowerCase() === targetUsername
  );

  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }

  const { password: _, ...publicProfile } = user;
  res.status(200).json(publicProfile);
});

// -------------------------------------------------------------
// 3. FEED & TIMELINE ENDPOINTS
// -------------------------------------------------------------

// GET /feed?cursor={last_post_id}&limit=20
apiRouter.get('/feed', (req, res) => {
  const user = getAuthUser(req);
  const cursorParam = req.query.cursor ? parseInt(req.query.cursor as string, 10) : undefined;
  const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  // Global feed containing standalone quotes and quoted-posts (excludes direct thread replies where parent_id !== null)
  const standalonePosts = Object.values(postsDb)
    .filter((p) => p.parent_id === null)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  let filtered = standalonePosts;
  if (cursorParam) {
    const idx = filtered.findIndex((p) => p.id === cursorParam);
    if (idx !== -1) {
      filtered = filtered.slice(idx + 1);
    }
  }

  const paged = filtered.slice(0, limitParam);
  const results = paged.map((p) => formatPostResponse(p.id, user?.id)).filter(Boolean);

  res.status(200).json(results);
});

// -------------------------------------------------------------
// 4. POST, QUOTE & THREAD OPERATIONS
// -------------------------------------------------------------

// POST /posts
apiRouter.post('/posts', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const { content, quoted_post_id, parent_id } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ detail: 'Content is required' });
  }

  const newId = Date.now();
  const newPost: ServerPost = {
    id: newId,
    content: content.trim(),
    created_at: new Date().toISOString(),
    likes_count: 0,
    comments_count: 0,
    parent_id: parent_id ? parseInt(parent_id, 10) : null,
    quoted_post_id: quoted_post_id ? parseInt(quoted_post_id, 10) : null,
    author_id: user.id,
  };

  postsDb[newId] = newPost;

  // If replying to a thread, increment parent comments/replies count
  if (newPost.parent_id && postsDb[newPost.parent_id]) {
    postsDb[newPost.parent_id].comments_count += 1;
  }

  const formatted = formatPostResponse(newId, user.id);
  res.status(201).json(formatted);
});

// GET /posts/:post_id
apiRouter.get('/posts/:post_id', (req, res) => {
  const user = getAuthUser(req);
  const postId = parseInt(req.params.post_id, 10);
  const formatted = formatPostResponse(postId, user?.id);

  if (!formatted) {
    return res.status(404).json({ detail: 'Post not found' });
  }

  res.status(200).json(formatted);
});

// GET /posts/:post_id/thread
apiRouter.get('/posts/:post_id/thread', (req, res) => {
  const user = getAuthUser(req);
  const postId = parseInt(req.params.post_id, 10);
  const root = postsDb[postId];

  if (!root) {
    return res.status(404).json({ detail: 'Post not found' });
  }

  const replies = Object.values(postsDb).filter((p) => p.parent_id === postId);
  replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const threadList = [root, ...replies]
    .map((p) => formatPostResponse(p.id, user?.id))
    .filter(Boolean);

  res.status(200).json(threadList);
});

// DELETE /posts/:post_id
apiRouter.delete('/posts/:post_id', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const postId = parseInt(req.params.post_id, 10);
  const post = postsDb[postId];

  if (!post) {
    return res.status(404).json({ detail: 'Post not found' });
  }

  if (post.author_id !== user.id) {
    return res.status(403).json({ detail: 'Not authorized to delete this post' });
  }

  delete postsDb[postId];
  res.status(204).send();
});

// -------------------------------------------------------------
// 5. LIKES, BOOKMARKS & COMMENTS
// -------------------------------------------------------------

// POST /posts/:post_id/like
apiRouter.post('/posts/:post_id/like', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const postId = parseInt(req.params.post_id, 10);
  const post = postsDb[postId];

  if (!post) {
    return res.status(404).json({ detail: 'Post not found' });
  }

  const key = `${user.id}:${postId}`;
  const alreadyLiked = likesDb.has(key);

  if (alreadyLiked) {
    likesDb.delete(key);
    post.likes_count = Math.max(0, post.likes_count - 1);
  } else {
    likesDb.add(key);
    post.likes_count += 1;
  }

  res.status(200).json({
    post_id: postId,
    liked: !alreadyLiked,
  });
});

// POST /posts/:post_id/save
apiRouter.post('/posts/:post_id/save', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const postId = parseInt(req.params.post_id, 10);
  const post = postsDb[postId];

  if (!post) {
    return res.status(404).json({ detail: 'Post not found' });
  }

  const key = `${user.id}:${postId}`;
  const alreadySaved = savesDb.has(key);

  if (alreadySaved) {
    savesDb.delete(key);
  } else {
    savesDb.add(key);
  }

  res.status(200).json({
    post_id: postId,
    saved: !alreadySaved,
  });
});

// GET /posts/saved/all
apiRouter.get('/posts/saved/all', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const savedPostIds = Array.from(savesDb)
    .filter((k) => k.startsWith(`${user.id}:`))
    .map((k) => parseInt(k.split(':')[1], 10));

  const savedList = savedPostIds
    .map((id) => formatPostResponse(id, user.id))
    .filter(Boolean)
    .sort((a, b) => new Date(b!.created_at).getTime() - new Date(a!.created_at).getTime());

  res.status(200).json(savedList);
});

// POST /posts/:post_id/comments
apiRouter.post('/posts/:post_id/comments', requireAuth, (req, res) => {
  const user = (req as Request & { user: ServerUser }).user;
  const postId = parseInt(req.params.post_id, 10);
  const post = postsDb[postId];

  if (!post) {
    return res.status(404).json({ detail: 'Post not found' });
  }

  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ detail: 'Content is required' });
  }

  const commentId = Date.now();
  const newComment = {
    id: commentId,
    post_id: postId,
    user_id: user.id,
    content: content.trim(),
    created_at: new Date().toISOString(),
  };

  commentsDb[commentId] = newComment;
  post.comments_count += 1;

  res.status(201).json({
    id: commentId,
    content: newComment.content,
    created_at: newComment.created_at,
    user: toAuthor(user),
  });
});

// GET /posts/:post_id/comments
apiRouter.get('/posts/:post_id/comments', (req, res) => {
  const postId = parseInt(req.params.post_id, 10);
  const post = postsDb[postId];

  if (!post) {
    return res.status(404).json({ detail: 'Post not found' });
  }

  const comments = Object.values(commentsDb)
    .filter((c) => c.post_id === postId)
    .map((c) => {
      const author = usersDb[c.user_id];
      return {
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user: author ? toAuthor(author) : {
          id: c.user_id,
          name: 'Unknown',
          username: 'unknown',
          email: '',
          bio: null,
          avatar_url: null,
          is_verified: false,
          created_at: c.created_at,
        },
      };
    })
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  res.status(200).json(comments);
});
