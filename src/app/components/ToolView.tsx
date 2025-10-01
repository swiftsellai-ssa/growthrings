'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Target, Users, TrendingUp, Zap, Wifi, WifiOff, Key, BarChart3 } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { useApp } from '../contexts/AppContext';
import { useXApi } from '../hooks/useXApi';
import { useDebounce } from '../hooks/useDebounce';
import { scaleImageToMaxSize } from '../utils/imageProcessor';
import { GoalSetupCard } from './GoalSetupCard';
import { PreviewCard } from './PreviewCard';

export const ToolView: React.FC = () => {
  const { navigateToHome, navigateToAnalytics } = useNavigation();
  const { state, setShowXApiConfig, setBearerToken } = useApp();
  const xApi = useXApi();
  const [bearerTokenInput, setBearerTokenInput] = useState('');

  // Tool state
  const [currentFollowers, setCurrentFollowers] = useState(2500);
  const [targetFollowers, setTargetFollowers] = useState(10000);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [goalType, setGoalType] = useState('followers');
  const [timeframe, setTimeframe] = useState('3months');
  const [ringStyle, setRingStyle] = useState('classic');
  const [showCanvas, setShowCanvas] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const goalTypes = React.useMemo(() => ({
    followers: { icon: Users, label: 'Followers', color: '#1565C0', format: (val: number) => val.toLocaleString() },
    engagement: { icon: TrendingUp, label: 'Engagement Rate', color: '#2E7D32', suffix: '%', format: (val: number) => val.toFixed(1) },
    tweets: { icon: Zap, label: 'Monthly Tweets', color: '#6A1B9A', format: (val: number) => val.toString() }
  }), []);

  const ringStyles = React.useMemo(() => ({
    classic: { name: 'Classic Ring', gradient: false },
    gradient: { name: 'Gradient Glow', gradient: true },
    neon: { name: 'Neon Pulse', gradient: true, glow: true }
  }), []);

  const timeframes = {
    '1month': { label: '1 Month', days: 30 },
    '3months': { label: '3 Months', days: 90 },
    '6months': { label: '6 Months', days: 180 }
  };

  const progressPercentage = Math.min((currentFollowers / targetFollowers) * 100, 100);
  const currentGoal = goalTypes[goalType as keyof typeof goalTypes];

  // Debounced values to prevent excessive canvas redraws
  const debouncedCurrentFollowers = useDebounce(currentFollowers, 300);
  const debouncedTargetFollowers = useDebounce(targetFollowers, 300);
  const debouncedProgressPercentage = useMemo(() =>
    Math.min((debouncedCurrentFollowers / debouncedTargetFollowers) * 100, 100),
    [debouncedCurrentFollowers, debouncedTargetFollowers]
  );

  const generateRingOverlay = useCallback(async () => {
    if (!profileImage) return;

    setIsGenerating(true);
    setCanvasError(null);

    requestAnimationFrame(() => {
      try {
        const canvas = canvasRef.current;
        if (!canvas) {
          setCanvasError('Canvas element not found. Please try refreshing the page.');
          setIsGenerating(false);
          return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setCanvasError('Canvas not supported in this browser. Please try a modern browser.');
          setIsGenerating(false);
          return;
        }

        const size = 400;

        try {
          canvas.width = size;
          canvas.height = size;
        } catch {
          setCanvasError('Failed to set canvas size. Canvas may be too large.');
          setIsGenerating(false);
          return;
        }

        const img = new Image();
        const imageTimeout = setTimeout(() => {
          setCanvasError('Image loading timed out. Please try a different image.');
          setIsGenerating(false);
        }, 10000);

        img.onload = () => {
          clearTimeout(imageTimeout);

          try {
            if (img.width === 0 || img.height === 0) {
              setCanvasError('Invalid image loaded. Please try a different image.');
              setIsGenerating(false);
              return;
            }

            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 25, 0, 2 * Math.PI);
            ctx.clip();

            try {
              ctx.drawImage(img, 0, 0, size, size);
            } catch {
              setCanvasError('Failed to draw image on canvas. The image may be corrupted.');
              setIsGenerating(false);
              return;
            }

            ctx.restore();

            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size / 2 - 20;
            const lineWidth = 10;

            // Background ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = lineWidth;
            ctx.stroke();

            // Progress ring
            const startAngle = -Math.PI / 2;
            const endAngle = startAngle + (debouncedProgressPercentage / 100) * 2 * Math.PI;

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);

            if (ringStyles[ringStyle as keyof typeof ringStyles].gradient) {
              const gradient = ctx.createLinearGradient(0, 0, size, size);
              gradient.addColorStop(0, currentGoal.color);
              gradient.addColorStop(1, currentGoal.color + '80');
              ctx.strokeStyle = gradient;
            } else {
              ctx.strokeStyle = currentGoal.color;
            }

            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';

            const currentRingStyle = ringStyles[ringStyle as keyof typeof ringStyles];
            if ('glow' in currentRingStyle && currentRingStyle.glow) {
              ctx.shadowColor = currentGoal.color;
              ctx.shadowBlur = 15;
            }

            ctx.stroke();
            ctx.shadowBlur = 0;

            // Add text elements
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText(`${Math.round(debouncedProgressPercentage)}%`, centerX, centerY + 10);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${Math.round(debouncedProgressPercentage)}%`, centerX, centerY + 10);

            ctx.font = 'bold 14px Arial';

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(currentGoal.label.toUpperCase(), centerX, centerY + 40);

            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(currentGoal.label.toUpperCase(), centerX, centerY + 40);

            // Achievement badge if goal reached
            if (debouncedProgressPercentage >= 100) {
              const badgeSize = 70;
              const badgeX = centerX + radius - badgeSize/2;
              const badgeY = centerY - badgeSize/2;

              ctx.beginPath();
              ctx.arc(badgeX, badgeY, badgeSize/2, 0, 2 * Math.PI);
              ctx.fillStyle = '#FFD700';
              ctx.fill();
              ctx.strokeStyle = '#FFA500';
              ctx.lineWidth = 3;
              ctx.stroke();

              ctx.fillStyle = '#FF6B35';
              ctx.font = 'bold 28px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('🏆', badgeX, badgeY);
            }

            // Watermark
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.fillText('growthrings.app', size - 10, size - 10);

            setShowCanvas(true);
            setIsGenerating(false);
          } catch (error) {
            setCanvasError(`Canvas rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsGenerating(false);
          }
        };

        img.onerror = () => {
          clearTimeout(imageTimeout);
          setCanvasError('Failed to load image. The image may be corrupted or in an unsupported format.');
          setIsGenerating(false);
        };

        try {
          img.src = profileImage;
        } catch {
          clearTimeout(imageTimeout);
          setCanvasError('Failed to set image source. Please try uploading the image again.');
          setIsGenerating(false);
        }
      } catch (error) {
        setCanvasError(`Canvas setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsGenerating(false);
      }
    });
  }, [profileImage, ringStyle, currentGoal, debouncedProgressPercentage, ringStyles]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    setCanvasError(null);

    try {
      const file = event.target.files?.[0];

      if (!file) {
        setImageError('No file selected. Please choose an image file.');
        return;
      }

      if (!file.type.startsWith('image/')) {
        setImageError('Invalid file type. Please select an image file (JPG, PNG, GIF, etc.).');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setImageError('File too large. Please choose an image smaller than 10MB.');
        return;
      }

      if (file.size === 0) {
        setImageError('Empty file. Please choose a valid image file.');
        return;
      }

      try {
        setIsGenerating(true);
        setShowCanvas(false);

        const scaledImage = await scaleImageToMaxSize(file, 400);

        if (!scaledImage || scaledImage === 'data:,') {
          throw new Error('Failed to process image - result was empty');
        }

        setProfileImage(scaledImage);
        setImageError(null);
      } catch (processingError) {
        const errorMessage = processingError instanceof Error
          ? processingError.message
          : 'Unknown error occurred while processing image';

        setImageError(errorMessage);
        setProfileImage(null);
        setShowCanvas(false);

        console.error('Image processing error:', processingError);
      } finally {
        setIsGenerating(false);
      }
    } catch (error) {
      setImageError(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsGenerating(false);
      console.error('File upload error:', error);
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const downloadImage = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        setCanvasError('Canvas not found. Please generate the image first.');
        return;
      }

      if (!showCanvas) {
        setCanvasError('No image to download. Please generate your growth ring first.');
        return;
      }

      await new Promise(resolve => requestAnimationFrame(resolve));

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCanvasError('Canvas context not available.');
        return;
      }

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData.data.some(pixel => pixel !== 0);

      if (!hasContent) {
        setCanvasError('Canvas appears to be empty. Please regenerate your growth ring.');
        return;
      }

      const link = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `growth-ring-${goalType}-${Math.round(progressPercentage)}%-${timestamp}.png`;

      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0);

        if (!dataUrl || dataUrl === 'data:,' || dataUrl.length < 100) {
          setCanvasError('Failed to export image. The canvas may be empty or corrupted.');
          return;
        }

        link.download = filename;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setCanvasError(null);
      } catch (error) {
        setCanvasError(`Failed to export image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('Download error:', error);
      }
    } catch (error) {
      setCanvasError(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Download setup error:', error);
    }
  };

  const handleXApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (bearerTokenInput.trim()) {
      const token = bearerTokenInput.trim();
      xApi.setBearerToken(token);
      setBearerToken(token);
      setShowXApiConfig(false);
    }
  };

  const syncWithXApi = async () => {
    if (xApi.isConfigured) {
      await xApi.refreshData();
      if (xApi.userData && !xApi.error) {
        setCurrentFollowers(xApi.userData.followersCount);
      }
    }
  };

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.showXApiConfig) {
        setShowXApiConfig(false);
        setBearerTokenInput('');
      }
    };

    if (state.showXApiConfig) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [state.showXApiConfig, setShowXApiConfig]);

  // Clear errors when user changes settings
  useEffect(() => {
    setCanvasError(null);
  }, [goalType, ringStyle]);

  // Trigger canvas redraw when necessary
  useEffect(() => {
    if (profileImage) {
      generateRingOverlay();
    }
  }, [profileImage, generateRingOverlay]);

  useEffect(() => {
    if (profileImage && showCanvas) {
      generateRingOverlay();
    }
  }, [debouncedProgressPercentage, goalType, ringStyle, profileImage, showCanvas, generateRingOverlay]);

  const getMotivationalMessage = () => {
    if (progressPercentage >= 100) return "🎉 Goal smashed! Time to level up!";
    if (progressPercentage >= 75) return "💪 Almost there! Keep pushing!";
    if (progressPercentage >= 50) return "🚀 Halfway there! Great momentum!";
    if (progressPercentage >= 25) return "📈 Great start! Keep it up!";
    return "🌱 Every expert was once a beginner!";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Growth Rings</h1>
                <p className="text-sm text-gray-600">Visualize your X growth journey</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowXApiConfig(true)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  xApi.isConfigured
                    ? 'bg-green-100 hover:bg-green-200 text-green-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {xApi.isConfigured ? <Wifi size={16} /> : <WifiOff size={16} />}
                {xApi.isConfigured ? 'X Connected' : 'Connect X API'}
              </button>
              <button
                onClick={navigateToAnalytics}
                className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <BarChart3 size={16} />
                Analytics
              </button>
              <button
                onClick={navigateToHome}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <GoalSetupCard
              goalType={goalType}
              goalTypes={goalTypes}
              setGoalType={setGoalType}
              currentFollowers={currentFollowers}
              setCurrentFollowers={setCurrentFollowers}
              targetFollowers={targetFollowers}
              setTargetFollowers={setTargetFollowers}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              ringStyle={ringStyle}
              setRingStyle={setRingStyle}
              timeframes={timeframes}
              ringStyles={ringStyles}
              profileImage={profileImage}
              isGenerating={isGenerating}
              imageError={imageError}
              fileInputRef={fileInputRef}
              onFileInputClick={() => fileInputRef.current?.click()}
              onImageUpload={handleImageUpload}
              xApiIsConfigured={xApi.isConfigured}
              xApiUserData={xApi.userData}
              xApiIsLoading={xApi.isLoading}
              xApiError={xApi.error}
              xApiLastUpdated={xApi.lastUpdated}
              onSyncWithXApi={syncWithXApi}
            />
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <PreviewCard
              profileImage={profileImage}
              showCanvas={showCanvas}
              isGenerating={isGenerating}
              canvasError={canvasError}
              canvasRef={canvasRef}
              progressPercentage={progressPercentage}
              targetFollowers={targetFollowers}
              currentFollowers={currentFollowers}
              currentGoalLabel={currentGoal.label}
              currentGoalColor={currentGoal.color}
              motivationalMessage={getMotivationalMessage()}
              onDownloadImage={downloadImage}
              onClearCanvasError={() => setCanvasError(null)}
              onRetryGenerate={() => {
                setCanvasError(null);
                if (profileImage) generateRingOverlay();
              }}
            />
          </div>
        </div>
      </div>

      {/* X API Configuration Modal */}
      {state.showXApiConfig && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowXApiConfig(false);
              setBearerTokenInput('');
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="text-blue-600" size={20} aria-hidden="true" />
              Connect X API
            </h3>

            <form onSubmit={handleXApiConfig} className="space-y-4">
              <div>
                <label htmlFor="bearer-token-input" className="block text-sm font-medium text-gray-700 mb-2">
                  X API Bearer Token
                </label>
                <input
                  id="bearer-token-input"
                  type="password"
                  value={bearerTokenInput}
                  onChange={(e) => setBearerTokenInput(e.target.value)}
                  placeholder="Enter your X API bearer token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get your bearer token from{' '}
                  <a
                    href="https://developer.x.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    X Developer Portal
                  </a>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-1">Free Tier Limitations:</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Only your own account data available</li>
                  <li>• Limited to basic follower count and engagement</li>
                  <li>• 450 requests per 15-minute window</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowXApiConfig(false);
                    setBearerTokenInput('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};