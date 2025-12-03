export const PLATFORMS = [
  { id: 'Steam', label: 'Steam', color: 'from-blue-500 to-blue-600', hasConsoles: false },
  {
    id: 'PlayStation',
    label: 'PlayStation',
    color: 'from-blue-600 to-indigo-600',
    hasConsoles: true,
  },
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

export type PlatformId = (typeof PLATFORMS)[number]['id'];
export type StatusId = (typeof STATUSES)[number]['id'];
