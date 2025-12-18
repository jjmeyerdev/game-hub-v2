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
} from 'lucide-react';
import { GameFormModal, DeleteConfirmModal } from '@/components/modals';
import { isPcPlatform } from '@/lib/constants/platforms';
import type { UserGame } from '@/app/(dashboard)/_actions/games';

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [game, setGame] = useState<UserGame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.08] rounded-lg">
                  <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] font-mono font-medium text-white/50 uppercase tracking-wider">{game.platform}</span>
                </div>

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
