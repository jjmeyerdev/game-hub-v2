// Steam OpenID Authentication Helper
import { InvalidSteamIdError } from '@/lib/types/steam';

const STEAM_OPENID_URL = 'https://steamcommunity.com/openid/login';

/**
 * Generate Steam OpenID authentication URL
 */
export function generateSteamLoginUrl(): string {
  const realm = process.env.NEXT_PUBLIC_STEAM_REALM || 'http://localhost:3000';
  const returnUrl = process.env.NEXT_PUBLIC_STEAM_RETURN_URL || 'http://localhost:3000/api/auth/steam/callback';

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnUrl,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  });

  return `${STEAM_OPENID_URL}?${params.toString()}`;
}

/**
 * Verify Steam OpenID response and extract Steam ID
 */
export async function verifySteamOpenId(params: URLSearchParams): Promise<string> {
  // Check if user cancelled
  if (params.get('openid.mode') === 'cancel') {
    throw new Error('User cancelled Steam authentication');
  }

  // Validate required parameters
  const claimedId = params.get('openid.claimed_id');
  if (!claimedId) {
    throw new Error('Missing claimed_id in OpenID response');
  }

  // Extract Steam ID from claimed_id
  const steamId = extractSteamIdFromClaimedId(claimedId);
  if (!steamId) {
    throw new InvalidSteamIdError('Could not extract Steam ID from OpenID response');
  }

  // Verify the signature with Steam
  const isValid = await verifyOpenIdSignature(params);
  if (!isValid) {
    throw new Error('Invalid OpenID signature');
  }

  return steamId;
}

/**
 * Extract Steam ID64 from OpenID claimed_id URL
 */
function extractSteamIdFromClaimedId(claimedId: string): string | null {
  const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Verify OpenID signature with Steam
 */
async function verifyOpenIdSignature(params: URLSearchParams): Promise<boolean> {
  // Create verification parameters
  const verifyParams = new URLSearchParams();
  
  // Copy all openid.* parameters
  for (const [key, value] of params.entries()) {
    if (key.startsWith('openid.')) {
      verifyParams.set(key, value);
    }
  }

  // Change mode to check_authentication
  verifyParams.set('openid.mode', 'check_authentication');

  try {
    const response = await fetch(STEAM_OPENID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: verifyParams.toString(),
    });

    if (!response.ok) {
      return false;
    }

    const text = await response.text();
    
    // Check if response contains "is_valid:true"
    return text.includes('is_valid:true');
  } catch (error) {
    console.error('Error verifying OpenID signature:', error);
    return false;
  }
}

/**
 * Parse OpenID parameters from URL or request
 */
export function parseOpenIdParams(url: string | URL): URLSearchParams {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  return urlObj.searchParams;
}

