// Xbox module barrel export
export {
  // Validation
  validateXuid,
  validateGamertag,
  // Profile
  getMyProfile,
  getProfileByXuid,
  searchByGamertag,
  // Game library
  getMyTitleHistory,
  getTitleHistoryByXuid,
  // Achievements
  getMyAchievements,
  getAchievementsByXuid,
  getGameAchievements,
  // Utilities
  getXboxStoreUrl,
  normalizeXboxPlatform,
  // Rate limiting
  canMakeXboxRequest,
  getXboxRateLimitWaitTime,
} from './client';
