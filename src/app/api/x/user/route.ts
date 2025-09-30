/**
 * X API - User Data Endpoint
 *
 * Fetches current user data from X API using stored access token.
 * This is a server-side proxy to keep tokens secure.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessTokenCookie, isAccessTokenExpired } from '../../../lib/cookies';
import { fetchCurrentUser, fetchUserTweets, calculateEngagementRate } from '../../../lib/xapi';

export async function GET(request: NextRequest) {
  try {
    // Get access token from cookie
    const accessToken = await getAccessTokenCookie();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Not authenticated. Please sign in first.',
        },
        { status: 401 }
      );
    }

    // Check if token is expired
    const expired = await isAccessTokenExpired();

    if (expired) {
      return NextResponse.json(
        {
          error: 'token_expired',
          message: 'Access token has expired. Please sign in again.',
        },
        { status: 401 }
      );
    }

    // Fetch user data from X API
    console.log('[X API] Fetching user data...');
    const userData = await fetchCurrentUser(accessToken);

    // Optionally fetch tweets for engagement calculation
    const includeTweets = request.nextUrl.searchParams.get('include_tweets') === 'true';
    let tweets = null;
    let engagementRate = null;

    if (includeTweets && userData.id) {
      try {
        tweets = await fetchUserTweets(userData.id, accessToken, 10);
        engagementRate = calculateEngagementRate(
          tweets,
          userData.public_metrics?.followers_count || 0
        );
      } catch (error) {
        console.error('[X API] Failed to fetch tweets:', error);
        // Continue without tweets
      }
    }

    console.log('[X API] User data fetched successfully', {
      username: userData.username,
      followers: userData.public_metrics?.followers_count,
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        ...(tweets && { tweets }),
        ...(engagementRate !== null && { engagementRate }),
      },
    });
  } catch (error) {
    console.error('[X API] Error fetching user data:', error);

    // Determine error type
    let errorCode = 'server_error';
    let errorMessage = 'Failed to fetch user data';
    let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;

      if (error.message.includes('401')) {
        errorCode = 'unauthorized';
        errorMessage = 'Invalid or expired access token';
        statusCode = 401;
      } else if (error.message.includes('429')) {
        errorCode = 'rate_limit_exceeded';
        errorMessage = 'Rate limit exceeded. Please try again later.';
        statusCode = 429;
      } else if (error.message.includes('403')) {
        errorCode = 'forbidden';
        errorMessage = 'Access forbidden. Check your app permissions.';
        statusCode = 403;
      }
    }

    return NextResponse.json(
      {
        error: errorCode,
        message: errorMessage,
      },
      { status: statusCode }
    );
  }
}

/**
 * Get specific user by username (requires admin/elevated access)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    if (!username) {
      return NextResponse.json(
        {
          error: 'invalid_request',
          message: 'Username is required',
        },
        { status: 400 }
      );
    }

    const accessToken = await getAccessTokenCookie();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'unauthorized',
          message: 'Not authenticated',
        },
        { status: 401 }
      );
    }

    // This would require additional X API permissions
    // For now, return not implemented
    return NextResponse.json(
      {
        error: 'not_implemented',
        message: 'Looking up other users requires elevated API access',
      },
      { status: 501 }
    );
  } catch (error) {
    console.error('[X API] Error:', error);

    return NextResponse.json(
      {
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}