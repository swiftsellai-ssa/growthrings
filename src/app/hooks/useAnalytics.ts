import { useState, useCallback, useEffect } from 'react';
import { createXApiService } from '../services/xapi';

interface AnalyticsData {
  user: {
    id: string;
    name: string;
    username: string;
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    engagementRate: number;
    profileImageUrl?: string;
    description?: string;
    verified?: boolean;
  } | null;
  tweets: Array<{
    id: string;
    text: string;
    createdAt: string;
    metrics: {
      retweets: number;
      likes: number;
      replies: number;
      quotes: number;
    };
    engagementRate: number;
  }>;
  historicalData: Array<{
    date: string;
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    engagementRate: number;
  }>;
  growthTrend: number;
  topTweet: {
    id: string;
    text: string;
    engagementRate: number;
  } | null;
  averageEngagement: number;
}

interface AnalyticsState {
  data: AnalyticsData;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isRefreshing: boolean;
}

export const useAnalytics = (bearerToken?: string) => {
  const [state, setState] = useState<AnalyticsState>({
    data: {
      user: null,
      tweets: [],
      historicalData: [],
      growthTrend: 0,
      topTweet: null,
      averageEngagement: 0
    },
    isLoading: false,
    error: null,
    lastUpdated: null,
    isRefreshing: false
  });

  const fetchAnalytics = useCallback(async (refresh = false) => {
    if (!bearerToken) {
      setState(prev => ({
        ...prev,
        error: 'Bearer token is required for analytics'
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: !refresh,
      isRefreshing: refresh,
      error: null
    }));

    try {
      const apiService = createXApiService(bearerToken);

      // Fetch all analytics data in parallel
      const [detailedAnalytics, historicalData] = await Promise.all([
        apiService.getDetailedAnalytics(),
        apiService.getHistoricalData(30)
      ]);

      const analyticsData: AnalyticsData = {
        user: {
          id: detailedAnalytics.user.id,
          name: detailedAnalytics.user.name,
          username: detailedAnalytics.user.username,
          followersCount: detailedAnalytics.user.publicMetrics.followersCount,
          followingCount: detailedAnalytics.user.publicMetrics.followingCount,
          tweetCount: detailedAnalytics.user.publicMetrics.tweetCount,
          engagementRate: detailedAnalytics.averageEngagement,
          profileImageUrl: detailedAnalytics.user.profileImageUrl,
          description: detailedAnalytics.user.description,
          verified: detailedAnalytics.user.verified
        },
        tweets: detailedAnalytics.tweets,
        historicalData,
        growthTrend: detailedAnalytics.growthTrend,
        topTweet: detailedAnalytics.topTweet ? {
          id: detailedAnalytics.topTweet.id,
          text: detailedAnalytics.topTweet.text,
          engagementRate: detailedAnalytics.topTweet.engagementRate
        } : null,
        averageEngagement: detailedAnalytics.averageEngagement
      };

      setState(prev => ({
        ...prev,
        data: analyticsData,
        isLoading: false,
        isRefreshing: false,
        error: null,
        lastUpdated: new Date()
      }));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch analytics data';
      setState(prev => ({
        ...prev,
        isLoading: false,
        isRefreshing: false,
        error: errorMessage
      }));
    }
  }, [bearerToken]);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalytics(true);
  }, [fetchAnalytics]);

  const clearData = useCallback(() => {
    setState({
      data: {
        user: null,
        tweets: [],
        historicalData: [],
        growthTrend: 0,
        topTweet: null,
        averageEngagement: 0
      },
      isLoading: false,
      error: null,
      lastUpdated: null,
      isRefreshing: false
    });
  }, []);

  // Auto-fetch when bearer token changes
  useEffect(() => {
    if (bearerToken) {
      fetchAnalytics();
    } else {
      clearData();
    }
  }, [bearerToken, fetchAnalytics, clearData]);

  const getGrowthStats = useCallback(() => {
    if (!state.data.historicalData.length || !state.data.user) {
      return {
        dailyGrowth: 0,
        weeklyGrowth: 0,
        monthlyGrowth: 0,
        growthVelocity: 'steady'
      };
    }

    const data = state.data.historicalData;
    const latest = data[data.length - 1];
    const weekAgo = data[Math.max(0, data.length - 7)];
    const monthAgo = data[0];

    const dailyGrowth = data.length > 1
      ? latest.followersCount - data[data.length - 2].followersCount
      : 0;

    const weeklyGrowth = latest.followersCount - weekAgo.followersCount;
    const monthlyGrowth = latest.followersCount - monthAgo.followersCount;

    // Calculate growth velocity
    let growthVelocity: 'declining' | 'steady' | 'accelerating' = 'steady';
    if (data.length >= 7) {
      const recentWeekGrowth = weeklyGrowth;
      const previousWeek = data[Math.max(0, data.length - 14)];
      const previousWeekGrowth = weekAgo.followersCount - previousWeek.followersCount;

      if (recentWeekGrowth > previousWeekGrowth * 1.1) {
        growthVelocity = 'accelerating';
      } else if (recentWeekGrowth < previousWeekGrowth * 0.9) {
        growthVelocity = 'declining';
      }
    }

    return {
      dailyGrowth,
      weeklyGrowth,
      monthlyGrowth,
      growthVelocity
    };
  }, [state.data]);

  const getEngagementTrends = useCallback(() => {
    if (!state.data.historicalData.length) {
      return {
        currentEngagement: 0,
        trend: 'stable',
        averageEngagement: 0
      };
    }

    const data = state.data.historicalData;
    const recent = data.slice(-7);
    const previous = data.slice(-14, -7);

    const recentAvg = recent.reduce((sum, d) => sum + d.engagementRate, 0) / recent.length;
    const previousAvg = previous.length > 0
      ? previous.reduce((sum, d) => sum + d.engagementRate, 0) / previous.length
      : recentAvg;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentAvg > previousAvg * 1.05) {
      trend = 'improving';
    } else if (recentAvg < previousAvg * 0.95) {
      trend = 'declining';
    }

    return {
      currentEngagement: Math.round(recentAvg * 10) / 10,
      trend,
      averageEngagement: Math.round((data.reduce((sum, d) => sum + d.engagementRate, 0) / data.length) * 10) / 10
    };
  }, [state.data]);

  return {
    ...state,
    fetchAnalytics,
    refreshAnalytics,
    clearData,
    getGrowthStats,
    getEngagementTrends,
    hasData: !!state.data.user,
    isConfigured: !!bearerToken
  };
};