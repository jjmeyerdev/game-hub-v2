// Epic Games Store API Client
// Documentation based on: https://github.com/MixV2/EpicResearch
// And: https://github.com/AchetaGames/egs-api-rs

import type {
  EpicTokenResponse,
  EpicLibraryResponse,
  EpicLibraryRecord,
  EpicBulkItemsResponse,
  EpicAssetInfo,
  EpicGame,
  EpicKeyImage,
} from '@/lib/types/epic';

// Epic Games OAuth Client Credentials (launcherAppClient2)
// These are the official Epic Games Launcher client credentials
const EPIC_CLIENT_ID = '34a02cf8f4414e29b15921876da36f9a';
const EPIC_CLIENT_SECRET = 'daafbccc737745039dffe53d94fc76cf';

// API Endpoints
const OAUTH_TOKEN_URL = 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token';
const OAUTH_VERIFY_URL = 'https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/verify';
const LIBRARY_URL = 'https://library-service.live.use1a.on.epicgames.com/library/api/public/items';
const CATALOG_URL = 'https://catalog-public-service-prod06.ol.epicgames.com/catalog/api/shared/namespace';
const GRAPHQL_URL = 'https://graphql.epicgames.com/graphql';

// User Agent to mimic Epic Games Launcher
const USER_AGENT = 'UELauncher/17.0.1-37584233+++Portal+Release-Live Windows/10.0.19043.1.0.64bit';

/**
 * Get Basic Auth header for Epic OAuth
 */
function getBasicAuthHeader(): string {
  const credentials = Buffer.from(`${EPIC_CLIENT_ID}:${EPIC_CLIENT_SECRET}`).toString('base64');
  return `basic ${credentials}`;
}

/**
 * Generate Epic authorization URL for OAuth flow
 * User needs to visit this URL while logged into epicgames.com
 */
export function getAuthorizationUrl(redirectUri?: string): string {
  const params = new URLSearchParams({
    clientId: EPIC_CLIENT_ID,
    responseType: 'code',
  });

  if (redirectUri) {
    params.set('redirectUri', redirectUri);
  }

  return `https://www.epicgames.com/id/api/redirect?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeAuthorizationCode(code: string): Promise<EpicTokenResponse> {
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': getBasicAuthHeader(),
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      token_type: 'eg1',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Epic] Authorization code exchange failed:', error);
    throw new Error(`Failed to exchange authorization code: ${response.status}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<EpicTokenResponse> {
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': getBasicAuthHeader(),
      'User-Agent': USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      token_type: 'eg1',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Epic] Token refresh failed:', error);
    throw new Error(`Failed to refresh token: ${response.status}`);
  }

  return response.json();
}

/**
 * Verify and get current session info
 */
export async function verifyAccessToken(accessToken: string): Promise<EpicTokenResponse> {
  const response = await fetch(OAUTH_VERIFY_URL, {
    method: 'GET',
    headers: {
      'Authorization': `bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Token verification failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get user's library items (owned games)
 */
export async function getLibraryItems(
  accessToken: string,
  includeMetadata = true,
  cursor?: string
): Promise<EpicLibraryResponse> {
  const params = new URLSearchParams({
    includeMetadata: includeMetadata.toString(),
  });

  if (cursor) {
    params.set('cursor', cursor);
  }

  const response = await fetch(`${LIBRARY_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Epic] Get library failed:', error);
    throw new Error(`Failed to get library: ${response.status}`);
  }

  return response.json();
}

/**
 * Get all library items (handles pagination)
 */
export async function getAllLibraryItems(accessToken: string): Promise<EpicLibraryRecord[]> {
  const allRecords: EpicLibraryRecord[] = [];
  let cursor: string | null = null;

  do {
    const response = await getLibraryItems(accessToken, true, cursor ?? undefined);
    allRecords.push(...response.records);
    cursor = response.responseMetadata?.nextCursor ?? null;

    // Small delay to avoid rate limiting
    if (cursor) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } while (cursor);

  return allRecords;
}

/**
 * Get asset information from catalog API
 */
export async function getAssetInfo(
  accessToken: string,
  namespace: string,
  catalogItemId: string
): Promise<EpicAssetInfo | null> {
  const url = `${CATALOG_URL}/${namespace}/bulk/items?id=${catalogItemId}&includeDLCDetails=true&includeMainGameDetails=true&country=us&locale=en`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `bearer ${accessToken}`,
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    console.error(`[Epic] Failed to get asset info for ${catalogItemId}: ${response.status}`);
    return null;
  }

  const data: EpicBulkItemsResponse = await response.json();
  return data[catalogItemId] || null;
}

/**
 * Get asset information for multiple items in bulk
 */
export async function getBulkAssetInfo(
  accessToken: string,
  items: { namespace: string; catalogItemId: string }[]
): Promise<Map<string, EpicAssetInfo>> {
  const results = new Map<string, EpicAssetInfo>();

  // Group items by namespace for efficient querying
  const byNamespace = new Map<string, string[]>();
  for (const item of items) {
    const existing = byNamespace.get(item.namespace) || [];
    existing.push(item.catalogItemId);
    byNamespace.set(item.namespace, existing);
  }

  console.log(`[Epic] Fetching metadata for ${items.length} items across ${byNamespace.size} namespaces`);

  // Fetch each namespace's items (chunk if too many to avoid URL length issues)
  const CHUNK_SIZE = 20; // Epic API might have limits on bulk requests

  for (const [namespace, catalogItemIds] of byNamespace) {
    // Process in chunks
    for (let i = 0; i < catalogItemIds.length; i += CHUNK_SIZE) {
      const chunk = catalogItemIds.slice(i, i + CHUNK_SIZE);
      const idsParam = chunk.join(',');
      const url = `${CATALOG_URL}/${namespace}/bulk/items?id=${idsParam}&includeDLCDetails=true&includeMainGameDetails=true&country=us&locale=en`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `bearer ${accessToken}`,
            'User-Agent': USER_AGENT,
          },
        });

        if (response.ok) {
          const data: EpicBulkItemsResponse = await response.json();
          for (const [id, info] of Object.entries(data)) {
            results.set(id, info);
          }
          console.log(`[Epic] Got ${Object.keys(data).length} items from namespace ${namespace} (chunk ${Math.floor(i / CHUNK_SIZE) + 1})`);
        } else {
          const errorText = await response.text();
          console.error(`[Epic] Failed to get bulk asset info for namespace ${namespace}: ${response.status} - ${errorText.substring(0, 200)}`);
        }
      } catch (error) {
        console.error(`[Epic] Exception getting bulk asset info for namespace ${namespace}:`, error);
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }

  return results;
}

/**
 * Minimal game info from GraphQL fallback
 */
interface GraphQLGameInfo {
  id: string;
  title: string;
  description: string;
  developer: string;
  keyImages: EpicKeyImage[];
}

/**
 * Try to find game info via GraphQL API (fallback for missing catalog entries)
 */
async function searchGameByNamespace(
  namespace: string,
  catalogItemId: string
): Promise<GraphQLGameInfo | null> {
  const query = `
    query searchStore($namespace: String!) {
      Catalog {
        searchStore(
          keywords: ""
          category: "games"
          namespace: $namespace
          count: 10
          sortBy: "releaseDate"
          sortDir: "DESC"
        ) {
          elements {
            title
            id
            namespace
            description
            keyImages {
              type
              url
            }
            seller {
              name
            }
            items {
              id
              namespace
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': USER_AGENT,
      },
      body: JSON.stringify({
        query,
        variables: { namespace },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const elements = data?.data?.Catalog?.searchStore?.elements || [];

    // Find a matching item
    for (const element of elements) {
      // Check if any item matches our catalogItemId
      const matchingItem = element.items?.find((item: { id: string }) => item.id === catalogItemId);
      if (matchingItem || element.id === catalogItemId) {
        console.log(`[Epic] Found via GraphQL: ${element.title}`);
        return {
          id: element.id,
          title: element.title,
          description: element.description || '',
          developer: element.seller?.name || '',
          keyImages: element.keyImages || [],
        };
      }
    }

    // If we found elements but no exact match, return first one as best guess
    if (elements.length > 0) {
      const element = elements[0];
      console.log(`[Epic] Found via GraphQL (best guess): ${element.title}`);
      return {
        id: element.id,
        title: element.title,
        description: element.description || '',
        developer: element.seller?.name || '',
        keyImages: element.keyImages || [],
      };
    }

    return null;
  } catch (error) {
    console.error(`[Epic] GraphQL search failed for namespace ${namespace}:`, error);
    return null;
  }
}

/**
 * Get best cover image URL from key images
 */
export function getBestCoverUrl(keyImages: EpicKeyImage[]): string | null {
  // Priority order for cover images
  const preferredTypes = [
    'OfferImageWide',
    'DieselGameBoxWide',
    'DieselStoreFrontWide',
    'Thumbnail',
    'OfferImageTall',
    'DieselGameBoxTall',
    'DieselStoreFrontTall',
    'CodeRedemption_340x440',
    'ProductLogo',
  ];

  for (const type of preferredTypes) {
    const image = keyImages.find(img => img.type === type);
    if (image?.url) {
      return image.url;
    }
  }

  // Fall back to first available image
  if (keyImages.length > 0 && keyImages[0].url) {
    return keyImages[0].url;
  }

  return null;
}

/**
 * Get enriched game data with metadata
 */
export async function getEnrichedLibrary(accessToken: string): Promise<{ games: EpicGame[]; missingMetadata: string[] }> {
  // Get all library items
  const libraryItems = await getAllLibraryItems(accessToken);

  console.log(`[Epic] Found ${libraryItems.length} items in library`);

  if (libraryItems.length === 0) {
    return { games: [], missingMetadata: [] };
  }

  // Get metadata for all items
  const itemsToFetch = libraryItems.map(item => ({
    namespace: item.namespace,
    catalogItemId: item.catalogItemId,
  }));

  const assetInfoMap = await getBulkAssetInfo(accessToken, itemsToFetch);

  console.log(`[Epic] Got metadata for ${assetInfoMap.size} of ${libraryItems.length} items`);

  // Combine library items with metadata
  const enrichedGames: EpicGame[] = [];
  const missingMetadata: string[] = [];

  for (const item of libraryItems) {
    const catalogInfo = assetInfoMap.get(item.catalogItemId);

    // If no asset info from catalog, try GraphQL fallback
    if (!catalogInfo) {
      console.log(`[Epic] No catalog info for: appName=${item.appName}, namespace=${item.namespace}, catalogItemId=${item.catalogItemId}`);
      console.log(`[Epic] Trying GraphQL fallback for namespace ${item.namespace}...`);

      const graphqlResult = await searchGameByNamespace(item.namespace, item.catalogItemId);
      if (graphqlResult) {
        // GraphQL fallback found the game
        enrichedGames.push({
          appName: item.appName,
          catalogItemId: item.catalogItemId,
          namespace: item.namespace,
          productId: item.productId,
          title: graphqlResult.title,
          description: graphqlResult.description || '',
          developer: graphqlResult.developer || '',
          coverUrl: getBestCoverUrl(graphqlResult.keyImages || []),
          keyImages: graphqlResult.keyImages || [],
        });
      } else {
        missingMetadata.push(`${item.appName} (${item.namespace})`);
      }
      continue;
    }

    // Check if this is DLC - be more careful about what we skip
    const isDLC = catalogInfo.categories?.some(cat => {
      const path = cat.path.toLowerCase();
      // Only skip if explicitly marked as DLC addon
      return path === 'addons/dlc' || path === 'dlc' || path === 'addons';
    });

    if (isDLC) {
      console.log(`[Epic] Skipping DLC: ${catalogInfo.title}`);
      continue;
    }

    enrichedGames.push({
      appName: item.appName,
      catalogItemId: item.catalogItemId,
      namespace: item.namespace,
      productId: item.productId,
      title: catalogInfo.title,
      description: catalogInfo.description || '',
      developer: catalogInfo.developer || '',
      coverUrl: getBestCoverUrl(catalogInfo.keyImages || []),
      keyImages: catalogInfo.keyImages || [],
    });
  }

  console.log(`[Epic] Returning ${enrichedGames.length} enriched games, ${missingMetadata.length} items without metadata`);
  return { games: enrichedGames, missingMetadata };
}

/**
 * Filter library to only include actual games (not DLC, add-ons, etc.)
 * Note: This is now less aggressive to avoid filtering out legitimate games
 */
export function filterGamesOnly(games: EpicGame[]): EpicGame[] {
  // Filter out obvious non-game items based on naming patterns
  return games.filter(game => {
    const titleLower = game.title.toLowerCase();

    // Only skip items that are very clearly not games
    // Be conservative to avoid filtering out legitimate games
    if (
      titleLower.includes('soundtrack only') ||
      titleLower.includes('artbook only') ||
      titleLower.includes('wallpaper pack') ||
      titleLower.includes('digital wallpaper') ||
      (titleLower.includes('season pass') && !titleLower.includes('game'))
    ) {
      console.log(`[Epic] Filtering out non-game: ${game.title}`);
      return false;
    }

    return true;
  });
}
