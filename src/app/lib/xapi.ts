/**
 * X (Twitter) API Client
 *
 * Provides utilities for interacting with the X API v2.
 * Handles authentication, rate limiting, and error handling.
 */

/**
 * X API Endpoints
 */
export const X_API_ENDPOINTS = {
  BASE_URL: 'https://api.x.com/2',
  USERS_ME: '/users/me',
  USERS_BY_ID: '/users/:id',
  USERS_BY_USERNAME: '/users/by/username/:username',
  TWEETS: '/tweets',
  USER_TWEETS: '/users/:id/tweets',
} as const;

/**
 * User fields for public metrics
 */
export const USER_FIELDS = [
  'id',
  'name',
  'username',
  'created_at',
  'description',
  'location',
  'profile_image_url',
  'public_metrics',
  'verified',
  'verified_type',
] as const;

/**
 * Tweet fields
 */
export const TWEET_FIELDS = [
  'id',
  'text',
  'created_at',
  'author_id',
  'public_metrics',
  'entities',
  'referenced_tweets',
] as const;

/**
 * User data interface
 */
export interface XUser {
  id: string;
  name: string;
  username: string;
  created_at?: string;
  description?: string;
  location?: string;
  profile_image_url?: string;
  public_metrics?: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  verified?: boolean;
  verified_type?: string;
}

/**
 * Tweet data interface
 */
export interface XTweet {
  id: string;
  text: string;
  created_at?: string;
  author_id?: string;
  public_metrics?: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
  };
  entities?: {
    urls?: Array<{ url: string; expanded_url: string }>;
    hashtags?: Array<{ tag: string }>;
    mentions?: Array<{ username: string }>;
  };
}

/**
 * API Response wrapper
 */
export interface XAPIResponse<T> {
  data: T;
  includes?: {
    users?: XUser[];
    tweets?: XTweet[];
  };
  meta?: {
    result_count?: number;
    next_token?: string;
  };
}

/**
 * API Error response
 */
export interface XAPIError {
  title: string;
  detail: string;
  type: string;
  status: number;
}

/**
 * Fetch current user data
 */
export async function fetchCurrentUser(accessToken: string): Promise<XUser> {
  const url = new URL(`${X_API_ENDPOINTS.BASE_URL}${X_API_ENDPOINTS.USERS_ME}`);
  url.searchParams.set('user.fields', USER_FIELDS.join(','));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `X API error: ${response.status} ${response.statusText}`
    );
  }

  const data: XAPIResponse<XUser> = await response.json();
  return data.data;
}

/**
 * Fetch user by username
 */
export async function fetchUserByUsername(
  username: string,
  accessToken: string
): Promise<XUser> {
  const url = new URL(
    `${X_API_ENDPOINTS.BASE_URL}${X_API_ENDPOINTS.USERS_BY_USERNAME.replace(
      ':username',
      username
    )}`
  );
  url.searchParams.set('user.fields', USER_FIELDS.join(','));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `X API error: ${response.status} ${response.statusText}`
    );
  }

  const data: XAPIResponse<XUser> = await response.json();
  return data.data;
}

/**
 * Fetch user tweets
 */
export async function fetchUserTweets(
  userId: string,
  accessToken: string,
  maxResults: number = 10
): Promise<XTweet[]> {
  const url = new URL(
    `${X_API_ENDPOINTS.BASE_URL}${X_API_ENDPOINTS.USER_TWEETS.replace(':id', userId)}`
  );
  url.searchParams.set('tweet.fields', TWEET_FIELDS.join(','));
  url.searchParams.set('max_results', maxResults.toString());

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(
      error?.detail || `X API error: ${response.status} ${response.statusText}`
    );
  }

  const data: XAPIResponse<XTweet[]> = await response.json();
  return data.data || [];
}

/**
 * Calculate engagement rate from tweets
 */
export function calculateEngagementRate(tweets: XTweet[], followersCount: number): number {
  if (!tweets.length || !followersCount) return 0;

  const totalEngagements = tweets.reduce((sum, tweet) => {
    const metrics = tweet.public_metrics;
    if (!metrics) return sum;

    return (
      sum +
      (metrics.retweet_count || 0) +
      (metrics.reply_count || 0) +
      (metrics.like_count || 0) +
      (metrics.quote_count || 0)
    );
  }, 0);

  const totalImpressions = tweets.length * followersCount;
  return totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;
}

/**
 * Get top performing tweet
 */
export function getTopTweet(tweets: XTweet[]): XTweet | null {
  if (!tweets.length) return null;

  return tweets.reduce((top, tweet) => {
    const topEngagement = top.public_metrics
      ? (top.public_metrics.retweet_count || 0) +
        (top.public_metrics.reply_count || 0) +
        (top.public_metrics.like_count || 0) +
        (top.public_metrics.quote_count || 0)
      : 0;

    const tweetEngagement = tweet.public_metrics
      ? (tweet.public_metrics.retweet_count || 0) +
        (tweet.public_metrics.reply_count || 0) +
        (tweet.public_metrics.like_count || 0) +
        (tweet.public_metrics.quote_count || 0)
      : 0;

    return tweetEngagement > topEngagement ? tweet : top;
  });
}

/**
 * Check rate limit headers
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
}

export function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('x-rate-limit-limit');
  const remaining = headers.get('x-rate-limit-remaining');
  const reset = headers.get('x-rate-limit-reset');

  if (!limit || !remaining || !reset) return null;

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    reset: new Date(parseInt(reset, 10) * 1000),
  };
}

/**
 * Format large numbers (e.g., 1.2K, 10.5M)
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return date.toLocaleDateString();
}