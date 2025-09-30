# Token Management Documentation

This guide explains how token refresh and logout are implemented in the Growth Rings application.

## Table of Contents

1. [Overview](#overview)
2. [Token Refresh](#token-refresh)
3. [Token Revocation & Logout](#token-revocation--logout)
4. [Usage Examples](#usage-examples)
5. [Security Considerations](#security-considerations)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The application uses **httpOnly cookies** to securely store OAuth tokens and prevent XSS attacks. All token management operations (refresh, revoke) are handled server-side through API routes.

### Token Storage Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Browser   │◄───────►│  API Routes      │◄───────►│  X API      │
│             │         │  (Server-side)   │         │             │
│  (Client)   │         │                  │         │  (Twitter)  │
└─────────────┘         └──────────────────┘         └─────────────┘
      │                         │
      │                         │
      ▼                         ▼
┌─────────────┐         ┌──────────────────┐
│  useAuth()  │         │  httpOnly        │
│  Hook       │         │  Cookies         │
└─────────────┘         └──────────────────┘
                        - x_access_token
                        - x_refresh_token
                        - x_token_expiry
```

### Token Lifecycle

1. **Authentication**: User signs in via OAuth 2.0 + PKCE
2. **Storage**: Tokens stored in httpOnly cookies (never exposed to JavaScript)
3. **Refresh**: Access token automatically refreshed when expired
4. **Revocation**: Tokens revoked with X API on logout

---

## Token Refresh

### Server-side Endpoint: `/api/auth/refresh`

Automatically refreshes expired access tokens using the refresh token stored in httpOnly cookies.

#### Implementation

```typescript
// src/app/api/auth/refresh/route.ts
export async function POST(request: NextRequest) {
  // 1. Get refresh token from httpOnly cookie
  const refreshToken = await getRefreshTokenCookie();

  // 2. Exchange refresh token for new access token
  const tokens = await refreshAccessToken(refreshToken, clientId, clientSecret);

  // 3. Store new tokens in httpOnly cookies
  await setAccessTokenCookie(tokens.access_token, tokens.expires_in);

  // 4. Handle token rotation (if X API returns new refresh token)
  if (tokens.refresh_token) {
    await setRefreshTokenCookie(tokens.refresh_token);
  }

  return NextResponse.json({ success: true });
}
```

#### Key Features

- ✅ **Automatic Refresh**: Called automatically when access token expires
- ✅ **Token Rotation**: Supports refresh token rotation if X API provides new token
- ✅ **Error Handling**: Clears all cookies on failure and requires re-authentication
- ✅ **Security**: All tokens remain in httpOnly cookies, never exposed to client

#### Client-side Usage

```typescript
import { useAuth } from '@/app/hooks/useAuth';

function MyComponent() {
  const { refreshToken, getValidToken } = useAuth();

  // Manual refresh
  const handleManualRefresh = async () => {
    try {
      await refreshToken();
      console.log('Token refreshed successfully');
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  // Get valid token (auto-refreshes if needed)
  const fetchData = async () => {
    const token = await getValidToken();
    if (!token) {
      console.error('Not authenticated');
      return;
    }

    // Use token for API calls
    const response = await fetch('/api/x/user', {
      credentials: 'include' // Include httpOnly cookies
    });
  };
}
```

#### Response Format

**Success:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "expiresIn": 7200
}
```

**Error (requires re-authentication):**
```json
{
  "success": false,
  "error": "token_refresh_failed",
  "message": "Refresh token expired",
  "requiresReauth": true
}
```

---

## Token Revocation & Logout

### Server-side Endpoint: `/api/auth/revoke`

Properly revokes tokens with X API and clears all authentication cookies.

#### Implementation

```typescript
// src/app/api/auth/revoke/route.ts
export async function POST(request: NextRequest) {
  // 1. Get access token from httpOnly cookie
  const accessToken = await getAccessTokenCookie();

  // 2. Revoke token with X API (if token exists)
  if (accessToken) {
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    await fetch('https://api.twitter.com/2/oauth2/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${basicAuth}`
      },
      body: new URLSearchParams({
        token: accessToken,
        token_type_hint: 'access_token'
      })
    });
  }

  // 3. Clear all authentication cookies
  await clearAuthCookies();

  return NextResponse.json({ success: true });
}
```

#### Key Features

- ✅ **Token Revocation**: Revokes token with X API (POST /2/oauth2/revoke)
- ✅ **Complete Cleanup**: Clears all httpOnly cookies
- ✅ **Local Storage Cleanup**: Removes OAuth verifier and state from localStorage
- ✅ **Graceful Degradation**: Continues with local cleanup even if X API revocation fails
- ✅ **Auto Redirect**: Automatically redirects to home page after logout

#### Client-side Usage

```typescript
import { useAuth } from '@/app/hooks/useAuth';

function LogoutExample() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      // User will be redirected to home page automatically
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirects even on error
    }
  };

  return <button onClick={handleLogout}>Sign Out</button>;
}
```

#### Using LogoutButton Component

```typescript
import { LogoutButton, CompactLogoutButton, IconLogoutButton, LogoutMenuItem } from '@/app/components';

// Standard button
<LogoutButton variant="primary" size="md" />

// Compact text button for navbar
<CompactLogoutButton />

// Icon-only button
<IconLogoutButton />

// Menu item for dropdown
<LogoutMenuItem onClick={() => console.log('Menu closed')} />
```

#### What Gets Cleared

1. **httpOnly Cookies:**
   - `x_access_token`
   - `x_refresh_token`
   - `x_token_expiry`
   - `user_id`
   - `session_id`

2. **Local Storage:**
   - `oauth_verifier`
   - `oauth_state`

3. **X API:**
   - Token revoked server-side

---

## Usage Examples

### Example 1: Automatic Token Refresh in API Calls

```typescript
// src/app/api/x/user/route.ts
import { getAccessTokenCookie, isAccessTokenExpired } from '@/app/lib/cookies';

export async function GET(request: NextRequest) {
  // Check if token is expired
  const isExpired = await isAccessTokenExpired();

  if (isExpired) {
    return NextResponse.json(
      { error: 'Token expired', message: 'Please refresh your token' },
      { status: 401 }
    );
  }

  const accessToken = await getAccessTokenCookie();

  // Make X API request
  const response = await fetch('https://api.twitter.com/2/users/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  return NextResponse.json(await response.json());
}
```

### Example 2: Protected Component with Auto-Refresh

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useXUserData } from '@/app/hooks/useXUserData';

function ProtectedDashboard() {
  const { isAuthenticated, isLoading, getValidToken } = useAuth();
  const { user, error } = useXUserData({ autoFetch: true });

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      window.location.href = '/';
    }
  }, [isAuthenticated, isLoading]);

  if (error?.message?.includes('Token expired')) {
    // Token refresh failed, user needs to re-authenticate
    return (
      <div>
        <p>Your session has expired. Please sign in again.</p>
        <SignInButton />
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome, {user?.name}</h1>
      <LogoutButton />
    </div>
  );
}
```

### Example 3: Manual Token Refresh

```typescript
import { useAuth } from '@/app/hooks/useAuth';

function TokenManager() {
  const { refreshToken, isAuthenticated } = useAuth();
  const [status, setStatus] = useState('');

  const handleRefresh = async () => {
    setStatus('Refreshing...');
    try {
      await refreshToken();
      setStatus('Token refreshed successfully!');
    } catch (error) {
      setStatus('Refresh failed. Please sign in again.');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div>
      <button onClick={handleRefresh}>Refresh Token</button>
      <p>{status}</p>
    </div>
  );
}
```

### Example 4: Global Logout Button

```typescript
// In your header/navbar component
import { useAuth } from '@/app/hooks/useAuth';
import { CompactLogoutButton } from '@/app/components';

function Header() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <SignInButton />;
  }

  return (
    <header>
      <nav>
        <span>Welcome, {user?.name}</span>
        <CompactLogoutButton />
      </nav>
    </header>
  );
}
```

---

## Security Considerations

### ✅ Best Practices Implemented

1. **httpOnly Cookies**
   - Tokens never accessible to JavaScript
   - Prevents XSS token theft
   - Automatic inclusion in same-origin requests

2. **Token Revocation**
   - Tokens properly revoked with X API on logout
   - Prevents reuse of old tokens
   - Cleans up both server and client state

3. **Token Rotation**
   - Supports refresh token rotation
   - Reduces risk of refresh token compromise
   - X API may issue new refresh token on each refresh

4. **Error Handling**
   - Graceful degradation on failures
   - Automatic cleanup on token refresh failure
   - Continues logout even if X API request fails

5. **CSRF Protection**
   - SameSite cookie attribute set to 'lax'
   - State parameter validation in OAuth flow
   - Server-side only token handling

### ⚠️ Important Security Notes

1. **Never expose tokens to client-side JavaScript**
   - Always use httpOnly cookies
   - Never store in localStorage or sessionStorage
   - Never include in client-side state management

2. **Always revoke tokens on logout**
   - Call `/api/auth/revoke` endpoint
   - Don't just clear cookies locally
   - Ensure X API receives revocation request

3. **Handle token expiration gracefully**
   - Check expiry before making API calls
   - Automatically refresh when needed
   - Provide clear UX when re-authentication required

4. **Use HTTPS in production**
   - Set `secure: true` in cookie options
   - Never transmit tokens over HTTP
   - Enable HSTS headers

---

## Troubleshooting

### Token Refresh Fails

**Problem**: `/api/auth/refresh` returns 401 error

**Solutions**:
1. Check if refresh token exists in cookies
2. Verify X API credentials in `.env.local`
3. Ensure refresh token hasn't expired (30 day max)
4. User may need to re-authenticate

```typescript
// Debug refresh token
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
});
const data = await response.json();
console.log('Refresh response:', data);

if (data.requiresReauth) {
  // Redirect to sign in
  window.location.href = '/';
}
```

### Logout Doesn't Clear Tokens

**Problem**: User still authenticated after logout

**Solutions**:
1. Ensure `/api/auth/revoke` is being called
2. Check that `clearAuthCookies()` is executing
3. Verify cookies are being deleted (check DevTools → Application → Cookies)
4. Clear browser cache and cookies manually

```typescript
// Debug logout
const response = await fetch('/api/auth/revoke', {
  method: 'POST',
  credentials: 'include'
});
const data = await response.json();
console.log('Revoke response:', data);

// Manually clear localStorage
localStorage.removeItem('oauth_verifier');
localStorage.removeItem('oauth_state');
```

### X API Token Revocation Fails

**Problem**: X API returns error when revoking token

**Solutions**:
1. Check X API credentials (client_id, client_secret)
2. Verify token is valid and not already revoked
3. Check X API status page for outages
4. Application continues with local cleanup even on failure

```typescript
// The revoke endpoint handles this gracefully
// Local logout still succeeds even if X API fails
await clearAuthCookies(); // Always executes
```

### Cookies Not Sent with Requests

**Problem**: API routes don't receive authentication cookies

**Solutions**:
1. Ensure `credentials: 'include'` in fetch calls
2. Check SameSite cookie settings
3. Verify requests are same-origin
4. Check CORS configuration in production

```typescript
// Always include credentials
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include' // Required for httpOnly cookies
});
```

### Token Expiry Not Detected

**Problem**: Expired tokens not being refreshed

**Solutions**:
1. Check `x_token_expiry` cookie value
2. Verify `isAccessTokenExpired()` logic
3. Ensure clock skew buffer (60 seconds)
4. Check token expiry from X API response

```typescript
// Debug token expiry
import { isAccessTokenExpired } from '@/app/lib/cookies';

const isExpired = await isAccessTokenExpired();
console.log('Token expired:', isExpired);

// Get expiry time
const cookieStore = await cookies();
const expiry = cookieStore.get('x_token_expiry');
console.log('Expiry timestamp:', expiry?.value);
console.log('Current time:', Date.now());
```

---

## Testing

### Test Token Refresh

```bash
# Make a refresh request
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: x_refresh_token=YOUR_REFRESH_TOKEN" \
  -c cookies.txt

# Check new access token
cat cookies.txt | grep x_access_token
```

### Test Token Revocation

```bash
# Revoke token
curl -X POST http://localhost:3000/api/auth/revoke \
  -H "Cookie: x_access_token=YOUR_ACCESS_TOKEN" \
  -c cookies.txt

# Verify cookies cleared
cat cookies.txt
```

### Test in Browser DevTools

```javascript
// Check authentication status
const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
console.log(await authResponse.json());

// Test refresh
const refreshResponse = await fetch('/api/auth/refresh', {
  method: 'POST',
  credentials: 'include'
});
console.log(await refreshResponse.json());

// Test logout
const logoutResponse = await fetch('/api/auth/revoke', {
  method: 'POST',
  credentials: 'include'
});
console.log(await logoutResponse.json());
```

---

## Related Documentation

- [OAuth Setup Guide](./OAUTH_SETUP.md)
- [OAuth Implementation Details](./OAUTH_IMPLEMENTATION.md)
- [X API Integration](./X_API_INTEGRATION.md)
- [Environment Setup](./ENVIRONMENT_SETUP.md)

---

**Last Updated**: 2025-09-30
**Version**: 1.0.0