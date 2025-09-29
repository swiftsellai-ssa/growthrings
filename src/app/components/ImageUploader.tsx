'use client';

import React, { RefObject } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  profileImage: string | null;
  isGenerating: boolean;
  imageError: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileInputClick: () => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  profileImage,
  isGenerating,
  imageError,
  fileInputRef,
  onFileInputClick,
  onImageUpload,
}) => {
  return (
    <div>
      <label
        htmlFor="profile-picture-upload"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Profile Picture
      </label>

      <button
        onClick={onFileInputClick}
        disabled={isGenerating}
        className={`w-full px-4 py-3 border-2 border-dashed rounded-lg transition-all flex items-center justify-center gap-2 ${
          isGenerating
            ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
            : 'border-gray-300 hover:border-blue-400 text-gray-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }`}
        aria-label={profileImage ? 'Change profile picture' : 'Upload profile picture'}
        aria-describedby="upload-instructions upload-status"
      >
        {isGenerating ? (
          <>
            <div
              className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"
              role="status"
              aria-label="Processing image"
            />
            <span>Processing Image...</span>
          </>
        ) : (
          <>
            <Upload size={20} aria-hidden="true" />
            <span>{profileImage ? 'Change Image' : 'Upload Your Profile Picture'}</span>
          </>
        )}
      </button>

      <input
        id="profile-picture-upload"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageUpload}
        className="sr-only"
        aria-describedby="upload-instructions"
        disabled={isGenerating}
      />

      <p id="upload-instructions" className="text-xs text-gray-500 mt-2">
        Supported formats: JPG, PNG, GIF. Max size: 10MB
      </p>

      {/* Image Upload Status */}
      {isGenerating && (
        <p id="upload-status" className="sr-only" aria-live="polite">
          Processing your image, please wait...
        </p>
      )}

      {/* Image Upload Error Message */}
      {imageError && (
        <div
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle
            className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <p className="text-sm font-medium text-red-800">Upload Error</p>
            <p className="text-sm text-red-600 mt-1">{imageError}</p>
          </div>
        </div>
      )}

      {/* Success State */}
      {profileImage && !imageError && !isGenerating && (
        <div
          className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2"
          role="status"
          aria-live="polite"
        >
          <svg
            className="w-5 h-5 text-green-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M5 13l4 4L19 7"></path>
          </svg>
          <p className="text-sm text-green-700 font-medium">
            Image uploaded successfully
          </p>
        </div>
      )}
    </div>
  );
};