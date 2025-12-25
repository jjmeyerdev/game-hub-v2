'use client';

import Image from 'next/image';
import {
  RefreshCw,
  Loader2,
  ImageIcon,
  Sparkles,
  X,
  Building2,
  Calendar,
  FileText,
  Lock,
  Unlock,
  Tag,
} from 'lucide-react';

interface GameMetadataSectionProps {
  title: string;
  setTitle: (value: string) => void;
  coverUrl: string;
  setCoverUrl: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  developer: string;
  setDeveloper: (value: string) => void;
  releaseDate: string;
  setReleaseDate: (value: string) => void;
  genres: string[];
  setGenres: (value: string[]) => void;
  genreInput: string;
  setGenreInput: (value: string) => void;
  addGenre: (genre: string) => void;
  removeGenre: (genre: string) => void;
  isFieldLocked: (field: string) => boolean;
  toggleFieldLock: (field: string) => void;
  onRefreshFromIGDB: () => void;
  refreshingMetadata: boolean;
  isEditMode: boolean;
  onUpdateCoverFromIGDB?: () => void;
  updatingCover?: boolean;
}

function FieldLabel({
  children,
  icon: Icon,
  isLocked,
  onToggleLock,
  required,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  isLocked?: boolean;
  onToggleLock?: () => void;
  required?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider">
        {Icon && <Icon className="w-3 h-3" />}
        {children}
        {required && <span className="text-red-400">*</span>}
      </label>
      {onToggleLock && (
        <button
          type="button"
          onClick={onToggleLock}
          className={`p-1 rounded transition-all ${isLocked ? 'text-amber-400 bg-amber-500/10' : 'text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-muted)]'}`}
          title={isLocked ? 'Unlock field' : 'Lock from IGDB updates'}
        >
          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
        </button>
      )}
    </div>
  );
}

function InputField({
  value,
  onChange,
  onClear,
  placeholder,
  isLocked,
  type = 'text',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  isLocked?: boolean;
  type?: 'text' | 'url' | 'date';
  className?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 bg-[var(--theme-hover-bg)] border rounded-lg text-[var(--theme-text-primary)] text-sm placeholder:text-[var(--theme-text-subtle)] focus:outline-none focus:border-[var(--theme-border-hover)] focus:bg-[var(--theme-active-bg)] transition-all ${isLocked ? 'border-amber-500/30' : 'border-[var(--theme-border)]'} ${type === 'date' ? '[color-scheme:dark]' : ''} ${className}`}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-muted)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export function GameMetadataSection({
  title,
  setTitle,
  coverUrl,
  setCoverUrl,
  description,
  setDescription,
  developer,
  setDeveloper,
  releaseDate,
  setReleaseDate,
  genres,
  setGenres,
  genreInput,
  setGenreInput,
  addGenre,
  removeGenre,
  isFieldLocked,
  toggleFieldLock,
  onRefreshFromIGDB,
  refreshingMetadata,
  isEditMode,
  onUpdateCoverFromIGDB,
  updatingCover,
}: GameMetadataSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--theme-border)]">
        <span className="text-xs font-medium text-[var(--theme-text-muted)]">Game Info</span>
        <button
          type="button"
          onClick={onRefreshFromIGDB}
          disabled={refreshingMetadata || !title.trim()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[var(--theme-hover-bg)] hover:bg-[var(--theme-active-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)] rounded-lg text-[10px] font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {refreshingMetadata ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {refreshingMetadata ? 'Fetching...' : 'Refresh from IGDB'}
        </button>
      </div>

      {/* Cover + Title Row */}
      <div className="flex gap-4">
        {/* Cover Preview */}
        <div className="flex-shrink-0">
          <div className="w-24 h-32 bg-[var(--theme-hover-bg)] rounded-xl overflow-hidden border border-[var(--theme-border)] relative group">
            {coverUrl ? (
              <Image src={coverUrl} alt="Cover" fill className="object-cover" sizes="96px" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-[var(--theme-text-subtle)]">
                <ImageIcon className="w-8 h-8 mb-1" />
                <span className="text-[10px]">No Cover</span>
              </div>
            )}
          </div>
          {isEditMode && onUpdateCoverFromIGDB && (
            <button
              type="button"
              onClick={onUpdateCoverFromIGDB}
              disabled={updatingCover || !title.trim()}
              className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-[var(--theme-hover-bg)] hover:bg-[var(--theme-active-bg)] border border-[var(--theme-border)] rounded-lg text-[10px] font-medium text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] transition-all disabled:opacity-30"
            >
              {updatingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {updatingCover ? 'Updating...' : 'Get Cover'}
            </button>
          )}
        </div>

        {/* Title + Cover URL */}
        <div className="flex-1 space-y-3">
          <div>
            <FieldLabel required isLocked={isFieldLocked('title')} onToggleLock={() => toggleFieldLock('title')}>
              Title
            </FieldLabel>
            <InputField
              value={title}
              onChange={setTitle}
              onClear={() => setTitle('')}
              placeholder="Game title..."
              isLocked={isFieldLocked('title')}
            />
          </div>
          <div>
            <FieldLabel isLocked={isFieldLocked('cover')} onToggleLock={() => toggleFieldLock('cover')}>
              Cover URL
            </FieldLabel>
            <InputField
              value={coverUrl}
              onChange={setCoverUrl}
              onClear={() => setCoverUrl('')}
              placeholder="https://..."
              type="url"
              isLocked={isFieldLocked('cover')}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Developer */}
      <div>
        <FieldLabel icon={Building2} isLocked={isFieldLocked('developer')} onToggleLock={() => toggleFieldLock('developer')}>
          Developer
        </FieldLabel>
        <InputField
          value={developer}
          onChange={setDeveloper}
          onClear={() => setDeveloper('')}
          placeholder="Studio name..."
          isLocked={isFieldLocked('developer')}
        />
      </div>

      {/* Release Date */}
      <div>
        <FieldLabel icon={Calendar} isLocked={isFieldLocked('releaseDate')} onToggleLock={() => toggleFieldLock('releaseDate')}>
          Release Date
        </FieldLabel>
        <InputField
          value={releaseDate}
          onChange={setReleaseDate}
          onClear={() => setReleaseDate('')}
          type="date"
          isLocked={isFieldLocked('releaseDate')}
        />
      </div>

      {/* Genres */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider">
            <Tag className="w-3 h-3" /> Genres
          </label>
          <div className="flex items-center gap-2">
            {genres.length > 0 && (
              <button
                type="button"
                onClick={() => setGenres([])}
                className="text-[10px] text-[var(--theme-text-subtle)] hover:text-red-400/70 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleFieldLock('genres')}
              className={`p-1 rounded transition-all ${isFieldLocked('genres') ? 'text-amber-400 bg-amber-500/10' : 'text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-muted)]'}`}
            >
              {isFieldLocked('genres') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className={`flex flex-wrap gap-1.5 p-2.5 bg-[var(--theme-hover-bg)] border rounded-lg min-h-[42px] ${isFieldLocked('genres') ? 'border-amber-500/30' : 'border-[var(--theme-border)]'}`}>
          {genres.map((genre) => (
            <span
              key={genre}
              className="inline-flex items-center gap-1 px-2 py-1 bg-violet-500/10 border border-violet-500/20 rounded text-xs text-violet-400/80"
            >
              {genre}
              <button type="button" onClick={() => removeGenre(genre)} className="hover:text-[var(--theme-text-primary)] transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={genreInput}
            onChange={(e) => setGenreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); addGenre(genreInput); }
            }}
            placeholder={genres.length === 0 ? "Add genre..." : ""}
            className="flex-1 min-w-[80px] bg-transparent text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-subtle)] outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider">
            <FileText className="w-3 h-3" /> Description
          </label>
          <div className="flex items-center gap-2">
            {description && (
              <button
                type="button"
                onClick={() => setDescription('')}
                className="text-[10px] text-[var(--theme-text-subtle)] hover:text-red-400/70 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleFieldLock('description')}
              className={`p-1 rounded transition-all ${isFieldLocked('description') ? 'text-amber-400 bg-amber-500/10' : 'text-[var(--theme-text-subtle)] hover:text-[var(--theme-text-muted)]'}`}
            >
              {isFieldLocked('description') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Game description..."
          rows={3}
          className={`w-full px-3 py-2.5 bg-[var(--theme-hover-bg)] border rounded-lg text-[var(--theme-text-primary)] text-sm placeholder:text-[var(--theme-text-subtle)] focus:outline-none focus:border-[var(--theme-border-hover)] focus:bg-[var(--theme-active-bg)] resize-none transition-all ${isFieldLocked('description') ? 'border-amber-500/30' : 'border-[var(--theme-border)]'}`}
        />
      </div>
    </div>
  );
}
