/**
 * OAuth 2.0 Authorization Code Flow with PKCE
 *
 * This module handles the OAuth flow for X (Twitter) authentication
 * using the Authorization Code flow with PKCE (Proof Key for Code Exchange)
 */

import * as oauth from 'oauth4webapi';

/**
 * OAuth Configuration
 */
export const OAUTH_CONFIG = {
  authorizationEndpoint: 'https://x.com/i/oauth2/authorize',
  tokenEndpoint: 'https://api.x.com/2/oauth2/token',
  revocationEndpoint: 'https://api.x.com/2/oauth2/revoke',
  scopes: [
    'tweet.read',
    'users.read',
    'follows.read',
    'offline.access', // For refresh tokens
  ],
} as const;

/**
 * Generate a cryptographically secure random code verifier
 */
export function generateCodeVerifier(): string {
  return oauth.generateRandomCodeVerifier();
}

/**
 * Generate a code challenge from a code verifier
 * Uses S256 (SHA-256) method as required by X API
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  return await oauth.calculatePKCECodeChallenge(verifier);
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return oauth.generateRandomState();
}

/**
 * Store OAuth state securely
 * In production, consider using httpOnly cookies or session storage
 */
export function storeOAuthState(verifier: string, state: string): void {
  if (typeof window === 'undefined') return;

  // Store with expiration (5 minutes)
  const expiry = Date.now() + 5 * 60 * 1000;
  const data = {
    verifier,
    state,
    expiry,
  };

  try {
    sessionStorage.setItem('oauth_state', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store OAuth state:', error);
  }
}

/**
 * Retrieve OAuth state
 */
export function retrieveOAuthState(): { verifier: string; state: string } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('oauth_state');
    if (!stored) return null;

    const data = JSON.parse(stored);

    // Check if expired
    if (Date.now() > data.expiry) {
      sessionStorage.removeItem('oauth_state');
      return null;
    }

    return {
      verifier: data.verifier,
      state: data.state,
    };
  } catch (error) {
    console.error('Failed to retrieve OAuth state:', error);
    return null;
  }
}

/**
 * Clear OAuth state after successful authentication
 */
export function clearOAuthState(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('oauth_state');
  } catch (error) {
    console.error('Failed to clear OAuth state:', error);
  }
}

/**
 * Build the authorization URL with PKCE parameters
 */
export async function buildAuthorizationUrl(
  clientId: string,
  redirectUri: string,
  scopes: string[] = [...OAUTH_CONFIG.scopes]
): Promise<{ url: string; state: string; verifier: string }> {
  // Generate PKCE parameters
  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  const state = generateState();

  // Build authorization URL
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    state: state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  const url = `${OAUTH_CONFIG.authorizationEndpoint}?${params.toString()}`;

  return { url, state, verifier };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
  clientId: string,
  redirectUri: string
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}> {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: codeVerifier,
  });

  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Refresh an access token using a refresh token
 */
export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret?: string
): Promise<{
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}> {
  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });

  // Add client_secret if provided (required for confidential clients)
  if (clientSecret) {
    params.append('client_secret', clientSecret);
  }

  const response = await fetch(OAUTH_CONFIG.tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Revoke an access or refresh token
 */
export async function revokeToken(
  token: string,
  clientId: string,
  clientSecret: string,
  tokenTypeHint: 'access_token' | 'refresh_token' = 'access_token'
): Promise<void> {
  const params = new URLSearchParams({
    token: token,
    token_type_hint: tokenTypeHint,
  });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(OAUTH_CONFIG.revocationEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token revocation failed: ${response.status} - ${error}`);
  }
}

/**
 * Validate state parameter to prevent CSRF attacks
 */
export function validateState(receivedState: string, storedState: string): boolean {
  return receivedState === storedState && receivedState.length > 0;
}

/**
 * Store tokens securely
 * In production, use httpOnly cookies or secure session storage
 */
export function storeTokens(tokens: {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}): void {
  if (typeof window === 'undefined') return;

  try {
    const expiry = Date.now() + tokens.expires_in * 1000;
    const data = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiry,
    };

    // In production, consider using httpOnly cookies via API route
    sessionStorage.setItem('x_tokens', JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store tokens:', error);
  }
}

/**
 * Retrieve stored tokens
 */
export function retrieveTokens(): {
  accessToken: string;
  refreshToken?: string;
  expiry: number;
} | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem('x_tokens');
    if (!stored) return null;

    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to retrieve tokens:', error);
    return null;
  }
}

/**
 * Clear stored tokens
 */
export function clearTokens(): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.removeItem('x_tokens');
  } catch (error) {
    console.error('Failed to clear tokens:', error);
  }
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(expiry: number): boolean {
  return Date.now() >= expiry - 60000; // 1 minute buffer
}