// Epic Games Store API Type Definitions

// OAuth Token Response
export interface EpicTokenResponse {
  access_token: string;
  expires_in: number;
  expires_at: string;
  token_type: string;
  refresh_token: string;
  refresh_expires: number;
  refresh_expires_at: string;
  account_id: string;
  client_id: string;
  internal_client: boolean;
  client_service: string;
  displayName: string;
  app: string;
  in_app_id: string;
  product_id: string;
  application_id: string;
}

// Library Record from the library-service API
export interface EpicLibraryRecord {
  appName: string;
  catalogItemId: string;
  namespace: string;
  productId: string;
  sandboxName: string;
}

// Library Response
export interface EpicLibraryResponse {
  records: EpicLibraryRecord[];
  responseMetadata: {
    nextCursor: string | null;
  };
}

// Asset Information from catalog API
export interface EpicAssetInfo {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  keyImages: EpicKeyImage[];
  categories: EpicCategory[];
  namespace: string;
  status: string;
  creationDate: string;
  lastModifiedDate: string;
  customAttributes: Record<string, EpicCustomAttribute>;
  entitlementName: string;
  entitlementType: string;
  itemType: string;
  releaseInfo: EpicReleaseInfo[];
  developer: string;
  developerId: string;
  useCount: number;
  eulaIds: string[];
  endOfSupport: boolean;
  dlcItemList: string[];
  ageGatings: Record<string, string>;
  applicationId: string;
  unsearchable: boolean;
  requiresSecureAccount: boolean;
}

export interface EpicKeyImage {
  type: string;
  url: string;
  md5: string;
  width: number;
  height: number;
  size: number;
  uploadedDate: string;
}

export interface EpicCategory {
  path: string;
}

export interface EpicCustomAttribute {
  type: string;
  value: string;
}

export interface EpicReleaseInfo {
  id: string;
  appId: string;
  compatibleApps: string[];
  platform: string[];
  dateAdded: string;
}

// Bulk Items Response from catalog API
export interface EpicBulkItemsResponse {
  [key: string]: EpicAssetInfo;
}

// Epic Games Account Info
export interface EpicAccountInfo {
  id: string;
  displayName: string;
  email?: string;
  failedLoginAttempts: number;
  lastLogin: string;
  numberOfDisplayNameChanges: number;
  ageGroup: string;
  headless: boolean;
  country: string;
  lastName: string;
  phoneNumber?: string;
  preferredLanguage: string;
  canUpdateDisplayName: boolean;
  tfaEnabled: boolean;
  emailVerified: boolean;
  minorVerified: boolean;
  minorExpected: boolean;
  minorStatus: string;
}

// Game with enriched metadata
export interface EpicGame {
  appName: string;
  catalogItemId: string;
  namespace: string;
  productId: string;
  title: string;
  description: string;
  developer: string;
  coverUrl: string | null;
  keyImages: EpicKeyImage[];
}

// Sync Result Types
export interface EpicSyncResult {
  success: boolean;
  gamesAdded: number;
  gamesUpdated: number;
  errors: string[];
  totalGames: number;
}

// Profile Types (stored in database)
export interface EpicProfile {
  epic_account_id: string;
  epic_display_name: string;
  epic_last_sync: string | null;
}

// Error Types
export class EpicAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'EpicAPIError';
  }
}

export class EpicAuthError extends EpicAPIError {
  constructor(message = 'Epic Games authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'EpicAuthError';
  }
}

export class EpicRateLimitError extends EpicAPIError {
  constructor(message = 'Epic Games API rate limit exceeded') {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'EpicRateLimitError';
  }
}
