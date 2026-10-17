import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/layout/Header.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { FeedView } from './components/feed/FeedView.tsx';
import { ThreadView } from './components/thread/ThreadView.tsx';
import { ProfileView } from './components/profile/ProfileView.tsx';
import { QuoteModal } from './components/modals/QuoteModal.tsx';
import { AuthModal } from './components/auth/AuthModal.tsx';
import type { PostResponse, FeedTab } from './types/index.ts';
import { Compass, Bookmark, Plus, User as UserIcon } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  // Navigation View State
  const [currentView, setCurrentView] = useState<'feed' | 'thread' | 'profile'>('feed');
  const [feedTab, setFeedTab] = useState<FeedTab>('discover');
  const [activePostId, setActivePostId] = useState<number | null>(null);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Floating Quote Modal State
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quotedPost, setQuotedPost] = useState<PostResponse | null>(null);
  const [parentPost, setParentPost] = useState<PostResponse | null>(null);

  // Global Keyboard shortcut 'C' or 'N' for compose
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'c' || e.key === 'C') &&
        !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        setQuotedPost(null);
        setParentPost(null);
        setIsQuoteModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for interactions
  const handleOpenCompose = (quoted?: PostResponse, parent?: PostResponse) => {
    setQuotedPost(quoted || null);
    setParentPost(parent || null);
    setIsQuoteModalOpen(true);
  };

  const handleNavigateHome = () => {
    setCurrentView('feed');
    setActivePostId(null);
    setActiveUsername(null);
  };

  const handleOpenThread = (post: PostResponse) => {
    setActivePostId(post.id);
    setCurrentView('thread');
  };

  const handleOpenProfile = (username: string) => {
    setActiveUsername(username);
    setCurrentView('profile');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-black dark:text-neutral-100 transition-colors">
      {/* HEADER */}
      <Header
        onOpenCompose={() => handleOpenCompose()}
        onNavigateHome={handleNavigateHome}
        onNavigateProfile={(username) => handleOpenProfile(username)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-6 pb-20">
        <div className="flex gap-8 items-start">
          {/* DESKTOP SIDEBAR */}
          <Sidebar
            activeTab={feedTab}
            onTabChange={(tab) => {
              setFeedTab(tab);
              setCurrentView('feed');
            }}
            onOpenCompose={() => handleOpenCompose()}
            onOpenProfile={() => {
              if (user) handleOpenProfile(user.username);
            }}
          />

          {/* CENTRAL CONTENT COLUMN */}
          <div className="flex-1 min-w-0 max-w-2xl mx-auto w-full">
            {currentView === 'feed' && (
              <FeedView
                activeTab={feedTab}
                onTabChange={setFeedTab}
                onQuoteClick={(post) => handleOpenCompose(post, undefined)}
                onCommentClick={handleOpenThread}
                onAuthorClick={handleOpenProfile}
                searchQuery={searchQuery}
              />
            )}

            {currentView === 'thread' && activePostId !== null && (
              <ThreadView
                postId={activePostId}
                onBack={handleNavigateHome}
                onQuoteClick={(post) => handleOpenCompose(post, undefined)}
                onAuthorClick={handleOpenProfile}
              />
            )}

            {currentView === 'profile' && activeUsername && (
              <ProfileView
                username={activeUsername}
                onBack={handleNavigateHome}
                onQuoteClick={(post) => handleOpenCompose(post, undefined)}
                onCommentClick={handleOpenThread}
                onAuthorClick={handleOpenProfile}
              />
            )}
          </div>
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 px-6 py-2 flex items-center justify-around">
        <button
          onClick={() => {
            setFeedTab('discover');
            setCurrentView('feed');
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'feed' && feedTab === 'discover'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-400'
          }`}
          aria-label="Discover"
        >
          <Compass className="w-5 h-5" />
          <span>Discover</span>
        </button>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal('login');
              return;
            }
            setFeedTab('bookmarks');
            setCurrentView('feed');
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'feed' && feedTab === 'bookmarks'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-400'
          }`}
          aria-label="Bookmarks"
        >
          <Bookmark className="w-5 h-5" />
          <span>Bookmarks</span>
        </button>

        {/* Inscribe action in center */}
        <button
          onClick={() => handleOpenCompose()}
          className="w-10 h-10 rounded-full bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center -mt-4 shadow-lg active:scale-95 transition-transform"
          aria-label="New Quote"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            if (isAuthenticated && user) {
              handleOpenProfile(user.username);
            } else {
              openAuthModal('login');
            }
          }}
          className={`flex flex-col items-center gap-1 text-[11px] font-medium transition-colors ${
            currentView === 'profile'
              ? 'text-neutral-900 dark:text-neutral-100'
              : 'text-neutral-400'
          }`}
          aria-label="Profile"
        >
          <UserIcon className="w-5 h-5" />
          <span>{isAuthenticated ? 'Archive' : 'Sign In'}</span>
        </button>
      </nav>

      {/* FLOATING QUOTE COMPOSE MODAL */}
      <QuoteModal
        isOpen={isQuoteModalOpen}
        onClose={() => {
          setIsQuoteModalOpen(false);
          setQuotedPost(null);
          setParentPost(null);
        }}
        quotedPost={quotedPost}
        parentPost={parentPost}
      />

      {/* AUTHENTICATION MODAL (Register, OTP, Login) */}
      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
