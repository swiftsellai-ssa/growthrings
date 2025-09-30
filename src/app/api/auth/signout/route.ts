/**
 * Sign Out Handler
 *
 * Clears all authentication cookies and ends the user session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies, clearOAuthCookies } from '../../../lib/cookies';

export async function POST(request: NextRequest) {
  try {
    // Clear all authentication-related cookies
    await clearAuthCookies();
    await clearOAuthCookies();

    console.log('[Auth SignOut] User signed out successfully');

    return NextResponse.json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (error) {
    console.error('[Auth SignOut] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sign out',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await clearAuthCookies();
    await clearOAuthCookies();

    // Redirect to home page
    return NextResponse.redirect(new URL('/?auth=signedout', request.url));
  } catch (error) {
    console.error('[Auth SignOut] Error:', error);

    return NextResponse.redirect(new URL('/?error=signout_failed', request.url));
  }
}