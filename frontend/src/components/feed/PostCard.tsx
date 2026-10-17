import React, { useState } from 'react';
import type { PostResponse } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { api } from '../../services/api.ts';
import {
  formatRelativeTime,
  getAvatarUrl,
  applyOptimisticLike,
  applyOptimisticSave,
  parseQuotesAndAttribution,
} from '../../lib/utils.ts';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Trash2,
  Share2,
  BadgeCheck,
  Quote,
} from 'lucide-react';

interface PostCardProps {
  post: PostResponse;
  onPostUpdated?: (updated: PostResponse) => void;
  onPostDeleted?: (postId: number) => void;
  onQuoteClick?: (post: PostResponse) => void;
  onCommentClick?: (post: PostResponse) => void;
  onAuthorClick?: (username: string) => void;
  isDetailedView?: boolean;
}

export function PostCard({
  post,
  onPostUpdated,
  onPostDeleted,
  onQuoteClick,
  onCommentClick,
  onAuthorClick,
  isDetailedView = false,
}: PostCardProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [currentPost, setCurrentPost] = useState<PostResponse>(post);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if prop changes
  React.useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  const parsed = parseQuotesAndAttribution(currentPost.content);
  const isOwner = user && user.id === currentPost.author.id;

  // Handle Optimistic Like
  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isLiking) return;

    // Optimistic update
    const { updatedPost } = applyOptimisticLike(currentPost);
    setCurrentPost(updatedPost);
    if (onPostUpdated) onPostUpdated(updatedPost);

    setIsLiking(true);
    try {
      await api.toggleLike(currentPost.id);
    } catch {
      // Rollback on failure
      setCurrentPost(currentPost);
      if (onPostUpdated) onPostUpdated(currentPost);
      showToast('Could not update like status', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  // Handle Optimistic Save / Bookmark
  const handleToggleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (isSaving) return;

    const { updatedPost, saved } = applyOptimisticSave(currentPost);
    setCurrentPost(updatedPost);
    if (onPostUpdated) onPostUpdated(updatedPost);

    showToast(saved ? 'Quote saved to bookmarks.' : 'Quote removed from bookmarks.', 'info');

    setIsSaving(true);
    try {
      await api.toggleSave(currentPost.id);
    } catch {
      setCurrentPost(currentPost);
      if (onPostUpdated) onPostUpdated(currentPost);
      showToast('Could not update bookmark status', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return;
    if (!confirm('Are you sure you want to delete this quote?')) return;

    setIsDeleting(true);
    try {
      await api.deletePost(currentPost.id);
      showToast('Quote permanently deleted.', 'info');
      if (onPostDeleted) onPostDeleted(currentPost.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete quote';
      showToast(msg, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Share / Copy
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `"${currentPost.content}" — via Aphorism`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('Quote text copied to clipboard.', 'success');
    }
  };

  const navigateToAuthor = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAuthorClick) {
      onAuthorClick(currentPost.author.username);
    }
  };

  const navigateToThread = () => {
    if (onCommentClick) {
      onCommentClick(currentPost);
    }
  };

  return (
    <article
      onClick={navigateToThread}
      className={`group relative bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl p-5 sm:p-6 transition-all duration-200 ${
        isDetailedView ? 'ring-1 ring-neutral-300 dark:ring-neutral-700' : 'hover:border-neutral-300 dark:hover:border-neutral-700/80 cursor-pointer'
      }`}
    >
      {/* Header: Author info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={navigateToAuthor}
            className="group/author flex items-center gap-3 text-left"
            aria-label={`View ${currentPost.author.name}'s profile`}
          >
            <img
              src={getAvatarUrl(currentPost.author.username, currentPost.author.avatar_url)}
              alt={currentPost.author.name}
              className="w-10 h-10 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover group-hover/author:ring-2 group-hover/author:ring-neutral-300 dark:group-hover/author:ring-neutral-700 transition-all"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover/author:underline decoration-neutral-300">
                  {currentPost.author.name}
                </span>
                {currentPost.author.is_verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />
                )}
              </div>
              <span className="text-xs text-neutral-400 dark:text-neutral-500">
                @{currentPost.author.username}
              </span>
            </div>
          </button>
        </div>

        {/* Timestamp */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-sans">
            {formatRelativeTime(currentPost.created_at)}
          </span>
        </div>
      </div>

      {/* Main Quote Content */}
      <div className="mb-4">
        <blockquote className="relative">
          <p
            className={`font-serif tracking-normal leading-relaxed text-neutral-900 dark:text-neutral-100 selection:bg-amber-100 dark:selection:bg-neutral-800 ${
              isDetailedView ? 'text-xl sm:text-2xl font-normal' : 'text-lg sm:text-xl font-normal'
            }`}
          >
            {parsed.author ? (
              <>
                <span className="italic font-serif">"{parsed.quote}"</span>
                <span className="block text-sm font-sans uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
                  — {parsed.author}
                </span>
              </>
            ) : (
              <span>{currentPost.content}</span>
            )}
          </p>
        </blockquote>
      </div>

      {/* Nested Quoted Post (if present) */}
      {currentPost.quoted_post && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (currentPost.quoted_post && onCommentClick) {
              onCommentClick(currentPost.quoted_post as unknown as PostResponse);
            }
          }}
          className="mb-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/40 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <img
              src={getAvatarUrl(currentPost.quoted_post.author.username, currentPost.quoted_post.author.avatar_url)}
              alt={currentPost.quoted_post.author.name}
              className="w-5 h-5 rounded-full"
            />
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
              {currentPost.quoted_post.author.name}
              {currentPost.quoted_post.author.is_verified && (
                <BadgeCheck className="w-3 h-3 text-blue-500 fill-blue-500/20" />
              )}
            </span>
            <span className="text-xs text-neutral-400">@{currentPost.quoted_post.author.username}</span>
            <span className="text-xs text-neutral-400">· {formatRelativeTime(currentPost.quoted_post.created_at)}</span>
          </div>
          <p className="font-serif text-sm text-neutral-700 dark:text-neutral-300 italic leading-relaxed">
            "{currentPost.quoted_post.content}"
          </p>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-900/90 text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-5 sm:gap-7">
          {/* Like Button */}
          <button
            type="button"
            onClick={handleToggleLike}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer group/like ${
              currentPost.is_liked_by_me
                ? 'text-rose-500 dark:text-rose-400'
                : 'hover:text-rose-500 dark:hover:text-rose-400'
            }`}
            aria-label={currentPost.is_liked_by_me ? 'Unlike quote' : 'Like quote'}
          >
            <div className="p-1 rounded-full group-hover/like:bg-rose-50 dark:group-hover/like:bg-rose-950/40 transition-colors">
              <Heart
                className={`w-4 h-4 transition-transform group-active/like:scale-125 ${
                  currentPost.is_liked_by_me ? 'fill-current text-rose-500' : ''
                }`}
              />
            </div>
            <span>{currentPost.likes_count}</span>
          </button>

          {/* Comment / Thread Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onCommentClick) onCommentClick(currentPost);
            }}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-blue-500 dark:hover:text-blue-400 transition-colors cursor-pointer group/comment"
            aria-label="View thread and comments"
          >
            <div className="p-1 rounded-full group-hover/comment:bg-blue-50 dark:group-hover/comment:bg-blue-950/40 transition-colors">
              <MessageCircle className="w-4 h-4" />
            </div>
            <span>{currentPost.comments_count}</span>
          </button>

          {/* Quote Repost Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onQuoteClick) onQuoteClick(currentPost);
            }}
            className="flex items-center gap-1.5 text-xs font-medium hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer group/quote"
            aria-label="Quote this post"
          >
            <div className="p-1 rounded-full group-hover/quote:bg-emerald-50 dark:group-hover/quote:bg-emerald-950/40 transition-colors">
              <Repeat2 className="w-4 h-4" />
            </div>
            <span className="hidden sm:inline">Quote</span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            type="button"
            onClick={handleToggleSave}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer group/save ${
              currentPost.is_saved_by_me
                ? 'text-amber-500 dark:text-amber-400'
                : 'hover:text-amber-500 dark:hover:text-amber-400'
            }`}
            aria-label={currentPost.is_saved_by_me ? 'Remove bookmark' : 'Bookmark quote'}
          >
            <div className="p-1 rounded-full group-hover/save:bg-amber-50 dark:group-hover/save:bg-amber-950/40 transition-colors">
              <Bookmark
                className={`w-4 h-4 transition-transform group-active/save:scale-125 ${
                  currentPost.is_saved_by_me ? 'fill-current text-amber-500' : ''
                }`}
              />
            </div>
            <span className="hidden sm:inline">
              {currentPost.is_saved_by_me ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>

        {/* Right tools: Delete (if owner) and Share */}
        <div className="flex items-center gap-2">
          {isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-neutral-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
              aria-label="Delete quote"
              title="Delete quote"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer"
            aria-label="Share quote"
            title="Copy quote link"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
