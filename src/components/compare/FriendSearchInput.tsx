'use client';

import { useState } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import type { ComparePlatform } from '@/lib/types/compare';

interface FriendSearchInputProps {
  platform: ComparePlatform;
  onSearch: (identifier: string) => Promise<void>;
  isSearching: boolean;
  onClear?: () => void;
}

const platformPlaceholders: Record<ComparePlatform, string> = {
  psn: 'Enter PSN username...',
  xbox: 'Enter Xbox gamertag...',
  steam: 'Enter Steam ID...',
};

const platformColors: Record<ComparePlatform, { border: string; focus: string; button: string }> = {
  psn: {
    border: 'focus-within:border-blue-500/50',
    focus: 'focus:ring-blue-500/20',
    button: 'bg-blue-500 hover:bg-blue-600',
  },
  xbox: {
    border: 'focus-within:border-green-500/50',
    focus: 'focus:ring-green-500/20',
    button: 'bg-green-500 hover:bg-green-600',
  },
  steam: {
    border: 'focus-within:border-slate-500/50',
    focus: 'focus:ring-slate-500/20',
    button: 'bg-slate-500 hover:bg-slate-600',
  },
};

export function FriendSearchInput({ platform, onSearch, isSearching, onClear }: FriendSearchInputProps) {
  const [value, setValue] = useState('');
  const colors = platformColors[platform];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isSearching) {
      await onSearch(value.trim());
    }
  };

  const handleClear = () => {
    setValue('');
    onClear?.();
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`flex items-center gap-2 bg-[var(--theme-bg-secondary)] border border-[var(--theme-border)] rounded-xl px-4 py-3 transition-all duration-200 ${colors.border}`}>
        <Search className="w-5 h-5 text-[var(--theme-text-subtle)] flex-shrink-0" />

        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={platformPlaceholders[platform]}
          disabled={isSearching}
          className={`flex-1 bg-transparent text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-subtle)] outline-none text-sm disabled:opacity-50`}
        />

        {value && !isSearching && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={!value.trim() || isSearching}
          className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${colors.button}`}
        >
          {isSearching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Searching...</span>
            </>
          ) : (
            <span>Compare</span>
          )}
        </button>
      </div>
    </form>
  );
}
