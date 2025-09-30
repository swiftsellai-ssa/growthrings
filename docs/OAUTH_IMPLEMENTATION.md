# OAuth Implementation Guide

Complete guide to the OAuth 2.0 + PKCE implementation in Growth Rings.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         OAuth Flow                               │
└─────────────────────────────────────────────────────────────────┘

Client                  Server                    X API
  │                       │                         │
  │ 1. Click Sign In      │                         │
  │──────────────────────>│                         │
  │                       │                         │
  │ 2. GET /api/auth/initiate                       │
  │──────────────────────>│                         │
  │                       │ Generate PKCE params    │
  │                       │ Store in httpOnly       │
  │                       │ cookies                 │
  │                       │                         │
  │ 3. Redirect to X      │                         │
  │<──────────────────────│                         │
  │                                                  │
  │ 4. User Authorizes                              │
  │─────────────────────────────────────────────────>
  │                                                  │
  │ 5. Redirect with code                           │
  │<─────────────────────────────────────────────────
  │                       │                         │
  │ 6. GET /api/auth/callback?code=...              │
  │──────────────────────>│                         │
  │                       │ Retrieve verifier       │
  │                       │ from cookies            │
  │                       │                         │
  │                       │ 7. Exchange code        │
  │                       │────────────────────────>│
  │                       │                         │
  │                       │ 8. Return tokens        │
  │                       │<────────────────────────│
  │                       │                         │
  │                       │ Store tokens in         │
  │                       │ httpOnly cookies        │
  │                       │                         │
  │ 9. Redirect to home   │                         │
  │<──────────────────────│                         │
  │                       │                         │
```

## File Structure

```
src/app/
├── lib/
│   ├── oauth.ts                 # OAuth utilities (PKCE, token exchange)
│   └── cookies.ts               # Secure cookie management
├── components/
│   └── SignInButton.tsx         # Sign-in button component
├── hooks/
│   └── useAuth.ts               # Authentication hook
└── api/
    └── auth/
        ├── initiate/
        │   └── route.ts         # Initiate OAuth flow
        ├── callback/
        │   └── route.ts         # Handle OAuth callback
        ├── me/
        │   └── route.ts         # Get current user
        └── signout/
            └── route.ts         # Sign out endpoint
```

## Implementation Details

### 1. OAuth Utilities (`lib/oauth.ts`)

Core OAuth functions using `oauth4webapi`:

```typescript
import * as oauth from 'oauth4webapi';

// Generate PKCE parameters
const verifier = generateCodeVerifier();
const challenge = await generateCodeChallenge(verifier);

// Build authorization URL
const { url, state, verifier } = await buildAuthorizationUrl(
  clientId,
  redirectUri
);

// Exchange code for tokens
const tokens = await exchangeCodeForToken(
  code,
  verifier,
  clientId,
  redirectUri
);
```

### 2. Cookie Management (`lib/cookies.ts`)

Secure token storage with httpOnly cookies:

```typescript
// Set access token (expires in 2 hours)
await setAccessTokenCookie(token, expiresIn);

// Set refresh token (expires in 30 days)
await setRefreshTokenCookie(refreshToken);

// Store OAuth state/verifier (expires in 10 minutes)
await setOAuthCookies(state, verifier);

// Retrieve tokens
const accessToken = await getAccessTokenCookie();
const refreshToken = await getRefreshTokenCookie();

// Clear all auth cookies
await clearAuthCookies();
```

**Cookie Security:**
- `httpOnly: true` - Not accessible to JavaScript
- `secure: true` - Only sent over HTTPS (production)
- `sameSite: 'lax'` - CSRF protection
- Short expiration times for OAuth temp data

### 3. Sign-In Flow

#### Client-Side (`components/SignInButton.tsx`)

```tsx
import { SignInButton } from '@/components';

// Basic usage
<SignInButton />

// Customized
<SignInButton
  variant="primary"
  size="lg"
  fullWidth={false}
  showIcon={true}
>
  Get Started with X
</SignInButton>
```

**What happens:**
1. User clicks button
2. Redirects to `/api/auth/initiate`
3. Server generates PKCE parameters
4. Server stores state/verifier in cookies
5. Server redirects to X authorization
6. User authorizes on X
7. X redirects back to callback

#### Server-Side Initiation (`api/auth/initiate/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  // Generate PKCE parameters
  const { url, state, verifier } = await buildAuthorizationUrl(
    clientId,
    redirectUri
  );

  // Store in secure httpOnly cookies
  await setOAuthCookies(state, verifier);

  // Redirect to X
  return NextResponse.redirect(url);
}
```

**Security features:**
- State/verifier never exposed to client
- Stored in httpOnly cookies
- 10-minute expiration

#### Callback Handler (`api/auth/callback/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const code = searchParams.get('code');
  const receivedState = searchParams.get('state');

  // Retrieve from cookies
  const storedState = await getOAuthStateCookie();
  const verifier = await getOAuthVerifierCookie();

  // Validate state (CSRF protection)
  if (receivedState !== storedState) {
    throw new Error('State mismatch');
  }

  // Exchange code for tokens
  const tokens = await exchangeCodeForToken(
    code,
    verifier,
    clientId,
    redirectUri
  );

  // Store tokens in httpOnly cookies
  await setAccessTokenCookie(tokens.access_token, tokens.expires_in);
  await setRefreshTokenCookie(tokens.refresh_token);

  // Clear OAuth temp cookies
  await clearOAuthCookies();

  // Redirect to home
  return NextResponse.redirect('/?auth=success');
}
```

**Security validations:**
1. ✅ Code parameter present
2. ✅ State parameter matches
3. ✅ Verifier retrieved from cookie
4. ✅ Token exchange successful
5. ✅ Tokens stored securely
6. ✅ Temp cookies cleared

### 4. Authentication State

#### Client-Side Hook (`hooks/useAuth.ts`)

```tsx
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const {
    isAuthenticated,
    isLoading,
    accessToken,
    error,
    signOut,
    getValidToken,
  } = useAuth();

  // Render based on auth state
  if (isLoading) return <Loader />;
  if (!isAuthenticated) return <SignInButton />;

  return <Dashboard />;
}
```

#### Server-Side Check (`api/auth/me/route.ts`)

```typescript
export async function GET(request: NextRequest) {
  const accessToken = await getAccessTokenCookie();
  const expired = await isAccessTokenExpired();

  if (!accessToken || expired) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    // user data...
  });
}
```

### 5. Sign Out

```typescript
// API route
export async function POST(request: NextRequest) {
  await clearAuthCookies();
  await clearOAuthCookies();

  return NextResponse.json({ success: true });
}

// Client usage
const handleSignOut = async () => {
  await fetch('/api/auth/signout', { method: 'POST' });
  window.location.href = '/';
};
```

## Security Features

### PKCE (Proof Key for Code Exchange)

Protects against authorization code interception:

```typescript
// Generate verifier (random string)
const verifier = generateCodeVerifier();

// Generate challenge (SHA-256 hash)
const challenge = await generateCodeChallenge(verifier);

// Include in authorization request
const authUrl = `${endpoint}?code_challenge=${challenge}`;

// Send verifier with code exchange
const tokens = await exchange({ code, code_verifier: verifier });
```

### State Parameter (CSRF Protection)

Prevents cross-site request forgery:

```typescript
// Generate random state
const state = generateState();

// Store in cookie
await setOAuthCookies(state, verifier);

// Validate on callback
if (receivedState !== storedState) {
  throw new Error('CSRF detected');
}
```

### httpOnly Cookies

Protects against XSS attacks:

```typescript
cookies().set('access_token', token, {
  httpOnly: true,      // Not accessible to JavaScript
  secure: true,        // Only HTTPS
  sameSite: 'lax',     // CSRF protection
  maxAge: 7200,        // 2 hours
});
```

### Token Expiration

Automatic expiry handling:

```typescript
// Store expiry timestamp
await setAccessTokenCookie(token, expiresIn);

// Check before use
const expired = await isAccessTokenExpired();

if (expired) {
  // Refresh or re-authenticate
  await refreshToken();
}
```

## Token Refresh

```typescript
// Refresh access token
const newTokens = await refreshAccessToken(
  refreshToken,
  clientId
);

// Update cookies
await setAccessTokenCookie(
  newTokens.access_token,
  newTokens.expires_in
);
```

## Error Handling

All errors redirect to `/auth/error` with details:

```typescript
return NextResponse.redirect(
  new URL(
    `/auth/error?error=${errorCode}&description=${errorMessage}`,
    request.url
  )
);
```

**Error types:**
- `access_denied` - User denied authorization
- `invalid_request` - Missing parameters
- `server_error` - Internal error
- `token_exchange_failed` - Token exchange failed
- `session_expired` - OAuth session expired
- `invalid_state` - CSRF detected

## Testing

### 1. Test OAuth Flow

```bash
npm run dev

# Visit http://localhost:3000
# Click "Sign in with X"
# Authorize on X
# Should redirect back successfully
```

### 2. Check Cookies (DevTools)

```
Application → Cookies → localhost:3000

Should see:
- x_access_token (httpOnly)
- x_refresh_token (httpOnly)
- x_token_expiry
- session_id
- user_id
```

### 3. Test API Endpoints

```bash
# Check auth status
curl http://localhost:3000/api/auth/me

# Sign out
curl -X POST http://localhost:3000/api/auth/signout
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for all URLs
- [ ] Set secure callback URL in X Developer Portal
- [ ] Rotate `NEXTAUTH_SECRET` regularly
- [ ] Monitor OAuth error rates
- [ ] Implement rate limiting
- [ ] Add logging and monitoring
- [ ] Test token refresh flow
- [ ] Implement proper database session storage
- [ ] Add CSRF token validation layer

## Troubleshooting

### "State mismatch" error

**Cause:** State cookie expired or not found

**Solution:**
- Check cookie settings in browser
- Ensure cookies are enabled
- Try clearing all cookies and retry

### "Token exchange failed"

**Cause:** Invalid code or verifier

**Solution:**
- Check X API credentials
- Verify callback URL matches exactly
- Check API logs for details

### Cookies not being set

**Cause:** HTTPS/domain mismatch

**Solution:**
- Use `secure: false` in development
- Check `sameSite` setting
- Verify domain matches

## Resources

- [oauth4webapi](https://github.com/panva/oauth4webapi)
- [X API OAuth 2.0](https://developer.x.com/en/docs/authentication/oauth-2-0)
- [RFC 7636 (PKCE)](https://tools.ietf.org/html/rfc7636)
- [OWASP OAuth Security](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)