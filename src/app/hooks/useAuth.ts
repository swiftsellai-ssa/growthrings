/**
 * Authentication Hook
 *
 * Provides authentication state and methods for managing
 * OAuth tokens and user sessions.
 */

import { useState, useEffect, useCallback } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  signOut: () => void;
  refreshToken: () => Promise<void>;
  getValidToken: () => Promise<string | null>;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    error: null,
  });

  // Check authentication status on mount by calling server-side endpoint
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Call server-side endpoint to check auth status
        const response = await fetch('/api/auth/me', {
          credentials: 'include', // Include httpOnly cookies
        });

        if (response.ok) {
          const data = await response.json();

          if (data.authenticated) {
            setState({
              isAuthenticated: true,
              isLoading: false,
              accessToken: null, // Token stays in httpOnly cookie
              error: null,
            });
            return;
          }
        }

        // Not authenticated or error
        setState({
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          error: null,
        });
      } catch (error) {
        console.error('Auth check error:', error);
        setState({
          isAuthenticated: false,
          isLoading: false,
          accessToken: null,
          error: 'Failed to check authentication status',
        });
      }
    };

    checkAuth();
  }, []);

  // Sign out - revoke token and clear cookies
  const signOut = useCallback(async () => {
    try {
      // Call server-side revoke endpoint to clear tokens with X API
      await fetch('/api/auth/revoke', {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
      });
    } catch (error) {
      console.error('Error during sign out:', error);
      // Continue with local cleanup even if server request fails
    }

    // Clear any local storage (OAuth verifier, etc.)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('oauth_verifier');
      localStorage.removeItem('oauth_state');
    }

    // Update state
    setState({
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      error: null,
    });

    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, []);

  // Refresh token using server-side endpoint
  const refreshToken = useCallback(async () => {
    try {
      // Call server-side refresh endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // Include httpOnly cookies
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Token refresh failed');
      }

      // Token refreshed successfully, update state
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        error: null,
      }));

      // If requiresReauth flag is set, user needs to sign in again
      if (data.requiresReauth) {
        signOut();
        throw new Error('Session expired. Please sign in again.');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, sign out
      signOut();
      throw error;
    }
  }, [signOut]);

  // Get a valid token (refresh if needed)
  // Note: Tokens are stored in httpOnly cookies, so we don't return the actual token
  // This method ensures the token is valid by checking with the server
  const getValidToken = useCallback(async (): Promise<string | null> => {
    try {
      // Check if user is authenticated
      const authResponse = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (!authResponse.ok) {
        // Try to refresh token
        try {
          await refreshToken();
          return 'valid'; // Token is in httpOnly cookie
        } catch {
          return null;
        }
      }

      return 'valid'; // Token is in httpOnly cookie
    } catch (error) {
      console.error('Get valid token error:', error);
      return null;
    }
  }, [refreshToken]);

  return {
    ...state,
    signOut,
    refreshToken,
    getValidToken,
  };
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook to get access token
 */
export function useAccessToken(): string | null {
  const { accessToken } = useAuth();
  return accessToken;
}