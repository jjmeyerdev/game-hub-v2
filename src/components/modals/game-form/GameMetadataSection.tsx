'use client';

import {
  Layers,
  RefreshCw,
  Loader2,
  Image,
  Sparkles,
  X,
  Building2,
  Calendar,
  FileText,
  Lock,
  Unlock,
} from 'lucide-react';

interface GameMetadataSectionProps {
  // Game metadata
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
  // Field locking
  isFieldLocked: (field: string) => boolean;
  toggleFieldLock: (field: string) => void;
  // Actions
  onRefreshFromIGDB: () => void;
  refreshingMetadata: boolean;
  // Edit mode specific
  isEditMode: boolean;
  onUpdateCoverFromIGDB?: () => void;
  updatingCover?: boolean;
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
      <div className="flex items-center justify-between pb-2 border-b border-steel/30">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Game Info</span>
        </div>
        <button
          type="button"
          onClick={onRefreshFromIGDB}
          disabled={refreshingMetadata || !title.trim()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[10px] font-semibold text-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          title="Refresh all metadata from IGDB"
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
          <div className="w-24 h-32 bg-deep rounded-xl overflow-hidden border-2 border-steel/50 relative group">
            {coverUrl ? (
              <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                <Image className="w-8 h-8 mb-1" />
                <span className="text-[10px]">No Cover</span>
              </div>
            )}
            {/* Scanline effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
          {isEditMode && onUpdateCoverFromIGDB && (
            <button
              type="button"
              onClick={onUpdateCoverFromIGDB}
              disabled={updatingCover}
              className="w-full mt-2 flex items-center justify-center gap-1 px-2 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-[10px] font-semibold text-cyan-400 transition-all disabled:opacity-50"
            >
              {updatingCover ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              {updatingCover ? 'Updating...' : 'Get Cover'}
            </button>
          )}
        </div>

        {/* Title + Cover URL */}
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <span>Title <span className="text-red-400">*</span></span>
              <button
                type="button"
                onClick={() => toggleFieldLock('title')}
                className={`p-1 rounded transition-all ${isFieldLocked('title') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                title={isFieldLocked('title') ? 'Unlock field' : 'Lock field from IGDB updates'}
              >
                {isFieldLocked('title') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Game title..."
                className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm ${isFieldLocked('title') ? 'border-amber-500/50' : 'border-steel/50'}`}
                required
              />
              {title && (
                <button
                  type="button"
                  onClick={() => setTitle('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <span>Cover URL</span>
              <button
                type="button"
                onClick={() => toggleFieldLock('cover')}
                className={`p-1 rounded transition-all ${isFieldLocked('cover') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
                title={isFieldLocked('cover') ? 'Unlock field' : 'Lock field from IGDB updates'}
              >
                {isFieldLocked('cover') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </button>
            </div>
            <div className="relative">
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm font-mono ${isFieldLocked('cover') ? 'border-amber-500/50' : 'border-steel/50'}`}
              />
              {coverUrl && (
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Developer */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5"><Building2 className="w-3 h-3" /> Developer</span>
          <button
            type="button"
            onClick={() => toggleFieldLock('developer')}
            className={`p-1 rounded transition-all ${isFieldLocked('developer') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
            title={isFieldLocked('developer') ? 'Unlock field' : 'Lock field from IGDB updates'}
          >
            {isFieldLocked('developer') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={developer}
            onChange={(e) => setDeveloper(e.target.value)}
            placeholder="Studio name..."
            className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm ${isFieldLocked('developer') ? 'border-amber-500/50' : 'border-steel/50'}`}
          />
          {developer && (
            <button
              type="button"
              onClick={() => setDeveloper('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Release Date */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Release Date</span>
          <button
            type="button"
            onClick={() => toggleFieldLock('releaseDate')}
            className={`p-1 rounded transition-all ${isFieldLocked('releaseDate') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
            title={isFieldLocked('releaseDate') ? 'Unlock field' : 'Lock field from IGDB updates'}
          >
            {isFieldLocked('releaseDate') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
          </button>
        </div>
        <div className="relative">
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className={`w-full px-3 py-2.5 pr-8 bg-abyss border rounded-lg text-white focus:outline-none focus:border-cyan-500/50 text-sm [color-scheme:dark] ${isFieldLocked('releaseDate') ? 'border-amber-500/50' : 'border-steel/50'}`}
          />
          {releaseDate && (
            <button
              type="button"
              onClick={() => setReleaseDate('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Genres */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Genres</span>
          <div className="flex items-center gap-2">
            {genres.length > 0 && (
              <button
                type="button"
                onClick={() => setGenres([])}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleFieldLock('genres')}
              className={`p-1 rounded transition-all ${isFieldLocked('genres') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
              title={isFieldLocked('genres') ? 'Unlock field' : 'Lock field from IGDB updates'}
            >
              {isFieldLocked('genres') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className={`flex flex-wrap gap-1.5 p-2.5 bg-abyss border rounded-lg min-h-[42px] ${isFieldLocked('genres') ? 'border-amber-500/50' : 'border-steel/50'}`}>
          {genres.map((genre) => (
            <span
              key={genre}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/40 rounded text-xs text-purple-300"
            >
              {genre}
              <button type="button" onClick={() => removeGenre(genre)} className="hover:text-white">
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
            className="flex-1 min-w-[80px] bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
          <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Description</span>
          <div className="flex items-center gap-2">
            {description && (
              <button
                type="button"
                onClick={() => setDescription('')}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleFieldLock('description')}
              className={`p-1 rounded transition-all ${isFieldLocked('description') ? 'text-amber-400 bg-amber-500/20' : 'text-gray-600 hover:text-gray-400'}`}
              title={isFieldLocked('description') ? 'Unlock field' : 'Lock field from IGDB updates'}
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
          className={`w-full px-3 py-2.5 bg-abyss border rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm resize-none ${isFieldLocked('description') ? 'border-amber-500/50' : 'border-steel/50'}`}
        />
      </div>
    </div>
  );
}
