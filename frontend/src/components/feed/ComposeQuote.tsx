import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { api } from '../../services/api.ts';
import { calculateRemainingChars, getAvatarUrl } from '../../lib/utils.ts';
import type { PostResponse } from '../../types/index.ts';
import { Send, Sparkles, Quote, BookOpen } from 'lucide-react';

interface ComposeQuoteProps {
  onPostCreated: (post: PostResponse) => void;
}

export function ComposeQuote({ onPostCreated }: ComposeQuoteProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const created = await api.createPost({
        content: content.trim(),
        quoted_post_id: null,
        parent_id: null,
      });
      setContent('');
      setIsFocused(false);
      showToast('Timeless quote published to the global timeline.', 'success');
      onPostCreated(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish quote';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInsertAttribution = () => {
    setContent((prev) => `${prev} — `);
  };

  return (
    <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3 sm:gap-4">
          {/* Avatar */}
          <img
            src={
              user
                ? getAvatarUrl(user.username, user.avatar_url)
                : 'https://api.dicebear.com/7.x/identicon/svg?seed=guest'
            }
            alt={user ? user.name : 'Guest'}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-neutral-200 dark:border-neutral-800 shrink-0 object-cover mt-0.5"
          />

          <div className="flex-1 min-w-0">
            {/* Input area */}
            <textarea
              rows={isFocused || content.length > 0 ? 3 : 2}
              value={content}
              onFocus={() => setIsFocused(true)}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Inscribe a quote, aphorism, or foundational thesis..."
              className="w-full bg-transparent border-0 text-base sm:text-lg font-serif text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none resize-none leading-relaxed"
            />

            {/* Quick helper when focused */}
            {(isFocused || content.length > 0) && (
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-neutral-100 dark:border-neutral-900">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInsertAttribution}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Attribution (—)</span>
                  </button>

                  <span className="text-[11px] text-neutral-400 hidden sm:inline-flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Markdown / Serif styled
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Character countdown */}
                  <span
                    className={`text-xs font-mono font-medium ${
                      charData.isOverLimit
                        ? 'text-rose-500 font-bold'
                        : charData.remaining < 50
                        ? 'text-amber-500'
                        : 'text-neutral-400'
                    }`}
                  >
                    {charData.remaining}
                  </span>

                  <button
                    type="submit"
                    disabled={isSubmitting || !content.trim() || charData.isOverLimit}
                    className="px-4 py-1.5 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    {isSubmitting ? (
                      'Inscribing...'
                    ) : (
                      <>
                        <Quote className="w-3 h-3" />
                        <span>Publish</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
