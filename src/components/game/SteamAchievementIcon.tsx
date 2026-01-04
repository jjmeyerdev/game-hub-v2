'use client';

import { Lock } from 'lucide-react';

type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'very_rare' | 'ultra_rare';

interface SteamAchievementIconProps {
  variant: number;
  unlocked: boolean;
  rarity: AchievementRarity;
}

export function SteamAchievementIcon({
  variant,
  unlocked,
  rarity
}: SteamAchievementIconProps) {
  // Use unique ID based on variant to prevent gradient conflicts
  const uid = `steam-ach-${variant}`;

  // Different icon designs based on variant
  const icons = [
    // Star burst
    <svg key="star" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffaa00" />
          <stop offset="100%" stopColor="#ff8c00" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={`url(#${uid}-gold)`} opacity={unlocked ? 1 : 0.3} />
      <path d="M32 12l5 15h16l-13 9 5 15-13-10-13 10 5-15-13-9h16z" fill={unlocked ? "#fff" : "#666"} opacity={unlocked ? 0.9 : 0.5} />
    </svg>,
    // Target/Bullseye
    <svg key="target" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-red`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4444" />
          <stop offset="100%" stopColor="#cc0000" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={unlocked ? `url(#${uid}-red)` : "#333"} opacity={unlocked ? 1 : 0.5} />
      <circle cx="32" cy="32" r="20" fill="none" stroke={unlocked ? "#fff" : "#555"} strokeWidth="3" opacity={unlocked ? 0.8 : 0.4} />
      <circle cx="32" cy="32" r="12" fill="none" stroke={unlocked ? "#fff" : "#555"} strokeWidth="3" opacity={unlocked ? 0.8 : 0.4} />
      <circle cx="32" cy="32" r="4" fill={unlocked ? "#fff" : "#555"} opacity={unlocked ? 0.9 : 0.4} />
    </svg>,
    // Shield
    <svg key="shield" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-blue`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4488ff" />
          <stop offset="100%" stopColor="#0044cc" />
        </linearGradient>
      </defs>
      <path d="M32 6L8 16v16c0 14 10 24 24 30 14-6 24-16 24-30V16L32 6z" fill={unlocked ? `url(#${uid}-blue)` : "#333"} opacity={unlocked ? 1 : 0.5} />
      <path d="M32 16l-16 7v11c0 9.5 6.5 16 16 20 9.5-4 16-10.5 16-20V23L32 16z" fill={unlocked ? "#fff" : "#444"} opacity={unlocked ? 0.2 : 0.2} />
      <path d="M28 30l-4 4 8 8 12-12-4-4-8 8-4-4z" fill={unlocked ? "#fff" : "#555"} opacity={unlocked ? 0.9 : 0.4} />
    </svg>,
    // Crown
    <svg key="crown" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-purple`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9944ff" />
          <stop offset="100%" stopColor="#6600cc" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={unlocked ? `url(#${uid}-purple)` : "#333"} opacity={unlocked ? 1 : 0.5} />
      <path d="M12 40l6-18 8 8 6-12 6 12 8-8 6 18H12z" fill={unlocked ? "#ffd700" : "#555"} opacity={unlocked ? 0.9 : 0.4} />
      <rect x="12" y="40" width="40" height="6" rx="2" fill={unlocked ? "#ffd700" : "#555"} opacity={unlocked ? 0.9 : 0.4} />
    </svg>,
    // Sword
    <svg key="sword" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-steel`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#88aacc" />
          <stop offset="50%" stopColor="#ccddeeff" />
          <stop offset="100%" stopColor="#667788" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={unlocked ? "#1a1a2e" : "#222"} opacity={unlocked ? 1 : 0.5} />
      <path d="M32 8l4 32-4 4-4-4 4-32z" fill={unlocked ? `url(#${uid}-steel)` : "#444"} opacity={unlocked ? 1 : 0.4} />
      <rect x="24" y="38" width="16" height="4" rx="1" fill={unlocked ? "#8b4513" : "#444"} opacity={unlocked ? 0.9 : 0.4} />
      <rect x="28" y="42" width="8" height="12" rx="2" fill={unlocked ? "#8b4513" : "#444"} opacity={unlocked ? 0.9 : 0.4} />
    </svg>,
    // Lightning bolt
    <svg key="lightning" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-yellow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffee00" />
          <stop offset="100%" stopColor="#ffaa00" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={unlocked ? "#1a1a2e" : "#222"} opacity={unlocked ? 1 : 0.5} />
      <path d="M36 8L20 34h12l-4 22 20-28H34l2-20z" fill={unlocked ? `url(#${uid}-yellow)` : "#444"} opacity={unlocked ? 1 : 0.4} />
    </svg>,
    // Trophy cup
    <svg key="trophy" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-gold2`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffcc00" />
          <stop offset="100%" stopColor="#ff9900" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={unlocked ? "#16213e" : "#222"} opacity={unlocked ? 1 : 0.5} />
      <path d="M20 14h24v4c0 8-4 14-12 18-8-4-12-10-12-18v-4z" fill={unlocked ? `url(#${uid}-gold2)` : "#444"} opacity={unlocked ? 1 : 0.4} />
      <path d="M16 14c-4 0-6 4-6 8s2 8 6 8c0-4 1-8 2-12l-2-4z" fill={unlocked ? `url(#${uid}-gold2)` : "#444"} opacity={unlocked ? 0.8 : 0.3} />
      <path d="M48 14c4 0 6 4 6 8s-2 8-6 8c0-4-1-8-2-12l2-4z" fill={unlocked ? `url(#${uid}-gold2)` : "#444"} opacity={unlocked ? 0.8 : 0.3} />
      <rect x="28" y="36" width="8" height="8" fill={unlocked ? `url(#${uid}-gold2)` : "#444"} opacity={unlocked ? 1 : 0.4} />
      <rect x="22" y="44" width="20" height="6" rx="2" fill={unlocked ? `url(#${uid}-gold2)` : "#444"} opacity={unlocked ? 1 : 0.4} />
    </svg>,
    // Flame
    <svg key="flame" viewBox="0 0 64 64" className="w-full h-full">
      <defs>
        <linearGradient id={`${uid}-fire`} x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ff4400" />
          <stop offset="50%" stopColor="#ff8800" />
          <stop offset="100%" stopColor="#ffcc00" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={unlocked ? "#1a0a0a" : "#222"} opacity={unlocked ? 1 : 0.5} />
      <path d="M32 8c-8 12-16 20-16 32 0 8 8 16 16 16s16-8 16-16c0-12-8-20-16-32zm0 40c-4 0-8-4-8-8 0-6 4-10 8-16 4 6 8 10 8 16 0 4-4 8-8 8z" fill={unlocked ? `url(#${uid}-fire)` : "#444"} opacity={unlocked ? 1 : 0.4} />
    </svg>,
  ];

  // Get rarity-based border glow
  const glowColor = unlocked ? {
    ultra_rare: 'ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.4)]',
    very_rare: 'ring-2 ring-violet-400/50 shadow-[0_0_12px_rgba(167,139,250,0.3)]',
    rare: 'ring-2 ring-cyan-400/40 shadow-[0_0_10px_rgba(34,211,238,0.25)]',
    uncommon: 'ring-1 ring-emerald-400/30',
    common: '',
  }[rarity] : '';

  return (
    <div className={`relative w-14 h-14 rounded-lg overflow-hidden ${glowColor} ${!unlocked ? 'grayscale opacity-60' : ''}`}>
      {icons[variant % icons.length]}
      {!unlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Lock className="w-5 h-5 text-theme-muted" />
        </div>
      )}
    </div>
  );
}
