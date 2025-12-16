import { Book, ChevronRight, Clock, Shield, AlertTriangle, ExternalLink, CheckCircle2, Copy, Key, Fingerprint, Zap } from 'lucide-react';
import Link from 'next/link';

export default function GuidePage() {
  return (
    <div className="relative min-h-screen">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 217, 255, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-void via-abyss to-void border-b border-amber-500/20 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(245, 158, 11, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(245, 158, 11, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }} />

        {/* Scan line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent animate-command-scan" />
        </div>

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-24 h-24">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 to-transparent" />
          <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-amber-500 to-transparent" />
        </div>
        <div className="absolute top-0 right-0 w-24 h-24">
          <div className="absolute top-0 right-0 w-full h-[2px] bg-gradient-to-l from-amber-500 to-transparent" />
          <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-amber-500 to-transparent" />
        </div>

        <div className="relative px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                  <div className="absolute inset-0 w-3 h-3 bg-amber-400 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-bold tracking-[0.15em] text-amber-400/80">INTEL</span>
              </div>

              <div className="h-12 w-px bg-gradient-to-b from-transparent via-steel to-transparent" />

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-[0.2em] text-amber-500/60">REFERENCE</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-amber-500/40 to-transparent w-16" />
                </div>
                <div className="flex items-baseline gap-3">
                  <Book className="w-5 h-5 text-amber-400" />
                  <h1 className="text-2xl font-black tracking-wide text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                    FIELD OPERATIONS MANUAL
                  </h1>
                </div>
              </div>
            </div>

            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 bg-steel/20 hover:bg-steel/30 border border-steel/30 rounded-lg text-sm text-gray-400 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Settings
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-10 space-y-12">

        {/* Introduction */}
        <section className="relative">
          <div className="relative p-6 bg-gradient-to-br from-deep/80 via-abyss/60 to-void/40 border border-steel/30 rounded-xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-2" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  MISSION BRIEFING
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Link your gaming platforms to automatically sync your game libraries, track achievements, and monitor playtime across all services.
                  Each platform requires different authentication methods detailed below. Follow the procedures carefully to establish secure connections.
                </p>
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs text-emerald-400">All data encrypted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs text-amber-400">~5 min per platform</span>
                  </div>
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
          color="blue"
          difficulty="Easy"
          time="2 min"
          icon={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658a3.387 3.387 0 0 1 1.912-.59c.064 0 .128.003.191.006l2.866-4.158v-.058c0-2.495 2.03-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.091 2.921c0 .054.003.108.003.164 0 1.872-1.521 3.393-3.393 3.393-1.703 0-3.113-1.268-3.346-2.913l-4.603-1.905A11.996 11.996 0 0 0 11.979 24c6.627 0 12-5.373 12-12s-5.372-12-12-12z"/>
            </svg>
          }
          requirements={[
            'Steam account with public profile',
            'Game details set to public in privacy settings',
          ]}
          steps={[
            {
              title: 'Option A: Sign in with Steam (Recommended)',
              description: 'Click "Sign in with Steam" to authenticate directly through Steam\'s official login. This is the fastest and most secure method.',
            },
            {
              title: 'Option B: Manual Link with Steam ID',
              description: 'If you prefer manual linking, expand "Or link manually with Steam ID" and enter your Steam ID64 or profile URL.',
            },
            {
              title: 'Find your Steam ID',
              description: 'Visit steamid.io and enter your profile URL to find your Steam ID64 (a 17-digit number like 76561198012345678).',
            },
            {
              title: 'Set profile to public',
              description: 'Go to Steam → Profile → Edit Profile → Privacy Settings. Set "Game details" to Public to allow library syncing.',
            },
          ]}
          tips={[
            'Steam offers the most complete integration with playtime tracking',
            'Recently played games sync automatically every 5 minutes',
            'Achievement progress is tracked for all games',
          ]}
          warnings={[
            'Private profiles cannot be synced - ensure your profile is set to public',
          ]}
        />

        {/* PlayStation Section */}
        <PlatformSection
          id="playstation"
          name="PlayStation"
          tagline="PSN Network"
          color="indigo"
          difficulty="Medium"
          time="5 min"
          icon={
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.181.76.814.76 1.505v5.876c2.441 1.193 4.362-.002 4.362-3.153 0-3.237-1.126-4.675-4.438-5.827-1.307-.448-3.728-1.186-5.393-1.502zm4.656 16.242l6.296-2.275c.715-.258.826-.625.246-.818-.586-.192-1.637-.139-2.357.123l-4.205 1.5v-2.385l.24-.085s1.201-.42 2.913-.615c1.696-.18 3.792.03 5.437.661 1.848.596 2.063 1.473 1.597 2.085-.466.611-1.635 1.04-1.635 1.04l-8.532 3.047v-2.278zM1.004 18.241c-1.513-.453-1.775-1.396-1.08-1.985.654-.556 1.77-.96 1.77-.96l5.572-1.99v2.316l-4.049 1.446c-.715.257-.826.625-.247.817.587.193 1.637.14 2.358-.12l1.938-.707v2.068c-.127.026-.262.047-.39.07-1.765.286-3.655.078-5.872-.955z"/>
            </svg>
          }
          requirements={[
            'PlayStation Network account',
            'Access to a web browser',
            'Signed into playstation.com',
          ]}
          steps={[
            {
              title: 'Sign into PlayStation',
              description: 'Open a new browser tab and go to playstation.com. Sign in with your PSN account credentials.',
            },
            {
              title: 'Access the NPSSO token URL',
              description: 'Click "Copy token URL" in Game Hub, or manually visit: ca.account.sony.com/api/v1/ssocookie',
            },
            {
              title: 'Copy your NPSSO token',
              description: 'The page will display a JSON response. Find the "npsso" value - it\'s a 64-character string. Copy this entire token.',
            },
            {
              title: 'Paste token in Game Hub',
              description: 'Return to Game Hub settings, paste the NPSSO token into the input field, and click "Connect".',
            },
          ]}
          tips={[
            'NPSSO tokens expire after approximately 2 months',
            'You\'ll need to re-authenticate when the token expires',
            'Trophy data and game library will sync automatically',
          ]}
          warnings={[
            'Never share your NPSSO token with anyone',
            'The token grants access to your PSN account data',
            'If you see an error, ensure you\'re signed into playstation.com first',
          ]}
        />

        {/* Xbox Section */}
        <PlatformSection
          id="xbox"
          name="Xbox"
          tagline="Xbox Live"
          color="green"
          difficulty="Medium"
          time="5 min"
          icon={
            <svg className="w-8 h-8" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 1.5a6.5 6.5 0 0 1 3.25.87c-.87.87-1.75 1.87-2.5 2.87L8 6l-.75-.76c-.75-1-1.63-2-2.5-2.87A6.5 6.5 0 0 1 8 1.5zM3.37 3.87c.75.75 1.63 1.75 2.38 2.88C4.25 8.5 3 10.75 2.5 12A6.47 6.47 0 0 1 1.5 8c0-1.5.5-3 1.87-4.13zM8 7.5l.75.75c1.12 1.25 2.12 2.75 2.87 4.12a6.45 6.45 0 0 1-7.24 0c.75-1.37 1.75-2.87 2.87-4.12L8 7.5zm4.63-3.63A6.47 6.47 0 0 1 14.5 8c0 1.5-.5 2.87-1.37 4-.5-1.25-1.75-3.5-3.25-5.25.75-1.13 1.63-2.13 2.75-2.88z"/>
            </svg>
          }
          requirements={[
            'Xbox/Microsoft account',
            'Free OpenXBL account (xbl.io)',
          ]}
          steps={[
            {
              title: 'Create OpenXBL account',
              description: 'Visit xbl.io and click "Login". Sign in using your Xbox/Microsoft account credentials.',
            },
            {
              title: 'Navigate to API settings',
              description: 'Once logged in, go to "API Console" or "Getting Started" in the OpenXBL dashboard.',
            },
            {
              title: 'Copy your API key',
              description: 'Your personal API key will be displayed. Copy this key - it\'s a long alphanumeric string.',
            },
            {
              title: 'Enter key in Game Hub',
              description: 'Paste the API key into the Xbox settings input field in Game Hub and click "Connect".',
            },
          ]}
          tips={[
            'OpenXBL is a free third-party service that provides Xbox API access',
            'Gamerscore and achievements sync with your library',
            'The API key does not expire unless you regenerate it',
          ]}
          warnings={[
            'OpenXBL has rate limits - avoid excessive syncing',
            'Keep your API key secure and don\'t share it publicly',
          ]}
        />

        {/* Epic Games Section */}
        <PlatformSection
          id="epic"
          name="Epic Games"
          tagline="Epic Games Store"
          color="slate"
          difficulty="Medium"
          time="3 min"
          icon={
            <svg className="w-8 h-8" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm3 4h6v1.5H6.5v2.25H10V9.25H6.5V12H11v1.5H5V4z"/>
            </svg>
          }
          requirements={[
            'Epic Games account',
            'Access to a web browser',
          ]}
          steps={[
            {
              title: 'Click "Sign in with Epic Games"',
              description: 'In Game Hub settings, click the sign-in button. This opens Epic\'s authorization page in a new window.',
            },
            {
              title: 'Authorize the connection',
              description: 'Sign in to your Epic Games account if prompted. You\'ll see a JSON response after successful authentication.',
            },
            {
              title: 'Copy the authorization code',
              description: 'Find the "authorizationCode" field in the JSON response. Copy only the code value (not the quotes or field name).',
            },
            {
              title: 'Complete the link',
              description: 'Paste the authorization code into the input field that appears in Game Hub and click "Link Account".',
            },
          ]}
          tips={[
            'The authorization code expires quickly - complete the process promptly',
            'Epic doesn\'t provide playtime data through their API',
            'Free games claimed through Epic will appear in your library',
          ]}
          warnings={[
            'Achievement tracking is not available for Epic Games',
            'Only your game library will sync, not playtime statistics',
          ]}
        />

        {/* Quick Reference Card */}
        <section className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-400/70">
                Quick Reference
              </h2>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/30 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <QuickRefCard
              platform="Steam"
              method="Steam Login or Steam ID"
              color="blue"
              icon={<Key className="w-4 h-4" />}
            />
            <QuickRefCard
              platform="PlayStation"
              method="NPSSO Token"
              color="indigo"
              icon={<Fingerprint className="w-4 h-4" />}
            />
            <QuickRefCard
              platform="Xbox"
              method="OpenXBL API Key"
              color="green"
              icon={<Key className="w-4 h-4" />}
            />
            <QuickRefCard
              platform="Epic Games"
              method="Authorization Code"
              color="slate"
              icon={<Copy className="w-4 h-4" />}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-steel/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <p className="text-xs text-gray-600 font-mono tracking-wider">FIELD MANUAL v1.0 // CLASSIFICATION: PUBLIC</p>
            </div>
            <Link
              href="/settings"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Return to Configuration
              <ChevronRight className="w-3 h-3" />
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
  color: 'blue' | 'indigo' | 'green' | 'slate';
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
    blue: {
      border: 'border-blue-500/30',
      bg: 'from-blue-500/10 to-blue-600/5',
      text: 'text-blue-400',
      accent: 'bg-blue-500',
      glow: 'via-blue-500/50',
      badge: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    },
    indigo: {
      border: 'border-indigo-500/30',
      bg: 'from-indigo-500/10 to-indigo-600/5',
      text: 'text-indigo-400',
      accent: 'bg-indigo-500',
      glow: 'via-indigo-500/50',
      badge: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
    },
    green: {
      border: 'border-green-500/30',
      bg: 'from-green-500/10 to-green-600/5',
      text: 'text-green-400',
      accent: 'bg-green-500',
      glow: 'via-green-500/50',
      badge: 'bg-green-500/10 border-green-500/30 text-green-400',
    },
    slate: {
      border: 'border-slate-500/30',
      bg: 'from-slate-500/10 to-slate-600/5',
      text: 'text-slate-400',
      accent: 'bg-slate-500',
      glow: 'via-slate-500/50',
      badge: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    },
  };

  const c = colorConfig[color];
  const difficultyColor = difficulty === 'Easy' ? 'text-emerald-400' : difficulty === 'Medium' ? 'text-amber-400' : 'text-red-400';

  return (
    <section id={id} className="relative scroll-mt-24">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className={c.text}>{icon}</span>
          <h2 className="text-xs font-bold tracking-[0.25em] uppercase text-gray-400">
            {name}
          </h2>
        </div>
        <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${c.glow} to-transparent`} />
        <span className="text-[10px] font-mono text-gray-600 tracking-wider uppercase">
          {tagline}
        </span>
      </div>

      {/* Main Card */}
      <div className={`relative overflow-hidden rounded-xl border ${c.border} bg-gradient-to-br ${c.bg}`}>
        {/* Top accent */}
        <div className={`h-1 bg-gradient-to-r from-transparent ${c.glow} to-transparent`} />

        <div className="p-6 space-y-6">
          {/* Platform Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${c.badge} border flex items-center justify-center`}>
                <span className={c.text}>{icon}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-rajdhani)' }}>
                  {name.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-500">{tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Difficulty</p>
                <p className={`text-sm font-bold ${difficultyColor}`}>{difficulty}</p>
              </div>
              <div className="w-px h-8 bg-steel/30" />
              <div className="text-right">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider">Est. Time</p>
                <p className="text-sm font-bold text-white">{time}</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="p-4 bg-abyss/50 rounded-lg border border-steel/20">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield className="w-3 h-3" />
              Requirements
            </h4>
            <ul className="space-y-2">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-3 h-3" />
              Procedure
            </h4>
            <div className="space-y-4">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className={`w-8 h-8 rounded-lg ${c.badge} border flex items-center justify-center flex-shrink-0 font-bold text-sm`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 pt-1">
                    <h5 className="text-sm font-semibold text-white mb-1">{step.title}</h5>
                    <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips & Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tips */}
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" />
                Tips
              </h4>
              <ul className="space-y-2">
                {tips.map((tip, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-emerald-500 mt-0.5">+</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Warnings */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                Warnings
              </h4>
              <ul className="space-y-2">
                {warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">!</span>
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
  color: 'blue' | 'indigo' | 'green' | 'slate';
  icon: React.ReactNode;
}

function QuickRefCard({ platform, method, color, icon }: QuickRefCardProps) {
  const colorMap = {
    blue: 'border-blue-500/30 text-blue-400',
    indigo: 'border-indigo-500/30 text-indigo-400',
    green: 'border-green-500/30 text-green-400',
    slate: 'border-slate-500/30 text-slate-400',
  };

  return (
    <div className={`flex items-center gap-3 p-3 bg-deep/50 border ${colorMap[color].split(' ')[0]} rounded-lg`}>
      <span className={colorMap[color].split(' ')[1]}>{icon}</span>
      <div>
        <p className={`text-sm font-semibold ${colorMap[color].split(' ')[1]}`}>{platform}</p>
        <p className="text-xs text-gray-500">{method}</p>
      </div>
    </div>
  );
}
