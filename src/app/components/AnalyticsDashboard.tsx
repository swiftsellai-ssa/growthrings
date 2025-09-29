'use client';

import React, { useState } from 'react';
import { Target, Users, TrendingUp, Zap, RefreshCw, Key, AlertCircle, Clock, BarChart3, CheckCircle } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { useApp } from '../contexts/AppContext';
import { useAnalytics } from '../hooks/useAnalytics';
import { LineChart, MetricCard, TweetCard } from './AnalyticsCharts';

export const AnalyticsDashboard: React.FC = () => {
  const { navigateToHome, navigateToTool } = useNavigation();
  const { state, setShowXApiConfig, setBearerToken } = useApp();
  const [bearerTokenInput, setBearerTokenInput] = useState('');

  const analytics = useAnalytics(
    state.bearerToken ? state.bearerToken : undefined
  );

  const handleXApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (bearerTokenInput.trim()) {
      const token = bearerTokenInput.trim();
      setBearerToken(token);
      setShowXApiConfig(false);
      setBearerTokenInput('');
    }
  };

  const growthStats = analytics.getGrowthStats();
  const engagementTrends = analytics.getEngagementTrends();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {analytics.hasData ? `@${analytics.data.user?.username} Analytics` : 'Analytics Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {analytics.hasData ? 'Real-time X growth analytics' : 'Connect your X account to see analytics'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {analytics.isConfigured && (
                <button
                  onClick={analytics.refreshAnalytics}
                  disabled={analytics.isRefreshing}
                  className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={16} className={analytics.isRefreshing ? 'animate-spin' : ''} />
                  {analytics.isRefreshing ? 'Syncing...' : 'Sync Data'}
                </button>
              )}
              {!analytics.isConfigured && (
                <button
                  onClick={() => setShowXApiConfig(true)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Key size={16} />
                  Connect X API
                </button>
              )}
              <button
                onClick={navigateToTool}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Target size={16} />
                Ring Tool
              </button>
              <button
                onClick={navigateToHome}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {analytics.isLoading ? (
          // Loading State
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your analytics...</p>
            </div>
          </div>
        ) : analytics.error ? (
          // Error State
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Analytics Error</h3>
            <p className="text-red-600 mb-4">{analytics.error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={analytics.refreshAnalytics}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => setShowXApiConfig(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Check API Settings
              </button>
            </div>
          </div>
        ) : !analytics.hasData ? (
          // No Data State
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analytics Data</h3>
            <p className="text-gray-600 mb-4">Connect your X account to see real-time analytics</p>
            <button
              onClick={() => setShowXApiConfig(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
            >
              <Key size={16} />
              Connect X API
            </button>
          </div>
        ) : (
          // Analytics Content
          <>
            {/* User Profile Card */}
            {analytics.data.user && (
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
                <div className="flex items-center gap-4">
                  {analytics.data.user.profileImageUrl && (
                    <img
                      src={analytics.data.user.profileImageUrl}
                      alt={analytics.data.user.name}
                      className="w-16 h-16 rounded-full"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">{analytics.data.user.name}</h2>
                      {analytics.data.user.verified && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <p className="text-gray-600">@{analytics.data.user.username}</p>
                    {analytics.data.user.description && (
                      <p className="text-gray-700 mt-2 max-w-2xl">{analytics.data.user.description}</p>
                    )}
                  </div>
                  <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                    <Clock size={14} />
                    Last updated: {analytics.lastUpdated?.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}

            {/* Key Metrics */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Followers"
                value={analytics.data.user?.followersCount || 0}
                change={growthStats.dailyGrowth}
                changeLabel="today"
                icon={Users}
                color="#1565C0"
              />
              <MetricCard
                title="Following"
                value={analytics.data.user?.followingCount || 0}
                icon={Users}
                color="#2E7D32"
              />
              <MetricCard
                title="Engagement Rate"
                value={`${engagementTrends.currentEngagement}%`}
                icon={TrendingUp}
                color="#6A1B9A"
              />
              <MetricCard
                title="Total Tweets"
                value={analytics.data.user?.tweetCount || 0}
                icon={Zap}
                color="#EA580C"
              />
            </div>

            {/* Growth Overview */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trend</h3>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    growthStats.growthVelocity === 'accelerating' ? 'text-green-600' :
                    growthStats.growthVelocity === 'declining' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {growthStats.growthVelocity === 'accelerating' ? '📈' :
                     growthStats.growthVelocity === 'declining' ? '📉' : '📊'}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{growthStats.growthVelocity}</p>
                  <p className="text-lg font-semibold mt-2">
                    {growthStats.weeklyGrowth > 0 ? '+' : ''}{growthStats.weeklyGrowth} this week
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trend</h3>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${
                    engagementTrends.trend === 'improving' ? 'text-green-600' :
                    engagementTrends.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {engagementTrends.trend === 'improving' ? '⬆️' :
                     engagementTrends.trend === 'declining' ? '⬇️' : '➡️'}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{engagementTrends.trend}</p>
                  <p className="text-lg font-semibold mt-2">{engagementTrends.currentEngagement}% current</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Score</h3>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{analytics.data.growthTrend}</div>
                  <p className="text-sm text-gray-600">Out of 10</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(analytics.data.growthTrend / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              <LineChart
                data={analytics.data.historicalData.map(d => ({
                  date: d.date,
                  followersCount: d.followersCount,
                  followingCount: d.followingCount,
                  tweetCount: d.tweetCount,
                  engagementRate: d.engagementRate
                }))}
                metric="followersCount"
                color="#1565C0"
                title="Followers Growth"
              />

              <LineChart
                data={analytics.data.historicalData.map(d => ({
                  date: d.date,
                  followersCount: d.followersCount,
                  followingCount: d.followingCount,
                  tweetCount: d.tweetCount,
                  engagementRate: d.engagementRate
                }))}
                metric="engagementRate"
                color="#2E7D32"
                title="Engagement Rate"
              />
            </div>

            {/* Top Tweet & Recent Tweets */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Tweet</h3>
                  {analytics.data.topTweet ? (
                    <TweetCard
                      tweet={{
                        ...analytics.data.topTweet,
                        createdAt: new Date().toISOString(),
                        metrics: {
                          retweets: 0,
                          likes: 0,
                          replies: 0,
                          quotes: 0
                        }
                      }}
                      isTopTweet
                    />
                  ) : (
                    <p className="text-gray-500 text-center py-8">No tweet data available</p>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tweets</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {analytics.data.tweets.slice(0, 5).map((tweet) => (
                      <TweetCard key={tweet.id} tweet={tweet} />
                    ))}
                    {analytics.data.tweets.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No recent tweets found</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* X API Configuration Modal */}
      {state.showXApiConfig && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowXApiConfig(false);
              setBearerTokenInput('');
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="text-blue-600" size={20} aria-hidden="true" />
              Connect X API
            </h3>

            <form onSubmit={handleXApiConfig} className="space-y-4">
              <div>
                <label htmlFor="bearer-token-input" className="block text-sm font-medium text-gray-700 mb-2">
                  X API Bearer Token
                </label>
                <input
                  id="bearer-token-input"
                  type="password"
                  value={bearerTokenInput}
                  onChange={(e) => setBearerTokenInput(e.target.value)}
                  placeholder="Enter your X API bearer token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your bearer token from{' '}
                  <a
                    href="https://developer.x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    X Developer Portal
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">Free Tier Limitations:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Only your own account data available</li>
                  <li>• Limited to basic follower count and engagement</li>
                  <li>• 450 requests per 15-minute window</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowXApiConfig(false);
                    setBearerTokenInput('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};