/**
 * Get Current User Information
 *
 * Returns the current authenticated user's information from cookies.
 * Can also fetch fresh data from X API if needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAccessTokenCookie,
  getUserIdCookie,
  isAccessTokenExpired,
} from '../../../lib/cookies';

export async function GET(_request: NextRequest) {
  try {
    // Check if user has an access token
    const accessToken = await getAccessTokenCookie();
    const userId = await getUserIdCookie();

    if (!accessToken) {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    // Check if token is expired
    const expired = await isAccessTokenExpired();

    if (expired) {
      return NextResponse.json(
        {
          authenticated: false,
          message: 'Token expired',
        },
        { status: 401 }
      );
    }

    // TODO: Fetch user data from X API
    // const userData = await fetchXUserData(accessToken);

    return NextResponse.json({
      authenticated: true,
      userId,
      // Include user data here when implemented
      // user: userData,
    });
  } catch (error) {
    console.error('[Auth Me] Error:', error);

    return NextResponse.json(
      {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}