import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import type { FeedTab } from '../../types/index.ts';
import {
  Compass,
  Bookmark,
  User as UserIcon,
  Plus,
  Sparkles,
  Command,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  onOpenCompose: () => void;
  onOpenProfile: () => void;
  savedCount?: number;
}

export function Sidebar({
  activeTab,
  onTabChange,
  onOpenCompose,
  onOpenProfile,
  savedCount = 0,
}: SidebarProps) {
  const { user, isAuthenticated, openAuthModal } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col gap-6 w-60 shrink-0 sticky top-20 self-start">
      {/* Navigation Links */}
      <nav className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800/90 rounded-2xl p-2.5 shadow-xs space-y-1">
        <button
          onClick={() => onTabChange('discover')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'discover'
              ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Compass className="w-4 h-4" />
            <span>Discover Timeline</span>
          </div>
          <span className="text-[10px] font-mono opacity-60">Feed</span>
        </button>

        <button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal('login');
              return;
            }
            onTabChange('bookmarks');
          }}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'bookmarks'
              ? 'bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4" />
            <span>Saved Bookmarks</span>
          </div>
          {savedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
              {savedCount}
            </span>
          )}
        </button>

        {isAuthenticated && user && (
          <button
            onClick={onOpenProfile}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-200 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <UserIcon className="w-4 h-4" />
              <span>My Archive</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">@{user.username}</span>
          </button>
        )}
      </nav>

      {/* Floating Action Button */}
      <button
        onClick={onOpenCompose}
        className="w-full py-3 px-4 rounded-2xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer group"
      >
        <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
        <span>Inscribe Thought</span>
      </button>

      {/* Quote of the Day Widget */}
      <div className="bg-white/60 dark:bg-neutral-950/60 border border-neutral-200 dark:border-neutral-800/80 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-neutral-400 mb-2">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Aphorism of the Day</span>
        </div>
        <p className="font-serif italic text-xs leading-relaxed text-neutral-800 dark:text-neutral-200 mb-2">
          "The soul becomes dyed with the color of its thoughts."
        </p>
        <span className="text-[11px] font-sans text-neutral-500 block text-right font-medium">
          — Marcus Aurelius
        </span>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="px-3 py-2 text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-2">
        <Command className="w-3.5 h-3.5" />
        <span>Press <kbd className="font-mono bg-neutral-100 dark:bg-neutral-900 px-1 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-300">C</kbd> to inscribe</span>
      </div>
    </aside>
  );
}
