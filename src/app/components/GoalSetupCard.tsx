'use client';

import React, { RefObject } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { GoalTypeSelector } from './GoalTypeSelector';
import { XApiStatus } from './XApiStatus';
import { ImageUploader } from './ImageUploader';

interface GoalType {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties; 'aria-hidden'?: boolean }>;
  label: string;
  color: string;
  format: (val: number) => string;
}

interface GoalSetupCardProps {
  goalType: string;
  goalTypes: Record<string, GoalType>;
  setGoalType: (type: string) => void;
  currentFollowers: number;
  setCurrentFollowers: (value: number) => void;
  targetFollowers: number;
  setTargetFollowers: (value: number) => void;
  timeframe: string;
  setTimeframe: (value: string) => void;
  ringStyle: string;
  setRingStyle: (value: string) => void;
  timeframes: Record<string, { label: string; days: number }>;
  ringStyles: Record<string, { name: string; gradient: boolean; glow?: boolean }>;
  profileImage: string | null;
  isGenerating: boolean;
  imageError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileInputClick: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  xApiIsConfigured: boolean;
  xApiUserData?: { username: string; followersCount: number; engagementRate: number } | null;
  xApiIsLoading: boolean;
  xApiError: string | null;
  xApiLastUpdated?: Date | null;
  onSyncWithXApi: () => void;
}

export const GoalSetupCard: React.FC<GoalSetupCardProps> = ({
  goalType,
  goalTypes,
  setGoalType,
  currentFollowers,
  setCurrentFollowers,
  targetFollowers,
  setTargetFollowers,
  timeframe,
  setTimeframe,
  ringStyle,
  setRingStyle,
  timeframes,
  ringStyles,
  profileImage,
  isGenerating,
  imageError,
  fileInputRef,
  onFileInputClick,
  onImageUpload,
  xApiIsConfigured,
  xApiUserData,
  xApiIsLoading,
  xApiError,
  xApiLastUpdated,
  onSyncWithXApi,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Settings className="text-gray-600" size={20} aria-hidden="true" />
        Goal Setup
      </h2>

      {/* Goal Type Selector */}
      <GoalTypeSelector
        goalType={goalType}
        goalTypes={goalTypes}
        onGoalTypeChange={setGoalType}
      />

      {/* Current and Target Values */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label
            htmlFor="current-followers"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Current
            {xApiIsConfigured && xApiUserData && (
              <span
                className="text-xs text-green-600 ml-1"
                role="status"
                aria-label="Live data from X API"
              >
                (Live)
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              id="current-followers"
              type="number"
              value={currentFollowers}
              onChange={(e) => setCurrentFollowers(Number(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-describedby="current-help"
              min="0"
              step="1"
            />
            {xApiIsConfigured && (
              <button
                onClick={onSyncWithXApi}
                disabled={xApiIsLoading}
                className={`px-3 py-2 rounded-lg border transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  xApiIsLoading
                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                    : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                }`}
                aria-label={xApiIsLoading ? 'Syncing with X API' : 'Sync follower count with X API'}
              >
                <RefreshCw
                  size={16}
                  className={xApiIsLoading ? 'animate-spin' : ''}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  {xApiIsLoading ? 'Syncing with X API' : 'Sync with X API'}
                </span>
              </button>
            )}
          </div>
          {xApiUserData && xApiLastUpdated && (
            <p id="current-help" className="text-xs text-gray-500 mt-1">
              Last updated: <time dateTime={xApiLastUpdated.toISOString()}>{xApiLastUpdated.toLocaleTimeString()}</time>
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="target-followers"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Target
          </label>
          <input
            id="target-followers"
            type="number"
            value={targetFollowers}
            onChange={(e) => setTargetFollowers(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-describedby="target-help"
            min="0"
            step="1"
          />
          <p id="target-help" className="sr-only">
            Enter your target {goalTypes[goalType]?.label.toLowerCase() || 'goal'} value
          </p>
        </div>
      </div>

      {/* X API Status */}
      <XApiStatus
        isConfigured={xApiIsConfigured}
        error={xApiError}
        userData={xApiUserData}
      />

      {/* Timeframe */}
      <div className="mb-4">
        <label htmlFor="timeframe-select" className="block text-sm font-medium text-gray-700 mb-2">
          Timeframe
        </label>
        <select
          id="timeframe-select"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-describedby="timeframe-help"
        >
          {Object.entries(timeframes).map(([key, frame]) => (
            <option key={key} value={key}>
              {frame.label}
            </option>
          ))}
        </select>
        <p id="timeframe-help" className="sr-only">
          Select the duration for your goal achievement
        </p>
      </div>

      {/* Ring Style */}
      <div className="mb-4">
        <label htmlFor="ring-style-select" className="block text-sm font-medium text-gray-700 mb-2">
          Ring Style
        </label>
        <select
          id="ring-style-select"
          value={ringStyle}
          onChange={(e) => setRingStyle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-describedby="ring-style-help"
        >
          {Object.entries(ringStyles).map(([key, style]) => (
            <option key={key} value={key}>
              {style.name}
            </option>
          ))}
        </select>
        <p id="ring-style-help" className="sr-only">
          Choose the visual style for your progress ring
        </p>
      </div>

      {/* Image Uploader */}
      <ImageUploader
        profileImage={profileImage}
        isGenerating={isGenerating}
        imageError={imageError}
        fileInputRef={fileInputRef}
        onFileInputClick={onFileInputClick}
        onImageUpload={onImageUpload}
      />
    </div>
  );
};