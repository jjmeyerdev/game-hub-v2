// Steam module barrel export

// Client functions
export {
  // Validation
  validateSteamId,
  // Player data
  getPlayerSummary,
  getCurrentlyPlayingGame,
  getOwnedGames,
  getPlayerAchievements,
  getGameSchema,
  getGameDetails,
  // URL builders
  getSteamStoreUrl,
  getSteamIconUrl,
  getSteamLogoUrl,
  getSteamHeaderUrl,
  getSteamLibraryCapsuleUrl,
  getSteamLibraryHeroUrl,
  // Utilities
  convertPlaytimeToHours,
  // Rate limiting
  canMakeSteamRequest,
  getSteamRateLimitWaitTime,
} from './client';

// OpenID authentication
export {
  generateSteamLoginUrl,
  verifySteamOpenId,
  parseOpenIdParams,
} from './openid';
