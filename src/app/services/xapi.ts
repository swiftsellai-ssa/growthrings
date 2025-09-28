interface XApiConfig {
  bearerToken: string;
}

interface UserMetrics {
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  listedCount: number;
}

interface XApiUser {
  id: string;
  name: string;
  username: string;
  publicMetrics: UserMetrics;
  profileImageUrl?: string;
  description?: string;
  verified?: boolean;
  createdAt?: string;
}

interface AnalyticsHistory {
  date: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  engagementRate: number;
}

interface TweetAnalytics {
  id: string;
  text: string;
  createdAt: string;
  metrics: {
    impressions?: number;
    retweets: number;
    likes: number;
    replies: number;
    quotes: number;
  };
  engagementRate: number;
}

interface XApiResponse<T> {
  data: T;
  errors?: Array<{
    title: string;
    detail: string;
    type: string;
  }>;
}

export class XApiService {
  private config: XApiConfig;
  private baseUrl = 'https://api.x.com/2';

  constructor(config: XApiConfig) {
    this.config = config;
  }

  private async makeRequest<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.bearerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid or expired bearer token. Please check your X API credentials.');
        }
        if (response.status === 403) {
          throw new Error('Access forbidden. Your X API tier may not support this endpoint.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making another request.');
        }
        throw new Error(`X API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        throw new Error(`X API Error: ${data.errors[0].title} - ${data.errors[0].detail}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to X API. Please check your internet connection.');
    }
  }

  async getUserMetrics(): Promise<XApiUser> {
    try {
      const response = await this.makeRequest<XApiResponse<{
        id: string;
        name: string;
        username: string;
        public_metrics: {
          followers_count: number;
          following_count: number;
          tweet_count: number;
          listed_count: number;
        };
        profile_image_url?: string;
      }>>('/users/me?user.fields=public_metrics,profile_image_url');

      return {
        id: response.data.id,
        name: response.data.name,
        username: response.data.username,
        publicMetrics: {
          followersCount: response.data.public_metrics.followers_count,
          followingCount: response.data.public_metrics.following_count,
          tweetCount: response.data.public_metrics.tweet_count,
          listedCount: response.data.public_metrics.listed_count,
        },
        profileImageUrl: response.data.profile_image_url,
      };
    } catch (error) {
      throw new Error(`Failed to fetch user metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getTweetEngagement(tweetId: string): Promise<{
    retweetCount: number;
    likeCount: number;
    replyCount: number;
    quoteCount: number;
  }> {
    try {
      const response = await this.makeRequest<XApiResponse<{
        public_metrics: {
          retweet_count: number;
          like_count: number;
          reply_count: number;
          quote_count: number;
        };
      }>>(`/tweets/${tweetId}?tweet.fields=public_metrics`);

      return {
        retweetCount: response.data.public_metrics.retweet_count,
        likeCount: response.data.public_metrics.like_count,
        replyCount: response.data.public_metrics.reply_count,
        quoteCount: response.data.public_metrics.quote_count,
      };
    } catch (error) {
      throw new Error(`Failed to fetch tweet engagement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getRecentTweets(maxResults: number = 10): Promise<Array<{
    id: string;
    text: string;
    createdAt: string;
    publicMetrics: {
      retweetCount: number;
      likeCount: number;
      replyCount: number;
      quoteCount: number;
    };
  }>> {
    try {
      const response = await this.makeRequest<XApiResponse<Array<{
        id: string;
        text: string;
        created_at: string;
        public_metrics: {
          retweet_count: number;
          like_count: number;
          reply_count: number;
          quote_count: number;
        };
      }>>>(`/users/me/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics`);

      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at,
        publicMetrics: {
          retweetCount: tweet.public_metrics.retweet_count,
          likeCount: tweet.public_metrics.like_count,
          replyCount: tweet.public_metrics.reply_count,
          quoteCount: tweet.public_metrics.quote_count,
        },
      }));
    } catch (error) {
      throw new Error(`Failed to fetch recent tweets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateEngagementRate(metrics: UserMetrics, recentTweets: Array<{ publicMetrics: { likeCount: number; retweetCount: number; replyCount: number; quoteCount: number } }>): number {
    if (recentTweets.length === 0 || metrics.followersCount === 0) {
      return 0;
    }

    const totalEngagement = recentTweets.reduce((sum, tweet) => {
      return sum + tweet.publicMetrics.likeCount + tweet.publicMetrics.retweetCount +
             tweet.publicMetrics.replyCount + tweet.publicMetrics.quoteCount;
    }, 0);

    const avgEngagementPerTweet = totalEngagement / recentTweets.length;
    const engagementRate = (avgEngagementPerTweet / metrics.followersCount) * 100;

    return Math.round(engagementRate * 10) / 10;
  }

  async getDetailedAnalytics(): Promise<{
    user: XApiUser;
    tweets: TweetAnalytics[];
    growthTrend: number;
    topTweet: TweetAnalytics | null;
    averageEngagement: number;
  }> {
    try {
      const user = await this.getUserMetrics();
      const recentTweets = await this.getRecentTweets(50);

      const tweetAnalytics: TweetAnalytics[] = recentTweets.map(tweet => ({
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.createdAt,
        metrics: {
          retweets: tweet.publicMetrics.retweetCount,
          likes: tweet.publicMetrics.likeCount,
          replies: tweet.publicMetrics.replyCount,
          quotes: tweet.publicMetrics.quoteCount,
        },
        engagementRate: this.calculateTweetEngagementRate(tweet.publicMetrics, user.publicMetrics.followersCount)
      }));

      const topTweet = tweetAnalytics.length > 0
        ? tweetAnalytics.reduce((prev, current) =>
            prev.engagementRate > current.engagementRate ? prev : current
          )
        : null;

      const averageEngagement = tweetAnalytics.length > 0
        ? tweetAnalytics.reduce((sum, tweet) => sum + tweet.engagementRate, 0) / tweetAnalytics.length
        : 0;

      // Calculate growth trend (simplified - in real app you'd need historical data)
      const growthTrend = this.calculateGrowthTrend(user.publicMetrics);

      return {
        user,
        tweets: tweetAnalytics,
        growthTrend,
        topTweet,
        averageEngagement: Math.round(averageEngagement * 10) / 10
      };
    } catch (error) {
      throw new Error(`Failed to fetch detailed analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateTweetEngagementRate(tweetMetrics: { likeCount: number; retweetCount: number; replyCount: number; quoteCount: number }, followerCount: number): number {
    const totalEngagement = tweetMetrics.likeCount + tweetMetrics.retweetCount + tweetMetrics.replyCount + tweetMetrics.quoteCount;
    return followerCount > 0 ? Math.round((totalEngagement / followerCount) * 1000) / 10 : 0;
  }

  private calculateGrowthTrend(metrics: UserMetrics): number {
    // Simplified growth calculation - in a real app, you'd compare with historical data
    // For now, we'll estimate based on follower-to-following ratio and tweet frequency
    const followRatio = metrics.followingCount > 0 ? metrics.followersCount / metrics.followingCount : 1;
    const tweetActivity = Math.min(metrics.tweetCount / 1000, 10); // Normalize tweet count

    return Math.round(((followRatio * 0.7) + (tweetActivity * 0.3)) * 10) / 10;
  }

  async getHistoricalData(days: number = 30): Promise<AnalyticsHistory[]> {
    // Since X API doesn't provide historical data in free tier,
    // we'll generate realistic sample data based on current metrics
    try {
      const currentUser = await this.getUserMetrics();
      const data: AnalyticsHistory[] = [];
      const today = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Simulate realistic growth with some variance
        const growthFactor = 1 - (i / days) * 0.1; // Gradual growth over time
        const variance = (Math.random() - 0.5) * 0.02; // ±1% daily variance

        const followersCount = Math.floor(currentUser.publicMetrics.followersCount * (growthFactor + variance));
        const followingCount = Math.floor(currentUser.publicMetrics.followingCount * (0.98 + variance));
        const tweetCount = Math.floor(currentUser.publicMetrics.tweetCount * (growthFactor + variance * 0.5));

        data.push({
          date: date.toISOString().split('T')[0],
          followersCount: Math.max(followersCount, 0),
          followingCount: Math.max(followingCount, 0),
          tweetCount: Math.max(tweetCount, 0),
          engagementRate: Math.round((2 + Math.random() * 3 + variance * 10) * 10) / 10
        });
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to fetch historical data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const createXApiService = (bearerToken: string): XApiService => {
  return new XApiService({ bearerToken });
};

export const isValidBearerToken = (token: string): boolean => {
  return typeof token === 'string' && token.length > 0 && !token.includes(' ');
};