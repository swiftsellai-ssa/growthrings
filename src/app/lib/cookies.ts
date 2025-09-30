/**
 * Secure Cookie Utilities
 *
 * Provides utilities for securely storing and retrieving
 * authentication tokens and session data using httpOnly cookies.
 */

import { cookies } from 'next/headers';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const TOKEN_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 2, // 2 hours
};

const REFRESH_TOKEN_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

const SESSION_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

/**
 * Cookie names
 */
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'x_access_token',
  REFRESH_TOKEN: 'x_refresh_token',
  TOKEN_EXPIRY: 'x_token_expiry',
  OAUTH_VERIFIER: 'oauth_verifier',
  OAUTH_STATE: 'oauth_state',
  USER_ID: 'user_id',
  SESSION_ID: 'session_id',
} as const;

/**
 * Set access token cookie
 */
export async function setAccessTokenCookie(token: string, expiresIn: number): Promise<void> {
  const cookieStore = await cookies();
  const expiry = Date.now() + expiresIn * 1000;

  cookieStore.set(COOKIE_NAMES.ACCESS_TOKEN, token, {
    ...TOKEN_COOKIE_OPTIONS,
    maxAge: expiresIn,
  });

  cookieStore.set(COOKIE_NAMES.TOKEN_EXPIRY, expiry.toString(), {
    ...TOKEN_COOKIE_OPTIONS,
    maxAge: expiresIn,
  });
}

/**
 * Get access token from cookie
 */
export async function getAccessTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN);
  return token?.value || null;
}

/**
 * Set refresh token cookie
 */
export async function setRefreshTokenCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES.REFRESH_TOKEN, token, REFRESH_TOKEN_COOKIE_OPTIONS);
}

/**
 * Get refresh token from cookie
 */
export async function getRefreshTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN);
  return token?.value || null;
}

/**
 * Store OAuth state and verifier
 */
export async function setOAuthCookies(state: string, verifier: string): Promise<void> {
  const cookieStore = await cookies();

  // Store state for CSRF validation (expires in 10 minutes)
  cookieStore.set(COOKIE_NAMES.OAUTH_STATE, state, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 10,
  });

  // Store verifier for PKCE (expires in 10 minutes)
  cookieStore.set(COOKIE_NAMES.OAUTH_VERIFIER, verifier, {
    ...COOKIE_OPTIONS,
    maxAge: 60 * 10,
  });
}

/**
 * Get OAuth state from cookie
 */
export async function getOAuthStateCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const state = cookieStore.get(COOKIE_NAMES.OAUTH_STATE);
  return state?.value || null;
}

/**
 * Get OAuth verifier from cookie
 */
export async function getOAuthVerifierCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const verifier = cookieStore.get(COOKIE_NAMES.OAUTH_VERIFIER);
  return verifier?.value || null;
}

/**
 * Clear OAuth cookies after successful authentication
 */
export async function clearOAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.OAUTH_STATE);
  cookieStore.delete(COOKIE_NAMES.OAUTH_VERIFIER);
}

/**
 * Set user session cookie
 */
export async function setSessionCookie(userId: string, sessionId: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAMES.USER_ID, userId, SESSION_COOKIE_OPTIONS);
  cookieStore.set(COOKIE_NAMES.SESSION_ID, sessionId, SESSION_COOKIE_OPTIONS);
}

/**
 * Get user ID from session cookie
 */
export async function getUserIdCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(COOKIE_NAMES.USER_ID);
  return userId?.value || null;
}

/**
 * Clear all authentication cookies
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE_NAMES.ACCESS_TOKEN);
  cookieStore.delete(COOKIE_NAMES.REFRESH_TOKEN);
  cookieStore.delete(COOKIE_NAMES.TOKEN_EXPIRY);
  cookieStore.delete(COOKIE_NAMES.USER_ID);
  cookieStore.delete(COOKIE_NAMES.SESSION_ID);
}

/**
 * Check if access token is expired
 */
export async function isAccessTokenExpired(): Promise<boolean> {
  const cookieStore = await cookies();
  const expiry = cookieStore.get(COOKIE_NAMES.TOKEN_EXPIRY);

  if (!expiry) return true;

  const expiryTime = parseInt(expiry.value, 10);
  const now = Date.now();

  // Consider expired if less than 1 minute remaining
  return now >= expiryTime - 60000;
}

/**
 * Get all auth cookies for debugging (development only)
 */
export async function getAuthCookiesDebug(): Promise<Record<string, string | undefined>> {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }

  const cookieStore = await cookies();

  return {
    access_token: cookieStore.get(COOKIE_NAMES.ACCESS_TOKEN)?.value,
    refresh_token: cookieStore.get(COOKIE_NAMES.REFRESH_TOKEN)?.value,
    token_expiry: cookieStore.get(COOKIE_NAMES.TOKEN_EXPIRY)?.value,
    user_id: cookieStore.get(COOKIE_NAMES.USER_ID)?.value,
    session_id: cookieStore.get(COOKIE_NAMES.SESSION_ID)?.value,
  };
}