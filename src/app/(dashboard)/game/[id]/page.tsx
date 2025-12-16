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
  Target,
  Zap,
  PlayCircle,
  CheckCircle2,
  Tag,
  Activity,
  BarChart3,
  Sparkles,
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
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-cyan-400 animate-spin" />
          <div className="absolute inset-0 blur-xl bg-cyan-500/50 animate-pulse" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.3em] text-cyan-400 animate-pulse">
          Loading Data...
        </p>
      </div>
    );
  }

  if (!game) {
    return null;
  }

  // Check if this is a PC platform that supports session tracking
  const canHaveActiveSession = isPcPlatform(game.platform);

  const statusConfig: Record<string, { label: string; color: string; hex: string; gradient: string; icon: string }> = {
    playing: {
      label: canHaveActiveSession ? 'Active Session' : 'Now Playing',
      color: 'emerald-500',
      hex: '#00ff9f',
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      icon: '▶'
    },
    played: { label: 'Played', color: 'purple-500', hex: '#b845ff', gradient: 'from-purple-500/20 via-purple-500/5 to-transparent', icon: '●' },
    completed: { label: 'Mission Complete', color: 'cyan-500', hex: '#00d9ff', gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent', icon: '✓' },
    finished: { label: 'Finished', color: 'amber-500', hex: '#f59e0b', gradient: 'from-amber-500/20 via-amber-500/5 to-transparent', icon: '⚑' },
    on_hold: { label: 'On Hold', color: 'rose-500', hex: '#f43f5e', gradient: 'from-rose-500/20 via-rose-500/5 to-transparent', icon: '⏸' },
    paused: { label: 'On Standby', color: 'yellow-500', hex: '#eab308', gradient: 'from-yellow-500/20 via-yellow-500/5 to-transparent', icon: '⏸' },
    dropped: { label: 'Terminated', color: 'red-500', hex: '#ef4444', gradient: 'from-red-500/20 via-red-500/5 to-transparent', icon: '✕' },
    unplayed: { label: 'Queued', color: 'gray-500', hex: '#6b7280', gradient: 'from-gray-500/20 via-gray-500/5 to-transparent', icon: '○' },
  };

  const status = statusConfig[game.status] || statusConfig.unplayed;

  return (
    <>
      {/* Animated Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Radial Gradient Orbs */}
        <div
          className="absolute top-0 left-1/4 w-[800px] h-[800px] rounded-full opacity-20 blur-[120px] animate-pulse"
          style={{
            background: `radial-gradient(circle, ${game.status === 'playing' ? 'rgba(0, 255, 159, 0.4)' : 'rgba(0, 217, 255, 0.4)'} 0%, transparent 70%)`,
            animationDuration: '4s',
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full opacity-20 blur-[100px] animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(184, 69, 255, 0.4) 0%, transparent 70%)',
            animationDuration: '6s',
            animationDelay: '1s',
          }}
        />

        {/* Scanlines */}
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,217,255,0.03)_2px,rgba(0,217,255,0.03)_4px)] pointer-events-none" />

        {/* Floating Scan Effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30 animate-scan"
            style={{ animationDuration: '8s' }}
          />
        </div>
      </div>

      <div className="relative z-10">
        {/* Glitch Header Bar */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-void/80 border-b-2 border-cyan-500/30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between max-w-[1800px] mx-auto">
              <button
                onClick={() => router.back()}
                className="group flex items-center gap-3 px-4 py-2 bg-deep/50 border border-steel hover:border-cyan-500/50 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.3)]"
              >
                <ArrowLeft className="w-4 h-4 text-cyan-400 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-cyan-400">Return</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  className="group p-3 bg-deep/50 hover:bg-slate/50 border border-steel hover:border-cyan-500/50 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.2)]"
                  title="Modify Data"
                >
                  <Edit className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="group p-3 bg-deep/50 hover:bg-red-500/10 border border-steel hover:border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  title="Delete Entry"
                >
                  <Trash2 className="w-5 h-5 text-gray-400 group-hover:text-red-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section with Dramatic Cover */}
        <div className="relative min-h-[600px] overflow-hidden">
          {/* Blurred Background */}
          {game.game?.cover_url && (
            <>
              <div
                className="absolute inset-0 opacity-10 blur-[80px] scale-110"
                style={{
                  backgroundImage: `url(${game.game.cover_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className={`absolute inset-0 bg-gradient-to-b ${status.gradient}`} />
            </>
          )}

          <div className="relative px-8 py-12">
            <div className="max-w-[1800px] mx-auto">
              <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-12">
                {/* Cover Art with Holographic Effect */}
                <div className="relative group perspective-1000">
                  <div className="relative">
                    {/* Main Cover */}
                    <div
                      className="relative w-full h-[560px] rounded-2xl overflow-hidden border-2 border-steel bg-deep shadow-2xl transform transition-all duration-500 group-hover:scale-[1.02] group-hover:rotate-y-2"
                      style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      {game.game?.cover_url ? (
                        <img
                          src={game.game.cover_url}
                          alt={game.game.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-deep to-abyss">
                          <Gamepad2 className="w-32 h-32 text-steel" />
                        </div>
                      )}

                      {/* Holographic Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/10 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 mix-blend-overlay" />

                      {/* Corner Accents */}
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/50" />
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-cyan-500/50" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-purple-500/50" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-purple-500/50" />
                    </div>

                    {/* Glow Effect */}
                    <div
                      className="absolute inset-0 rounded-2xl blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10"
                      style={{
                        background: `linear-gradient(135deg, rgba(0, 217, 255, 0.4), rgba(184, 69, 255, 0.4))`,
                      }}
                    />
                  </div>

                  {/* Status Indicator - Only show for PC platforms */}
                  {canHaveActiveSession && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)]">
                      <div
                        className="relative px-6 py-4 backdrop-blur-xl border-2 rounded-xl overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${status.hex}33, ${status.hex}0d)`,
                          borderColor: `${status.hex}80`,
                          boxShadow: `0 0 30px ${status.hex}4d`,
                        }}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <span className="text-3xl animate-pulse">{status.icon}</span>
                          <span className="text-sm uppercase tracking-[0.3em] font-bold text-white">
                            {status.label}
                          </span>
                        </div>

                        {/* Animated Bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Game Data Terminal */}
                <div className="space-y-6 mt-8">
                  {/* Title Section */}
                  <div className="space-y-4">
                    {/* Platform Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                      <Gamepad2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs uppercase tracking-[0.2em] font-bold text-cyan-400">
                        {game.platform}
                      </span>
                    </div>

                    {/* Title with Glitch Effect */}
                    <h1
                      className="text-6xl xl:text-7xl font-black uppercase tracking-tight leading-none"
                      style={{
                        background: 'linear-gradient(135deg, #00d9ff 0%, #33e3ff 30%, #b845ff 70%, #c76dff 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 40px rgba(0, 217, 255, 0.5)',
                        animation: 'fadeInUp 0.6s ease-out',
                      }}
                    >
                      {game.game?.title}
                    </h1>
                  </div>

                  {/* Data Grid - Arcade Style */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Playtime */}
                    <div
                      className="relative group overflow-hidden rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-transparent p-5 transition-all hover:border-cyan-500/60 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                      style={{ animationDelay: '0.1s', animation: 'fadeInUp 0.6s ease-out backwards' }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/20 rounded-full blur-2xl" />
                      <div className="relative">
                        <Clock className="w-6 h-6 text-cyan-400 mb-3" />
                        <div className="text-xs uppercase tracking-[0.2em] text-cyan-400/70 mb-1">Playtime</div>
                        <div className="text-3xl font-black text-white tabular-nums">
                          {game.playtime_hours || 0}
                          <span className="text-sm text-cyan-400 ml-1">H</span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
                    </div>

                    {/* Completion */}
                    <div
                      className="relative group overflow-hidden rounded-xl border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-transparent p-5 transition-all hover:border-purple-500/60 hover:shadow-[0_0_30px_rgba(184,69,255,0.3)]"
                      style={{ animationDelay: '0.2s', animation: 'fadeInUp 0.6s ease-out backwards' }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl" />
                      <div className="relative">
                        <TrendingUp className="w-6 h-6 text-purple-400 mb-3" />
                        <div className="text-xs uppercase tracking-[0.2em] text-purple-400/70 mb-1">Progress</div>
                        <div className="text-3xl font-black text-white tabular-nums">
                          {game.completion_percentage || 0}
                          <span className="text-sm text-purple-400 ml-1">%</span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50" />
                    </div>

                    {/* Achievements/Trophies */}
                    <div
                      className="relative group overflow-hidden rounded-xl border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-transparent p-5 transition-all hover:border-yellow-500/60 hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"
                      style={{ animationDelay: '0.3s', animation: 'fadeInUp 0.6s ease-out backwards' }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/20 rounded-full blur-2xl" />
                      <div className="relative">
                        <Trophy className="w-6 h-6 text-yellow-400 mb-3" />
                        <div className="text-xs uppercase tracking-[0.2em] text-yellow-400/70 mb-1">
                          {game.platform.includes('PlayStation') || game.platform.startsWith('PS') ? 'Trophies' : 'Achievements'}
                        </div>
                        <div className="text-3xl font-black text-white tabular-nums">
                          {game.achievements_earned || 0}
                          <span className="text-sm text-yellow-400 ml-1">/{game.achievements_total || 0}</span>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-50" />
                    </div>

                    {/* Rating */}
                    <div
                      className="relative group overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent p-5 transition-all hover:border-emerald-500/60 hover:shadow-[0_0_30px_rgba(0,255,159,0.3)]"
                      style={{ animationDelay: '0.4s', animation: 'fadeInUp 0.6s ease-out backwards' }}
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/20 rounded-full blur-2xl" />
                      <div className="relative">
                        <Star className="w-6 h-6 text-emerald-400 mb-3" />
                        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400/70 mb-1">Rating</div>
                        <div className="text-3xl font-black text-white tabular-nums">
                          {game.personal_rating || '—'}
                          {game.personal_rating && (
                            <span className="text-sm text-emerald-400 ml-1">/10</span>
                          )}
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />
                    </div>
                  </div>

                  {/* Progress Visualizations */}
                  {(game.playtime_hours > 0 || game.completion_percentage > 0 || game.achievements_earned > 0) && (
                    <div
                      className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-transparent p-8"
                      style={{
                        animationDelay: '0.5s',
                        animation: 'fadeInUp 0.6s ease-out backwards',
                        boxShadow: '0 0 40px rgba(0, 217, 255, 0.1)',
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,rgba(0,217,255,0.1),transparent_50%)]" />
                      <div className="relative space-y-6">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-6 h-6 text-cyan-400" />
                          <h3 className="text-xl font-black uppercase tracking-wide text-cyan-400">
                            Data Analysis
                          </h3>
                        </div>

                        <div className="space-y-5">
                          {game.completion_percentage > 0 && (
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm uppercase tracking-[0.15em] text-gray-300 flex items-center gap-2">
                                  <Target className="w-4 h-4 text-purple-400" />
                                  Story Completion
                                </span>
                                <span className="text-sm font-bold tabular-nums text-purple-400">
                                  {game.completion_percentage}%
                                </span>
                              </div>
                              <div className="relative h-3 bg-deep rounded-full overflow-hidden border border-purple-500/30">
                                <div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${game.completion_percentage}%`,
                                    boxShadow: '0 0 20px rgba(184, 69, 255, 0.6)',
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                </div>
                              </div>
                            </div>
                          )}

                          {game.achievements_total > 0 && (
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm uppercase tracking-[0.15em] text-gray-300 flex items-center gap-2">
                                  <Trophy className="w-4 h-4 text-yellow-400" />
                                  {game.platform.includes('PlayStation') || game.platform.startsWith('PS') ? 'Trophy Progress' : 'Achievement Progress'}
                                </span>
                                <span className="text-sm font-bold tabular-nums text-yellow-400">
                                  {game.achievements_earned} / {game.achievements_total}
                                </span>
                              </div>
                              <div className="relative h-3 bg-deep rounded-full overflow-hidden border border-yellow-500/30">
                                <div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${(game.achievements_earned / game.achievements_total) * 100}%`,
                                    boxShadow: '0 0 20px rgba(234, 179, 8, 0.6)',
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                </div>
                              </div>
                            </div>
                          )}

                          {game.playtime_hours > 0 && (
                            <div>
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm uppercase tracking-[0.15em] text-gray-300 flex items-center gap-2">
                                  <Activity className="w-4 h-4 text-cyan-400" />
                                  Time Investment
                                </span>
                                <span className="text-sm font-bold tabular-nums text-cyan-400">
                                  {game.playtime_hours} hours
                                </span>
                              </div>
                              <div className="relative h-3 bg-deep rounded-full overflow-hidden border border-cyan-500/30">
                                <div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${Math.min((game.playtime_hours / 100) * 100, 100)}%`,
                                    boxShadow: '0 0 20px rgba(0, 217, 255, 0.6)',
                                  }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="px-8 py-12 bg-gradient-to-b from-transparent to-abyss/50">
          <div className="max-w-[1800px] mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Game Information Panel */}
              <div
                className="relative overflow-hidden rounded-2xl border-2 border-steel bg-deep/50 backdrop-blur-xl p-8"
                style={{
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl" />
                <div className="relative space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-steel">
                    <Sparkles className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-2xl font-black uppercase tracking-wide text-cyan-400">
                      Intel Database
                    </h3>
                  </div>

                  {game.game?.description ? (
                    <p className="text-gray-300 leading-relaxed text-sm">
                      {game.game.description}
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      No description available. Use IGDB search to fetch game details.
                    </p>
                  )}

                  {/* Meta Information Grid */}
                  <div className="grid grid-cols-1 gap-4 pt-4 border-t border-steel">
                    {game.game?.developer && (
                      <div className="flex items-start gap-4 p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                          <Zap className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs uppercase tracking-[0.2em] text-cyan-400/70 mb-1">
                            Developer
                          </div>
                          <div className="font-bold text-white">{game.game.developer}</div>
                        </div>
                      </div>
                    )}

                    {game.game?.publisher && (
                      <div className="flex items-start gap-4 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Target className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs uppercase tracking-[0.2em] text-purple-400/70 mb-1">
                            Publisher
                          </div>
                          <div className="font-bold text-white">{game.game.publisher}</div>
                        </div>
                      </div>
                    )}

                    {game.game?.release_date && (
                      <div className="flex items-start gap-4 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs uppercase tracking-[0.2em] text-emerald-400/70 mb-1">
                            Release Date
                          </div>
                          <div className="font-bold text-white">
                            {new Date(game.game.release_date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  {game.game?.genres && game.game.genres.length > 0 && (
                    <div className="pt-4 border-t border-steel">
                      <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-3">
                        Genre Classification
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {game.game.genres.map((genre, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs uppercase tracking-[0.15em] font-bold text-cyan-300 hover:bg-cyan-500/20 transition-colors"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity & Metadata Panel */}
              <div className="space-y-8">
                {/* Activity Timeline */}
                <div
                  className="relative overflow-hidden rounded-2xl border-2 border-steel bg-deep/50 backdrop-blur-xl p-8"
                  style={{
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
                  <div className="relative space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-steel">
                      <PlayCircle className="w-6 h-6 text-purple-400" />
                      <h3 className="text-2xl font-black uppercase tracking-wide text-purple-400">
                        Activity Log
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {game.last_played_at && (
                        <div className="flex items-start gap-4 p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
                          <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <PlayCircle className="w-5 h-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs uppercase tracking-[0.2em] text-cyan-400/70 mb-1">
                              Last Session
                            </div>
                            <div className="font-bold text-white">
                              {new Date(game.last_played_at).toLocaleDateString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-4 p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs uppercase tracking-[0.2em] text-purple-400/70 mb-1">
                            Library Entry
                          </div>
                          <div className="font-bold text-white">
                            {new Date(game.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <div className="text-xs uppercase tracking-[0.2em] text-emerald-400/70 mb-1">
                            Data Sync
                          </div>
                          <div className="font-bold text-white">
                            {new Date(game.updated_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {game.tags && game.tags.length > 0 && (
                  <div
                    className="relative overflow-hidden rounded-2xl border-2 border-steel bg-deep/50 backdrop-blur-xl p-8"
                    style={{
                      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div className="relative space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b-2 border-steel">
                        <Tag className="w-6 h-6 text-purple-400" />
                        <h3 className="text-2xl font-black uppercase tracking-wide text-purple-400">
                          Tags
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {game.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-sm uppercase tracking-[0.15em] font-bold text-purple-300 hover:bg-purple-500/20 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personal Notes - Full Width */}
            {game.notes && (
              <div
                className="mt-8 relative overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-transparent backdrop-blur-xl p-8"
                style={{
                  boxShadow: '0 10px 40px rgba(0, 217, 255, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="absolute top-0 left-1/2 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
                <div className="relative space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b-2 border-cyan-500/30">
                    <Edit className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-2xl font-black uppercase tracking-wide text-cyan-400">
                      Personal Notes
                    </h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {game.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
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
    </>
  );
}
