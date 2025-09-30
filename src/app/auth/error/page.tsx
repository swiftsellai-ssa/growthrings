'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

// Prevent prerendering - this page requires client-side only rendering
export const dynamic = 'force-dynamic';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const error = searchParams.get('error') || 'unknown_error';
  const description = searchParams.get('description') || 'An unknown error occurred';

  const errorMessages: Record<string, { title: string; message: string }> = {
    access_denied: {
      title: 'Access Denied',
      message: 'You denied access to the application. To use Growth Rings, we need permission to access your X account.',
    },
    invalid_request: {
      title: 'Invalid Request',
      message: 'The authentication request was invalid. This might be a temporary issue.',
    },
    server_error: {
      title: 'Server Error',
      message: 'An error occurred on our server. Please try again.',
    },
    temporarily_unavailable: {
      title: 'Service Unavailable',
      message: 'The X authentication service is temporarily unavailable. Please try again later.',
    },
    invalid_client: {
      title: 'Configuration Error',
      message: 'The application is not properly configured. Please contact support.',
    },
    unknown_error: {
      title: 'Authentication Error',
      message: 'An unexpected error occurred during authentication.',
    },
  };

  const errorInfo = errorMessages[error] || errorMessages.unknown_error;

  const handleRetry = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-red-200">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" aria-hidden="true" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          {errorInfo.title}
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-6">
          {errorInfo.message}
        </p>

        {/* Technical Details */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Technical Details:</h2>
          <div className="space-y-1">
            <p className="text-xs text-gray-600">
              <span className="font-medium">Error Code:</span> {error}
            </p>
            <p className="text-xs text-gray-600">
              <span className="font-medium">Description:</span> {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} aria-hidden="true" />
            Try Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} aria-hidden="true" />
            Go Home
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help?{' '}
            <a
              href="mailto:support@growthrings.app"
              className="text-blue-600 hover:underline font-medium"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-200 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}