import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { getAvatarUrl } from '../../lib/utils.ts';
import { getApiBaseUrl, setApiBaseUrl } from '../../services/api.ts';
import {
  Sun,
  Moon,
  Plus,
  LogIn,
  LogOut,
  User as UserIcon,
  Search,
  Server,
  Settings,
  X,
  Check,
} from 'lucide-react';

interface HeaderProps {
  onOpenCompose: () => void;
  onNavigateHome: () => void;
  onNavigateProfile: (username: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function Header({
  onOpenCompose,
  onNavigateHome,
  onNavigateProfile,
  searchQuery,
  onSearchChange,
}: HeaderProps) {
  const { user, isAuthenticated, openAuthModal, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState(getApiBaseUrl());

  const handleSaveApiUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = customApiUrl.trim();
    setApiBaseUrl(cleanUrl);
    showToast(`Live Base API URL set to ${cleanUrl}`, 'success');
    setIsConfigOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-black/85 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 text-left group cursor-pointer"
              aria-label="Go to home feed"
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-serif font-bold text-lg shadow-xs group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="font-serif font-bold text-lg tracking-tight text-neutral-900 dark:text-neutral-100 block leading-none">
                  Aphorism
                </span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400 block mt-0.5">
                  Letters & Threads
                </span>
              </div>
            </button>
          </div>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search quotes, authors, ideas..."
                className="w-full pl-9 pr-4 py-1.5 bg-neutral-100 dark:bg-neutral-900 border border-transparent focus:border-neutral-300 dark:focus:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Compose button */}
            <button
              onClick={onOpenCompose}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900 text-neutral-50 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              aria-label="Compose new quote"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Inscribe</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Auth section */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-neutral-300 dark:hover:ring-neutral-700 transition-all cursor-pointer"
                  aria-label="User account menu"
                >
                  <img
                    src={getAvatarUrl(user.username, user.avatar_url)}
                    alt={user.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-neutral-200 dark:border-neutral-800 object-cover"
                  />
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800">
                      <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">@{user.username}</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onNavigateProfile(user.username);
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-400" />
                      View Profile
                    </button>

                    

                    <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        await logout();
                        showToast('Logged out successfully.', 'info');
                      }}
                      className="w-full px-3 py-2 text-left text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-medium text-neutral-800 dark:text-neutral-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Backend Endpoint Settings Modal */}
          </>
  );
}
