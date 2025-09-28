import { useState, useCallback } from 'react';
import { createXApiService, isValidBearerToken } from '../services/xapi';

interface XApiState {
  isLoading: boolean;
  error: string | null;
  userData: {
    id: string;
    name: string;
    username: string;
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    engagementRate: number;
    profileImageUrl?: string;
  } | null;
  lastUpdated: Date | null;
}

interface UseXApiReturn extends XApiState {
  refreshData: () => Promise<void>;
  setBearerToken: (token: string) => void;
  clearData: () => void;
  isConfigured: boolean;
}

export const useXApi = (): UseXApiReturn => {
  const [bearerToken, setBearerTokenState] = useState<string>('');
  const [state, setState] = useState<XApiState>({
    isLoading: false,
    error: null,
    userData: null,
    lastUpdated: null,
  });

  const setBearerToken = useCallback((token: string) => {
    setBearerTokenState(token.trim());
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearData = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      userData: null,
      lastUpdated: null,
    });
  }, []);

  const refreshData = useCallback(async () => {
    if (!bearerToken || !isValidBearerToken(bearerToken)) {
      setState(prev => ({
        ...prev,
        error: 'Please provide a valid X API bearer token',
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const apiService = createXApiService(bearerToken);

      const [userMetrics, recentTweets] = await Promise.all([
        apiService.getUserMetrics(),
        apiService.getRecentTweets(10).catch(() => [])
      ]);

      const engagementRate = apiService.calculateEngagementRate(
        userMetrics.publicMetrics,
        recentTweets
      );

      setState({
        isLoading: false,
        error: null,
        userData: {
          id: userMetrics.id,
          name: userMetrics.name,
          username: userMetrics.username,
          followersCount: userMetrics.publicMetrics.followersCount,
          followingCount: userMetrics.publicMetrics.followingCount,
          tweetCount: userMetrics.publicMetrics.tweetCount,
          engagementRate,
          profileImageUrl: userMetrics.profileImageUrl,
        },
        lastUpdated: new Date(),
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch X data',
      }));
    }
  }, [bearerToken]);

  return {
    ...state,
    refreshData,
    setBearerToken,
    clearData,
    isConfigured: !!bearerToken && isValidBearerToken(bearerToken),
  };
};