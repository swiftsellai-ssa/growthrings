/**
 * Token Refresh API Route
 *
 * Handles automatic token refresh using the refresh_token stored in httpOnly cookies.
 * This endpoint is called when the access token expires to obtain a new one without
 * requiring the user to re-authenticate.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getRefreshTokenCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  clearAuthCookies
} from '@/app/lib/cookies';
import { refreshAccessToken } from '@/app/lib/oauth';

export async function POST(_request: NextRequest) {
  try {
    // Get the refresh token from httpOnly cookie
    const refreshToken = await getRefreshTokenCookie();

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'No refresh token found',
          message: 'Please sign in again'
        },
        { status: 401 }
      );
    }

    // Get client credentials from environment
    const clientId = process.env.X_CLIENT_ID;
    const clientSecret = process.env.X_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error('Missing X API credentials in environment variables');
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error',
          message: 'OAuth credentials not configured'
        },
        { status: 500 }
      );
    }

    try {
      // Exchange refresh token for new access token
      const tokens = await refreshAccessToken(
        refreshToken,
        clientId,
        clientSecret
      );

      // Store the new tokens in httpOnly cookies
      await setAccessTokenCookie(tokens.access_token, tokens.expires_in);

      // X API may return a new refresh token (rotation)
      if (tokens.refresh_token) {
        await setRefreshTokenCookie(tokens.refresh_token);
      }

      return NextResponse.json({
        success: true,
        message: 'Token refreshed successfully',
        expiresIn: tokens.expires_in
      });

    } catch (tokenError: unknown) {
      // Token refresh failed - clear all auth cookies
      console.error('Token refresh failed:', tokenError);
      await clearAuthCookies();

      const errorMessage = tokenError instanceof Error ? tokenError.message : 'Token refresh failed';

      return NextResponse.json(
        {
          success: false,
          error: 'token_refresh_failed',
          message: errorMessage,
          requiresReauth: true
        },
        { status: 401 }
      );
    }

  } catch (error: unknown) {
    console.error('Refresh endpoint error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        success: false,
        error: 'server_error',
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

// Prevent caching of this endpoint
export const dynamic = 'force-dynamic';