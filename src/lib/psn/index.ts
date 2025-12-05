// PSN module barrel export
export {
  // Authentication
  validateNpsso,
  authenticateWithNpsso,
  refreshAccessToken,
  // Profile
  getUserProfile,
  getTrophyProfileSummary,
  // Game library
  getGameLibrary,
  getTrophiesForTitle,
  // Utilities
  getPsnStoreSearchUrl,
  getPsnCoverUrl,
  calculateTotalTrophies,
  calculateDefinedTrophies,
  normalizePsnPlatform,
  // Rate limiting
  canMakePsnRequest,
  getPsnRateLimitWaitTime,
} from './client';
