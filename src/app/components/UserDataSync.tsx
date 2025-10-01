/**
 * User Data Sync Component
 *
 * Automatically syncs user data from X API and updates application state.
 * Can be used in ToolView, Analytics, or anywhere you need live X data.
 */

'use client';

import React, { useEffect } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useXUserData } from '../hooks/useXUserData';
import { useAuth } from '../hooks/useAuth';

interface UserDataSyncProps {
  onDataUpdate?: (data: {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    engagementRate: number;
  }) => void;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  showStatus?: boolean;
}

export const UserDataSync: React.FC<UserDataSyncProps> = ({
  onDataUpdate,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute default
  showStatus = true,
}) => {
  const { isAuthenticated } = useAuth();
  const { user, engagementRate, isLoading, error, lastUpdated, refresh } = useXUserData({
    includeTweets: true,
    autoFetch: isAuthenticated,
    refreshInterval: autoRefresh ? refreshInterval : undefined,
  });

  // Call onDataUpdate when data changes
  useEffect(() => {
    if (user && onDataUpdate) {
      onDataUpdate({
        followersCount: user.public_metrics?.followers_count || 0,
        followingCount: user.public_metrics?.following_count || 0,
        tweetCount: user.public_metrics?.tweet_count || 0,
        engagementRate: engagementRate || 0,
      });
    }
  }, [user, engagementRate, onDataUpdate]);

  if (!isAuthenticated) {
    return null;
  }

  if (!showStatus) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isLoading && (
        <>
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" aria-hidden="true" />
          <span className="text-gray-600">Syncing...</span>
        </>
      )}

      {!isLoading && !error && user && (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" aria-hidden="true" />
          <span className="text-gray-600">
            Synced {lastUpdated ? formatRelativeTime(lastUpdated) : 'just now'}
          </span>
          <button
            onClick={refresh}
            className="text-blue-600 hover:text-blue-700 underline"
            aria-label="Refresh user data"
          >
            Refresh
          </button>
        </>
      )}

      {error && (
        <>
          <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
          <span className="text-red-600 text-sm">{error}</span>
          <button
            onClick={refresh}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Retry
          </button>
        </>
      )}
    </div>
  );
};

/**
 * Example: Integration with ToolView
 */
export const ToolViewWithSync: React.FC = () => {
  const [currentFollowers, setCurrentFollowers] = React.useState(2500);
  const [_targetFollowers, _setTargetFollowers] = React.useState(10000);

  const handleDataUpdate = (data: {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    engagementRate: number;
  }) => {
    // Update current followers with live data
    setCurrentFollowers(data.followersCount);

    // You can also use other metrics
    console.log('X Data:', {
      followers: data.followersCount,
      following: data.followingCount,
      tweets: data.tweetCount,
      engagement: data.engagementRate.toFixed(2) + '%',
    });
  };

  return (
    <div>
      {/* Sync component - invisible but active */}
      <UserDataSync
        onDataUpdate={handleDataUpdate}
        autoRefresh={true}
        refreshInterval={60000} // Refresh every 60 seconds
        showStatus={true}
      />

      {/* Your existing ToolView components */}
      <div className="p-4">
        <h2>Current Followers: {currentFollowers.toLocaleString()}</h2>
        <h2>Target: {_targetFollowers.toLocaleString()}</h2>
        <div className="h-2 bg-gray-200 rounded">
          <div
            className="h-2 bg-blue-500 rounded"
            style={{ width: `${(currentFollowers / _targetFollowers) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Example: Manual fetch in useEffect
 */
export function ManualFetchExample() {
  const [userData, setUserData] = React.useState<{
    user: {
      username: string;
      public_metrics: {
        followers_count: number;
        tweet_count: number;
        following_count: number;
        listed_count: number;
      };
    };
    tweets: unknown[];
    engagementRate: number;
  } | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/x/user?include_tweets=true');

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const result = await response.json();
        setUserData(result.data);

        // Use the data
        const followers = result.data.user.public_metrics.followers_count;
        console.log('Followers:', followers);
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>@{userData.user.username}</h2>
      <p>Followers: {userData.user.public_metrics.followers_count.toLocaleString()}</p>
      <p>Tweets: {userData.user.public_metrics.tweet_count.toLocaleString()}</p>
      {userData.engagementRate && (
        <p>Engagement: {userData.engagementRate.toFixed(2)}%</p>
      )}
    </div>
  );
}

/**
 * Format relative time
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  return 'today';
}