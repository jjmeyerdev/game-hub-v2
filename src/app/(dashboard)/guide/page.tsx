import { Book, ChevronRight, Clock, Shield, AlertTriangle, CheckCircle2, Key, Fingerprint, Zap, Terminal, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SteamLogo, PlayStationLogo, XboxLogo, EpicLogo } from '@/components/icons/PlatformLogos';

export default function GuidePage() {
  return (
    <div className="relative min-h-screen bg-[var(--theme-bg-primary)]">
      {/* Ambient glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/[0.03] rounded-full blur-[120px] animate-breathe" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[120px] animate-breathe" style={{ animationDelay: '2s' }} />
      </div>

      {/* Header */}
      <header className="relative border-b border-[var(--theme-border)]">
        {/* Top accent line */}
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

        <div className="px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with HUD corners */}
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Book className="w-6 h-6 text-amber-400" />
                </div>
                {/* HUD corners */}
                <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-amber-400/50" />
                <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-amber-400/50" />
                <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-amber-400/50" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-amber-400/50" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">// SETUP_MANUAL</span>
                </div>
                <h1 className="text-2xl font-bold text-[var(--theme-text-primary)] uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                  SETUP GUIDE
                </h1>
              </div>
            </div>

            <Link
              href="/settings"
              className="group flex items-center gap-2 px-4 py-2 bg-[var(--theme-hover-bg)] hover:bg-amber-500/10 border border-[var(--theme-border)] hover:border-amber-500/30 rounded-xl text-sm text-[var(--theme-text-muted)] hover:text-amber-400 transition-all"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-mono text-xs uppercase tracking-wider">Back to Settings</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-10 space-y-10">

        {/* Introduction */}
        <section className="relative p-6 bg-[var(--theme-bg-secondary)] border border-cyan-500/20 rounded-xl overflow-hidden">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyan-400/30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyan-400/30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-400/30" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-400/30" />

          <div className="flex items-start gap-4">
            <div className="relative w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-cyan-400" />
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-bold text-[var(--theme-text-primary)] uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                  Getting Started
                </h2>
                <span className="text-[10px] font-mono text-[var(--theme-text-muted)]">// INIT_SEQUENCE</span>
              </div>
              <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">
                Connect your gaming platforms to automatically sync game libraries, track achievements, and monitor playtime.
                Each platform uses a different authentication method detailed below.
              </p>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded">
                  <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Encrypted</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">~5 min/platform</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steam Section */}
        <PlatformSection
          id="steam"
          name="Steam"
          tagline="PC Gaming Platform"
          color="cyan"
          difficulty="Easy"
          time="2 min"
          icon={<SteamLogo size="md" />}
          requirements={[
            'Steam account with public profile',
            'Game details set to public in privacy settings',
          ]}
          steps={[
            {
              title: 'Option A: Sign in with Steam (Recommended)',
              description: 'Click "Sign in with Steam" to authenticate directly through Steam\'s official login.',
            },
            {
              title: 'Option B: Manual Link with Steam ID',
              description: 'Expand "Or link manually with Steam ID" and enter your Steam ID64 or profile URL.',
            },
            {
              title: 'Find your Steam ID',
              description: 'Visit steamid.io and enter your profile URL to find your Steam ID64 (17-digit number).',
            },
            {
              title: 'Set profile to public',
              description: 'Go to Steam → Profile → Edit Profile → Privacy Settings. Set "Game details" to Public.',
            },
          ]}
          tips={[
            'Steam offers complete integration with playtime tracking',
            'Recently played games sync automatically every 5 minutes',
            'Achievement progress is tracked for all games',
          ]}
          warnings={[
            'Private profiles cannot be synced - ensure your profile is public',
          ]}
        />

        {/* PlayStation Section */}
        <PlatformSection
          id="playstation"
          name="PlayStation"
          tagline="PSN Network"
          color="blue"
          difficulty="Medium"
          time="5 min"
          icon={<PlayStationLogo size="md" />}
          requirements={[
            'PlayStation Network account',
            'Access to a web browser',
            'Signed into playstation.com',
          ]}
          steps={[
            {
              title: 'Sign into PlayStation',
              description: 'Open a new tab and go to playstation.com. Sign in with your PSN credentials.',
            },
            {
              title: 'Access the NPSSO token URL',
              description: 'Click "Copy token URL" in Game Hub, or visit: ca.account.sony.com/api/v1/ssocookie',
            },
            {
              title: 'Copy your NPSSO token',
              description: 'Find the "npsso" value in the JSON response - it\'s a 64-character string.',
            },
            {
              title: 'Paste token in Game Hub',
              description: 'Paste the NPSSO token into the input field and click "Connect".',
            },
          ]}
          tips={[
            'NPSSO tokens expire after approximately 2 months',
            'You\'ll need to re-authenticate when the token expires',
            'Trophy data and game library sync automatically',
          ]}
          warnings={[
            'Never share your NPSSO token with anyone',
            'If you see an error, ensure you\'re signed into playstation.com first',
          ]}
        />

        {/* Xbox Section */}
        <PlatformSection
          id="xbox"
          name="Xbox"
          tagline="Xbox Live"
          color="emerald"
          difficulty="Medium"
          time="5 min"
          icon={<XboxLogo size="md" />}
          requirements={[
            'Xbox/Microsoft account',
            'Free OpenXBL account (xbl.io)',
          ]}
          steps={[
            {
              title: 'Create OpenXBL account',
              description: 'Visit xbl.io and sign in using your Xbox/Microsoft account.',
            },
            {
              title: 'Navigate to API settings',
              description: 'Go to "API Console" or "Getting Started" in the OpenXBL dashboard.',
            },
            {
              title: 'Copy your API key',
              description: 'Your API key will be displayed. Copy this alphanumeric string.',
            },
            {
              title: 'Enter key in Game Hub',
              description: 'Paste the API key into the Xbox settings and click "Connect".',
            },
          ]}
          tips={[
            'OpenXBL is a free service that provides Xbox API access',
            'Gamerscore and achievements sync with your library',
            'The API key doesn\'t expire unless regenerated',
          ]}
          warnings={[
            'OpenXBL has rate limits - avoid excessive syncing',
            'Keep your API key secure',
          ]}
        />

        {/* Epic Games Section */}
        <PlatformSection
          id="epic"
          name="Epic Games"
          tagline="Epic Games Store"
          color="gray"
          difficulty="Medium"
          time="3 min"
          icon={<span className="text-[var(--theme-text-primary)]"><EpicLogo size="md" /></span>}
          requirements={[
            'Epic Games account',
            'Access to a web browser',
          ]}
          steps={[
            {
              title: 'Click "Sign in with Epic Games"',
              description: 'This opens Epic\'s authorization page in a new window.',
            },
            {
              title: 'Authorize the connection',
              description: 'Sign in to your Epic Games account. You\'ll see a JSON response.',
            },
            {
              title: 'Copy the authorization code',
              description: 'Find "authorizationCode" in the response. Copy just the code value.',
            },
            {
              title: 'Complete the link',
              description: 'Paste the code in Game Hub and click "Link Account".',
            },
          ]}
          tips={[
            'The authorization code expires quickly - complete promptly',
            'Free games claimed through Epic will appear in your library',
          ]}
          warnings={[
            'Achievement tracking is not available for Epic Games',
            'Only your game library will sync, not playtime',
          ]}
        />

        {/* Quick Reference */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-4 h-4 text-[var(--theme-text-muted)]" />
            <h2 className="text-sm font-semibold text-[var(--theme-text-secondary)] uppercase tracking-wide font-[family-name:var(--font-family-display)]">
              Quick Reference
            </h2>
            <span className="text-[10px] font-mono text-[var(--theme-text-muted)]">// AUTH_METHODS</span>
            <div className="h-px flex-1 bg-[var(--theme-border)]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <QuickRefCard platform="Steam" method="Steam Login or Steam ID" color="cyan" icon={<Key className="w-4 h-4" />} />
            <QuickRefCard platform="PlayStation" method="NPSSO Token" color="blue" icon={<Fingerprint className="w-4 h-4" />} />
            <QuickRefCard platform="Xbox" method="OpenXBL API Key" color="emerald" icon={<Key className="w-4 h-4" />} />
            <QuickRefCard platform="Epic Games" method="Authorization Code" color="gray" icon={<Key className="w-4 h-4" />} />
          </div>
        </section>

        {/* Footer */}
        <footer className="relative pt-6 border-t border-[var(--theme-border)]">
          {/* HUD corners */}
          <div className="absolute top-0 left-0 w-6 h-6 border-l border-t border-[var(--theme-border)]" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r border-t border-[var(--theme-border)]" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="w-3.5 h-3.5 text-[var(--theme-text-subtle)]" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <p className="text-[11px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">
                  Guide v2.0.0-pre-alpha <span className="text-[var(--theme-text-subtle)]">•</span> Documentation
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="group flex items-center gap-1.5 text-[11px] font-mono text-[var(--theme-accent-cyan)] hover:text-cyan-300 transition-colors uppercase tracking-wider"
            >
              Return to Settings
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

// Platform Section Component
interface PlatformSectionProps {
  id: string;
  name: string;
  tagline: string;
  color: 'cyan' | 'blue' | 'emerald' | 'gray';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  time: string;
  icon: React.ReactNode;
  requirements: string[];
  steps: { title: string; description: string }[];
  tips: string[];
  warnings: string[];
}

function PlatformSection({ id, name, tagline, color, difficulty, time, icon, requirements, steps, tips, warnings }: PlatformSectionProps) {
  const colorConfig = {
    cyan: {
      border: 'border-cyan-500/20',
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      headerBg: 'bg-cyan-500/5',
      corner: 'border-cyan-400/30',
    },
    blue: {
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      headerBg: 'bg-blue-500/5',
      corner: 'border-blue-400/30',
    },
    emerald: {
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      headerBg: 'bg-emerald-500/5',
      corner: 'border-emerald-400/30',
    },
    gray: {
      border: 'border-[var(--theme-border)]',
      text: '',
      bg: 'bg-[var(--theme-hover-bg)]',
      headerBg: 'bg-[var(--theme-hover-bg)]',
      corner: 'border-[var(--theme-text-subtle)]',
    },
  };

  const c = colorConfig[color];
  const difficultyColor = difficulty === 'Easy' ? 'text-emerald-400' : difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400';
  const difficultyBg = difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20' : difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';

  return (
    <section id={id} className="scroll-mt-24">
      <div className={`relative bg-[var(--theme-bg-secondary)] border ${c.border} rounded-xl overflow-hidden`}>
        {/* HUD corners */}
        <div className={`absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 ${c.corner}`} />
        <div className={`absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 ${c.corner}`} />
        <div className={`absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 ${c.corner}`} />
        <div className={`absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 ${c.corner}`} />

        {/* Header */}
        <div className={`px-6 py-4 ${c.headerBg} border-b border-[var(--theme-border)]`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`relative w-11 h-11 rounded-lg ${c.bg} ${c.border} border flex items-center justify-center`}>
                <span className={c.text}>{icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--theme-text-primary)] uppercase tracking-wide font-[family-name:var(--font-family-display)]">
                    {name}
                  </h3>
                  <span className="text-[9px] font-mono text-[var(--theme-text-subtle)] uppercase tracking-wider">
                    // {id.toUpperCase()}_API
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">{tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-[9px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider mb-1">Difficulty</p>
                <div className={`px-2 py-0.5 rounded ${difficultyBg} border`}>
                  <p className={`text-[10px] font-mono font-medium ${difficultyColor} uppercase tracking-wider`}>{difficulty}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-[var(--theme-border)]" />
              <div className="text-right">
                <p className="text-[9px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider mb-1">Time</p>
                <p className="text-xs font-mono font-medium text-[var(--theme-text-primary)]">{time}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Requirements */}
          <div className="relative p-4 bg-[var(--theme-hover-bg)] rounded-lg border border-[var(--theme-border)] overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[var(--theme-text-subtle)]" />
            <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[var(--theme-text-subtle)]" />
            <h4 className="text-[10px] font-mono font-medium text-[var(--theme-text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Requirements
            </h4>
            <ul className="space-y-2">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[var(--theme-text-secondary)]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h4 className="text-[10px] font-mono font-medium text-[var(--theme-text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Execution Steps
            </h4>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`relative w-7 h-7 rounded-md ${c.bg} ${c.border} border flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xs font-mono font-bold ${c.text}`}>{i + 1}</span>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h5 className="text-sm font-semibold text-[var(--theme-text-primary)] mb-0.5">{step.title}</h5>
                    <p className="text-sm text-[var(--theme-text-muted)] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips & Warnings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-emerald-400/30" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-emerald-400/30" />
              <h4 className="text-[10px] font-mono font-medium text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" />
                Tips
              </h4>
              <ul className="space-y-1.5">
                {tips.map((tip, i) => (
                  <li key={i} className="text-xs text-[var(--theme-text-muted)] flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5 font-mono">+</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative p-4 bg-amber-500/5 border border-amber-500/15 rounded-lg overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-amber-400/30" />
              <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-amber-400/30" />
              <h4 className="text-[10px] font-mono font-medium text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Warnings
              </h4>
              <ul className="space-y-1.5">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-[var(--theme-text-muted)] flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5 font-mono">!</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Quick Reference Card
interface QuickRefCardProps {
  platform: string;
  method: string;
  color: 'cyan' | 'blue' | 'emerald' | 'gray';
  icon: React.ReactNode;
}

function QuickRefCard({ platform, method, color, icon }: QuickRefCardProps) {
  const colorMap = {
    cyan: { border: 'border-cyan-500/20', text: 'text-cyan-400', bg: 'bg-cyan-500/5', corner: 'border-cyan-400/30' },
    blue: { border: 'border-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500/5', corner: 'border-blue-400/30' },
    emerald: { border: 'border-emerald-500/20', text: 'text-emerald-400', bg: 'bg-emerald-500/5', corner: 'border-emerald-400/30' },
    gray: { border: 'border-[var(--theme-border)]', text: 'text-[var(--theme-text-muted)]', bg: 'bg-[var(--theme-hover-bg)]', corner: 'border-[var(--theme-text-subtle)]' },
  };

  const c = colorMap[color];

  return (
    <div className={`group relative flex items-center gap-3 p-3 bg-[var(--theme-bg-secondary)] ${c.bg} border ${c.border} rounded-lg hover:border-[var(--theme-text-muted)] transition-all`}>
      {/* HUD corners on hover */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-l border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute top-0 right-0 w-2 h-2 border-r border-t ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-l border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-r border-b ${c.corner} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <span className={c.text}>{icon}</span>
      <div>
        <p className={`text-sm font-semibold uppercase tracking-wide font-[family-name:var(--font-family-display)] ${c.text}`}>
          {platform}
        </p>
        <p className="text-[10px] font-mono text-[var(--theme-text-muted)] uppercase tracking-wider">{method}</p>
      </div>
    </div>
  );
}
