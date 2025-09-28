import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ChartData {
  date: string;
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  engagementRate: number;
}

interface LineChartProps {
  data: ChartData[];
  metric: keyof ChartData;
  color: string;
  title: string;
  showTrend?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  metric,
  color,
  title,
  showTrend = true
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const values = data.map(d => typeof d[metric] === 'number' ? d[metric] : 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  // Calculate trend
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
  const trendPercentage = min > 0 ? ((trend / min) * 100) : 0;

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {showTrend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend > 0 ? (
              <TrendingUp size={16} />
            ) : trend < 0 ? (
              <TrendingDown size={16} />
            ) : (
              <Minus size={16} />
            )}
            {Math.abs(trendPercentage).toFixed(1)}%
          </div>
        )}
      </div>

      <div className="relative h-48 mb-4">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id={`grid-${metric}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill={`url(#grid-${metric})`} />

          {/* Area under curve */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill={color}
            fillOpacity="0.1"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {values.map((value, index) => {
            const x = (index / (values.length - 1)) * 100;
            const y = 100 - ((value - min) / range) * 100;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="0.8"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between text-sm text-gray-600">
        <span>{data[0]?.date}</span>
        <div className="text-center">
          <span className="block font-medium text-gray-900">
            {values[values.length - 1]?.toLocaleString()}
          </span>
          <span className="text-xs">Current</span>
        </div>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change > 0 ? (
                <TrendingUp size={14} />
              ) : change < 0 ? (
                <TrendingDown size={14} />
              ) : (
                <Minus size={14} />
              )}
              <span>
                {change > 0 ? '+' : ''}{change} {changeLabel || ''}
              </span>
            </div>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: color + '20' }}
        >
          <div style={{ color }}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

interface TweetCardProps {
  tweet: {
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
  };
  isTopTweet?: boolean;
}

export const TweetCard: React.FC<TweetCardProps> = ({ tweet, isTopTweet }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total engagement for potential future use
  // const totalEngagement = tweet.metrics.likes + tweet.metrics.retweets +
  //                         tweet.metrics.replies + tweet.metrics.quotes;

  return (
    <div className={`bg-white rounded-lg border p-4 ${
      isTopTweet ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'
    }`}>
      {isTopTweet && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-600 text-sm font-medium">🏆 Top Performing Tweet</span>
        </div>
      )}

      <p className="text-gray-900 mb-3 line-clamp-3">{tweet.text}</p>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{formatDate(tweet.createdAt)}</span>
        <div className="flex items-center gap-4">
          <span>❤️ {tweet.metrics.likes}</span>
          <span>🔄 {tweet.metrics.retweets}</span>
          <span>💬 {tweet.metrics.replies}</span>
          <span className="font-medium text-blue-600">
            {tweet.engagementRate}% ER
          </span>
        </div>
      </div>
    </div>
  );
};