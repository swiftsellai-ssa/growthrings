/**
 * OAuth Callback Handler (Server-side)
 *
 * This API route handles the OAuth callback from X (Twitter)
 * after the user authorizes the application.
 *
 * Security features:
 * - State validation (CSRF protection)
 * - PKCE code verifier validation
 * - Secure token storage (httpOnly cookies)
 * - Error handling and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken } from '../../../lib/oauth';
import {
  getOAuthStateCookie,
  getOAuthVerifierCookie,
  clearOAuthCookies,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  setSessionCookie,
} from '../../../lib/cookies';

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract parameters from callback URL
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const receivedState = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Log callback (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('[OAuth Callback] Received:', {
        code: code ? `${code.substring(0, 10)}...` : null,
        state: receivedState ? `${receivedState.substring(0, 10)}...` : null,
        error,
        errorDescription,
      });
    }

    // Check for OAuth errors from X
    if (error) {
      console.error('[OAuth Callback] X returned error:', error, errorDescription);
      return NextResponse.redirect(
        new URL(
          `/auth/error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(
            errorDescription || 'Authorization failed'
          )}`,
          request.url
        )
      );
    }

    // Validate required parameters
    if (!code) {
      console.error('[OAuth Callback] Missing authorization code');
      return NextResponse.redirect(
        new URL(
          '/auth/error?error=invalid_request&description=Missing authorization code',
          request.url
        )
      );
    }

    if (!receivedState) {
      console.error('[OAuth Callback] Missing state parameter');
      return NextResponse.redirect(
        new URL(
          '/auth/error?error=invalid_request&description=Missing state parameter',
          request.url
        )
      );
    }

    // Retrieve stored state and verifier from cookies
    const storedState = await getOAuthStateCookie();
    const codeVerifier = await getOAuthVerifierCookie();

    if (!storedState || !codeVerifier) {
      console.error('[OAuth Callback] OAuth session expired or not found');
      return NextResponse.redirect(
        new URL(
          '/auth/error?error=session_expired&description=OAuth session expired. Please try signing in again.',
          request.url
        )
      );
    }

    // Validate state parameter (CSRF protection)
    if (receivedState !== storedState) {
      console.error('[OAuth Callback] State mismatch - possible CSRF attack', {
        received: receivedState.substring(0, 10),
        stored: storedState.substring(0, 10),
      });
      return NextResponse.redirect(
        new URL(
          '/auth/error?error=invalid_state&description=State validation failed. Possible CSRF attack detected.',
          request.url
        )
      );
    }

    // Get OAuth configuration
    const clientId = process.env.X_CLIENT_ID || process.env.NEXT_PUBLIC_X_CLIENT_ID;
    const redirectUri = process.env.X_CALLBACK_URL || process.env.NEXT_PUBLIC_X_CALLBACK_URL;

    if (!clientId || !redirectUri) {
      console.error('[OAuth Callback] OAuth configuration missing');
      return NextResponse.redirect(
        new URL(
          '/auth/error?error=configuration_error&description=OAuth is not properly configured',
          request.url
        )
      );
    }

    // Exchange authorization code for access token
    console.log('[OAuth Callback] Exchanging code for tokens...');
    const tokens = await exchangeCodeForToken(code, codeVerifier, clientId, redirectUri);

    console.log('[OAuth Callback] Token exchange successful', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiresIn: tokens.expires_in,
      scope: tokens.scope,
    });

    // Store tokens in secure httpOnly cookies
    await setAccessTokenCookie(tokens.access_token, tokens.expires_in);

    if (tokens.refresh_token) {
      await setRefreshTokenCookie(tokens.refresh_token);
    }

    // Create user session
    // In a real app, you would:
    // 1. Fetch user data from X API
    // 2. Create/update user in database
    // 3. Create session in database
    const sessionId = generateSessionId();
    const userId = 'user_pending'; // Replace with actual user ID after fetching from X API

    await setSessionCookie(userId, sessionId);

    // Clear OAuth temporary cookies
    await clearOAuthCookies();

    // Log success
    const duration = Date.now() - startTime;
    console.log(`[OAuth Callback] Authentication successful (${duration}ms)`);

    // Redirect to dashboard/home with success flag
    return NextResponse.redirect(new URL('/?auth=success', request.url));
  } catch (error) {
    console.error('[OAuth Callback] Error:', error);

    // Clear OAuth cookies on error
    try {
      await clearOAuthCookies();
    } catch (clearError) {
      console.error('[OAuth Callback] Failed to clear cookies:', clearError);
    }

    // Determine error type and message
    let errorCode = 'server_error';
    let errorMessage = 'An unexpected error occurred during authentication';

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check for specific error types
      if (error.message.includes('Token exchange failed')) {
        errorCode = 'token_exchange_failed';
      } else if (error.message.includes('Network')) {
        errorCode = 'network_error';
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('timeout')) {
        errorCode = 'timeout';
        errorMessage = 'Request timed out. Please try again.';
      }
    }

    return NextResponse.redirect(
      new URL(
        `/auth/error?error=${encodeURIComponent(errorCode)}&description=${encodeURIComponent(
          errorMessage
        )}`,
        request.url
      )
    );
  }
}