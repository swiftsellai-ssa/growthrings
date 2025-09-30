# X API Integration Guide

Complete guide for fetching and using X (Twitter) user data in Growth Rings.

## Overview

Growth Rings uses a secure server-side proxy pattern to fetch X API data:

```
Client → Our API Route → X API
         (with token)    (authenticated)
```

This keeps access tokens secure in httpOnly cookies and prevents CORS issues.

## Quick Start

### 1. Fetch User Data (Simple)

```tsx
import { useXUserData } from '@/hooks/useXUserData';

function MyComponent() {
  const { user, isLoading, error } = useXUserData({
    includeTweets: false,
    autoFetch: true,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>@{user?.username}</h2>
      <p>Followers: {user?.public_metrics?.followers_count}</p>
    </div>
  );
}
```

### 2. Auto-Sync with Application State

```tsx
import { UserDataSync } from '@/components/UserDataSync';

function ToolView() {
  const [currentFollowers, setCurrentFollowers] = useState(0);

  const handleDataUpdate = (data) => {
    setCurrentFollowers(data.followersCount);
  };

  return (
    <>
      <UserDataSync
        onDataUpdate={handleDataUpdate}
        autoRefresh={true}
        refreshInterval={60000} // 1 minute
      />

      <div>Current: {currentFollowers}</div>
    </>
  );
}
```

### 3. Manual Fetch with useEffect

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const [followers, setFollowers] = useState(0);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      const response = await fetch('/api/x/user');
      const result = await response.json();

      setFollowers(result.data.user.public_metrics.followers_count);
    };

    fetchData();
  }, [isAuthenticated]);

  return <div>Followers: {followers}</div>;
}
```

## API Endpoints

### GET `/api/x/user`

Fetch current authenticated user's data.

**Query Parameters:**
- `include_tweets` (optional): Set to `'true'` to include recent tweets

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123456789",
      "name": "John Doe",
      "username": "johndoe",
      "public_metrics": {
        "followers_count": 1234,
        "following_count": 567,
        "tweet_count": 890,
        "listed_count": 12
      },
      "profile_image_url": "https://...",
      "verified": false
    },
    "tweets": [...],  // If include_tweets=true
    "engagementRate": 2.45  // If include_tweets=true
  }
}
```

**Error Responses:**
```json
{
  "error": "unauthorized",
  "message": "Not authenticated. Please sign in first."
}
```

**Error Codes:**
- `unauthorized` (401) - Not authenticated
- `token_expired` (401) - Token expired
- `rate_limit_exceeded` (429) - Rate limit hit
- `forbidden` (403) - Insufficient permissions
- `server_error` (500) - Internal error

## Hooks

### `useXUserData(options)`

Primary hook for fetching X user data.

**Options:**
```typescript
{
  includeTweets?: boolean;      // Fetch recent tweets
  autoFetch?: boolean;           // Auto-fetch on mount
  refreshInterval?: number;      // Auto-refresh (ms)
}
```

**Returns:**
```typescript
{
  user: XUser | null;
  tweets: XTweet[] | null;
  engagementRate: number | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  fetchUserData: () => Promise<void>;
  refresh: () => Promise<void>;
}
```

**Example:**
```tsx
const {
  user,
  tweets,
  engagementRate,
  isLoading,
  error,
  refresh
} = useXUserData({
  includeTweets: true,
  autoFetch: true,
  refreshInterval: 60000, // Refresh every minute
});
```

### `useFollowerCount()`

Simplified hook for just follower count.

**Returns:**
```typescript
{
  followersCount: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}
```

**Example:**
```tsx
const { followersCount, isLoading, refresh } = useFollowerCount();
```

### `useXUserMetrics(refreshIntervalMs?)`

Hook for all user metrics with auto-refresh.

**Returns:**
```typescript
{
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  engagementRate: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}
```

**Example:**
```tsx
const {
  followersCount,
  followingCount,
  tweetCount,
  engagementRate,
  lastUpdated
} = useXUserMetrics(60000); // Auto-refresh every minute
```

## Components

### `<UserDataSync />`

Component that syncs X data with your application state.

**Props:**
```typescript
{
  onDataUpdate?: (data: {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
    engagementRate: number;
  }) => void;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showStatus?: boolean;
}
```

**Example:**
```tsx
<UserDataSync
  onDataUpdate={(data) => {
    setCurrentFollowers(data.followersCount);
    setEngagementRate(data.engagementRate);
  }}
  autoRefresh={true}
  refreshInterval={30000}  // 30 seconds
  showStatus={true}        // Show sync status UI
/>
```

## Data Types

### XUser

```typescript
interface XUser {
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
```

### XTweet

```typescript
interface XTweet {
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
```

## Utility Functions

### Calculate Engagement Rate

```typescript
import { calculateEngagementRate } from '@/lib/xapi';

const rate = calculateEngagementRate(tweets, followersCount);
console.log(`Engagement: ${rate.toFixed(2)}%`);
```

### Get Top Tweet

```typescript
import { getTopTweet } from '@/lib/xapi';

const topTweet = getTopTweet(tweets);
console.log('Top tweet:', topTweet?.text);
```

### Format Numbers

```typescript
import { formatNumber } from '@/lib/xapi';

console.log(formatNumber(1234));      // "1.2K"
console.log(formatNumber(1234567));   // "1.2M"
```

### Format Dates

```typescript
import { formatDate } from '@/lib/xapi';

console.log(formatDate('2024-01-15T10:30:00Z'));
// "2h ago" or "3d ago" or "Jan 15"
```

## Integration Patterns

### Pattern 1: ToolView Auto-Sync

```tsx
function ToolView() {
  const [currentFollowers, setCurrentFollowers] = useState(2500);
  const [targetFollowers, setTargetFollowers] = useState(10000);

  return (
    <div>
      {/* Auto-sync followers */}
      <UserDataSync
        onDataUpdate={(data) => setCurrentFollowers(data.followersCount)}
        autoRefresh={true}
        refreshInterval={60000}
      />

      {/* Progress ring */}
      <ProgressRing
        current={currentFollowers}
        target={targetFollowers}
      />
    </div>
  );
}
```

### Pattern 2: Analytics Dashboard

```tsx
function AnalyticsDashboard() {
  const {
    followersCount,
    followingCount,
    tweetCount,
    engagementRate,
    isLoading,
    lastUpdated
  } = useXUserMetrics(300000); // Refresh every 5 minutes

  if (isLoading) return <Spinner />;

  return (
    <div>
      <MetricCard title="Followers" value={followersCount} />
      <MetricCard title="Following" value={followingCount} />
      <MetricCard title="Tweets" value={tweetCount} />
      <MetricCard
        title="Engagement"
        value={`${engagementRate.toFixed(2)}%`}
      />
      <p>Last updated: {lastUpdated?.toLocaleTimeString()}</p>
    </div>
  );
}
```

### Pattern 3: Manual Fetch on Demand

```tsx
function RefreshableStats() {
  const { user, isLoading, refresh } = useXUserData({
    autoFetch: false, // Don't fetch automatically
  });

  return (
    <div>
      <button onClick={refresh} disabled={isLoading}>
        {isLoading ? 'Refreshing...' : 'Refresh Stats'}
      </button>

      {user && (
        <div>
          <p>Followers: {user.public_metrics?.followers_count}</p>
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Conditional Fetch

```tsx
function ConditionalFetch() {
  const { isAuthenticated } = useAuth();
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    if (isAuthenticated && someCondition) {
      setShouldFetch(true);
    }
  }, [isAuthenticated]);

  const { user } = useXUserData({
    autoFetch: shouldFetch,
  });

  return <div>...</div>;
}
```

## Rate Limiting

X API has rate limits. Our implementation handles this gracefully:

**Rate Limits (Free Tier):**
- User lookup: 75 requests per 15 minutes
- User tweets: 75 requests per 15 minutes

**Best Practices:**
1. Use reasonable refresh intervals (minimum 30 seconds)
2. Cache data when possible
3. Handle 429 errors gracefully
4. Use `autoFetch: false` for components that aren't always visible

**Example Error Handling:**
```tsx
const { user, error, refresh } = useXUserData();

if (error?.includes('rate_limit')) {
  return (
    <div>
      <p>Rate limit reached. Please try again in a few minutes.</p>
      <button onClick={() => setTimeout(refresh, 60000)}>
        Retry in 1 minute
      </button>
    </div>
  );
}
```

## Security

### Server-Side Proxy

All X API requests go through our server-side API routes:

```
✅ Client → /api/x/user → X API
   (no token)  (with token)  (authenticated)

❌ Client → X API
   (exposed token - DON'T DO THIS)
```

### Token Protection

- Access tokens stored in httpOnly cookies
- Never exposed to client JavaScript
- Automatic expiration handling
- CSRF protection with SameSite cookies

### CORS Prevention

By proxying through our API, we avoid CORS issues and keep tokens secure.

## Troubleshooting

### "Not authenticated" error

**Solution:**
```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <SignInButton />;
  }

  // Use X data hooks here
}
```

### Rate limit errors

**Solution:**
- Increase refresh interval
- Reduce number of requests
- Cache data locally
- Wait for rate limit reset

### Stale data

**Solution:**
```tsx
const { user, lastUpdated, refresh } = useXUserData();

// Check if data is stale (older than 5 minutes)
const isStale = lastUpdated &&
  Date.now() - lastUpdated.getTime() > 5 * 60 * 1000;

if (isStale) {
  refresh();
}
```

## Testing

### Test API Endpoint

```bash
# Start dev server
npm run dev

# Test endpoint (requires auth)
curl http://localhost:3000/api/x/user

# With tweets
curl http://localhost:3000/api/x/user?include_tweets=true
```

### Test in Browser

```javascript
// Open DevTools Console on your authenticated app
fetch('/api/x/user?include_tweets=true')
  .then(r => r.json())
  .then(console.log);
```

## Performance Tips

1. **Use appropriate refresh intervals**
   ```tsx
   // Good: 60 seconds for live dashboard
   refreshInterval={60000}

   // Bad: 5 seconds (too frequent, will hit rate limits)
   refreshInterval={5000}
   ```

2. **Fetch only what you need**
   ```tsx
   // If you don't need tweets, don't fetch them
   useXUserData({ includeTweets: false })
   ```

3. **Disable auto-fetch for hidden components**
   ```tsx
   useXUserData({
     autoFetch: isVisible, // Only fetch when visible
   })
   ```

4. **Cache data in state**
   ```tsx
   const [cachedData, setCachedData] = useState(null);

   useEffect(() => {
     if (user) {
       setCachedData(user);
     }
   }, [user]);
   ```

## Examples

See [UserDataSync.tsx](../src/app/components/UserDataSync.tsx) for complete working examples.

## Resources

- [X API v2 Documentation](https://developer.x.com/en/docs/twitter-api)
- [Rate Limits](https://developer.x.com/en/docs/twitter-api/rate-limits)
- [User Fields](https://developer.x.com/en/docs/twitter-api/data-dictionary/object-model/user)