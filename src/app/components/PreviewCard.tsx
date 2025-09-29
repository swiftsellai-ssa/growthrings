'use client';

import React, { RefObject } from 'react';
import { Download, Upload } from 'lucide-react';

interface PreviewCardProps {
  profileImage: string | null;
  showCanvas: boolean;
  isGenerating: boolean;
  canvasError: string | null;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  progressPercentage: number;
  targetFollowers: number;
  currentFollowers: number;
  currentGoalLabel: string;
  currentGoalColor: string;
  motivationalMessage: string;
  onDownloadImage: () => void;
  onClearCanvasError: () => void;
  onRetryGenerate: () => void;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  profileImage,
  showCanvas,
  isGenerating,
  canvasError,
  canvasRef,
  progressPercentage,
  currentGoalColor,
  motivationalMessage,
  onDownloadImage,
  onClearCanvasError,
  onRetryGenerate,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Your Growth Ring</h3>
        {showCanvas && !canvasError && (
          <button
            onClick={onDownloadImage}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Download size={16} />
            Download
          </button>
        )}
      </div>

      {canvasError && showCanvas && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <div className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5">
            ⚠️
          </div>
          <div className="flex-grow">
            <p className="text-sm font-medium text-red-800">Download Error</p>
            <p className="text-sm text-red-600 mt-1">{canvasError}</p>
          </div>
          <button
            onClick={onClearCanvasError}
            className="text-red-400 hover:text-red-600 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {!profileImage ? (
        <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-gray-300 rounded-lg">
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 text-center text-lg font-medium mb-2">
                Processing...
              </p>
              <p className="text-gray-500 text-center">
                Please wait while we prepare your image
              </p>
            </>
          ) : (
            <>
              <Upload className="text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 text-center text-lg font-medium mb-2">
                Upload your profile picture
              </p>
              <p className="text-gray-500 text-center">
                See your growth progress as a visual ring
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="text-center">
          {canvasError ? (
            <div className="flex flex-col items-center justify-center h-80">
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg max-w-md">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 text-red-500 mt-1">
                    ⚠️
                  </div>
                  <div>
                    <p className="text-lg font-medium text-red-800 mb-2">Canvas Error</p>
                    <p className="text-sm text-red-600 mb-4">{canvasError}</p>
                    <button
                      onClick={onRetryGenerate}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="relative inline-block mb-4">
                {isGenerating && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className={`rounded-full shadow-lg transition-opacity ${showCanvas ? 'opacity-100' : 'opacity-0'}`}
                  style={{ maxWidth: '350px', width: '100%', height: 'auto' }}
                  role="img"
                  aria-label={`Growth ring showing ${Math.round(progressPercentage)}% progress`}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-medium text-gray-900 mb-2">{motivationalMessage}</p>
                <div
                  className="w-full bg-gray-200 rounded-full h-2"
                  role="progressbar"
                  aria-valuenow={Math.round(progressPercentage)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: currentGoalColor
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};