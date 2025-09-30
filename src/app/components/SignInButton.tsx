'use client';

import React, { useState } from 'react';
import { Twitter, Loader2, AlertCircle } from 'lucide-react';

interface SignInButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const SignInButton: React.FC<SignInButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  showIcon = true,
  children = 'Sign in with X',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Option 1: Use server-side initiation (recommended for production)
      // This stores state/verifier in secure httpOnly cookies server-side
      window.location.href = '/api/auth/initiate';

      // Option 2: Client-side initiation (kept for backward compatibility)
      // Uncomment below and comment above to use client-side flow
      /*
      const clientId = process.env.NEXT_PUBLIC_X_CLIENT_ID;
      const redirectUri = process.env.NEXT_PUBLIC_X_CALLBACK_URL;

      if (!clientId || !redirectUri) {
        throw new Error(
          'OAuth not configured. Please set NEXT_PUBLIC_X_CLIENT_ID and NEXT_PUBLIC_X_CALLBACK_URL'
        );
      }

      const { url, state, verifier } = await buildAuthorizationUrl(
        clientId,
        redirectUri
      );

      storeOAuthState(verifier, state);
      window.location.href = url;
      */
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate sign in';
      setError(errorMessage);
      console.error('Sign in error:', err);
    }
  };

  // Variant styles
  const variantStyles = {
    primary: 'bg-black hover:bg-gray-800 text-white',
    secondary: 'bg-blue-500 hover:bg-blue-600 text-white',
    outline: 'bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-300',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <div className={fullWidth ? 'w-full' : 'inline-block'}>
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${fullWidth ? 'w-full' : ''}
          font-semibold rounded-xl transition-all
          flex items-center justify-center gap-3
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          shadow-lg hover:shadow-xl
        `}
        aria-label="Sign in with X (Twitter)"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="animate-spin" size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} aria-hidden="true" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            {showIcon && <Twitter size={size === 'sm' ? 16 : size === 'md' ? 20 : 24} aria-hidden="true" />}
            <span>{children}</span>
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-red-800">Sign In Error</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact sign-in button for headers/navbars
 */
export const CompactSignInButton: React.FC = () => {
  return (
    <SignInButton
      variant="outline"
      size="sm"
      showIcon={true}
    >
      Sign in
    </SignInButton>
  );
};

/**
 * Hero section sign-in button
 */
export const HeroSignInButton: React.FC = () => {
  return (
    <SignInButton
      variant="primary"
      size="lg"
      showIcon={true}
    >
      Get Started with X
    </SignInButton>
  );
};