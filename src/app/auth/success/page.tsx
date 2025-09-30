'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import {
  exchangeCodeForToken,
  retrieveOAuthState,
  validateState,
  clearOAuthState,
  storeTokens,
  clearTokens,
} from '../../lib/oauth';

// Prevent prerendering - this page requires client-side only rendering
export const dynamic = 'force-dynamic';

function AuthSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Completing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get code and state from URL
        const code = searchParams.get('code');
        const receivedState = searchParams.get('state');

        if (!code || !receivedState) {
          throw new Error('Missing authentication parameters');
        }

        // Retrieve stored OAuth state
        const storedState = retrieveOAuthState();

        if (!storedState) {
          throw new Error('OAuth session expired. Please try signing in again.');
        }

        // Validate state to prevent CSRF attacks
        if (!validateState(receivedState, storedState.state)) {
          throw new Error('Invalid state parameter. Possible CSRF attack detected.');
        }

        // Get OAuth configuration
        const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_X_CALLBACK_URL;

        if (!clientId || !redirectUri) {
          throw new Error('OAuth configuration missing');
        }

        setMessage('Exchanging authorization code for access token...');

        // Exchange code for tokens
        const tokens = await exchangeCodeForToken(
          code,
          storedState.verifier,
          clientId,
          redirectUri
        );

        setMessage('Storing authentication tokens...');

        // Store tokens securely
        storeTokens({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        });

        // Clear OAuth state
        clearOAuthState();

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect to home page after 2 seconds
        setTimeout(() => {
          router.push('/?auth=success');
        }, 2000);
      } catch (error) {
        console.error('Authentication error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');

        // Clear any stored tokens on error
        clearTokens();
        clearOAuthState();
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        {status === 'loading' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authenticating</h1>
            <p className="text-gray-600">{message}</p>
            <div
              className="mt-4 w-full bg-gray-200 rounded-full h-2"
              role="progressbar"
              aria-label="Authentication progress"
              aria-valuenow={50}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="bg-blue-500 h-2 rounded-full animate-pulse"
                style={{ width: '50%' }}
              />
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Success!</h1>
            <p className="text-gray-600">{message}</p>
            <div className="mt-6">
              <div className="animate-pulse flex space-x-2 justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading</h1>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}