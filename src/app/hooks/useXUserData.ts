/**
 * X User Data Hook
 *
 * Fetches and manages X (Twitter) user data with automatic refresh.
 */

import { useState, useEffect, useCallback } from 'react';
import type { XUser, XTweet } from '../lib/xapi';

interface UseXUserDataOptions {
  includeTweets?: boolean;
  autoFetch?: boolean;
  refreshInterval?: number; // in milliseconds
}

interface XUserDataState {
  user: XUser | null;
  tweets: XTweet[] | null;
  engagementRate: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseXUserDataReturn extends XUserDataState {
  fetchUserData: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useXUserData(options: UseXUserDataOptions = {}): UseXUserDataReturn {
  const {
    includeTweets = false,
    autoFetch = true,
    refreshInterval,
  } = options;

  const [state, setState] = useState<XUserDataState>({
    user: null,
    tweets: null,
    engagementRate: null,
    isLoading: autoFetch,
    error: null,
    lastUpdated: null,
  });

  const fetchUserData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const url = new URL('/api/x/user', window.location.origin);
      if (includeTweets) {
        url.searchParams.set('include_tweets', 'true');
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to fetch user data: ${response.status}`);
      }

      const result = await response.json();

      setState({
        user: result.data.user,
        tweets: result.data.tweets || null,
        engagementRate: result.data.engagementRate || null,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('[useXUserData] Error:', error);

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user data',
      }));
    }
  }, [includeTweets]);

  const refresh = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchUserData();
    }
  }, [autoFetch, fetchUserData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!refreshInterval) return;

    const interval = setInterval(() => {
      fetchUserData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, fetchUserData]);

  return {
    ...state,
    fetchUserData,
    refresh,
  };
}

/**
 * Hook to get just the follower count
 */
export function useFollowerCount(): {
  followersCount: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const { user, isLoading, error, refresh } = useXUserData({
    includeTweets: false,
    autoFetch: true,
  });

  return {
    followersCount: user?.public_metrics?.followers_count || null,
    isLoading,
    error,
    refresh,
  };
}

/**
 * Hook to get user metrics with auto-refresh
 */
export function useXUserMetrics(refreshIntervalMs?: number) {
  const { user, engagementRate, isLoading, error, lastUpdated, refresh } = useXUserData({
    includeTweets: true,
    autoFetch: true,
    refreshInterval: refreshIntervalMs,
  });

  return {
    followersCount: user?.public_metrics?.followers_count || 0,
    followingCount: user?.public_metrics?.following_count || 0,
    tweetCount: user?.public_metrics?.tweet_count || 0,
    engagementRate: engagementRate || 0,
    isLoading,
    error,
    lastUpdated,
    refresh,
  };
}