import React, { useState, useEffect } from 'react';
import type { PostResponse, CommentResponse } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { api } from '../../services/api.ts';
import { PostCard } from '../feed/PostCard.tsx';
import { formatRelativeTime, getAvatarUrl } from '../../lib/utils.ts';
import { ArrowLeft, MessageSquare, Send, Sparkles, CornerDownRight } from 'lucide-react';

interface ThreadViewProps {
  postId: number;
  onBack: () => void;
  onQuoteClick: (post: PostResponse) => void;
  onAuthorClick: (username: string) => void;
}

export function ThreadView({ postId, onBack, onQuoteClick, onAuthorClick }: ThreadViewProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [threadPosts, setThreadPosts] = useState<PostResponse[]>([]);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Quick reply input state
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Tangential comment input state
  const [commentContent, setCommentContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Fetch thread and comments
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [threadData, commentsData] = await Promise.all([
        api.getThread(postId),
        api.getComments(postId),
      ]);
      setThreadPosts(threadData);
      setComments(commentsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not load thread';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [postId]);

  // Handle adding direct reply to the thread
  const handleAddReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      const newPost = await api.createPost({
        content: replyContent.trim(),
        parent_id: postId,
        quoted_post_id: null,
      });
      setReplyContent('');
      setThreadPosts((prev) => [...prev, newPost]);
      showToast('Reply inscribed into conversation thread.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add reply';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Handle adding comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!commentContent.trim()) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await api.addComment(postId, commentContent.trim());
      setCommentContent('');
      setComments((prev) => [...prev, newComment]);
      showToast('Comment posted.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post comment';
      showToast(msg, 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const rootPost = threadPosts.find((p) => p.id === postId) || threadPosts[0];
  const replies = threadPosts.filter((p) => p.id !== rootPost?.id);

  return (
    <div className="space-y-6 pb-24">
      {/* Top Bar with Back navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
          aria-label="Back to feed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Timeline</span>
        </button>
        <span className="text-xs text-neutral-400 font-mono">
          Thread #{postId}
        </span>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-neutral-400 font-serif italic">
          Retrieving conversation thread...
        </div>
      ) : (
        <>
          {/* ROOT FOCUS POST */}
          {rootPost && (
            <div className="relative">
              <PostCard
                post={rootPost}
                isDetailedView={true}
                onQuoteClick={onQuoteClick}
                onAuthorClick={onAuthorClick}
                onPostUpdated={(updated) => {
                  setThreadPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                }}
                onPostDeleted={() => onBack()}
              />

              {/* Connecting line to replies if replies exist */}
              {replies.length > 0 && (
                <div className="absolute left-8 bottom-0 w-0.5 h-6 bg-neutral-200 dark:bg-neutral-800 translate-y-full z-0" />
              )}
            </div>
          )}

          {/* SEQUENTIAL THREAD REPLIES WITH CONTINUOUS VERTICAL LINE */}
          {replies.length > 0 && (
            <div className="relative pl-6 sm:pl-8 space-y-4 pt-2">
              {/* Continuous vertical connector line */}
              <div className="absolute left-8 sm:left-10 top-0 bottom-4 w-0.5 bg-neutral-200 dark:bg-neutral-800 z-0" />

              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider pl-4">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Sequential Responses ({replies.length})</span>
                </div>

                {replies.map((replyPost) => (
                  <div key={replyPost.id} className="relative">
                    <PostCard
                      post={replyPost}
                      onQuoteClick={onQuoteClick}
                      onAuthorClick={onAuthorClick}
                      onPostUpdated={(updated) => {
                        setThreadPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                      }}
                      onPostDeleted={(deletedId) => {
                        setThreadPosts((prev) => prev.filter((p) => p.id !== deletedId));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TANGENTIAL COMMENTS SECTION */}
          <div className="pt-6 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Discussion & Queries ({comments.length})
              </h3>
            </div>

            {/* Comment composer */}
            <form onSubmit={handleAddComment} className="mb-6">
              <div className="flex gap-3">
                <img
                  src={
                    user
                      ? getAvatarUrl(user.username, user.avatar_url)
                      : 'https://api.dicebear.com/7.x/identicon/svg?seed=guest'
                  }
                  alt={user ? user.name : 'Guest'}
                  className="w-8 h-8 rounded-full border border-neutral-200 dark:border-neutral-800 shrink-0 mt-1"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Ask a question or offer context..."
                    className="flex-1 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentContent.trim()}
                    className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
                  >
                    <span>Comment</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </form>

            {/* Comment List */}
            {comments.length === 0 ? (
              <p className="text-xs text-neutral-400 italic py-2">
                No discussion comments yet. Be the first to inquire.
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3.5 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/80 flex items-start gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => onAuthorClick(comment.user.username)}
                      aria-label={`View ${comment.user.name}'s profile`}
                    >
                      <img
                        src={getAvatarUrl(comment.user.username, comment.user.avatar_url)}
                        alt={comment.user.name}
                        className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-800 hover:ring-2 hover:ring-neutral-400 transition-all shrink-0 mt-0.5"
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          type="button"
                          onClick={() => onAuthorClick(comment.user.username)}
                          className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:underline"
                        >
                          {comment.user.name}
                        </button>
                        <span className="text-[11px] text-neutral-400">@{comment.user.username}</span>
                        <span className="text-[11px] text-neutral-400">· {formatRelativeTime(comment.created_at)}</span>
                      </div>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-sans">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* PINNED BOTTOM BAR TO QUICKLY REPLY IN THREAD */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 p-3 sm:p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Add an elaborating reply to this thread..."
            className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm font-serif text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddReply(e);
              }
            }}
          />
          <button
            onClick={handleAddReply}
            disabled={isSubmittingReply || !replyContent.trim()}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold transition-all disabled:opacity-40 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            {isSubmittingReply ? 'Replying...' : 'Inscribe Reply'}
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
