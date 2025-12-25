export const PLATFORMS = [
  { id: 'PC', label: 'PC', color: 'from-gray-500 to-slate-600', hasConsoles: false },
  { id: 'Steam', label: 'Steam', color: 'from-blue-500 to-blue-600', hasConsoles: false },
  { id: 'PlayStation', label: 'PlayStation', color: 'from-blue-600 to-indigo-600', hasConsoles: true },
  { id: 'Xbox', label: 'Xbox', color: 'from-green-500 to-emerald-600', hasConsoles: true },
  { id: 'Epic Games', label: 'Epic Games', color: 'from-slate-600 to-slate-700', hasConsoles: false },
  { id: 'EA App', label: 'EA App', color: 'from-red-600 to-rose-600', hasConsoles: false },
  { id: 'Nintendo', label: 'Nintendo', color: 'from-red-500 to-red-600', hasConsoles: true },
  { id: 'Battle.net', label: 'Battle.net', color: 'from-blue-500 to-cyan-500', hasConsoles: false },
  { id: 'GOG', label: 'GOG', color: 'from-purple-600 to-violet-600', hasConsoles: false },
  { id: 'Ubisoft Connect', label: 'Ubisoft Connect', color: 'from-blue-400 to-blue-600', hasConsoles: false },
  { id: 'Physical', label: 'Physical Copy', color: 'from-amber-500 to-orange-500', hasConsoles: true },
] as const;

export const CONSOLE_OPTIONS: Record<string, readonly string[]> = {
  PlayStation: [
    'PS5',
    'PS4',
    'PS3',
    'PS2',
    'PS1',
  ],
  Xbox: [
    'Xbox Series X|S',
    'Xbox One',
    'Xbox 360',
    'Xbox',
  ],
  Nintendo: [
    'Switch 2',
    'Switch',
    'Wii U',
    '3DS',
  ],
  Physical: [
    'PlayStation 5',
    'PlayStation 4',
    'PlayStation 3',
    'PlayStation 2',
    'PlayStation 1',
    'Xbox Series X/S',
    'Xbox One',
    'Xbox 360',
    'Xbox',
    'Nintendo Switch',
    'Wii U',
    'Wii',
    'GameCube',
    'Nintendo 64',
    'PC DVD-ROM',
  ],
} as const;

export const STATUSES = [
  { id: 'unplayed', label: 'Unplayed', icon: '○' },
  { id: 'playing', label: 'Playing', icon: '▶' },
  { id: 'played', label: 'Played', icon: '●' },
  { id: 'completed', label: 'Completed', icon: '✓' },
  { id: 'finished', label: 'Finished', icon: '⚑' },
  { id: 'on_hold', label: 'On Hold', icon: '⏸' },
] as const;

export const PRIORITIES = [
  { id: 'high', label: 'High', color: 'from-red-500 to-orange-500', bgColor: 'bg-red-500', textColor: 'text-red-400', borderColor: 'border-red-500' },
  { id: 'medium', label: 'Medium', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-500', textColor: 'text-yellow-400', borderColor: 'border-yellow-500' },
  { id: 'low', label: 'Low', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-500' },
  { id: 'none', label: 'No Priority', color: 'from-gray-500 to-gray-600', bgColor: 'bg-gray-500', textColor: 'text-gray-400', borderColor: 'border-gray-500' },
  { id: 'finished', label: 'Finished', color: 'from-emerald-500 to-green-500', bgColor: 'bg-emerald-500', textColor: 'text-emerald-400', borderColor: 'border-emerald-500' },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]['id'];
export type StatusId = (typeof STATUSES)[number]['id'];
export type PriorityId = (typeof PRIORITIES)[number]['id'];

// Platforms that can have active session tracking (PC platforms)
export const PC_PLATFORMS = ['Steam', 'Windows', 'Epic Games', 'EA App', 'Battle.net', 'GOG', 'Xbox Game Pass'] as const;

export function isPcPlatform(platform: string): boolean {
  // Check if the platform starts with any PC platform name
  return PC_PLATFORMS.some(pcPlatform =>
    platform === pcPlatform || platform.startsWith(pcPlatform)
  );
}

// Library filter constants
export const LIBRARY_FILTER_PLATFORMS = ['All', 'Steam', 'PlayStation', 'Xbox', 'Nintendo', 'Windows', 'Epic Games', 'EA App', 'GOG', 'Battle.net', 'Ubisoft Connect', 'Physical'] as const;

// Sync source filter options
export const SYNC_SOURCE_OPTIONS = [
  { id: 'all', label: 'All Sources', icon: null },
  { id: 'steam', label: 'Steam', icon: 'steam' },
  { id: 'psn', label: 'PlayStation', icon: 'psn' },
  { id: 'xbox', label: 'Xbox', icon: 'xbox' },
  { id: 'epic', label: 'Epic', icon: 'epic' },
  { id: 'manual', label: 'Manual', icon: 'manual' },
] as const;

export type SyncSourceId = (typeof SYNC_SOURCE_OPTIONS)[number]['id'];

export type SortOption = 'title-asc' | 'title-desc' | 'recent' | 'completion-asc' | 'completion-desc' | 'playtime-asc' | 'playtime-desc' | 'priority-high' | 'priority-low' | 'release-newest' | 'release-oldest';

// Priority order mapping for sorting (finished is lowest priority since game is done)
export const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3, finished: 4 };

// Console generation hierarchy for advanced filtering
export interface ConsoleInfo {
  id: string;
  label: string;
  year: string;
}

export interface ConsoleGeneration {
  family: string;
  icon: string;
  gradient: string;
  glow: string;
  consoles: ConsoleInfo[];
}

// Platform brand colors for badges
export interface PlatformBrandStyle {
  bg: string;
  text: string;
  border: string;
  glow?: string;
}

export function getPlatformBrandStyle(platform: string): PlatformBrandStyle {
  const p = platform.toLowerCase();

  // Steam
  if (p.includes('steam')) {
    return {
      bg: 'bg-[#1a9fff]',
      text: 'text-white',
      border: 'border-[#66c0f4]/50',
      glow: 'shadow-[0_0_20px_rgba(26,159,255,0.5),0_0_40px_rgba(26,159,255,0.2)]',
    };
  }

  // PlayStation (PS5, PS4, PS3, etc.)
  if (p.includes('playstation') || p.includes('ps5') || p.includes('ps4') || p.includes('ps3') || p.includes('ps2') || p.includes('ps1') || p.includes('psp') || p.includes('vita') || p === 'psn') {
    return {
      bg: 'bg-[#003087]',
      text: 'text-white',
      border: 'border-[#0070d1]/50',
      glow: 'shadow-[0_0_20px_rgba(0,112,209,0.5),0_0_40px_rgba(0,112,209,0.2)]',
    };
  }

  // Xbox (Series X|S, One, 360, etc.)
  if (p.includes('xbox') || p.includes('series x') || p.includes('series s')) {
    return {
      bg: 'bg-[#107c10]',
      text: 'text-white',
      border: 'border-[#52b043]/50',
      glow: 'shadow-[0_0_20px_rgba(82,176,67,0.5),0_0_40px_rgba(82,176,67,0.2)]',
    };
  }

  // Nintendo (Switch, Wii, 3DS, etc.)
  if (p.includes('nintendo') || p.includes('switch') || p.includes('wii') || p.includes('3ds') || p.includes('ds') || p.includes('gamecube') || p.includes('n64') || p.includes('snes') || p.includes('nes') || p.includes('game boy') || p.includes('gba')) {
    return {
      bg: 'bg-[#e60012]',
      text: 'text-white',
      border: 'border-[#ff4554]/50',
      glow: 'shadow-[0_0_20px_rgba(230,0,18,0.5),0_0_40px_rgba(230,0,18,0.2)]',
    };
  }

  // Epic Games
  if (p.includes('epic')) {
    return {
      bg: 'bg-text-primary',
      text: 'text-bg-primary',
      border: 'border-(--theme-text-primary)/50',
      glow: 'shadow-[0_0_20px_rgba(128,128,128,0.4),0_0_40px_rgba(128,128,128,0.15)]',
    };
  }

  // EA App
  if (p.includes('ea app') || p.includes('origin')) {
    return {
      bg: 'bg-[#ff4747]',
      text: 'text-white',
      border: 'border-[#ff6b6b]/50',
      glow: 'shadow-[0_0_20px_rgba(255,71,71,0.5),0_0_40px_rgba(255,71,71,0.2)]',
    };
  }

  // Battle.net
  if (p.includes('battle.net') || p.includes('blizzard')) {
    return {
      bg: 'bg-[#00aeff]',
      text: 'text-white',
      border: 'border-[#00c8ff]/50',
      glow: 'shadow-[0_0_20px_rgba(0,200,255,0.5),0_0_40px_rgba(0,200,255,0.2)]',
    };
  }

  // GOG
  if (p.includes('gog')) {
    return {
      bg: 'bg-[#a855f7]',
      text: 'text-white',
      border: 'border-[#c084fc]/50',
      glow: 'shadow-[0_0_20px_rgba(168,85,247,0.5),0_0_40px_rgba(168,85,247,0.2)]',
    };
  }

  // Ubisoft Connect
  if (p.includes('ubisoft')) {
    return {
      bg: 'bg-[#0070ff]',
      text: 'text-white',
      border: 'border-[#3d9aff]/50',
      glow: 'shadow-[0_0_20px_rgba(0,112,255,0.5),0_0_40px_rgba(0,112,255,0.2)]',
    };
  }

  // Physical
  if (p.includes('physical') || p.includes('dvd') || p.includes('disc')) {
    return {
      bg: 'bg-amber-600',
      text: 'text-white',
      border: 'border-amber-500/50',
      glow: 'shadow-[0_0_20px_rgba(217,119,6,0.5),0_0_40px_rgba(217,119,6,0.2)]',
    };
  }

  // PC / Windows (default for PC platforms)
  if (p.includes('pc') || p.includes('windows')) {
    return {
      bg: 'bg-[#0078D4]',
      text: 'text-white',
      border: 'border-[#00a2ff]/50',
      glow: 'shadow-[0_0_20px_rgba(0,120,212,0.5),0_0_40px_rgba(0,120,212,0.2)]',
    };
  }

  // Default fallback
  return {
    bg: 'bg-white/10',
    text: 'text-white',
    border: 'border-white/8',
  };
}

// Subtle brand colors for unselected state (low opacity with brand accent)
export function getPlatformBrandStyleSubtle(platform: string): PlatformBrandStyle {
  const p = platform.toLowerCase();

  // Steam
  if (p.includes('steam')) {
    return {
      bg: 'bg-[#1b2838]/30',
      text: 'text-[#66c0f4]',
      border: 'border-[#66c0f4]/20',
    };
  }

  // PlayStation
  if (p.includes('playstation') || p.includes('ps5') || p.includes('ps4') || p.includes('ps3') || p.includes('ps2') || p.includes('ps1') || p.includes('psp') || p.includes('vita') || p === 'psn') {
    return {
      bg: 'bg-[#003087]/20',
      text: 'text-[#0070d1]',
      border: 'border-[#0070d1]/20',
    };
  }

  // Xbox
  if (p.includes('xbox') || p.includes('series x') || p.includes('series s')) {
    return {
      bg: 'bg-[#107c10]/20',
      text: 'text-[#52b043]',
      border: 'border-[#52b043]/20',
    };
  }

  // Nintendo
  if (p.includes('nintendo') || p.includes('switch') || p.includes('wii') || p.includes('3ds') || p.includes('ds') || p.includes('gamecube') || p.includes('n64') || p.includes('snes') || p.includes('nes') || p.includes('game boy') || p.includes('gba')) {
    return {
      bg: 'bg-[#e60012]/15',
      text: 'text-[#ff4554]',
      border: 'border-[#ff4554]/20',
    };
  }

  // Epic Games
  if (p.includes('epic')) {
    return {
      bg: 'bg-text-primary/10',
      text: 'text-theme-secondary',
      border: 'border-(--theme-text-primary)/15',
    };
  }

  // EA App
  if (p.includes('ea app') || p.includes('origin')) {
    return {
      bg: 'bg-[#ff4747]/15',
      text: 'text-[#ff6b6b]',
      border: 'border-[#ff6b6b]/20',
    };
  }

  // Battle.net
  if (p.includes('battle.net') || p.includes('blizzard')) {
    return {
      bg: 'bg-[#00aeff]/15',
      text: 'text-[#00c8ff]',
      border: 'border-[#00c8ff]/20',
    };
  }

  // GOG
  if (p.includes('gog')) {
    return {
      bg: 'bg-[#a855f7]/15',
      text: 'text-[#c084fc]',
      border: 'border-[#c084fc]/20',
    };
  }

  // Ubisoft Connect
  if (p.includes('ubisoft')) {
    return {
      bg: 'bg-[#0070ff]/15',
      text: 'text-[#3d9aff]',
      border: 'border-[#3d9aff]/20',
    };
  }

  // Physical
  if (p.includes('physical') || p.includes('dvd') || p.includes('disc')) {
    return {
      bg: 'bg-amber-600/15',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    };
  }

  // PC / Windows
  if (p.includes('pc') || p.includes('windows')) {
    return {
      bg: 'bg-[#0078D4]/20',
      text: 'text-[#00a2ff]',
      border: 'border-[#0078D4]/20',
    };
  }

  // Default fallback
  return {
    bg: 'bg-white/5',
    text: 'text-theme-muted',
    border: 'border-white/5',
  };
}

export const CONSOLE_GENERATIONS: ConsoleGeneration[] = [
  {
    family: 'PlayStation',
    icon: '🎮',
    gradient: 'from-blue-600/10 to-indigo-600/10',
    glow: 'rgba(99, 102, 241, 0.4)',
    consoles: [
      { id: 'PS5', label: 'PlayStation 5', year: '2020' },
      { id: 'PS4', label: 'PlayStation 4', year: '2013' },
      { id: 'PS3', label: 'PlayStation 3', year: '2006' },
      { id: 'PS2', label: 'PlayStation 2', year: '2000' },
      { id: 'PS1', label: 'PlayStation', year: '1994' },
      { id: 'PSP', label: 'PSP', year: '2004' },
      { id: 'PS Vita', label: 'PS Vita', year: '2011' },
    ],
  },
  {
    family: 'Xbox',
    icon: '🟢',
    gradient: 'from-green-600/10 to-emerald-600/10',
    glow: 'rgba(34, 197, 94, 0.4)',
    consoles: [
      { id: 'Xbox Series X|S', label: 'Series X|S', year: '2020' },
      { id: 'Xbox One', label: 'Xbox One', year: '2013' },
      { id: 'Xbox 360', label: 'Xbox 360', year: '2005' },
      { id: 'Xbox', label: 'Xbox', year: '2001' },
    ],
  },
  {
    family: 'Nintendo',
    icon: '🍄',
    gradient: 'from-red-600/10 to-rose-600/10',
    glow: 'rgba(239, 68, 68, 0.4)',
    consoles: [
      { id: 'Switch 2', label: 'Switch 2', year: '2025' },
      { id: 'Switch', label: 'Switch', year: '2017' },
      { id: 'Wii U', label: 'Wii U', year: '2012' },
      { id: 'Wii', label: 'Wii', year: '2006' },
      { id: '3DS', label: '3DS', year: '2011' },
      { id: 'DS', label: 'DS', year: '2004' },
      { id: 'GameCube', label: 'GameCube', year: '2001' },
      { id: 'Nintendo 64', label: 'N64', year: '1996' },
      { id: 'SNES', label: 'SNES', year: '1990' },
      { id: 'NES', label: 'NES', year: '1983' },
      { id: 'Game Boy', label: 'Game Boy', year: '1989' },
      { id: 'GBA', label: 'GBA', year: '2001' },
    ],
  },
  {
    family: 'Retro',
    icon: '👾',
    gradient: 'from-purple-600/10 to-violet-600/10',
    glow: 'rgba(168, 85, 247, 0.4)',
    consoles: [
      { id: 'Dreamcast', label: 'Dreamcast', year: '1998' },
      { id: 'Saturn', label: 'Saturn', year: '1994' },
      { id: 'Genesis', label: 'Genesis', year: '1988' },
      { id: 'Master System', label: 'Master System', year: '1985' },
      { id: 'Atari 2600', label: 'Atari 2600', year: '1977' },
      { id: 'Neo Geo', label: 'Neo Geo', year: '1990' },
      { id: 'TurboGrafx-16', label: 'TurboGrafx-16', year: '1987' },
    ],
  },
];
