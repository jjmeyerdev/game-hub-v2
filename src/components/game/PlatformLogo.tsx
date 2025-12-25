import { Gamepad2 } from 'lucide-react';
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

export function getPlatformLogo(platform: string, className?: string) {
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

  return <Gamepad2 className={logoClass} />;
}
