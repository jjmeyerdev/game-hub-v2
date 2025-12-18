'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Trophy,
  Star,
  Calendar,
  Gamepad2,
  Loader2,
  TrendingUp,
  Zap,
  PlayCircle,
  CheckCircle2,
  Tag,
  Activity,
  BarChart3,
  Building2,
  Terminal,
  Lock,
  Unlock,
  Sparkles,
  Medal,
  Crown,
  Diamond,
  Circle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { GameFormModal, DeleteConfirmModal } from '@/components/modals';
import { isPcPlatform, getPlatformBrandStyle } from '@/lib/constants/platforms';
import {
  SteamLogo,
  PlayStationLogo,
  XboxLogo,
  EpicLogo,
  NintendoLogo,
  GOGLogo,
  EALogo,
  BattleNetLogo,
  UbisoftLogo,
  WindowsLogo,
} from '@/components/icons/PlatformLogos';
import type { UserGame } from '@/app/(dashboard)/_actions/games';

// Helper to get platform logo component
function getPlatformLogo(platform: string, className?: string) {
  const p = platform.toLowerCase();
  const logoClass = className || 'w-4 h-4';

  if (p.includes('steam')) return <SteamLogo className={logoClass} />;
  if (p.includes('playstation') || p.startsWith('ps') || p === 'psn') return <PlayStationLogo className={logoClass} />;
  if (p.includes('xbox') || p.includes('series x') || p.includes('series s')) return <XboxLogo className={logoClass} />;
  if (p.includes('epic')) return <EpicLogo className={logoClass} />;
  if (p.includes('nintendo') || p.includes('switch') || p.includes('wii') || p.includes('3ds')) return <NintendoLogo className={logoClass} />;
  if (p.includes('gog')) return <GOGLogo className={logoClass} />;
  if (p.includes('ea app') || p.includes('origin')) return <EALogo className={logoClass} />;
  if (p.includes('battle.net') || p.includes('blizzard')) return <BattleNetLogo className={logoClass} />;
  if (p.includes('ubisoft')) return <UbisoftLogo className={logoClass} />;
  if (p.includes('pc') || p.includes('windows')) return <WindowsLogo className={logoClass} />;

  // Fallback to gamepad icon
  return <Gamepad2 className={logoClass} />;
}

// Achievement/Trophy types
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url?: string;
  unlocked: boolean;
  unlock_date?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'ultra_rare';
  rarity_percentage?: number;
  // PlayStation specific
  trophy_type?: 'platinum' | 'gold' | 'silver' | 'bronze';
  // Xbox specific
  gamerscore?: number;
  // Steam specific
  global_percentage?: number;
  // Icon variant for visual variety
  icon_variant?: number;
}

// Steam-style achievement icon component
function SteamAchievementIcon({
  variant,
  unlocked,
  rarity
}: {
  variant: number;
  unlocked: boolean;
  rarity: Achievement['rarity'];
}) {
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
          <Lock className="w-5 h-5 text-white/40" />
        </div>
      )}
    </div>
  );
}

// Generate mock achievements based on game data
function generateMockAchievements(total: number, earned: number, platform: string): Achievement[] {
  const isPlayStation = platform.toLowerCase().includes('playstation') || platform.toLowerCase().startsWith('ps');
  const isXbox = platform.toLowerCase().includes('xbox');

  const achievementNames = [
    { name: 'First Steps', desc: 'Complete the tutorial' },
    { name: 'Veteran', desc: 'Reach level 50' },
    { name: 'Completionist', desc: 'Collect all collectibles' },
    { name: 'Speed Demon', desc: 'Complete a mission in under 5 minutes' },
    { name: 'Untouchable', desc: 'Complete a level without taking damage' },
    { name: 'Explorer', desc: 'Discover all locations' },
    { name: 'Master Tactician', desc: 'Win 100 battles' },
    { name: 'Legendary', desc: 'Defeat the final boss on hardest difficulty' },
    { name: 'Social Butterfly', desc: 'Make 10 friends in multiplayer' },
    { name: 'Treasure Hunter', desc: 'Find all hidden treasures' },
    { name: 'Perfectionist', desc: 'Get a perfect score on any level' },
    { name: 'Night Owl', desc: 'Play for 10 hours total' },
    { name: 'Champion', desc: 'Win a tournament' },
    { name: 'Survivor', desc: 'Survive for 30 minutes' },
    { name: 'Collector', desc: 'Collect 500 items' },
  ];

  const rarities: Achievement['rarity'][] = ['common', 'uncommon', 'rare', 'very_rare', 'ultra_rare'];
  const trophyTypes: Achievement['trophy_type'][] = ['bronze', 'bronze', 'silver', 'gold', 'platinum'];
  const gamerscores = [10, 15, 25, 50, 100];

  return Array.from({ length: total }, (_, i) => {
    const template = achievementNames[i % achievementNames.length];
    const rarityIndex = Math.min(Math.floor(i / (total / 5)), 4);
    const unlocked = i < earned;
    const rarityPercentage = [45, 25, 12, 5, 1.5][rarityIndex];

    return {
      id: `achievement-${i}`,
      name: i === 0 && isPlayStation ? 'Platinum Trophy' : `${template.name}${i >= achievementNames.length ? ` ${Math.floor(i / achievementNames.length) + 1}` : ''}`,
      description: i === 0 && isPlayStation ? 'Unlock all other trophies' : template.desc,
      unlocked,
      unlock_date: unlocked ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
      rarity: rarities[rarityIndex],
      rarity_percentage: rarityPercentage + Math.random() * 5,
      trophy_type: isPlayStation ? (i === 0 ? 'platinum' : trophyTypes[rarityIndex]) : undefined,
      gamerscore: isXbox ? gamerscores[rarityIndex] : undefined,
      global_percentage: rarityPercentage + Math.random() * 5,
      icon_variant: i % 8, // Cycle through 8 different icon designs
    };
  });
}

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<UserGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [achievementFilter, setAchievementFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [showHiddenAchievements, setShowHiddenAchievements] = useState(false);

  useEffect(() => {
    async function loadGame() {
      try {
        const response = await fetch(`/api/games/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setGame(data);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to load game:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadGame();
    }
  }, [params.id, router]);

  const handleSuccess = () => {
    window.location.reload();
  };

  const handleDelete = () => {
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-void">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-cyan-400/60 animate-spin" />
          <div className="absolute inset-0 w-12 h-12 border-2 border-cyan-400/20 rounded-full" />
        </div>
        <p className="mt-4 text-[11px] font-mono text-white/30 uppercase tracking-wider">// Loading game data...</p>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  const canHaveActiveSession = isPcPlatform(game.platform);

  const statusConfig: Record<string, { label: string; color: string; bg: string; border: string }> = {
    playing: {
      label: canHaveActiveSession ? 'Active Session' : 'Playing',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
    played: { label: 'Played', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    completed: { label: 'Completed', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    finished: { label: 'Finished', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    on_hold: { label: 'On Hold', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    paused: { label: 'Paused', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    dropped: { label: 'Dropped', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    unplayed: { label: 'Unplayed', color: 'text-white/50', bg: 'bg-white/[0.04]', border: 'border-white/[0.08]' },
  };

  const status = statusConfig[game.status] || statusConfig.unplayed;

  return (
    <div className="relative min-h-screen bg-void">
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px] animate-breathe" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-violet-500/[0.03] rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-void/80 border-b border-white/[0.06]">
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-4 py-2 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.08] hover:border-cyan-500/30 rounded-xl text-sm text-white/50 hover:text-cyan-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-mono text-xs uppercase tracking-wider">Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="group p-2.5 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/[0.08] hover:border-cyan-500/30 rounded-xl transition-all"
                title="Edit"
              >
                <Edit className="w-4 h-4 text-white/50 group-hover:text-cyan-400" />
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="group p-2.5 bg-white/[0.03] hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 rounded-xl transition-all"
                title="Delete"
              >
                <Trash2 className="w-4 h-4 text-white/50 group-hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative">
        {/* Blurred Background */}
        {game.game?.cover_url && (
          <div
            className="absolute inset-0 opacity-5 blur-[80px] scale-110"
            style={{
              backgroundImage: `url(${game.game.cover_url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className="relative px-6 lg:px-8 py-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
              {/* Cover Art */}
              <div className="relative">
                <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-abyss border border-white/[0.08]">
                  {/* HUD corners */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyan-400/40 z-10" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyan-400/40 z-10" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-cyan-400/40 z-10" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-cyan-400/40 z-10" />

                  {game.game?.cover_url ? (
                    <img
                      src={game.game.cover_url}
                      alt={game.game.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gamepad2 className="w-20 h-20 text-white/10" />
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute -bottom-4 left-4 right-4">
                  <div className={`relative px-4 py-2.5 ${status.bg} ${status.border} border backdrop-blur-xl rounded-xl flex items-center justify-center overflow-hidden`}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${status.color.replace('text-', 'bg-')}`} />
                    <span className={`text-sm font-semibold uppercase tracking-wide font-[family-name:var(--font-family-display)] ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Game Info */}
              <div className="space-y-6 pt-2">
                {/* Platform Badge */}
                {(() => {
                  const brandStyle = getPlatformBrandStyle(game.platform);
                  return (
                    <div className={`inline-flex items-center gap-2.5 px-4 py-2 ${brandStyle.bg} ${brandStyle.border} border rounded-xl ${brandStyle.glow || ''}`}>
                      <span className={brandStyle.text}>
                        {getPlatformLogo(game.platform, 'w-4 h-4')}
                      </span>
                      <span className={`text-[11px] font-mono font-semibold uppercase tracking-wider ${brandStyle.text}`}>
                        {game.platform}
                      </span>
                    </div>
                  );
                })()}

                {/* Title */}
                <div>
                  <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2 block">// GAME_DATA</span>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                    {game.game?.title}
                  </h1>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
                  <StatCard
                    icon={<Clock className="w-4 h-4" />}
                    label="Playtime"
                    value={`${game.playtime_hours || 0}h`}
                    color="cyan"
                  />
                  <StatCard
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Progress"
                    value={`${game.completion_percentage || 0}%`}
                    color="violet"
                  />
                  <StatCard
                    icon={<Trophy className="w-4 h-4" />}
                    label={game.platform.includes('PlayStation') || game.platform.startsWith('PS') ? 'Trophies' : 'Achievements'}
                    value={`${game.achievements_earned || 0}/${game.achievements_total || 0}`}
                    color="amber"
                  />
                  <StatCard
                    icon={<Star className="w-4 h-4" />}
                    label="Rating"
                    value={game.personal_rating ? `${game.personal_rating}/10` : '—'}
                    color="emerald"
                  />
                </div>

                {/* Progress Bars */}
                {(game.completion_percentage > 0 || (game.achievements_total > 0 && game.achievements_earned > 0)) && (
                  <div className="relative p-5 bg-abyss border border-white/[0.08] rounded-xl space-y-4 overflow-hidden">
                    {/* HUD corners */}
                    <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-white/[0.12]" />
                    <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-white/[0.12]" />
                    <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-white/[0.12]" />
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-white/[0.12]" />

                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-semibold text-white/60 uppercase tracking-wide font-[family-name:var(--font-family-display)]">Progress</span>
                      <span className="text-[10px] font-mono text-white/30">// STATS</span>
                    </div>

                    {game.completion_percentage > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Completion</span>
                          <span className="text-xs font-mono font-medium text-violet-400">{game.completion_percentage}%</span>
                        </div>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all duration-500"
                            style={{ width: `${game.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {game.achievements_total > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                            {game.platform.includes('PlayStation') || game.platform.startsWith('PS') ? 'Trophies' : 'Achievements'}
                          </span>
                          <span className="text-xs font-mono font-medium text-amber-400">
                            {game.achievements_earned} / {game.achievements_total}
                          </span>
                        </div>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${(game.achievements_earned / game.achievements_total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="px-6 lg:px-8 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Game Information */}
            <div className="relative p-6 bg-abyss border border-cyan-500/20 rounded-xl space-y-5 overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />

              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                <Zap className="w-4 h-4 text-cyan-400" />
                Game Details
                <span className="text-[10px] font-mono text-white/30 font-normal">// METADATA</span>
              </h3>

              {game.game?.description ? (
                <p className="text-sm text-white/50 leading-relaxed">
                  {game.game.description}
                </p>
              ) : (
                <p className="text-sm text-white/30 italic font-mono">
                  // No description available
                </p>
              )}

              <div className="space-y-3 pt-2">
                {game.game?.developer && (
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="Developer" value={game.game.developer} color="cyan" />
                )}
                {game.game?.publisher && (
                  <InfoRow icon={<Building2 className="w-4 h-4" />} label="Publisher" value={game.game.publisher} color="violet" />
                )}
                {game.game?.release_date && (
                  <InfoRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Release Date"
                    value={new Date(game.game.release_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    color="emerald"
                  />
                )}
              </div>

              {game.game?.genres && game.game.genres.length > 0 && (
                <div className="pt-4 border-t border-white/[0.06]">
                  <div className="text-[10px] font-mono text-white/40 mb-3 uppercase tracking-wider">Genres</div>
                  <div className="flex flex-wrap gap-2">
                    {game.game.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-mono font-medium text-cyan-400 uppercase tracking-wider"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Activity & Tags */}
            <div className="space-y-6">
              {/* Activity */}
              <div className="relative p-6 bg-abyss border border-violet-500/20 rounded-xl space-y-4 overflow-hidden">
                {/* HUD corners */}
                <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-violet-400/30" />
                <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-violet-400/30" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-violet-400/30" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-violet-400/30" />

                <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                  <Activity className="w-4 h-4 text-violet-400" />
                  Activity
                  <span className="text-[10px] font-mono text-white/30 font-normal">// TIMELINE</span>
                </h3>

                <div className="space-y-3">
                  {game.last_played_at && (
                    <InfoRow
                      icon={<PlayCircle className="w-4 h-4" />}
                      label="Last Played"
                      value={new Date(game.last_played_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                      color="cyan"
                    />
                  )}
                  <InfoRow
                    icon={<Calendar className="w-4 h-4" />}
                    label="Added to Library"
                    value={new Date(game.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    color="violet"
                  />
                  <InfoRow
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label="Last Synced"
                    value={new Date(game.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    color="emerald"
                  />
                </div>
              </div>

              {/* Tags */}
              {game.tags && game.tags.length > 0 && (
                <div className="relative p-6 bg-abyss border border-amber-500/20 rounded-xl space-y-4 overflow-hidden">
                  {/* HUD corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-amber-400/30" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-amber-400/30" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-amber-400/30" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-amber-400/30" />

                  <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                    <Tag className="w-4 h-4 text-amber-400" />
                    Tags
                    <span className="text-[10px] font-mono text-white/30 font-normal">// USER_TAGS</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {game.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] font-mono font-medium text-amber-400 uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Personal Notes */}
          {game.notes && (
            <div className="relative mt-6 p-6 bg-abyss border border-emerald-500/20 rounded-xl space-y-4 overflow-hidden">
              {/* HUD corners */}
              <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-emerald-400/30" />
              <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-emerald-400/30" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-emerald-400/30" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-emerald-400/30" />

              <h3 className="text-sm font-semibold text-white/60 flex items-center gap-2 uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                <Terminal className="w-4 h-4 text-emerald-400" />
                Notes
                <span className="text-[10px] font-mono text-white/30 font-normal">// PERSONAL_LOG</span>
              </h3>
              <p className="text-sm text-white/50 leading-relaxed whitespace-pre-wrap">
                {game.notes}
              </p>
            </div>
          )}

          {/* Achievements/Trophies Section */}
          {game.achievements_total > 0 && (
            <AchievementsSection
              game={game}
              filter={achievementFilter}
              setFilter={setAchievementFilter}
              showHidden={showHiddenAchievements}
              setShowHidden={setShowHiddenAchievements}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <GameFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleSuccess}
        mode="edit"
        userGame={game}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDelete}
        userGame={game}
      />
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'violet' | 'amber' | 'emerald';
}) {
  const colorMap = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', corner: 'border-cyan-400/30' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', corner: 'border-violet-400/30' },
    amber: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', corner: 'border-amber-400/30' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', corner: 'border-emerald-400/30' },
  };

  const c = colorMap[color];

  return (
    <div className={`relative p-4 ${c.bg} ${c.border} border rounded-xl overflow-hidden group hover:border-white/[0.15] transition-all`}>
      {/* HUD corners on hover */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className={`${c.text} mb-2`}>{icon}</div>
      <div className="text-[10px] font-mono text-white/40 mb-1 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-white font-[family-name:var(--font-family-display)]">{value}</div>
    </div>
  );
}

// Info Row Component
function InfoRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'cyan' | 'violet' | 'emerald';
}) {
  const colorMap = {
    cyan: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    violet: { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
    emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  };

  const c = colorMap[color];

  return (
    <div className={`flex items-center gap-3 p-3 ${c.bg} ${c.border} border rounded-lg`}>
      <span className={c.text}>{icon}</span>
      <div className="flex-1">
        <div className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-medium text-white">{value}</div>
      </div>
    </div>
  );
}

// Achievements/Trophies Section Component
function AchievementsSection({
  game,
  filter,
  setFilter,
  showHidden,
  setShowHidden,
}: {
  game: UserGame;
  filter: 'all' | 'unlocked' | 'locked';
  setFilter: (filter: 'all' | 'unlocked' | 'locked') => void;
  showHidden: boolean;
  setShowHidden: (show: boolean) => void;
}) {
  const isPlayStation = game.platform.toLowerCase().includes('playstation') || game.platform.toLowerCase().startsWith('ps');
  const isXbox = game.platform.toLowerCase().includes('xbox');
  const termLabel = isPlayStation ? 'TROPHIES' : 'ACHIEVEMENTS';

  // Generate mock achievements for demo
  const achievements = generateMockAchievements(game.achievements_total, game.achievements_earned, game.platform);

  // Filter achievements
  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked;
    return true;
  });

  const progressPercent = (game.achievements_earned / game.achievements_total) * 100;

  // Get rarity color and icon
  const getRarityConfig = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'ultra_rare':
        return { color: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Diamond, label: 'Ultra Rare', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' };
      case 'very_rare':
        return { color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', icon: Crown, label: 'Very Rare', glow: 'shadow-[0_0_12px_rgba(167,139,250,0.25)]' };
      case 'rare':
        return { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: Medal, label: 'Rare', glow: '' };
      case 'uncommon':
        return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Sparkles, label: 'Uncommon', glow: '' };
      default:
        return { color: 'text-white/50', bg: 'bg-white/[0.04]', border: 'border-white/[0.08]', icon: Circle, label: 'Common', glow: '' };
    }
  };

  // Get trophy type config for PlayStation
  const getTrophyConfig = (trophyType: Achievement['trophy_type']) => {
    switch (trophyType) {
      case 'platinum':
        return { color: 'text-sky-300', bg: 'bg-sky-500/20', border: 'border-sky-400/40', glow: 'shadow-[0_0_20px_rgba(125,211,252,0.4)]' };
      case 'gold':
        return { color: 'text-amber-300', bg: 'bg-amber-500/20', border: 'border-amber-400/40', glow: 'shadow-[0_0_15px_rgba(251,191,36,0.3)]' };
      case 'silver':
        return { color: 'text-slate-300', bg: 'bg-slate-400/20', border: 'border-slate-400/40', glow: '' };
      default:
        return { color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-400/40', glow: '' };
    }
  };

  // Count by trophy type for PlayStation
  const trophyCounts = isPlayStation ? {
    platinum: achievements.filter(a => a.trophy_type === 'platinum' && a.unlocked).length,
    gold: achievements.filter(a => a.trophy_type === 'gold' && a.unlocked).length,
    silver: achievements.filter(a => a.trophy_type === 'silver' && a.unlocked).length,
    bronze: achievements.filter(a => a.trophy_type === 'bronze' && a.unlocked).length,
  } : null;

  // Total gamerscore for Xbox
  const totalGamerscore = isXbox ? achievements.filter(a => a.unlocked).reduce((sum, a) => sum + (a.gamerscore || 0), 0) : null;
  const maxGamerscore = isXbox ? achievements.reduce((sum, a) => sum + (a.gamerscore || 0), 0) : null;

  return (
    <div className="relative mt-8 p-6 bg-abyss border border-amber-500/20 rounded-2xl overflow-hidden">
      {/* HUD corners */}
      <div className="absolute top-0 left-0 w-5 h-5 border-l-2 border-t-2 border-amber-400/40" />
      <div className="absolute top-0 right-0 w-5 h-5 border-r-2 border-t-2 border-amber-400/40" />
      <div className="absolute bottom-0 left-0 w-5 h-5 border-l-2 border-b-2 border-amber-400/40" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-r-2 border-b-2 border-amber-400/40" />

      {/* Decorative scan line */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-amber-400/20 to-transparent animate-scan-line" />
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <Trophy className="w-5 h-5 text-amber-400" />
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-l border-t border-amber-400/50" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-r border-t border-amber-400/50" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-l border-b border-amber-400/50" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-r border-b border-amber-400/50" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white uppercase tracking-wide font-[family-name:var(--font-family-display)] flex items-center gap-2">
              {termLabel}
              <span className="text-[10px] font-mono text-white/30 font-normal">// {isPlayStation ? 'PSN_TROPHIES' : isXbox ? 'XBOX_ACHIEVEMENTS' : 'PROGRESS_TRACKING'}</span>
            </h3>
            <p className="text-[11px] font-mono text-white/40">
              {game.achievements_earned} of {game.achievements_total} unlocked
            </p>
          </div>
        </div>

        {/* Platform-specific summary */}
        <div className="flex items-center gap-3">
          {isPlayStation && trophyCounts && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.06] rounded-xl">
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-sky-300 to-sky-500 flex items-center justify-center shadow-[0_0_10px_rgba(125,211,252,0.5)]">
                  <span className="text-[8px] font-bold text-white">P</span>
                </div>
                <span className="text-xs font-mono text-sky-300">{trophyCounts.platinum}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                  <span className="text-[8px] font-bold text-white">G</span>
                </div>
                <span className="text-xs font-mono text-amber-300">{trophyCounts.gold}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">S</span>
                </div>
                <span className="text-xs font-mono text-slate-300">{trophyCounts.silver}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">B</span>
                </div>
                <span className="text-xs font-mono text-orange-400">{trophyCounts.bronze}</span>
              </div>
            </div>
          )}

          {isXbox && totalGamerscore !== null && maxGamerscore !== null && (
            <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_12px_rgba(52,211,153,0.4)]">
                <span className="text-[9px] font-bold text-white">G</span>
              </div>
              <div>
                <span className="text-lg font-bold text-emerald-400 font-[family-name:var(--font-family-display)]">{totalGamerscore}</span>
                <span className="text-xs font-mono text-white/30 ml-1">/ {maxGamerscore}</span>
              </div>
            </div>
          )}

          {/* Toggle hidden achievements */}
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={`p-2.5 rounded-xl border transition-all ${
              showHidden
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/60 hover:border-white/[0.15]'
            }`}
            title={showHidden ? 'Hide locked descriptions' : 'Show locked descriptions'}
          >
            {showHidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Overall Progress</span>
          <span className="text-sm font-mono font-bold text-amber-400">{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="relative h-3 bg-white/[0.04] rounded-full overflow-hidden">
          {/* Striped background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.03) 16px)'
            }}
          />
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
          {/* Segment markers */}
          {[25, 50, 75].map(percent => (
            <div
              key={percent}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: `${percent}%` }}
            />
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 p-1 bg-white/[0.02] border border-white/[0.06] rounded-xl w-fit">
        {(['all', 'unlocked', 'locked'] as const).map(f => {
          const count = f === 'all'
            ? achievements.length
            : f === 'unlocked'
              ? achievements.filter(a => a.unlocked).length
              : achievements.filter(a => !a.unlocked).length;

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all overflow-hidden ${
                filter === f
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-white/40 hover:text-white/60 border border-transparent hover:bg-white/[0.03]'
              }`}
            >
              {filter === f && (
                <>
                  <div className="absolute top-0 left-0 w-1 h-1 border-l border-t border-amber-400/60" />
                  <div className="absolute top-0 right-0 w-1 h-1 border-r border-t border-amber-400/60" />
                  <div className="absolute bottom-0 left-0 w-1 h-1 border-l border-b border-amber-400/60" />
                  <div className="absolute bottom-0 right-0 w-1 h-1 border-r border-b border-amber-400/60" />
                </>
              )}
              {f === 'all' ? 'All' : f === 'unlocked' ? 'Unlocked' : 'Locked'}
              <span className="ml-1.5 text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Achievements grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredAchievements.map((achievement, index) => {
          const rarityConfig = getRarityConfig(achievement.rarity);
          const trophyConfig = isPlayStation && achievement.trophy_type ? getTrophyConfig(achievement.trophy_type) : null;
          const RarityIcon = rarityConfig.icon;

          return (
            <div
              key={achievement.id}
              className={`group relative p-4 rounded-xl border transition-all duration-300 overflow-hidden ${
                achievement.unlocked
                  ? `${trophyConfig?.bg || rarityConfig.bg} ${trophyConfig?.border || rarityConfig.border} ${trophyConfig?.glow || rarityConfig.glow} hover:scale-[1.01]`
                  : 'bg-white/[0.01] border-white/[0.06] hover:border-white/[0.12]'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* HUD corners on hover */}
              <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${achievement.unlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${achievement.unlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${achievement.unlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${achievement.unlocked ? (trophyConfig?.border || rarityConfig.border).replace('border-', 'border-').replace('/30', '/60').replace('/40', '/70') : 'border-white/20'} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <div className="flex items-start gap-4">
                {/* Achievement icon */}
                {isPlayStation && achievement.trophy_type ? (
                  // PlayStation Trophy Icon
                  <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                    achievement.unlocked
                      ? `${trophyConfig?.bg} border ${trophyConfig?.border}`
                      : 'bg-white/[0.03] border border-white/[0.08]'
                  }`}>
                    {achievement.unlocked ? (
                      <div className={`w-9 h-9 rounded-full ${
                        achievement.trophy_type === 'platinum' ? 'bg-gradient-to-br from-sky-200 via-sky-400 to-sky-600 shadow-[0_0_15px_rgba(125,211,252,0.5)]' :
                        achievement.trophy_type === 'gold' ? 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.4)]' :
                        achievement.trophy_type === 'silver' ? 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500' :
                        'bg-gradient-to-br from-orange-300 via-orange-500 to-orange-700'
                      } flex items-center justify-center`}>
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                  </div>
                ) : isXbox ? (
                  // Xbox Achievement Icon
                  <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
                    achievement.unlocked
                      ? `${rarityConfig.bg} border ${rarityConfig.border}`
                      : 'bg-white/[0.03] border border-white/[0.08]'
                  }`}>
                    {achievement.unlocked ? (
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                        <RarityIcon className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-white/[0.05] flex items-center justify-center">
                        <Lock className="w-4 h-4 text-white/20" />
                      </div>
                    )}
                    {/* Xbox gamerscore badge */}
                    {achievement.gamerscore && achievement.unlocked && (
                      <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-emerald-500 rounded text-[8px] font-bold text-white shadow-lg">
                        +{achievement.gamerscore}G
                      </div>
                    )}
                  </div>
                ) : (
                  // Steam/PC Style Achievement Icon
                  <div className="relative flex-shrink-0">
                    <SteamAchievementIcon
                      variant={achievement.icon_variant || 0}
                      unlocked={achievement.unlocked}
                      rarity={achievement.rarity}
                    />
                  </div>
                )}

                {/* Achievement details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className={`font-semibold text-sm uppercase tracking-wide font-[family-name:var(--font-family-display)] ${
                      achievement.unlocked ? 'text-white' : 'text-white/40'
                    }`}>
                      {achievement.unlocked || showHidden ? achievement.name : '// CLASSIFIED'}
                    </h4>

                    {/* Rarity badge */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${
                      achievement.unlocked ? `${rarityConfig.bg} ${rarityConfig.color}` : 'bg-white/[0.02] text-white/30'
                    }`}>
                      {achievement.rarity_percentage?.toFixed(1)}%
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed mb-2 ${
                    achievement.unlocked ? 'text-white/60' : 'text-white/20'
                  }`}>
                    {achievement.unlocked || showHidden
                      ? achievement.description
                      : '████████ ███████ ██████████ ████'
                    }
                  </p>

                  <div className="flex items-center gap-3">
                    {/* Unlock status */}
                    {achievement.unlocked ? (
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Unlock className="w-3 h-3" />
                        <span className="text-[10px] font-mono">
                          {achievement.unlock_date
                            ? new Date(achievement.unlock_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'Unlocked'
                          }
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-white/20">
                        <Lock className="w-3 h-3" />
                        <span className="text-[10px] font-mono uppercase">Locked</span>
                      </div>
                    )}

                    {/* Rarity label */}
                    <div className={`text-[10px] font-mono uppercase tracking-wider ${
                      achievement.unlocked ? rarityConfig.color : 'text-white/20'
                    }`}>
                      {rarityConfig.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredAchievements.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
            {filter === 'unlocked' ? (
              <Lock className="w-8 h-8 text-white/10" />
            ) : (
              <Unlock className="w-8 h-8 text-white/10" />
            )}
          </div>
          <p className="text-sm font-mono text-white/30">
            // No {filter === 'unlocked' ? 'unlocked' : 'locked'} {termLabel.toLowerCase()} found
          </p>
        </div>
      )}
    </div>
  );
}
