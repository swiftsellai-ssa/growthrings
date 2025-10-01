/**
 * OAuth Initiation Handler (Server-side)
 *
 * This API route initiates the OAuth flow by:
 * 1. Generating PKCE parameters
 * 2. Storing state and verifier in secure httpOnly cookies
 * 3. Redirecting to X authorization endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildAuthorizationUrl } from '../../../lib/oauth';
import { setOAuthCookies } from '../../../lib/cookies';

export async function GET(_request: NextRequest) {
  try {
    // Get OAuth configuration
    const clientId = process.env.X_CLIENT_ID || process.env.NEXT_PUBLIC_X_CLIENT_ID;
    const redirectUri = process.env.X_CALLBACK_URL || process.env.NEXT_PUBLIC_X_CALLBACK_URL;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: 'OAuth is not properly configured',
        },
        { status: 500 }
      );
    }

    // Generate authorization URL with PKCE
    const { url, state, verifier } = await buildAuthorizationUrl(clientId, redirectUri);

    // Store state and verifier in secure httpOnly cookies
    await setOAuthCookies(state, verifier);

    console.log('[OAuth Initiate] Generated authorization URL', {
      state: state.substring(0, 10) + '...',
      verifier: verifier.substring(0, 10) + '...',
    });

    // Redirect to X authorization page
    return NextResponse.redirect(url);
  } catch (error) {
    console.error('[OAuth Initiate] Error:', error);

    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Failed to initiate OAuth flow',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}