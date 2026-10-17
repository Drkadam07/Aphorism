import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { PostResponse, FeedTab } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { api } from '../../services/api.ts';
import { ComposeQuote } from './ComposeQuote.tsx';
import { PostCard } from './PostCard.tsx';
import {
  Compass,
  Bookmark,
  RefreshCw,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react';

interface FeedViewProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  onQuoteClick: (post: PostResponse) => void;
  onCommentClick: (post: PostResponse) => void;
  onAuthorClick: (username: string) => void;
  searchQuery: string;
}

export function FeedView({
  activeTab,
  onTabChange,
  onQuoteClick,
  onCommentClick,
  onAuthorClick,
  searchQuery,
}: FeedViewProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const { showToast } = useToast();

  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'philosophy' | 'systems' | 'literature'>('all');

  // Load feed
  const loadInitialFeed = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getFeed(undefined, 20);
      setPosts(data);
      setHasMore(data.length >= 20);

      if (isAuthenticated) {
        const saves = await api.getSavedPosts();
        setSavedPosts(saves);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch feed';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, showToast]);

  useEffect(() => {
    loadInitialFeed();
  }, [loadInitialFeed]);

  // Infinite Scroll / Load More
  const loadMore = async () => {
    if (isLoadingMore || !hasMore || posts.length === 0) return;
    const lastId = posts[posts.length - 1].id;
    setIsLoadingMore(true);
    try {
      const more = await api.getFeed(lastId, 10);
      if (more.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => [...prev, ...more]);
        setHasMore(more.length >= 10);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handlePostCreated = (newPost: PostResponse) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updated: PostResponse) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSavedPosts((prev) => {
      if (updated.is_saved_by_me) {
        const exists = prev.some((p) => p.id === updated.id);
        return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...prev];
      } else {
        return prev.filter((p) => p.id !== updated.id);
      }
    });
  };

  const handlePostDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setSavedPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  // Filtered posts based on tab, search query, and category
  const displayedPosts = useMemo(() => {
    const list = activeTab === 'bookmarks' ? savedPosts : posts;

    return list.filter((post) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesContent = post.content.toLowerCase().includes(q);
        const matchesAuthor = post.author.name.toLowerCase().includes(q) || post.author.username.toLowerCase().includes(q);
        if (!matchesContent && !matchesAuthor) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const contentLower = post.content.toLowerCase();
        if (categoryFilter === 'philosophy' && !contentLower.match(/mind|soul|life|virtue|marcus|aurelius|seneca|existential|stoic/)) {
          return false;
        }
        if (categoryFilter === 'systems' && !contentLower.match(/system|software|program|computer|dijkstra|engine|code|relia/)) {
          return false;
        }
        if (categoryFilter === 'literature' && !contentLower.match(/book|library|borges|write|capital|words|jacquard/)) {
          return false;
        }
      }

      return true;
    });
  }, [activeTab, posts, savedPosts, searchQuery, categoryFilter]);

  return (
    <div className="space-y-5 pb-16">
      {/* MOBILE / TOP FEED HEADER TABS */}
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => onTabChange('discover')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'discover'
                ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Discover</span>
          </button>

          <button
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
                return;
              }
              onTabChange('bookmarks');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'bookmarks'
                ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarks</span>
            {savedPosts.length > 0 && (
              <span className="text-[10px] opacity-70">({savedPosts.length})</span>
            )}
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={loadInitialFeed}
          className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"
          title="Refresh feed"
          aria-label="Refresh feed"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* PINNED COMPOSE INPUT (Only on Discover tab) */}
      {activeTab === 'discover' && (
        <ComposeQuote onPostCreated={handlePostCreated} />
      )}

      {/* CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0 mr-1" />
        {(['all', 'philosophy', 'systems', 'literature'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors shrink-0 cursor-pointer ${
              categoryFilter === cat
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-medium'
                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300'
            }`}
          >
            {cat}
          </button>
        ))}

        {searchQuery && (
          <span className="text-xs text-neutral-400 ml-auto italic">
            Filtering by: "{searchQuery}"
          </span>
        )}
      </div>

      {/* FEED CONTENT */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 dark:border-neutral-700 dark:border-t-neutral-200 rounded-full animate-spin mx-auto mb-3" />
          <p className="font-serif italic text-xs text-neutral-400">
            Gathering timeless fragments...
          </p>
        </div>
      ) : displayedPosts.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8">
          <Sparkles className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
          <h3 className="font-serif text-base text-neutral-800 dark:text-neutral-200 mb-1">
            {activeTab === 'bookmarks' ? 'No bookmarked quotes yet' : 'No quotes match your filter'}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-4">
            {activeTab === 'bookmarks'
              ? 'Click the bookmark icon under any quote in the timeline to preserve it in your personal reading room.'
              : 'Try clearing your search query or adjusting the category filters.'}
          </p>
          {activeTab === 'bookmarks' ? (
            <button
              onClick={() => onTabChange('discover')}
              className="px-4 py-2 rounded-xl bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 text-xs font-semibold cursor-pointer"
            >
              Explore Discover Timeline
            </button>
          ) : (
            <button
              onClick={() => {
                setCategoryFilter('all');
              }}
              className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
              onQuoteClick={onQuoteClick}
              onCommentClick={onCommentClick}
              onAuthorClick={onAuthorClick}
            />
          ))}

          {/* Load More Button for Infinite Scroll */}
          {hasMore && activeTab === 'discover' && !searchQuery && categoryFilter === 'all' && (
            <div className="pt-4 text-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="px-6 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-semibold text-neutral-700 dark:text-neutral-300 transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Loading more quotes...</span>
                  </>
                ) : (
                  <span>Load More Quotes</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
