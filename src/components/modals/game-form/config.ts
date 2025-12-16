import { Flame, Clock, Coffee, Trophy, CircleDashed, Play, CircleDot, CheckCircle2, Pause, Flag, CircleOff } from 'lucide-react';

export const PRIORITY_CONFIG = {
  high: { label: 'High', Icon: Flame, color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/50', glow: 'shadow-red-500/20' },
  medium: { label: 'Medium', Icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50', glow: 'shadow-amber-500/20' },
  low: { label: 'Low', Icon: Coffee, color: 'text-sky-400', bg: 'bg-sky-500/20', border: 'border-sky-500/50', glow: 'shadow-sky-500/20' },
  none: { label: 'No Priority', Icon: CircleOff, color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/50', glow: 'shadow-gray-500/20' },
  finished: { label: 'Finished', Icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', glow: 'shadow-emerald-500/20' },
} as const;

export const STATUS_CONFIG = {
  unplayed: { label: 'Unplayed', Icon: CircleDashed, color: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/50' },
  playing: { label: 'Playing', Icon: Play, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50' },
  played: { label: 'Played', Icon: CircleDot, color: 'text-purple-400', bg: 'bg-purple-500/20', border: 'border-purple-500/50' },
  completed: { label: 'Completed', Icon: CheckCircle2, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/50' },
  finished: { label: 'Finished', Icon: Flag, color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/50' },
  on_hold: { label: 'On Hold', Icon: Pause, color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/50' },
} as const;

export type PriorityKey = keyof typeof PRIORITY_CONFIG;
export type StatusKey = keyof typeof STATUS_CONFIG;
