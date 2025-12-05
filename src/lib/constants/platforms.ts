export const PLATFORMS = [
  { id: 'Steam', label: 'Steam', color: 'from-blue-500 to-blue-600', hasConsoles: false },
  {
    id: 'PlayStation',
    label: 'PlayStation',
    color: 'from-blue-600 to-indigo-600',
    hasConsoles: true,
  },
  // PSN sync uses specific platform names
  { id: 'PS5', label: 'PS5', color: 'from-blue-600 to-indigo-600', hasConsoles: false },
  { id: 'PS4', label: 'PS4', color: 'from-blue-600 to-indigo-600', hasConsoles: false },
  { id: 'PS3', label: 'PS3', color: 'from-blue-600 to-indigo-600', hasConsoles: false },
  { id: 'PS Vita', label: 'PS Vita', color: 'from-blue-600 to-indigo-600', hasConsoles: false },
  { id: 'Xbox', label: 'Xbox', color: 'from-green-500 to-emerald-600', hasConsoles: true },
  { id: 'Windows', label: 'Windows', color: 'from-sky-500 to-blue-500', hasConsoles: false },
  { id: 'Epic', label: 'Epic Games', color: 'from-slate-600 to-slate-700', hasConsoles: false },
  { id: 'EA App', label: 'EA App', color: 'from-red-600 to-rose-600', hasConsoles: false },
  { id: 'Nintendo', label: 'Nintendo', color: 'from-red-500 to-red-600', hasConsoles: true },
  {
    id: 'Battle.net',
    label: 'Battle.net',
    color: 'from-blue-500 to-cyan-500',
    hasConsoles: false,
  },
  {
    id: 'Physical',
    label: 'Physical Copy',
    color: 'from-amber-500 to-orange-500',
    hasConsoles: true,
  },
] as const;

export const CONSOLE_OPTIONS: Record<string, readonly string[]> = {
  PlayStation: [
    'PS5 Pro',
    'PS5',
    'PS5 Slim',
    'PS4 Pro',
    'PS4',
    'PS4 Slim',
    'PS3',
    'PS3 Slim',
    'PS2',
    'PS1',
  ],
  Xbox: [
    'Xbox Series X',
    'Xbox Series S',
    'Xbox One X',
    'Xbox One S',
    'Xbox One',
    'Xbox 360 E',
    'Xbox 360 S',
    'Xbox 360',
    'Original Xbox',
  ],
  Nintendo: [
    'Switch 2',
    'Switch OLED',
    'Switch',
    'Switch Lite',
    'Wii U',
    'New 3DS XL',
    'New 3DS',
    'New 2DS XL',
    '3DS XL',
    '3DS',
    '2DS',
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
    'PC CD-ROM',
  ],
} as const;

export const STATUSES = [
  { id: 'unplayed', label: 'Unplayed', icon: '⏸️' },
  { id: 'playing', label: 'Playing', icon: '▶️' },
  { id: 'completed', label: 'Completed', icon: '✓' },
  { id: 'on_hold', label: 'On Hold', icon: '⏸' },
] as const;

export const PRIORITIES = [
  { id: 'high', label: 'High', color: 'from-red-500 to-orange-500', bgColor: 'bg-red-500', textColor: 'text-red-400', borderColor: 'border-red-500' },
  { id: 'medium', label: 'Medium', color: 'from-yellow-500 to-amber-500', bgColor: 'bg-yellow-500', textColor: 'text-yellow-400', borderColor: 'border-yellow-500' },
  { id: 'low', label: 'Low', color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500', textColor: 'text-blue-400', borderColor: 'border-blue-500' },
] as const;

export type PlatformId = (typeof PLATFORMS)[number]['id'];
export type StatusId = (typeof STATUSES)[number]['id'];
export type PriorityId = (typeof PRIORITIES)[number]['id'];

// Platforms that can have active session tracking (PC platforms)
export const PC_PLATFORMS = ['Steam', 'Windows', 'Epic', 'EA App', 'Battle.net', 'GOG', 'Xbox Game Pass'] as const;

export function isPcPlatform(platform: string): boolean {
  // Check if the platform starts with any PC platform name
  return PC_PLATFORMS.some(pcPlatform =>
    platform === pcPlatform || platform.startsWith(pcPlatform)
  );
}

// Library filter constants
export const LIBRARY_FILTER_PLATFORMS = ['All', 'Steam', 'PlayStation', 'Xbox', 'Windows', 'Epic', 'EA App', 'Battle.net', 'Physical'] as const;

export type SortOption = 'title-asc' | 'title-desc' | 'recent' | 'completion-asc' | 'completion-desc' | 'playtime-asc' | 'playtime-desc' | 'priority-high' | 'priority-low';

// Priority order mapping for sorting
export const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
