'use client';

import {
  Gamepad2,
  Package,
  Heart,
  X,
  Disc,
  ShieldAlert,
  Eye,
  EyeOff,
  Timer,
  Trophy,
  Star,
  FileText,
  Tag,
} from 'lucide-react';
import { PLATFORMS, CONSOLE_OPTIONS } from '@/lib/constants';
import { PRIORITY_CONFIG, STATUS_CONFIG, type PriorityKey, type StatusKey } from './config';

interface UserLibrarySectionProps {
  // Platform
  selectedPlatform: string;
  setSelectedPlatform: (value: string) => void;
  selectedConsole: string;
  setSelectedConsole: (value: string) => void;
  // Status & Priority
  selectedStatus: StatusKey;
  setSelectedStatus: (value: StatusKey) => void;
  selectedPriority: PriorityKey;
  setSelectedPriority: (value: PriorityKey) => void;
  // Ownership
  ownershipStatus: 'owned' | 'wishlist' | 'unowned';
  setOwnershipStatus: (value: 'owned' | 'wishlist' | 'unowned') => void;
  isPhysical: boolean;
  setIsPhysical: (value: boolean) => void;
  // Visibility
  isAdult: boolean;
  setIsAdult: (value: boolean) => void;
  isHidden: boolean;
  setIsHidden: (value: boolean) => void;
  // Edit mode fields
  isEditMode: boolean;
  playtimeHours?: string;
  setPlaytimeHours?: (value: string) => void;
  completionPercentage?: string;
  setCompletionPercentage?: (value: string) => void;
  personalRating?: string;
  setPersonalRating?: (value: string) => void;
  notes?: string;
  setNotes?: (value: string) => void;
  tags?: string[];
  setTags?: (value: string[]) => void;
  tagInput?: string;
  setTagInput?: (value: string) => void;
  addTag?: (tag: string) => void;
  removeTag?: (tag: string) => void;
}

export function UserLibrarySection({
  selectedPlatform,
  setSelectedPlatform,
  selectedConsole,
  setSelectedConsole,
  selectedStatus,
  setSelectedStatus,
  selectedPriority,
  setSelectedPriority,
  ownershipStatus,
  setOwnershipStatus,
  isPhysical,
  setIsPhysical,
  isAdult,
  setIsAdult,
  isHidden,
  setIsHidden,
  isEditMode,
  playtimeHours,
  setPlaytimeHours,
  completionPercentage,
  setCompletionPercentage,
  personalRating,
  setPersonalRating,
  notes,
  setNotes,
  tags,
  setTags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
}: UserLibrarySectionProps) {
  const currentPlatform = PLATFORMS.find((p) => p.id === selectedPlatform);
  const hasConsoles = currentPlatform?.hasConsoles ?? false;
  const consoleOptions = hasConsoles ? CONSOLE_OPTIONS[selectedPlatform] ?? [] : [];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-steel/30">
        <Gamepad2 className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Your Library</span>
      </div>

      {/* Platform Selection */}
      <div>
        <label className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
          <span>Platform</span>
          {selectedPlatform && (
            <button
              type="button"
              onClick={() => { setSelectedPlatform(''); setSelectedConsole(''); }}
              className="text-gray-600 hover:text-red-400 transition-colors"
            >
              Clear
            </button>
          )}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {PLATFORMS.filter(p => ['PC', 'Steam', 'PlayStation', 'Xbox', 'Epic Games', 'EA App', 'Nintendo', 'Battle.net'].includes(p.id)).sort((a, b) => a.label.localeCompare(b.label)).map((platform) => (
            <button
              key={platform.id}
              type="button"
              onClick={() => {
                if (selectedPlatform === platform.id) {
                  setSelectedPlatform('');
                  setSelectedConsole('');
                } else {
                  setSelectedPlatform(platform.id);
                  setSelectedConsole('');
                }
              }}
              className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                selectedPlatform === platform.id
                  ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                  : 'bg-abyss border border-steel/50 text-gray-400 hover:border-steel hover:text-white'
              }`}
            >
              {platform.label}
            </button>
          ))}
        </div>
        {/* Console selector */}
        {hasConsoles && consoleOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...consoleOptions].sort((a, b) => a.localeCompare(b)).map((consoleName) => (
              <button
                key={consoleName}
                type="button"
                onClick={() => {
                  if (selectedConsole === consoleName) {
                    setSelectedConsole('');
                  } else {
                    setSelectedConsole(consoleName);
                  }
                }}
                className={`px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                  selectedConsole === consoleName
                    ? 'bg-purple-500/30 border border-purple-500/50 text-purple-300'
                    : 'bg-abyss/50 border border-steel/30 text-gray-500 hover:text-white'
                }`}
              >
                {consoleName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
          <div className="space-y-1.5">
            {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([key, config]) => {
              const Icon = config.Icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedStatus(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedStatus === key
                      ? `${config.bg} ${config.color} border ${config.border}`
                      : 'bg-abyss border border-steel/50 text-gray-500 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Priority</label>
          <div className="space-y-1.5">
            {(Object.entries(PRIORITY_CONFIG) as [PriorityKey, typeof PRIORITY_CONFIG[PriorityKey]][]).map(([key, config]) => {
              const Icon = config.Icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPriority(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                    selectedPriority === key
                      ? `${config.bg} ${config.color} border ${config.border}`
                      : 'bg-abyss border border-steel/50 text-gray-500 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ownership Status */}
      <div className="space-y-1.5">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          <Package className="w-3 h-3" /> Ownership
        </label>
        <div className="relative flex bg-abyss border border-steel/50 rounded-xl p-1 overflow-hidden">
          {/* Sliding background indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(33.333%-3px)] rounded-lg transition-all duration-300 ease-out ${
              ownershipStatus === 'owned'
                ? 'left-1 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
                : ownershipStatus === 'wishlist'
                ? 'left-[calc(33.333%+1px)] bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg shadow-rose-500/30'
                : 'left-[calc(66.666%+1px)] bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg shadow-gray-500/20'
            }`}
          />
          <button
            type="button"
            onClick={() => setOwnershipStatus('owned')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
              ownershipStatus === 'owned' ? 'text-void font-bold' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Package className={`w-3.5 h-3.5 transition-transform ${ownershipStatus === 'owned' ? 'scale-110' : ''}`} />
            <span className="text-xs">Owned</span>
          </button>
          <button
            type="button"
            onClick={() => setOwnershipStatus('wishlist')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
              ownershipStatus === 'wishlist' ? 'text-void font-bold' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 transition-transform ${ownershipStatus === 'wishlist' ? 'scale-110 fill-current' : ''}`} />
            <span className="text-xs">Wishlist</span>
          </button>
          <button
            type="button"
            onClick={() => setOwnershipStatus('unowned')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
              ownershipStatus === 'unowned' ? 'text-white font-bold' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <X className={`w-3.5 h-3.5 transition-transform ${ownershipStatus === 'unowned' ? 'scale-110' : ''}`} />
            <span className="text-xs">Unowned</span>
          </button>
        </div>
      </div>

      {/* Physical Copy Toggle */}
      <button
        type="button"
        onClick={() => setIsPhysical(!isPhysical)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
          isPhysical
            ? 'bg-amber-500/20 border border-amber-500/50'
            : 'bg-abyss border border-steel/50 hover:border-steel'
        }`}
      >
        <div className="flex items-center gap-2">
          <Disc className={`w-4 h-4 ${isPhysical ? 'text-amber-400' : 'text-gray-500'}`} />
          <span className={`text-sm font-medium ${isPhysical ? 'text-amber-300' : 'text-gray-400'}`}>
            Physical Copy
          </span>
        </div>
        <div className={`w-10 h-5 rounded-full transition-all ${isPhysical ? 'bg-amber-500' : 'bg-steel'}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${isPhysical ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
        </div>
      </button>

      {/* Adult Content Toggle */}
      <button
        type="button"
        onClick={() => setIsAdult(!isAdult)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
          isAdult
            ? 'bg-rose-500/20 border border-rose-500/50'
            : 'bg-abyss border border-steel/50 hover:border-steel'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-4 h-4 ${isAdult ? 'text-rose-400' : 'text-gray-500'}`} />
          <div className="flex flex-col items-start">
            <span className={`text-sm font-medium ${isAdult ? 'text-rose-300' : 'text-gray-400'}`}>
              Adult Content
            </span>
            <span className="text-[10px] text-gray-600">
              Hides game and blurs cover
            </span>
          </div>
        </div>
        <div className={`w-10 h-5 rounded-full transition-all ${isAdult ? 'bg-rose-500' : 'bg-steel'}`}>
          <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${isAdult ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
        </div>
      </button>

      {/* Edit Mode: Additional Fields */}
      {isEditMode && (
        <>
          {/* Playtime + Completion + Rating */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                <Timer className="w-3 h-3" /> Hours
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={playtimeHours ?? ''}
                  onChange={(e) => setPlaytimeHours?.(e.target.value)}
                  min="0"
                  step="0.1"
                  placeholder="0"
                  className="w-full px-3 py-2.5 pr-7 bg-abyss border border-steel/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                />
                {playtimeHours && (
                  <button
                    type="button"
                    onClick={() => setPlaytimeHours?.('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                <Trophy className="w-3 h-3" /> Complete
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={completionPercentage ?? ''}
                  onChange={(e) => setCompletionPercentage?.(e.target.value)}
                  min="0"
                  max="100"
                  placeholder="0"
                  className="w-full px-3 py-2.5 pr-12 bg-abyss border border-steel/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                />
                <span className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                {completionPercentage && (
                  <button
                    type="button"
                    onClick={() => setCompletionPercentage?.('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                <Star className="w-3 h-3" /> Rating
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={personalRating ?? ''}
                  onChange={(e) => setPersonalRating?.(e.target.value)}
                  min="1"
                  max="10"
                  placeholder="—"
                  className="w-full px-3 py-2.5 pr-12 bg-abyss border border-steel/50 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/50 font-mono"
                />
                <span className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">/10</span>
                {personalRating && (
                  <button
                    type="button"
                    onClick={() => setPersonalRating?.('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Hidden Toggle */}
          <button
            type="button"
            onClick={() => setIsHidden(!isHidden)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
              isHidden
                ? 'bg-purple-500/20 border border-purple-500/50'
                : 'bg-abyss border border-steel/50 hover:border-steel'
            }`}
          >
            <div className="flex items-center gap-2">
              {isHidden ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-gray-500" />}
              <span className={`text-sm font-medium ${isHidden ? 'text-purple-300' : 'text-gray-400'}`}>
                {isHidden ? 'Hidden from library' : 'Visible in library'}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-all ${isHidden ? 'bg-purple-500' : 'bg-steel'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-all ${isHidden ? 'translate-x-5' : 'translate-x-0.5'} mt-0.5`} />
            </div>
          </button>

          {/* Notes */}
          <div>
            <label className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Notes</span>
              {notes && (
                <button
                  type="button"
                  onClick={() => setNotes?.('')}
                  className="text-gray-600 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              )}
            </label>
            <textarea
              value={notes ?? ''}
              onChange={(e) => setNotes?.(e.target.value)}
              placeholder="Your thoughts..."
              rows={2}
              className="w-full px-3 py-2.5 bg-abyss border border-steel/50 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 text-sm resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Tags</span>
              <span className="flex items-center gap-2">
                {tags && tags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTags?.([])}
                    className="text-gray-600 hover:text-red-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <span className="text-gray-600">{tags?.length ?? 0}/10</span>
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-abyss border border-steel/50 rounded-lg min-h-[42px]">
              {tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 rounded text-xs text-cyan-300"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  <button type="button" onClick={() => removeTag?.(tag)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput ?? ''}
                onChange={(e) => setTagInput?.(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag?.(tagInput ?? ''); }
                  else if (e.key === 'Backspace' && tagInput === '' && tags && tags.length > 0) removeTag?.(tags[tags.length - 1]);
                }}
                placeholder={!tags || tags.length === 0 ? "Add tags..." : ""}
                disabled={tags && tags.length >= 10}
                className="flex-1 min-w-[80px] bg-transparent text-sm text-white placeholder:text-gray-600 outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
