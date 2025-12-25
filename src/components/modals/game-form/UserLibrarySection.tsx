'use client';

import {
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
import { getPlatformBrandStyle, getPlatformBrandStyleSubtle } from '@/lib/constants/platforms';
import { PRIORITY_CONFIG, STATUS_CONFIG, type PriorityKey, type StatusKey } from './config';

interface UserLibrarySectionProps {
  selectedPlatform: string;
  setSelectedPlatform: (value: string) => void;
  selectedConsole: string;
  setSelectedConsole: (value: string) => void;
  selectedStatus: StatusKey;
  setSelectedStatus: (value: StatusKey) => void;
  selectedPriority: PriorityKey;
  setSelectedPriority: (value: PriorityKey) => void;
  ownershipStatus: 'owned' | 'wishlist' | 'unowned';
  setOwnershipStatus: (value: 'owned' | 'wishlist' | 'unowned') => void;
  isPhysical: boolean;
  setIsPhysical: (value: boolean) => void;
  isAdult: boolean;
  setIsAdult: (value: boolean) => void;
  isHidden: boolean;
  setIsHidden: (value: boolean) => void;
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

function Toggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
  color = 'cyan',
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: 'cyan' | 'amber' | 'rose' | 'violet';
}) {
  const colorClasses = {
    cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500/30', text: 'text-cyan-400', bgActive: 'bg-cyan-500/10' },
    amber: { bg: 'bg-amber-500', border: 'border-amber-500/30', text: 'text-amber-400', bgActive: 'bg-amber-500/10' },
    rose: { bg: 'bg-rose-500', border: 'border-rose-500/30', text: 'text-rose-400', bgActive: 'bg-rose-500/10' },
    violet: { bg: 'bg-violet-500', border: 'border-violet-500/30', text: 'text-violet-400', bgActive: 'bg-violet-500/10' },
  };
  const c = colorClasses[color];

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
        checked
          ? `${c.bgActive} border ${c.border}`
          : 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] hover:border-[var(--theme-border-hover)]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`w-4 h-4 ${checked ? c.text : 'text-[var(--theme-text-subtle)]'}`} />
        <div className="text-left">
          <span className={`text-sm font-medium ${checked ? c.text : 'text-[var(--theme-text-muted)]'}`}>{label}</span>
          {description && (
            <p className="text-[10px] text-[var(--theme-text-subtle)] mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <div className={`w-9 h-5 rounded-full transition-all ${checked ? c.bg : 'bg-[var(--theme-hover-bg)]'}`}>
        <div className={`w-4 h-4 rounded-full bg-[var(--theme-text-primary)] shadow-sm transform transition-all ${checked ? 'translate-x-4' : 'translate-x-0.5'} mt-0.5`} />
      </div>
    </button>
  );
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
      <div className="pb-3 border-b border-[var(--theme-border)]">
        <span className="text-xs font-medium text-[var(--theme-text-muted)]">Your Library</span>
      </div>

      {/* Platform Selection */}
      <div>
        <label className="flex items-center justify-between text-[11px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-2">
          <span>Platform</span>
          {selectedPlatform && (
            <button
              type="button"
              onClick={() => { setSelectedPlatform(''); setSelectedConsole(''); }}
              className="text-[10px] text-[var(--theme-text-subtle)] hover:text-red-400/70 transition-colors normal-case"
            >
              Clear
            </button>
          )}
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          {PLATFORMS.filter(p => ['PC', 'Steam', 'PlayStation', 'Xbox', 'Epic Games', 'EA App', 'Nintendo', 'Battle.net', 'GOG', 'Ubisoft Connect'].includes(p.id)).sort((a, b) => a.label.localeCompare(b.label)).map((platform) => {
            const brandStyle = getPlatformBrandStyle(platform.id);
            const subtleStyle = getPlatformBrandStyleSubtle(platform.id);
            const isSelected = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedPlatform('');
                    setSelectedConsole('');
                  } else {
                    setSelectedPlatform(platform.id);
                    setSelectedConsole('');
                  }
                }}
                className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all border ${
                  isSelected
                    ? `${brandStyle.bg} ${brandStyle.text} ${brandStyle.border} ${brandStyle.glow ?? ''}`
                    : `${subtleStyle.bg} ${subtleStyle.border} ${subtleStyle.text} hover:brightness-125`
                }`}
              >
                {platform.label}
              </button>
            );
          })}
        </div>
        {/* Console selector */}
        {hasConsoles && consoleOptions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[...consoleOptions].sort((a, b) => a.localeCompare(b)).map((consoleName) => {
              const brandStyle = getPlatformBrandStyle(selectedPlatform);
              const subtleStyle = getPlatformBrandStyleSubtle(selectedPlatform);
              const isSelected = selectedConsole === consoleName;
              return (
                <button
                  key={consoleName}
                  type="button"
                  onClick={() => setSelectedConsole(isSelected ? '' : consoleName)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border ${
                    isSelected
                      ? `${brandStyle.bg} ${brandStyle.text} ${brandStyle.border} ${brandStyle.glow ?? ''}`
                      : `${subtleStyle.bg} ${subtleStyle.border} ${subtleStyle.text} hover:brightness-125`
                  }`}
                >
                  {consoleName}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        {/* Status */}
        <div>
          <label className="block text-[11px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-2">Status</label>
          <div className="space-y-1">
            {(Object.entries(STATUS_CONFIG) as [StatusKey, typeof STATUS_CONFIG[StatusKey]][]).map(([key, config]) => {
              const Icon = config.Icon;
              const isSelected = selectedStatus === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedStatus(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-[var(--theme-text-primary)] text-[var(--theme-bg-primary)]'
                      : 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-hover)]'
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
          <label className="block text-[11px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-2">Priority</label>
          <div className="space-y-1">
            {(Object.entries(PRIORITY_CONFIG) as [PriorityKey, typeof PRIORITY_CONFIG[PriorityKey]][]).map(([key, config]) => {
              const Icon = config.Icon;
              const isSelected = selectedPriority === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPriority(key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
                    isSelected
                      ? 'bg-[var(--theme-text-primary)] text-[var(--theme-bg-primary)]'
                      : 'bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)] hover:border-[var(--theme-border-hover)]'
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
      <div>
        <label className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-2">
          <Package className="w-3 h-3" /> Ownership
        </label>
        <div className="relative flex bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-xl p-1 overflow-hidden">
          {/* Sliding indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(33.333%-3px)] rounded-lg transition-all duration-200 ease-out bg-[var(--theme-text-primary)] ${
              ownershipStatus === 'owned' ? 'left-1' : ownershipStatus === 'wishlist' ? 'left-[calc(33.333%+1px)]' : 'left-[calc(66.666%+1px)]'
            }`}
          />
          <button
            type="button"
            onClick={() => setOwnershipStatus('owned')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
              ownershipStatus === 'owned' ? 'text-[var(--theme-bg-primary)] font-semibold' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span className="text-xs">Owned</span>
          </button>
          <button
            type="button"
            onClick={() => setOwnershipStatus('wishlist')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
              ownershipStatus === 'wishlist' ? 'text-[var(--theme-bg-primary)] font-semibold' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${ownershipStatus === 'wishlist' ? 'fill-current' : ''}`} />
            <span className="text-xs">Wishlist</span>
          </button>
          <button
            type="button"
            onClick={() => setOwnershipStatus('unowned')}
            className={`relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg transition-all z-10 ${
              ownershipStatus === 'unowned' ? 'text-[var(--theme-bg-primary)] font-semibold' : 'text-[var(--theme-text-muted)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            <span className="text-xs">Unowned</span>
          </button>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2">
        <Toggle
          checked={isPhysical}
          onChange={setIsPhysical}
          label="Physical Copy"
          icon={Disc}
          color="amber"
        />
        <Toggle
          checked={isAdult}
          onChange={setIsAdult}
          label="Adult Content"
          description="Hides game and blurs cover"
          icon={ShieldAlert}
          color="rose"
        />
      </div>

      {/* Edit Mode: Additional Fields */}
      {isEditMode && (
        <>
          {/* Playtime + Completion + Rating */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="flex items-center gap-1 text-[10px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-1.5">
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
                  className="w-full px-3 py-2.5 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-primary)] text-sm focus:outline-none focus:border-[var(--theme-border-hover)] font-mono"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-1.5">
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
                  className="w-full px-3 py-2.5 pr-8 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-primary)] text-sm focus:outline-none focus:border-[var(--theme-border-hover)] font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-subtle)] text-xs">%</span>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-1 text-[10px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-1.5">
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
                  className="w-full px-3 py-2.5 pr-10 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-primary)] text-sm focus:outline-none focus:border-[var(--theme-border-hover)] font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--theme-text-subtle)] text-[10px]">/10</span>
              </div>
            </div>
          </div>

          {/* Hidden Toggle */}
          <Toggle
            checked={isHidden}
            onChange={setIsHidden}
            label={isHidden ? 'Hidden from library' : 'Visible in library'}
            icon={isHidden ? EyeOff : Eye}
            color="violet"
          />

          {/* Notes */}
          <div>
            <label className="flex items-center justify-between text-[10px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> Notes</span>
              {notes && (
                <button
                  type="button"
                  onClick={() => setNotes?.('')}
                  className="text-[var(--theme-text-subtle)] hover:text-red-400/70 transition-colors"
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
              className="w-full px-3 py-2.5 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-lg text-[var(--theme-text-primary)] text-sm placeholder:text-[var(--theme-text-subtle)] focus:outline-none focus:border-[var(--theme-border-hover)] resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center justify-between text-[10px] font-medium text-[var(--theme-text-subtle)] uppercase tracking-wider mb-1.5">
              <span className="flex items-center gap-1.5"><Tag className="w-3 h-3" /> Tags</span>
              <span className="flex items-center gap-2">
                {tags && tags.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setTags?.([])}
                    className="text-[var(--theme-text-subtle)] hover:text-red-400/70 transition-colors"
                  >
                    Clear all
                  </button>
                )}
                <span className="text-[var(--theme-text-subtle)]">{tags?.length ?? 0}/10</span>
              </span>
            </label>
            <div className="flex flex-wrap gap-1.5 p-2.5 bg-[var(--theme-hover-bg)] border border-[var(--theme-border)] rounded-lg min-h-[42px]">
              {tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded text-xs text-cyan-400/80"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                  <button type="button" onClick={() => removeTag?.(tag)} className="hover:text-[var(--theme-text-primary)] transition-colors">
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
                className="flex-1 min-w-[80px] bg-transparent text-sm text-[var(--theme-text-primary)] placeholder:text-[var(--theme-text-subtle)] outline-none disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
