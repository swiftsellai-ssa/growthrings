'use client';

import React from 'react';
import { Wifi, AlertCircle } from 'lucide-react';

interface XApiStatusProps {
  isConfigured: boolean;
  error: string | null;
  userData?: {
    username: string;
    followersCount: number;
    engagementRate: number;
  } | null;
}

export const XApiStatus: React.FC<XApiStatusProps> = ({
  isConfigured,
  error,
  userData,
}) => {
  if (!isConfigured) {
    return null;
  }

  return (
    <>
      {/* Error State */}
      {error && (
        <div
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-red-800">X API Error</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Connected State */}
      {userData && !error && (
        <div
          className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-medium text-green-800 flex items-center gap-2">
            <Wifi size={14} aria-hidden="true" />
            <span>Connected to @{userData.username}</span>
          </p>
          <p className="text-sm text-green-600 mt-1">
            {userData.followersCount.toLocaleString()} followers • {userData.engagementRate}% engagement
          </p>
          <span className="sr-only">
            Successfully connected to X API for user {userData.username} with {userData.followersCount} followers
          </span>
        </div>
      )}
    </>
  );
};