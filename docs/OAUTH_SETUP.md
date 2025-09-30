# OAuth 2.0 Setup Guide

Complete guide for setting up OAuth 2.0 with PKCE for X (Twitter) authentication.

## Overview

Growth Rings uses **OAuth 2.0 Authorization Code Flow with PKCE** (Proof Key for Code Exchange) to securely authenticate users with X (Twitter). This provides:

✅ **Secure Authentication** - Industry-standard OAuth 2.0 protocol
✅ **PKCE Protection** - Protects against authorization code interception attacks
✅ **Token Management** - Automatic token refresh and expiration handling
✅ **User Privacy** - Only accesses permitted data with explicit user consent

## Flow Diagram

```
┌──────────┐                              ┌──────────┐
│  Client  │                              │  X API   │
└────┬─────┘                              └────┬─────┘
     │                                         │
     │ 1. Click "Sign in with X"              │
     │────────────────────────────────────────▶
     │                                         │
     │ 2. Generate code_verifier & challenge  │
     │    Store verifier in sessionStorage    │
     │                                         │
     │ 3. Redirect to X authorization         │
     │────────────────────────────────────────▶
     │                                         │
     │ 4. User authorizes app                 │
     │                                         │
     │ 5. Redirect with authorization code    │
     │◀────────────────────────────────────────
     │                                         │
     │ 6. Exchange code + verifier for tokens │
     │────────────────────────────────────────▶
     │                                         │
     │ 7. Receive access & refresh tokens     │
     │◀────────────────────────────────────────
     │                                         │
     │ 8. Store tokens securely               │
     │                                         │
```

## Setup Instructions

### 1. Create X Developer Account

1. Go to [X Developer Portal](https://developer.x.com/en/portal/dashboard)
2. Sign in with your X account
3. Apply for a developer account (if you haven't already)
4. Wait for approval (usually instant for basic access)

### 2. Create an App

1. In the Developer Portal, click **"Create App"**
2. Fill in app details:
   - **App Name:** Growth Rings (or your preferred name)
   - **App Description:** Visual X growth tracking tool
   - **Website URL:** Your app URL
3. Click **"Create"**

### 3. Configure OAuth Settings

1. Go to your app settings
2. Navigate to **"User authentication settings"**
3. Click **"Set up"**
4. Configure OAuth 2.0:

   **App permissions:**
   - ✅ Read (for reading tweets and user data)
   - ☐ Write (not needed)
   - ☐ Direct Messages (not needed)

   **Type of App:**
   - ✅ Web App

   **App info:**
   - **Callback URL:** `http://localhost:3000/api/auth/callback`
   - **Website URL:** Your app URL
   - **Organization name:** Your name/company
   - **Organization website:** Your website

5. Click **"Save"**

### 4. Get Your Credentials

After setup, you'll receive:
- **Client ID** (public, can be exposed)
- **Client Secret** (keep secret!)

### 5. Configure Environment Variables

Add to your `.env.local`:

```env
# OAuth Configuration (Client-side)
NEXT_PUBLIC_X_CLIENT_ID=your_client_id_here
NEXT_PUBLIC_X_CALLBACK_URL=http://localhost:3000/api/auth/callback

# Server-side OAuth Configuration
X_CLIENT_ID=your_client_id_here
X_CLIENT_SECRET=your_client_secret_here
X_CALLBACK_URL=http://localhost:3000/api/auth/callback

# NextAuth Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your_generated_secret_here
```

### 6. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`

3. Click **"Sign in with X"**

4. Authorize the app on X

5. You should be redirected back with authentication success

## Components

### SignInButton

Simple button to initiate OAuth flow:

```tsx
import { SignInButton } from '@/components/SignInButton';

// Default button
<SignInButton />

// Customized button
<SignInButton
  variant="primary"     // primary | secondary | outline
  size="lg"             // sm | md | lg
  fullWidth={false}
  showIcon={true}
>
  Get Started with X
</SignInButton>

// Compact variant for headers
<CompactSignInButton />

// Hero variant for landing pages
<HeroSignInButton />
```

### useAuth Hook

Manage authentication state:

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const {
    isAuthenticated,
    isLoading,
    accessToken,
    signOut,
    getValidToken
  } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <SignInButton />;
  }

  return (
    <div>
      <p>Welcome! You're signed in.</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## OAuth Flow Implementation

### 1. Initiate Authentication

```tsx
// components/SignInButton.tsx
const handleSignIn = async () => {
  // Generate PKCE parameters
  const { url, state, verifier } = await buildAuthorizationUrl(
    clientId,
    redirectUri
  );

  // Store securely
  storeOAuthState(verifier, state);

  // Redirect to X
  window.location.href = url;
};
```

### 2. Handle Callback

```tsx
// api/auth/callback/route.ts
export async function GET(request: NextRequest) {
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  // Validate and exchange code for tokens
  // See implementation in the route file
}
```

### 3. Token Management

```tsx
// Automatic token refresh
const token = await getValidToken();

// Make authenticated API calls
const response = await fetch('https://api.x.com/2/users/me', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Security Best Practices

### ✅ Do:

1. **Use PKCE** - Always use code_challenge and code_verifier
2. **Validate State** - Check state parameter to prevent CSRF
3. **Store Securely** - Use sessionStorage for temporary data
4. **Use HTTPS** - Always use HTTPS in production
5. **Rotate Secrets** - Regularly rotate your client secret
6. **Check Expiry** - Always check token expiration before use
7. **Handle Refresh** - Implement automatic token refresh

### ❌ Don't:

1. **Expose Secrets** - Never commit client secret to version control
2. **Skip Validation** - Always validate state and code parameters
3. **Use localStorage** - Avoid localStorage for sensitive tokens
4. **Ignore Expiry** - Don't use expired tokens
5. **Hardcode URLs** - Use environment variables for all URLs
6. **Share Tokens** - Never share access tokens between users

## Troubleshooting

### "Invalid Client ID"

**Problem:** X doesn't recognize your client ID

**Solutions:**
- Verify client ID is copied correctly
- Check that it matches your app in X Developer Portal
- Ensure environment variables are loaded (restart dev server)

### "Redirect URI Mismatch"

**Problem:** Callback URL doesn't match configured URL

**Solutions:**
- Check callback URL in `.env.local` matches X app settings
- Ensure protocol (http/https) matches exactly
- Verify port number is correct
- No trailing slashes

### "State Mismatch"

**Problem:** State parameter validation failed

**Solutions:**
- Don't open multiple sign-in windows
- Check that sessionStorage is enabled
- Clear browser cache and try again
- State expires after 5 minutes - start fresh

### "Token Expired"

**Problem:** Access token is no longer valid

**Solutions:**
- Use `getValidToken()` which handles refresh automatically
- Implement refresh token logic
- Sign in again if refresh token is also expired

### "CORS Errors"

**Problem:** Browser blocks cross-origin requests

**Solutions:**
- Ensure you're using API routes for token exchange (server-side)
- Don't call X API directly from client-side code
- Use Next.js API routes as a proxy

## Rate Limits

X API has rate limits:

- **OAuth endpoints:** 15 requests per 15 minutes per user
- **API v2 endpoints:** Varies by endpoint
- **Token refresh:** 1 refresh per access token

**Best Practices:**
- Cache tokens until expiry
- Don't request new tokens unnecessarily
- Implement exponential backoff on errors

## Production Deployment

### Callback URLs

Update your X app settings with production callback URLs:

```
https://yourdomain.com/api/auth/callback
```

### Environment Variables

Set in your hosting platform:

```env
NEXT_PUBLIC_X_CLIENT_ID=prod_client_id
NEXT_PUBLIC_X_CALLBACK_URL=https://yourdomain.com/api/auth/callback
X_CLIENT_ID=prod_client_id
X_CLIENT_SECRET=prod_client_secret
X_CALLBACK_URL=https://yourdomain.com/api/auth/callback
NEXTAUTH_SECRET=prod_secret_different_from_dev
```

### Security Headers

Add security headers in production:

```typescript
// next.config.js
module.exports = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
      ],
    },
  ],
};
```

## Resources

- [X API Documentation](https://developer.x.com/en/docs)
- [OAuth 2.0 Specification](https://oauth.net/2/)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
- [oauth4webapi Documentation](https://github.com/panva/oauth4webapi)

## Support

Having issues?

1. Check the troubleshooting section above
2. Review X API status: https://api.twitterstat.us/
3. Open an issue on GitHub
4. Contact support@growthrings.app