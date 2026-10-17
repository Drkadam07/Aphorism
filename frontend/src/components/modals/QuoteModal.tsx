import React, { useState, useEffect } from 'react';
import type { PostResponse } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { api } from '../../services/api.ts';
import { calculateRemainingChars, getAvatarUrl, formatRelativeTime } from '../../lib/utils.ts';
import { X, Quote, Send, Sparkles, Eye, BadgeCheck } from 'lucide-react';

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotedPost?: PostResponse | null;
  parentPost?: PostResponse | null;
  onSuccess?: (newPost: PostResponse) => void;
}

export function QuoteModal({ isOpen, onClose, quotedPost, parentPost, onSuccess }: QuoteModalProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Reset content when opening/closing
  useEffect(() => {
    if (isOpen) {
      setContent('');
      setShowPreview(false);
    }
  }, [isOpen, quotedPost, parentPost]);

  if (!isOpen) return null;

  const charData = calculateRemainingChars(content, 500);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    if (!content.trim() || charData.isOverLimit) return;

    setIsSubmitting(true);
    try {
      const payload = {
        content: content.trim(),
        quoted_post_id: quotedPost ? quotedPost.id : null,
        parent_id: parentPost ? parentPost.id : null,
      };

      const created = await api.createPost(payload);
      showToast(
        quotedPost ? 'Quote reposted with commentary!' : parentPost ? 'Reply added to thread!' : 'Timeless quote published.',
        'success'
      );
      if (onSuccess) onSuccess(created);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not publish quote';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2">
            <Quote className="w-4 h-4 text-neutral-400" />
            <h2 id="compose-modal-title" className="text-sm font-semibold tracking-wide text-neutral-900 dark:text-neutral-100">
              {quotedPost ? 'Quote Post' : parentPost ? 'Reply in Thread' : 'New Thought or Quote'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 overflow-y-auto">
          {/* If replying in thread, show parent snippet */}
          {parentPost && (
            <div className="mb-4 pl-3 border-l-2 border-neutral-300 dark:border-neutral-700 text-xs text-neutral-500">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                Replying to @{parentPost.author.username}
              </span>
              <p className="font-serif italic text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-0.5">
                "{parentPost.content}"
              </p>
            </div>
          )}

          {/* User badge */}
          {user && (
            <div className="flex items-center gap-2.5 mb-3">
              <img
                src={getAvatarUrl(user.username, user.avatar_url)}
                alt={user.name}
                className="w-7 h-7 rounded-full border border-neutral-200 dark:border-neutral-800"
              />
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {user.name}
              </span>
              <span className="text-xs text-neutral-400">@{user.username}</span>
            </div>
          )}

          {/* Text Area */}
          <div className="relative mb-3">
            <textarea
              autoFocus
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                quotedPost
                  ? 'Add your commentary or synthesis...'
                  : parentPost
                  ? 'Elaborate or share your counterpoint...'
                  : 'Write a timeless aphorism, quote, or principle... Use "— Author" for attribution.'
              }
              className="w-full bg-transparent border-0 text-base sm:text-lg font-serif text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Quoted Post Preview (if quoting another post) */}
          {quotedPost && (
            <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={getAvatarUrl(quotedPost.author.username, quotedPost.author.avatar_url)}
                  alt={quotedPost.author.name}
                  className="w-5 h-5 rounded-full"
                />
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1">
                  {quotedPost.author.name}
                  {quotedPost.author.is_verified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                  )}
                </span>
                <span className="text-xs text-neutral-400">@{quotedPost.author.username}</span>
                <span className="text-xs text-neutral-400">· {formatRelativeTime(quotedPost.created_at)}</span>
              </div>
              <p className="font-serif text-sm text-neutral-800 dark:text-neutral-200 italic leading-relaxed">
                "{quotedPost.content}"
              </p>
            </div>
          )}

          {/* Live Preview Toggle */}
          {showPreview && content.trim() && (
            <div className="mb-4 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-1">
                Typography Preview
              </span>
              <p className="font-serif text-lg leading-relaxed text-neutral-900 dark:text-neutral-100 italic">
                “{content}”
              </p>
            </div>
          )}

          {/* Bottom Toolbar & Action */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800/80 mt-auto">
            <div className="flex items-center gap-3">
              {/* Preview Button */}
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors inline-flex items-center gap-1.5 ${
                  showPreview
                    ? 'bg-neutral-200 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>

              {/* Attribution quick insert */}
              <button
                type="button"
                onClick={() => setContent((prev) => `${prev} — `)}
                className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 px-2 py-1 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800 inline-flex items-center gap-1"
                title="Add em-dash for author attribution"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Add Attribution
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Character Countdown */}
              <div
                className={`text-xs font-mono font-medium ${
                  charData.isOverLimit
                    ? 'text-rose-500'
                    : charData.remaining < 50
                    ? 'text-amber-500'
                    : 'text-neutral-400'
                }`}
              >
                {charData.remaining}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || !content.trim() || charData.isOverLimit}
                className="px-5 py-2 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Posting...' : 'Publish'}
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
