'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Gamepad2,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  HelpCircle,
  Link2,
  RefreshCw,
  Trophy,
  Shield,
  Zap,
  Search,
} from 'lucide-react';
import {
  SteamLogo,
  PlayStationLogo,
  XboxLogo,
  EpicLogo,
} from '@/components/icons/PlatformLogos';
import { ModeToggle } from '@/components/theme';

interface FAQItem {
  id: string;
  question: string;
  answer: React.ReactNode;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  description: string;
  questions: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    color: 'cyan',
    description: 'New to GameHub? Start here.',
    questions: [
      {
        id: 'what-is-gamehub',
        question: 'What is GameHub?',
        answer: (
          <>
            <p>
              GameHub is a unified game library aggregation platform that brings all your games from different
              platforms into one centralized dashboard. Track your backlog, monitor achievements, analyze playtime,
              and never lose track of a game again.
            </p>
            <p>
              Whether you game on Steam, PlayStation, Xbox, or multiple platforms, GameHub gives you a
              complete picture of your gaming life in one place.
            </p>
          </>
        ),
      },
      {
        id: 'is-it-free',
        question: 'Is GameHub free to use?',
        answer: (
          <>
            <p>
              Yes! GameHub is completely free for personal use. There are no premium tiers, no hidden fees,
              and no paywalls. All features including unlimited game tracking, platform connections, and
              achievement sync are available to everyone.
            </p>
            <p className="text-theme-muted text-sm mt-4">
              We may introduce optional premium features in the future, but core functionality will always remain free.
            </p>
          </>
        ),
      },
      {
        id: 'platforms-supported',
        question: 'Which gaming platforms are supported?',
        answer: (
          <div className="space-y-4">
            <p>GameHub supports automatic sync with:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="flex items-center gap-3 p-3 bg-theme-hover border border-theme rounded-lg">
                <SteamLogo className="w-5 h-5" />
                <span className="text-sm font-medium">Steam</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-theme-hover border border-theme rounded-lg">
                <PlayStationLogo className="w-5 h-5" />
                <span className="text-sm font-medium">PlayStation</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-theme-hover border border-theme rounded-lg">
                <XboxLogo className="w-5 h-5" />
                <span className="text-sm font-medium">Xbox</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-theme-hover border border-theme rounded-lg">
                <EpicLogo className="w-5 h-5" />
                <span className="text-sm font-medium">Epic Games</span>
              </div>
            </div>
            <p>
              You can also manually add games from Nintendo, GOG, EA App, Battle.net, Ubisoft Connect,
              physical media, retro consoles, and any other platform.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    id: 'connecting-platforms',
    title: 'Connecting Platforms',
    icon: Link2,
    color: 'violet',
    description: 'Link your gaming accounts.',
    questions: [
      {
        id: 'how-to-connect-steam',
        question: 'How do I connect my Steam account?',
        answer: (
          <>
            <p>To connect your Steam account:</p>
            <ol className="list-decimal pl-5 space-y-2 my-4">
              <li>Go to <strong>Settings</strong> from the sidebar</li>
              <li>Find the <strong>Steam</strong> section under Platform Connections</li>
              <li>Click <strong>Connect Steam</strong></li>
              <li>You&apos;ll be redirected to Steam&apos;s login page</li>
              <li>Sign in and authorize GameHub</li>
              <li>Your games will automatically start syncing</li>
            </ol>
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm">
              <strong className="text-amber-400">Important:</strong> Make sure your Steam profile and game details
              are set to <strong>Public</strong> in your Steam privacy settings for the sync to work.
            </div>
          </>
        ),
      },
      {
        id: 'how-to-connect-psn',
        question: 'How do I connect my PlayStation Network account?',
        answer: (
          <>
            <p>To connect your PSN account:</p>
            <ol className="list-decimal pl-5 space-y-2 my-4">
              <li>Go to <strong>Settings</strong> from the sidebar</li>
              <li>Find the <strong>PlayStation</strong> section</li>
              <li>Enter your PSN Online ID (your public username)</li>
              <li>Click <strong>Connect</strong></li>
              <li>Your trophy data and games will sync automatically</li>
            </ol>
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-sm">
              <strong className="text-cyan-400">Note:</strong> PSN syncing uses your public trophy data.
              Make sure your trophy privacy settings are set to &quot;Anyone&quot; in your PlayStation account settings.
            </div>
          </>
        ),
      },
      {
        id: 'how-to-connect-xbox',
        question: 'How do I connect my Xbox account?',
        answer: (
          <>
            <p>To connect your Xbox account:</p>
            <ol className="list-decimal pl-5 space-y-2 my-4">
              <li>Go to <strong>Settings</strong> from the sidebar</li>
              <li>Find the <strong>Xbox</strong> section</li>
              <li>Enter your Xbox Gamertag</li>
              <li>Click <strong>Connect</strong></li>
              <li>Your achievements and games will sync automatically</li>
            </ol>
            <p>
              Xbox sync pulls your public achievement data and game library. Make sure your Xbox privacy
              settings allow others to see your game history and achievements.
            </p>
          </>
        ),
      },
      {
        id: 'how-to-connect-epic',
        question: 'How do I connect my Epic Games account?',
        answer: (
          <>
            <p>To connect your Epic Games account:</p>
            <ol className="list-decimal pl-5 space-y-2 my-4">
              <li>Go to <strong>Settings</strong> from the sidebar</li>
              <li>Find the <strong>Epic Games</strong> section</li>
              <li>Click <strong>Connect Epic Games</strong></li>
              <li>You&apos;ll be redirected to Epic&apos;s login page</li>
              <li>Sign in and authorize GameHub</li>
              <li>Your library will sync automatically</li>
            </ol>
            <p>
              Epic Games sync includes all games in your library, including free game claims.
              Note that Epic doesn&apos;t have a public achievement system, so only game ownership
              and basic metadata are synced.
            </p>
          </>
        ),
      },
      {
        id: 'disconnect-platform',
        question: 'How do I disconnect a platform?',
        answer: (
          <>
            <p>
              To disconnect a platform, go to <strong>Settings → Platform Connections</strong> and click
              the <strong>Disconnect</strong> button next to the platform you want to remove.
            </p>
            <p>
              <strong>Important:</strong> Disconnecting a platform will stop automatic syncing, but your
              previously synced games will remain in your library. You can delete individual games manually
              if needed, or reconnect the platform at any time.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'syncing',
    title: 'Library Sync',
    icon: RefreshCw,
    color: 'emerald',
    description: 'Keep your library up to date.',
    questions: [
      {
        id: 'how-often-sync',
        question: 'How often does GameHub sync my library?',
        answer: (
          <>
            <p>Sync frequency varies by platform:</p>
            <ul className="space-y-2 my-4">
              <li className="flex items-center gap-3">
                <span className="w-28 text-sm text-theme-muted">Steam:</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-mono">Real-time</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-28 text-sm text-theme-muted">PlayStation:</span>
                <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs font-mono">Every 15 min</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-28 text-sm text-theme-muted">Xbox:</span>
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-mono">Real-time</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-28 text-sm text-theme-muted">Epic Games:</span>
                <span className="px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs font-mono">Every 30 min</span>
              </li>
            </ul>
            <p>
              You can also manually trigger a sync at any time from the Settings page or by clicking
              the sync button in your library.
            </p>
          </>
        ),
      },
      {
        id: 'sync-not-working',
        question: 'Why isn\'t my library syncing?',
        answer: (
          <>
            <p>If your library isn&apos;t syncing, check these common issues:</p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li><strong>Privacy settings:</strong> Make sure your profile and game data are set to public on the platform</li>
              <li><strong>Account connection:</strong> Try disconnecting and reconnecting your account</li>
              <li><strong>Rate limits:</strong> Some platforms have API limits; wait a few minutes and try again</li>
              <li><strong>Platform outages:</strong> Check if the gaming platform itself is experiencing issues</li>
            </ul>
            <p>
              If issues persist, check the <strong>Sync Logs</strong> in Settings for detailed error messages.
            </p>
          </>
        ),
      },
      {
        id: 'manual-games',
        question: 'Can I manually add games?',
        answer: (
          <>
            <p>
              Absolutely! Click the <strong>Add Game</strong> button in your library to manually add any game.
              You can search our database of over 200,000 games, or create a custom entry for games not in our system.
            </p>
            <p>
              Manual games support all the same features as synced games: status tracking, notes, ratings,
              playtime logging, and more.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'achievements',
    title: 'Achievements & Trophies',
    icon: Trophy,
    color: 'amber',
    description: 'Track your gaming accomplishments.',
    questions: [
      {
        id: 'achievement-tracking',
        question: 'How does achievement tracking work?',
        answer: (
          <>
            <p>
              GameHub automatically syncs your achievements and trophies from connected platforms. We track:
            </p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li><strong>Steam:</strong> All achievements with unlock timestamps</li>
              <li><strong>PlayStation:</strong> All trophies (Bronze, Silver, Gold, Platinum) with rarity data</li>
              <li><strong>Xbox:</strong> All achievements with Gamerscore points</li>
            </ul>
            <p>
              View your unified achievement progress on the <strong>Achievements</strong> page, including
              overall completion percentage, platform breakdowns, and games close to 100%.
            </p>
          </>
        ),
      },
      {
        id: 'achievement-ownership',
        question: 'What if I sold a game but want to keep my achievements?',
        answer: (
          <>
            <p>
              GameHub supports &quot;previously owned&quot; games! When you mark a game as previously owned,
              your achievement data is preserved as a snapshot. You can also manually override which
              achievements count as &quot;yours&quot; using the ownership toggle on individual achievements.
            </p>
            <p>
              This is perfect for tracking games you played via Game Pass, borrowed from a friend, or
              sold after completing.
            </p>
          </>
        ),
      },
      {
        id: 'perfect-games',
        question: 'What counts as a "Perfect Game"?',
        answer: (
          <>
            <p>
              A Perfect Game is any game where you&apos;ve earned 100% of the available achievements or trophies.
              These are showcased in the <strong>Hall of Fame</strong> section of your Achievements page.
            </p>
            <p>
              Perfect Games are calculated based on your actual unlock data, so DLC achievements
              are included if you&apos;ve unlocked any from that DLC pack.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'privacy-security',
    title: 'Privacy & Security',
    icon: Shield,
    color: 'rose',
    description: 'Your data, protected.',
    questions: [
      {
        id: 'data-storage',
        question: 'What data does GameHub store?',
        answer: (
          <>
            <p>GameHub stores the following data:</p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li>Your account information (email, username)</li>
              <li>Connected platform identifiers (Steam ID, PSN ID, Gamertag)</li>
              <li>Your game library data (games, playtime, achievements)</li>
              <li>Your personal notes and ratings</li>
              <li>Platform API tokens (securely encrypted)</li>
            </ul>
            <p>
              We never store your platform passwords. All authentication is handled through official
              OAuth flows or public API access.
            </p>
          </>
        ),
      },
      {
        id: 'data-sharing',
        question: 'Is my gaming data shared with anyone?',
        answer: (
          <>
            <p>
              <strong>No.</strong> Your gaming data is never sold, shared with advertisers, or used for
              any purpose other than providing GameHub&apos;s features to you.
            </p>
            <p>
              The only data sharing that occurs is when you explicitly choose to compare your library
              with friends, and even then, only the data you choose to share is visible.
            </p>
          </>
        ),
      },
      {
        id: 'delete-account',
        question: 'How do I delete my account and data?',
        answer: (
          <>
            <p>
              You can delete your account at any time from <strong>Settings → Account → Delete Account</strong>.
              This will permanently delete:
            </p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li>Your GameHub account</li>
              <li>All connected platform data</li>
              <li>Your entire game library</li>
              <li>All notes, ratings, and custom data</li>
            </ul>
            <p className="text-rose-400 text-sm">
              This action is irreversible. Make sure to export your data first if you want a backup.
            </p>
          </>
        ),
      },
      {
        id: 'adult-content',
        question: 'How does GameHub handle adult content?',
        answer: (
          <>
            <p>
              Games tagged as &quot;adult&quot; are automatically blurred in your library and achievement pages
              to prevent accidental exposure. You can reveal individual games by clicking the
              &quot;Decrypt&quot; button on each card.
            </p>
            <p>
              This helps keep your library screen-share safe while still allowing you to track all your games.
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: 'general',
    title: 'General',
    icon: HelpCircle,
    color: 'blue',
    description: 'Everything else.',
    questions: [
      {
        id: 'mobile-app',
        question: 'Is there a mobile app?',
        answer: (
          <>
            <p>
              GameHub is a progressive web app (PWA), meaning you can install it on your mobile device
              directly from your browser. On iOS, tap Share → Add to Home Screen. On Android, tap the
              install prompt or menu → Install App.
            </p>
            <p>
              A dedicated native app is planned for the future.
            </p>
          </>
        ),
      },
      {
        id: 'offline-access',
        question: 'Does GameHub work offline?',
        answer: (
          <>
            <p>
              Basic library browsing works offline once data has been cached. However, syncing,
              searching for new games, and real-time features require an internet connection.
            </p>
          </>
        ),
      },
      {
        id: 'feature-request',
        question: 'How can I request a feature?',
        answer: (
          <>
            <p>
              We love hearing from our users! You can submit feature requests through:
            </p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li>Our GitHub repository&apos;s Issues page</li>
              <li>The feedback form in Settings</li>
              <li>Our Discord community</li>
            </ul>
            <p>
              Popular feature requests are reviewed monthly and prioritized based on community demand
              and technical feasibility.
            </p>
          </>
        ),
      },
      {
        id: 'bug-report',
        question: 'How do I report a bug?',
        answer: (
          <>
            <p>
              Found a bug? Please report it with as much detail as possible:
            </p>
            <ul className="list-disc pl-5 space-y-2 my-4">
              <li>What you were trying to do</li>
              <li>What happened instead</li>
              <li>Your browser and device</li>
              <li>Screenshots if applicable</li>
            </ul>
            <p>
              Submit bug reports through GitHub Issues or email support@gamehub.com.
            </p>
          </>
        ),
      },
    ],
  },
];

const colorClasses: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  cyan: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
  violet: {
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    glow: 'shadow-violet-500/20',
  },
  emerald: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  amber: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  rose: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    glow: 'shadow-rose-500/20',
  },
  blue: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/20',
  },
};

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState('getting-started');
  const [openQuestions, setOpenQuestions] = useState<Set<string>>(new Set(['what-is-gamehub']));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleQuestion = (id: string) => {
    setOpenQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    const element = document.getElementById(id);
    if (element) {
      const offset = 120;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  // Filter questions based on search
  const filteredCategories = searchQuery
    ? faqCategories
        .map((category) => ({
          ...category,
          questions: category.questions.filter(
            (q) =>
              q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (typeof q.answer === 'string' && q.answer.toLowerCase().includes(searchQuery.toLowerCase()))
          ),
        }))
        .filter((category) => category.questions.length > 0)
    : faqCategories;

  return (
    <div className="min-h-screen bg-theme-primary text-theme-primary">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/4 w-[600px] h-[600px] rounded-full opacity-30 animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.06) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full opacity-20 animate-breathe"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.08) 0%, transparent 70%)',
            animationDelay: '2s',
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-theme-primary/90 backdrop-blur-xl border-b border-theme">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-linear-to-br from-cyan-500 to-violet-600 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-l border-t border-cyan-400/50" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 border-r border-t border-cyan-400/50" />
                <div className="absolute -bottom-0.5 -left-0.5 w-2 h-2 border-l border-b border-cyan-400/50" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-r border-b border-cyan-400/50" />
              </div>
              <span className="text-lg font-semibold tracking-wide font-family-display">GAMEHUB</span>
            </Link>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg border border-theme bg-theme-hover"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <ModeToggle />

              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-sm text-theme-muted hover:text-accent-cyan border border-theme hover:border-accent-cyan/50 rounded-lg bg-theme-hover transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Return</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-20 left-4 right-4 bg-theme-secondary border border-theme rounded-xl p-4 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-theme">
              <HelpCircle className="w-4 h-4 text-accent-cyan" />
              <span className="text-xs font-mono text-theme-muted uppercase tracking-wider">Categories</span>
            </div>
            <nav className="space-y-1">
              {faqCategories.map((category) => {
                const colors = colorClasses[category.color];
                return (
                  <button
                    key={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all ${
                      activeCategory === category.id
                        ? `${colors.bg} ${colors.text}`
                        : 'text-theme-muted hover:bg-theme-hover'
                    }`}
                  >
                    <category.icon className="w-4 h-4" />
                    <span className="text-sm">{category.title}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Hero */}
          <div
            className={`text-center mb-12 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 mb-6">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <div className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
              </div>
              <span className="text-[10px] font-medium text-cyan-400 uppercase tracking-[0.25em] font-family-display">
                Support Database
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold font-family-display tracking-tight mb-4">
              <span className="text-theme-primary">FREQUENTLY </span>
              <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-violet-400 glow-cyan">
                ASKED
              </span>
            </h1>
            <p className="text-theme-muted text-lg max-w-xl mx-auto">
              Everything you need to know about GameHub. Can&apos;t find an answer?{' '}
              <Link href="/guide" className="text-accent-cyan hover:underline">
                Check our guide
              </Link>{' '}
              or reach out to support.
            </p>
          </div>

          {/* Search */}
          <div
            className={`max-w-2xl mx-auto mb-12 transition-all duration-700 delay-100 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-theme-secondary border border-theme rounded-xl text-theme-primary placeholder:text-theme-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-2 focus:ring-accent-cyan/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-theme-hover"
                >
                  <X className="w-4 h-4 text-theme-muted" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="relative">
                  {/* HUD Frame */}
                  <div className="absolute -inset-3">
                    <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />
                  </div>

                  <div className="bg-theme-secondary/50 backdrop-blur-sm border border-theme rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-5 pb-4 border-b border-theme">
                      <HelpCircle className="w-4 h-4 text-accent-cyan" />
                      <span className="text-[10px] font-mono text-accent-cyan uppercase tracking-wider">
                        // CATEGORIES
                      </span>
                    </div>
                    <nav className="space-y-1">
                      {faqCategories.map((category) => {
                        const colors = colorClasses[category.color];
                        return (
                          <button
                            key={category.id}
                            onClick={() => scrollToCategory(category.id)}
                            className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-300 ${
                              activeCategory === category.id
                                ? `${colors.bg} border ${colors.border}`
                                : 'hover:bg-theme-hover border border-transparent'
                            }`}
                          >
                            <category.icon
                              className={`w-4 h-4 transition-colors ${
                                activeCategory === category.id ? colors.text : 'text-theme-subtle group-hover:text-theme-muted'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <span
                                className={`text-sm transition-colors block ${
                                  activeCategory === category.id ? colors.text : 'text-theme-muted group-hover:text-theme-primary'
                                }`}
                              >
                                {category.title}
                              </span>
                              <span className="text-[10px] text-theme-subtle truncate block">
                                {category.questions.length} questions
                              </span>
                            </div>
                            {activeCategory === category.id && <ChevronRight className={`w-4 h-4 ${colors.text}`} />}
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                </div>
              </div>
            </aside>

            {/* Content */}
            <main ref={contentRef} className="space-y-12">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-theme-hover border border-theme flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-theme-muted" />
                  </div>
                  <h3 className="text-xl font-semibold text-theme-primary mb-2">No results found</h3>
                  <p className="text-theme-muted">
                    Try different keywords or{' '}
                    <button onClick={() => setSearchQuery('')} className="text-accent-cyan hover:underline">
                      clear the search
                    </button>
                  </p>
                </div>
              ) : (
                filteredCategories.map((category, categoryIndex) => {
                  const colors = colorClasses[category.color];
                  return (
                    <section
                      key={category.id}
                      id={category.id}
                      className="scroll-mt-32"
                      style={{ animationDelay: `${categoryIndex * 0.1}s` }}
                    >
                      {/* Category Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <div
                            className={`w-12 h-12 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}
                          >
                            <category.icon className={`w-5 h-5 ${colors.text}`} />
                          </div>
                          <div className={`absolute -top-1 -left-1 w-2 h-2 border-l border-t ${colors.border}`} />
                          <div className={`absolute -top-1 -right-1 w-2 h-2 border-r border-t ${colors.border}`} />
                          <div className={`absolute -bottom-1 -left-1 w-2 h-2 border-l border-b ${colors.border}`} />
                          <div className={`absolute -bottom-1 -right-1 w-2 h-2 border-r border-b ${colors.border}`} />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold font-family-display text-theme-primary">{category.title}</h2>
                          <p className="text-sm text-theme-muted">{category.description}</p>
                        </div>
                      </div>

                      {/* Questions */}
                      <div className="space-y-3">
                        {category.questions.map((question) => {
                          const isOpen = openQuestions.has(question.id);
                          return (
                            <div
                              key={question.id}
                              className={`group relative border rounded-xl overflow-hidden transition-all duration-300 ${
                                isOpen ? `${colors.border} ${colors.bg}` : 'border-theme bg-theme-secondary/50 hover:border-theme-hover'
                              }`}
                            >
                              {/* HUD corners on hover/open */}
                              <div
                                className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${colors.border} transition-opacity ${
                                  isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                }`}
                              />
                              <div
                                className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${colors.border} transition-opacity ${
                                  isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                }`}
                              />
                              <div
                                className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${colors.border} transition-opacity ${
                                  isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                }`}
                              />
                              <div
                                className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${colors.border} transition-opacity ${
                                  isOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'
                                }`}
                              />

                              <button
                                onClick={() => toggleQuestion(question.id)}
                                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                              >
                                <ChevronDown
                                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                                    isOpen ? `rotate-180 ${colors.text}` : 'text-theme-muted'
                                  }`}
                                />
                                <span
                                  className={`font-medium transition-colors ${
                                    isOpen ? colors.text : 'text-theme-primary group-hover:text-theme-primary'
                                  }`}
                                >
                                  {question.question}
                                </span>
                              </button>

                              <div
                                className={`grid transition-all duration-300 ${
                                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                }`}
                              >
                                <div className="overflow-hidden">
                                  <div className="px-5 pb-5 pl-14 prose-custom">{question.answer}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  );
                })
              )}

              {/* Still have questions CTA */}
              <div className="relative mt-16 p-8 rounded-2xl border border-theme bg-theme-secondary/50 overflow-hidden">
                {/* Background gradient */}
                <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 via-transparent to-violet-500/5" />

                {/* HUD corners */}
                <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyan-400/30" />
                <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyan-400/30" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-cyan-400/30" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-400/30" />

                <div className="relative text-center">
                  <h3 className="text-2xl font-bold font-family-display text-theme-primary mb-3">
                    Still have questions?
                  </h3>
                  <p className="text-theme-muted mb-6 max-w-md mx-auto">
                    Can&apos;t find what you&apos;re looking for? Our team is here to help.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4">
                    <Link
                      href="/guide"
                      className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl"
                    >
                      <div className="absolute inset-0 bg-linear-to-r from-cyan-500 to-violet-600 opacity-90 group-hover:opacity-100 transition-opacity" />
                      <span className="relative font-semibold text-white uppercase tracking-wide font-family-display text-sm">
                        View Guide
                      </span>
                      <ChevronRight className="relative w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <a
                      href="mailto:support@gamehub.com"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-theme hover:border-theme-hover rounded-xl text-theme-muted hover:text-theme-primary transition-all"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-8 border-t border-theme">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-theme-muted hover:text-accent-cyan transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-xs text-theme-muted hover:text-accent-cyan transition-colors">
                Terms of Service
              </Link>
            </div>
            <span className="text-xs font-mono text-theme-subtle">
              &copy; {new Date().getFullYear()} GameHub. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .prose-custom {
          font-size: 0.9375rem;
          line-height: 1.7;
          color: var(--theme-text-secondary);
        }
        .prose-custom p {
          margin-bottom: 1rem;
        }
        .prose-custom p:last-child {
          margin-bottom: 0;
        }
        .prose-custom ul,
        .prose-custom ol {
          margin: 1rem 0;
        }
        .prose-custom li {
          margin-bottom: 0.5rem;
        }
        .prose-custom strong {
          color: var(--theme-text-primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}
