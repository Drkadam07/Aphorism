import React, { useState, useEffect } from 'react';
import type { User, PostResponse } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { api } from '../../services/api.ts';
import { PostCard } from '../feed/PostCard.tsx';
import { EditProfileModal } from '../modals/EditProfileModal.tsx';
import { getAvatarUrl } from '../../lib/utils.ts';
import { Calendar, BadgeCheck, Edit3, ArrowLeft, Bookmark, Quote, Sparkles } from 'lucide-react';

interface ProfileViewProps {
  username: string;
  onBack: () => void;
  onQuoteClick: (post: PostResponse) => void;
  onCommentClick: (post: PostResponse) => void;
  onAuthorClick: (username: string) => void;
}

export function ProfileView({
  username,
  onBack,
  onQuoteClick,
  onCommentClick,
  onAuthorClick,
}: ProfileViewProps) {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'quotes' | 'saves'>('quotes');
  const [authoredPosts, setAuthoredPosts] = useState<PostResponse[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Fetch user profile
      const userRes = isOwnProfile && currentUser ? currentUser : await api.getUser(username);
      setProfileUser(userRes);

      // Fetch global feed to filter authored posts
      const feed = await api.getFeed(undefined, 100);
      const userPosts = feed.filter((p) => p.author.username.toLowerCase() === username.toLowerCase());
      setAuthoredPosts(userPosts);

      // If own profile, fetch saved posts
      if (isOwnProfile) {
        const saves = await api.getSavedPosts();
        setSavedPosts(saves);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'User not found';
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [username, currentUser]);

  const joinedFormatted = profileUser?.created_at
    ? new Date(profileUser.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'October 2026';

  return (
    <div className="space-y-6 pb-20">
      {/* Top back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
          aria-label="Back to feed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Timeline</span>
        </button>
        <span className="text-xs text-neutral-400 font-mono">@{username}</span>
      </div>

      {isLoading || !profileUser ? (
        <div className="p-12 text-center text-neutral-400 font-serif italic">
          Retrieving author archive...
        </div>
      ) : (
        <>
          {/* PROFILE HEADER CARD */}
          <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            {/* Subtle background ornamentation */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-neutral-200/40 dark:from-neutral-800/30 to-transparent pointer-events-none rounded-full blur-2xl -mr-16 -mt-16" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                <div className="flex items-center sm:items-start gap-4">
                  <img
                    src={getAvatarUrl(profileUser.username, profileUser.avatar_url)}
                    alt={profileUser.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-neutral-200 dark:border-neutral-800 object-cover shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl sm:text-2xl font-serif font-semibold text-neutral-900 dark:text-neutral-100">
                        {profileUser.name}
                      </h1>
                      {profileUser.is_verified && (
                        <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />
                      )}
                    </div>
                    <span className="text-sm text-neutral-400 font-sans block mb-2">
                      @{profileUser.username}
                    </span>

                    <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Joined {joinedFormatted}</span>
                    </div>
                  </div>
                </div>

                {isOwnProfile && (
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-semibold text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-2 transition-colors self-start cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {/* Bio */}
              {profileUser.bio ? (
                <p className="text-sm font-serif italic text-neutral-700 dark:text-neutral-300 leading-relaxed max-w-xl mb-4">
                  "{profileUser.bio}"
                </p>
              ) : (
                <p className="text-xs text-neutral-400 italic mb-4">
                  No biographical inscription yet.
                </p>
              )}

              {/* Stats Bar */}
              <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 dark:border-neutral-900 text-xs text-neutral-500">
                <div>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-sm mr-1">
                    {authoredPosts.length}
                  </span>
                  <span>Quotes authored</span>
                </div>
                {isOwnProfile && (
                  <div>
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono text-sm mr-1">
                      {savedPosts.length}
                    </span>
                    <span>Saved quotes</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TABS: Quotes vs Saves */}
          <div className="flex border-b border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTab('quotes')}
              className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 cursor-pointer ${
                activeTab === 'quotes'
                  ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <Quote className="w-3.5 h-3.5" />
              <span>Authored Quotes ({authoredPosts.length})</span>
            </button>

            {isOwnProfile && (
              <button
                onClick={() => setActiveTab('saves')}
                className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition-colors inline-flex items-center gap-2 border-b-2 cursor-pointer ${
                  activeTab === 'saves'
                    ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Bookmarks ({savedPosts.length})</span>
              </button>
            )}
          </div>

          {/* TAB CONTENT */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {authoredPosts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                  <Sparkles className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                  <p className="font-serif text-neutral-600 dark:text-neutral-400 italic">
                    No quotes published by this author yet.
                  </p>
                </div>
              ) : (
                authoredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onQuoteClick={onQuoteClick}
                    onCommentClick={onCommentClick}
                    onAuthorClick={onAuthorClick}
                    onPostUpdated={(updated) => {
                      setAuthoredPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    }}
                    onPostDeleted={(deletedId) => {
                      setAuthoredPosts((prev) => prev.filter((p) => p.id !== deletedId));
                    }}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'saves' && isOwnProfile && (
            <div className="space-y-4">
              {savedPosts.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6">
                  <Bookmark className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                  <p className="font-serif text-neutral-600 dark:text-neutral-400 italic">
                    No bookmarked quotes yet. Click the bookmark icon on any quote to save it here.
                  </p>
                </div>
              ) : (
                savedPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onQuoteClick={onQuoteClick}
                    onCommentClick={onCommentClick}
                    onAuthorClick={onAuthorClick}
                    onPostUpdated={(updated) => {
                      setSavedPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                    }}
                    onPostDeleted={(deletedId) => {
                      setSavedPosts((prev) => prev.filter((p) => p.id !== deletedId));
                    }}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          loadProfile();
        }}
      />
    </div>
  );
}
