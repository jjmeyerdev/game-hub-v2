// Steam OpenID Login Initiation
import { NextRequest, NextResponse } from 'next/server';
import { generateSteamLoginUrl } from '@/lib/steam/openid';

export async function GET(request: NextRequest) {
  try {
    // Generate Steam OpenID login URL
    const loginUrl = generateSteamLoginUrl();

    // Redirect user to Steam login
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Error initiating Steam login:', error);
    
    // Redirect back to settings with error
    const errorUrl = new URL('/settings', request.url);
    errorUrl.searchParams.set('error', 'steam_login_failed');
    
    return NextResponse.redirect(errorUrl);
  }
}

