/**
 * Token Revocation API Route
 *
 * Revokes the access token with X API and clears all authentication cookies.
 * This should be called during logout to properly invalidate the user's session.
 *
 * X API Token Revocation: POST https://api.twitter.com/2/oauth2/revoke
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenCookie, clearAuthCookies } from '@/app/lib/cookies';

export async function POST(_request: NextRequest) {
  try {
    // Get the access token from httpOnly cookie
    const accessToken = await getAccessTokenCookie();

    // Get client credentials
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing X API credentials in environment variables');
      // Still clear cookies even if we can't revoke with X API
      await clearAuthCookies();
      return NextResponse.json({
        success: true,
        warning: 'Logged out locally but could not revoke token with X API'
      });
    }

    // If we have an access token, revoke it with X API
    if (accessToken) {
      try {
        // X API requires Basic Auth with client credentials
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        const revokeResponse = await fetch('https://api.twitter.com/2/oauth2/revoke', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
          },
          body: new URLSearchParams({
            token: accessToken,
            token_type_hint: 'access_token'
          })
        });

        if (!revokeResponse.ok) {
          console.warn('X API token revocation failed:', revokeResponse.status);
          // Continue with local logout even if revocation fails
        }
      } catch (revokeError) {
        console.error('Error revoking token with X API:', revokeError);
        // Continue with local logout even if revocation fails
      }
    }

    // Clear all authentication cookies
    await clearAuthCookies();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error: unknown) {
    console.error('Logout error:', error);

    // Always try to clear cookies even on error
    try {
      await clearAuthCookies();
    } catch (clearError) {
      console.error('Error clearing cookies:', clearError);
    }

    const errorMessage = error instanceof Error ? error.message : 'Logout failed';

    return NextResponse.json(
      {
        success: false,
        error: 'logout_error',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';