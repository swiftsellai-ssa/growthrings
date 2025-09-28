'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Target, Users, TrendingUp, Zap, Download, Upload, Settings, Trophy, CheckCircle, Star, ArrowRight, Mail, BarChart3, RefreshCw, Wifi, WifiOff, Key, AlertCircle, Clock } from 'lucide-react';
import { useXApi } from './hooks/useXApi';
import { useAnalytics } from './hooks/useAnalytics';
import { emailService, isValidEmail } from './services/emailService';
import { LineChart, MetricCard, TweetCard } from './components/AnalyticsCharts';

interface AnalyticsDataPoint {
  date: string;
  followers: number;
  engagement: number;
  tweets: number;
}

// Debounce utility function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Image scaling utility with comprehensive error handling
const scaleImageToMaxSize = (file: File, maxSize: number = 400): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Invalid file type. Please select an image file.'));
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB absolute limit
      reject(new Error('File too large. Please select an image smaller than 50MB.'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas not supported in this browser.'));
      return;
    }

    const img = new Image();
    let objectUrl: string;

    const cleanup = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

    img.onload = () => {
      try {
        // Validate image dimensions
        if (img.width === 0 || img.height === 0) {
          cleanup();
          reject(new Error('Invalid image: Image has zero dimensions.'));
          return;
        }

        if (img.width > 10000 || img.height > 10000) {
          cleanup();
          reject(new Error('Image too large: Maximum dimensions are 10000x10000 pixels.'));
          return;
        }

        // Calculate new dimensions
        let { width, height } = img;
        const aspectRatio = width / height;

        if (width > height) {
          width = Math.min(width, maxSize);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxSize);
          width = height * aspectRatio;
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        // Clear canvas and draw image
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to data URL with error handling
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        if (!dataUrl || dataUrl === 'data:,') {
          cleanup();
          reject(new Error('Failed to process image. The image may be corrupted.'));
          return;
        }

        cleanup();
        resolve(dataUrl);
      } catch (error) {
        cleanup();
        reject(new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };

    img.onerror = () => {
      cleanup();
      reject(new Error('Failed to load image. The image may be corrupted or in an unsupported format.'));
    };

    try {
      objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
    } catch (error) {
      reject(new Error(`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
};

export default function GrowthRingsApp() {
  const [showTool, setShowTool] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // X API integration
  const xApi = useXApi();
  const [showXApiConfig, setShowXApiConfig] = useState(false);
  const [bearerTokenInput, setBearerTokenInput] = useState('');

  // Analytics integration
  const analytics = useAnalytics(xApi.isConfigured ? bearerTokenInput || localStorage.getItem('xapi_token') || undefined : undefined);

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

  // Analytics state
  const [analyticsData, setAnalyticsData] = useState<AnalyticsDataPoint[]>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('growthRingsAnalytics');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          console.warn('Failed to parse saved analytics data');
        }
      }
    }

    // Generate sample analytics data for the last 30 days
    const data: AnalyticsDataPoint[] = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const followers = Math.floor(2000 + (Math.random() * 1000) + (i * 20));
      data.push({
        date: date.toISOString().split('T')[0],
        followers,
        engagement: Math.floor(2 + Math.random() * 4),
        tweets: Math.floor(5 + Math.random() * 15)
      });
    }
    return data;
  });

  // Save analytics data to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && analyticsData.length > 0) {
      localStorage.setItem('growthRingsAnalytics', JSON.stringify(analyticsData));
    }
  }, [analyticsData]);

  const goalTypes = {
    followers: { icon: Users, label: 'Followers', color: '#1565C0', format: (val: number) => val.toLocaleString() },
    engagement: { icon: TrendingUp, label: 'Engagement Rate', color: '#2E7D32', suffix: '%', format: (val: number) => val.toFixed(1) },
    tweets: { icon: Zap, label: 'Monthly Tweets', color: '#6A1B9A', format: (val: number) => val.toString() }
  };

  const ringStyles = {
    classic: { name: 'Classic Ring', gradient: false },
    gradient: { name: 'Gradient Glow', gradient: true },
    neon: { name: 'Neon Pulse', gradient: true, glow: true }
  };

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

    // Use requestAnimationFrame for better performance
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

        // Set up timeout for image loading
        const imageTimeout = setTimeout(() => {
          setCanvasError('Image loading timed out. Please try a different image.');
          setIsGenerating(false);
        }, 10000); // 10 second timeout

        img.onload = () => {
          clearTimeout(imageTimeout);

          try {
            // Validate image loaded properly
            if (img.width === 0 || img.height === 0) {
              setCanvasError('Invalid image loaded. Please try a different image.');
              setIsGenerating(false);
              return;
            }

            ctx.save();
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2 - 25, 0, 2 * Math.PI);
            ctx.clip();

            // Draw image with error handling
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
            try {
              ctx.beginPath();
              ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.lineWidth = lineWidth;
              ctx.stroke();
            } catch {
              setCanvasError('Failed to draw background ring.');
              setIsGenerating(false);
              return;
            }

            // Progress ring - use debounced progress for smoother updates
            try {
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
            } catch {
              setCanvasError('Failed to draw progress ring.');
              setIsGenerating(false);
              return;
            }

            // Add text elements
            try {
              // Add percentage text - use debounced progress with better contrast
              ctx.font = 'bold 28px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              // Add thick black outline for contrast
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 6;
              ctx.strokeText(`${Math.round(debouncedProgressPercentage)}%`, centerX, centerY + 10);

              // White fill on top
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(`${Math.round(debouncedProgressPercentage)}%`, centerX, centerY + 10);

              // Add goal label with better contrast
              ctx.font = 'bold 14px Arial';

              // Black outline for goal label
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 3;
              ctx.strokeText(currentGoal.label.toUpperCase(), centerX, centerY + 40);

              // White fill for goal label
              ctx.fillStyle = '#FFFFFF';
              ctx.fillText(currentGoal.label.toUpperCase(), centerX, centerY + 40);
            } catch (error) {
              // Text rendering errors are non-critical, continue
              console.warn('Failed to render text on canvas:', error);
            }

            // Achievement badge if goal reached
            try {
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
            } catch (error) {
              // Badge rendering errors are non-critical, continue
              console.warn('Failed to render achievement badge:', error);
            }

            // Watermark
            try {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
              ctx.font = '10px Arial';
              ctx.textAlign = 'right';
              ctx.fillText('growthrings.app', size - 10, size - 10);
            } catch (error) {
              // Watermark errors are non-critical, continue
              console.warn('Failed to render watermark:', error);
            }

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

        // Load the image
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
  }, [profileImage, goalType, ringStyle, currentGoal, debouncedProgressPercentage, ringStyles]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // Clear previous errors
    setImageError(null);
    setCanvasError(null);

    try {
      const file = event.target.files?.[0];

      if (!file) {
        setImageError('No file selected. Please choose an image file.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setImageError('Invalid file type. Please select an image file (JPG, PNG, GIF, etc.).');
        return;
      }

      // Check file size before processing
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

        // Scale down the image to max 400px and compress
        const scaledImage = await scaleImageToMaxSize(file, 400);

        if (!scaledImage || scaledImage === 'data:,') {
          throw new Error('Failed to process image - result was empty');
        }

        setProfileImage(scaledImage);
        setImageError(null); // Clear any previous errors on success
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

    // Clear the input to allow re-uploading the same file
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

      // Ensure canvas is fully rendered before download
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Check if canvas has content
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setCanvasError('Canvas context not available.');
        return;
      }

      // Verify canvas has been drawn on
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
        document.body.appendChild(link); // Ensure link is in DOM
        link.click();
        document.body.removeChild(link); // Clean up

        // Clear any previous errors on successful download
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Validate email format
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setEmailLoading(true);
    setEmailError(null);

    try {
      const result = await emailService.submitEmail(email, ['growth-rings-waitlist']);

      if (result.success) {
        setEmailSubmitted(true);
        setEmail(''); // Clear the form

        if (result.fallback) {
          console.log('Email submitted via fallback method for:', email);
        } else {
          console.log('Email successfully submitted to ConvertKit:', email);
        }
      } else {
        setEmailError(result.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('Email submission error:', error);

      // Graceful fallback - log for manual processing but show success
      console.log('Email logged for manual processing due to error:', email);
      setEmailSubmitted(true);
      setEmail('');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleXApiConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (bearerTokenInput.trim()) {
      const token = bearerTokenInput.trim();
      xApi.setBearerToken(token);
      // Store token for analytics (in production, use more secure storage)
      localStorage.setItem('xapi_token', token);
      setShowXApiConfig(false);
    }
  };

  const syncWithXApi = async () => {
    if (xApi.isConfigured) {
      await xApi.refreshData();
      if (xApi.userData && !xApi.error) {
        setCurrentFollowers(xApi.userData.followersCount);
        // Update analytics with real data
        const newDataPoint: AnalyticsDataPoint = {
          date: new Date().toISOString().split('T')[0],
          followers: xApi.userData.followersCount,
          engagement: xApi.userData.engagementRate,
          tweets: Math.floor(xApi.userData.tweetCount / 30) // Convert to daily average
        };

        setAnalyticsData(prev => {
          const updated = [...prev];
          const today = newDataPoint.date;
          const existingIndex = updated.findIndex(d => d.date === today);

          if (existingIndex >= 0) {
            updated[existingIndex] = newDataPoint;
          } else {
            updated.push(newDataPoint);
            // Keep only last 30 days
            if (updated.length > 30) {
              updated.shift();
            }
          }

          return updated;
        });
      }
    }
  };

  // Navigation functions with proper state cleanup
  const navigateToTool = useCallback(() => {
    setShowAnalytics(false);
    setShowTool(true);
    setCanvasError(null);
    setImageError(null);
    // Reset any other UI states as needed
  }, []);

  const navigateToAnalytics = useCallback(() => {
    setShowTool(false);
    setShowAnalytics(true);
    setCanvasError(null);
    setImageError(null);
  }, []);

  const navigateToHome = useCallback(() => {
    setShowTool(false);
    setShowAnalytics(false);
    setShowXApiConfig(false);
    setCanvasError(null);
    setImageError(null);
    setBearerTokenInput('');
    // Reset modal states and clear any errors
  }, []);

  // Handle escape key for modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showXApiConfig) {
        setShowXApiConfig(false);
        setBearerTokenInput('');
      }
    };

    if (showXApiConfig) {
      document.addEventListener('keydown', handleEscape);
      // Trap focus in modal
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showXApiConfig]);

  // Clear errors when user changes settings
  useEffect(() => {
    setCanvasError(null);
  }, [goalType, ringStyle]);

  // Optimized useEffect that only triggers canvas redraw when necessary
  useEffect(() => {
    if (profileImage) {
      generateRingOverlay();
    }
  }, [profileImage, generateRingOverlay]);

  // Separate useEffect for debounced progress updates to avoid excessive redraws
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

  // Note: Legacy analytics functions removed - using real X API analytics now

  if (showTool) {
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
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="text-gray-600" size={20} />
                  Goal Setup
                </h2>
                
                {/* Goal Type */}
                <fieldset className="mb-4">
                  <legend className="block text-sm font-medium text-gray-700 mb-3">Growth Metric</legend>
                  <div className="space-y-2" role="radiogroup" aria-label="Select your growth metric">
                    {Object.entries(goalTypes).map(([key, goal]) => (
                      <button
                        key={key}
                        onClick={() => setGoalType(key)}
                        className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          goalType === key
                            ? `border-blue-500 bg-blue-50 text-blue-700`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        role="radio"
                        aria-checked={goalType === key}
                        aria-describedby={`goal-${key}-description`}
                      >
                        <goal.icon size={18} style={{ color: goal.color }} aria-hidden="true" />
                        <span className="font-medium">{goal.label}</span>
                        <span id={`goal-${key}-description`} className="sr-only">
                          Track your {goal.label.toLowerCase()} growth progress
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Values */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label htmlFor="current-followers" className="block text-sm font-medium text-gray-700 mb-2">
                      Current {xApi.isConfigured && xApi.userData && (
                        <span className="text-xs text-green-600 ml-1">(Live)</span>
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
                      />
                      {xApi.isConfigured && (
                        <button
                          onClick={syncWithXApi}
                          disabled={xApi.isLoading}
                          className={`px-3 py-2 rounded-lg border transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            xApi.isLoading
                              ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                              : 'border-blue-500 text-blue-600 hover:bg-blue-50'
                          }`}
                          aria-label={xApi.isLoading ? 'Syncing with X API' : 'Sync follower count with X API'}
                          title={xApi.isLoading ? 'Syncing...' : 'Sync with X API'}
                        >
                          <RefreshCw size={16} className={xApi.isLoading ? 'animate-spin' : ''} aria-hidden="true" />
                          <span className="sr-only">{xApi.isLoading ? 'Syncing with X API' : 'Sync with X API'}</span>
                        </button>
                      )}
                    </div>
                    {xApi.userData && (
                      <p id="current-help" className="text-xs text-gray-500 mt-1">
                        Last updated: {xApi.lastUpdated?.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="target-followers" className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                    <input
                      id="target-followers"
                      type="number"
                      value={targetFollowers}
                      onChange={(e) => setTargetFollowers(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-describedby="target-help"
                    />
                    <p id="target-help" className="sr-only">
                      Enter your target {currentGoal.label.toLowerCase()} goal
                    </p>
                  </div>
                </div>

                {/* X API Status */}
                {xApi.error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-800">X API Error</p>
                    <p className="text-sm text-red-600 mt-1">{xApi.error}</p>
                  </div>
                )}

                {xApi.userData && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                      <Wifi size={14} />
                      Connected to @{xApi.userData.username}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {xApi.userData.followersCount.toLocaleString()} followers • {xApi.userData.engagementRate}% engagement
                    </p>
                  </div>
                )}

                {/* Timeframe */}
                <div className="mb-4">
                  <label htmlFor="timeframe-select" className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                  <select
                    id="timeframe-select"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-describedby="timeframe-help"
                  >
                    {Object.entries(timeframes).map(([key, frame]) => (
                      <option key={key} value={key}>{frame.label}</option>
                    ))}
                  </select>
                  <p id="timeframe-help" className="sr-only">
                    Select the duration for your goal achievement
                  </p>
                </div>

                {/* Ring Style */}
                <div className="mb-4">
                  <label htmlFor="ring-style-select" className="block text-sm font-medium text-gray-700 mb-2">Ring Style</label>
                  <select
                    id="ring-style-select"
                    value={ringStyle}
                    onChange={(e) => setRingStyle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    aria-describedby="ring-style-help"
                  >
                    {Object.entries(ringStyles).map(([key, style]) => (
                      <option key={key} value={key}>{style.name}</option>
                    ))}
                  </select>
                  <p id="ring-style-help" className="sr-only">
                    Choose the visual style for your progress ring
                  </p>
                </div>

                {/* Upload */}
                <div>
                  <label htmlFor="profile-picture-upload" className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className={`w-full px-4 py-3 border-2 border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      isGenerating
                        ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                        : 'border-gray-300 hover:border-blue-400 text-gray-600'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        Processing Image...
                      </>
                    ) : (
                      <>
                        <Upload size={20} />
                        {profileImage ? 'Change Image' : 'Upload Your Profile Picture'}
                      </>
                    )}
                  </button>
                  <input
                    id="profile-picture-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-describedby="upload-help"
                  />
                  <p id="upload-help" className="sr-only">
                    Upload a profile picture to create your growth ring visualization
                  </p>

                  {/* Image Upload Error Message */}
                  {imageError && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <div className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5">
                        ⚠️
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-800">Upload Error</p>
                        <p className="text-sm text-red-600 mt-1">{imageError}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Your Growth Ring</h3>
                  {showCanvas && !canvasError && (
                    <button
                      onClick={downloadImage}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  )}
                </div>

                {/* Download Error Message */}
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
                      onClick={() => setCanvasError(null)}
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
                    {/* Canvas Error Message */}
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
                                onClick={() => {
                                  setCanvasError(null);
                                  if (profileImage) generateRingOverlay();
                                }}
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
                            aria-label={`Growth ring showing ${Math.round(progressPercentage)}% progress towards ${targetFollowers.toLocaleString()} ${currentGoal.label.toLowerCase()}. Current: ${currentFollowers.toLocaleString()}.`}
                            aria-describedby="progress-description"
                          />
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                          <p className="text-sm font-medium text-gray-900 mb-2">{getMotivationalMessage()}</p>
                          <div
                            className="w-full bg-gray-200 rounded-full h-2"
                            role="progressbar"
                            aria-valuenow={Math.round(progressPercentage)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progress: ${Math.round(progressPercentage)}% towards ${currentGoal.label.toLowerCase()} goal`}
                          >
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${progressPercentage}%`,
                                backgroundColor: currentGoal.color
                              }}
                            />
                          </div>
                          <div id="progress-description" className="sr-only">
                            Progress visualization showing {Math.round(progressPercentage)}% completion of your {currentGoal.label.toLowerCase()} goal.
                            You have {currentFollowers.toLocaleString()} out of {targetFollowers.toLocaleString()} target {currentGoal.label.toLowerCase()}.
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* X API Configuration Modal */}
        {showXApiConfig && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="xapi-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowXApiConfig(false);
                setBearerTokenInput('');
              }
            }}
          >
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
              <h3 id="xapi-modal-title" className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
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
                    aria-describedby="token-help"
                  />
                  <p id="token-help" className="text-xs text-gray-500 mt-1">
                    Get your bearer token from{' '}
                    <a
                      href="https://developer.x.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                      aria-label="X Developer Portal (opens in new tab)"
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
  }

  // Real Analytics Dashboard
  if (showAnalytics) {
    const growthStats = analytics.getGrowthStats();
    const engagementTrends = analytics.getEngagementTrends();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-white" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {analytics.hasData ? `@${analytics.data.user?.username} Analytics` : 'Analytics Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {analytics.hasData ? 'Real-time X growth analytics' : 'Connect your X account to see analytics'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {analytics.isConfigured && (
                  <button
                    onClick={analytics.refreshAnalytics}
                    disabled={analytics.isRefreshing}
                    className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <RefreshCw size={16} className={analytics.isRefreshing ? 'animate-spin' : ''} />
                    {analytics.isRefreshing ? 'Syncing...' : 'Sync Data'}
                  </button>
                )}
                {!analytics.isConfigured && (
                  <button
                    onClick={() => setShowXApiConfig(true)}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Key size={16} />
                    Connect X API
                  </button>
                )}
                <button
                  onClick={navigateToTool}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                >
                  <Target size={16} />
                  Ring Tool
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
          {analytics.isLoading ? (
            // Loading State
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your analytics...</p>
              </div>
            </div>
          ) : analytics.error ? (
            // Error State
            <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Analytics Error</h3>
              <p className="text-red-600 mb-4">{analytics.error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={analytics.refreshAnalytics}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Retry
                </button>
                <button
                  onClick={() => setShowXApiConfig(true)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Check API Settings
                </button>
              </div>
            </div>
          ) : !analytics.hasData ? (
            // No Data State
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Analytics Data</h3>
              <p className="text-gray-600 mb-4">Connect your X account to see real-time analytics</p>
              <button
                onClick={() => setShowXApiConfig(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
              >
                <Key size={16} />
                Connect X API
              </button>
            </div>
          ) : (
            // Analytics Content
            <>
              {/* User Profile Card */}
              {analytics.data.user && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-6">
                  <div className="flex items-center gap-4">
                    {analytics.data.user.profileImageUrl && (
                      <img
                        src={analytics.data.user.profileImageUrl}
                        alt={analytics.data.user.name}
                        className="w-16 h-16 rounded-full"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900">{analytics.data.user.name}</h2>
                        {analytics.data.user.verified && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <p className="text-gray-600">@{analytics.data.user.username}</p>
                      {analytics.data.user.description && (
                        <p className="text-gray-700 mt-2 max-w-2xl">{analytics.data.user.description}</p>
                      )}
                    </div>
                    <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
                      <Clock size={14} />
                      Last updated: {analytics.lastUpdated?.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Metrics */}
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <MetricCard
                  title="Followers"
                  value={analytics.data.user?.followersCount || 0}
                  change={growthStats.dailyGrowth}
                  changeLabel="today"
                  icon={Users}
                  color="#1565C0"
                />
                <MetricCard
                  title="Following"
                  value={analytics.data.user?.followingCount || 0}
                  icon={Users}
                  color="#2E7D32"
                />
                <MetricCard
                  title="Engagement Rate"
                  value={`${engagementTrends.currentEngagement}%`}
                  icon={TrendingUp}
                  color="#6A1B9A"
                />
                <MetricCard
                  title="Total Tweets"
                  value={analytics.data.user?.tweetCount || 0}
                  icon={Zap}
                  color="#EA580C"
                />
              </div>

              {/* Growth Overview */}
              <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trend</h3>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      growthStats.growthVelocity === 'accelerating' ? 'text-green-600' :
                      growthStats.growthVelocity === 'declining' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {growthStats.growthVelocity === 'accelerating' ? '📈' :
                       growthStats.growthVelocity === 'declining' ? '📉' : '📊'}
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{growthStats.growthVelocity}</p>
                    <p className="text-lg font-semibold mt-2">
                      {growthStats.weeklyGrowth > 0 ? '+' : ''}{growthStats.weeklyGrowth} this week
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Trend</h3>
                  <div className="text-center">
                    <div className={`text-3xl font-bold mb-2 ${
                      engagementTrends.trend === 'improving' ? 'text-green-600' :
                      engagementTrends.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {engagementTrends.trend === 'improving' ? '⬆️' :
                       engagementTrends.trend === 'declining' ? '⬇️' : '➡️'}
                    </div>
                    <p className="text-sm text-gray-600 capitalize">{engagementTrends.trend}</p>
                    <p className="text-lg font-semibold mt-2">{engagementTrends.currentEngagement}% current</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Score</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{analytics.data.growthTrend}</div>
                    <p className="text-sm text-gray-600">Out of 10</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(analytics.data.growthTrend / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <LineChart
                  data={analytics.data.historicalData.map(d => ({
                    date: d.date,
                    followersCount: d.followersCount,
                    followingCount: d.followingCount,
                    tweetCount: d.tweetCount,
                    engagementRate: d.engagementRate
                  }))}
                  metric="followersCount"
                  color="#1565C0"
                  title="Followers Growth"
                />

                <LineChart
                  data={analytics.data.historicalData.map(d => ({
                    date: d.date,
                    followersCount: d.followersCount,
                    followingCount: d.followingCount,
                    tweetCount: d.tweetCount,
                    engagementRate: d.engagementRate
                  }))}
                  metric="engagementRate"
                  color="#2E7D32"
                  title="Engagement Rate"
                />
              </div>

              {/* Top Tweet & Recent Tweets */}
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Tweet</h3>
                    {analytics.data.topTweet ? (
                      <TweetCard
                        tweet={{
                          ...analytics.data.topTweet,
                          createdAt: new Date().toISOString(),
                          metrics: {
                            retweets: 0,
                            likes: 0,
                            replies: 0,
                            quotes: 0
                          }
                        }}
                        isTopTweet
                      />
                    ) : (
                      <p className="text-gray-500 text-center py-8">No tweet data available</p>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Tweets</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {analytics.data.tweets.slice(0, 5).map((tweet) => (
                        <TweetCard key={tweet.id} tweet={tweet} />
                      ))}
                      {analytics.data.tweets.length === 0 && (
                        <p className="text-gray-500 text-center py-8">No recent tweets found</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Target className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Growth Rings</h1>
                <p className="text-sm text-gray-600">Visual X (Twitter) growth tracking</p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <Star size={14} />
              FREE Beta
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Turn Your X Growth Into
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Visual Progress Rings
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Add dynamic progress rings around your profile picture that fill up as you hit your X (Twitter) growth goals. 
            Visual motivation that works.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <button
              onClick={navigateToTool}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center gap-2 shadow-lg"
            >
              Create My Growth Ring
              <ArrowRight size={20} />
            </button>
            <button
              onClick={navigateToAnalytics}
              className="bg-white border-2 border-blue-500 text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center gap-2"
            >
              <BarChart3 size={20} />
              View Analytics Demo
            </button>
          </div>
          <p className="text-sm text-gray-500 text-center">No signup required • 100% free</p>
        </div>

        {/* Preview Demo */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
            <div className="grid md:grid-cols-3 gap-8 items-center">
              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiByeD0iNjQiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIzMiIgeT0iMzIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2QjczODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRIOGE0IDQgMCAwIDAtNCA0djIiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+Cjwvc3ZnPgo8L3N2Zz4K" 
                    alt="Profile" 
                    className="w-full h-full rounded-full"
                  />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500" style={{
                    background: `conic-gradient(#1DA1F2 0deg 144deg, transparent 144deg 360deg)`
                  }}></div>
                </div>
                <p className="text-sm font-medium text-gray-600">40% to 10K followers</p>
              </div>

              <div className="text-center">
                <ArrowRight className="w-8 h-8 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-semibold text-gray-900">Set your goal</p>
                <p className="text-sm text-gray-600">Upload image, see progress</p>
              </div>

              <div className="text-center">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                  <img 
                    src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiByeD0iNjQiIGZpbGw9IiNGM0Y0RjYiLz4KPHN2ZyB4PSIzMiIgeT0iMzIiIHdpZHRoPSI2NCIgaGVpZ2h0PSI2NCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM2QjczODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj4KPHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRIOGE0IDQgMCAwIDAtNCA0djIiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+Cjwvc3ZnPgo8L3N2Zz4K" 
                    alt="Profile" 
                    className="w-full h-full rounded-full"
                  />
                  <div className="absolute inset-0 rounded-full border-4 border-green-500" style={{
                    background: `conic-gradient(#17BF63 0deg 360deg, transparent 360deg 360deg)`
                  }}></div>
                  <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Trophy size={16} className="text-yellow-800" />
                  </div>
                </div>
                <p className="text-sm font-medium text-green-600">Goal achieved! 🎉</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Growth Rings Work</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Visual Motivation</h3>
              <p className="text-gray-600">See your progress every day. Visual feedback keeps you motivated and accountable to your goals.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Social Proof</h3>
              <p className="text-gray-600">Your progress becomes visible to everyone. Others see you&apos;re actively working toward growth.</p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Goal Tracking</h3>
              <p className="text-gray-600">Track followers, engagement, or any metric that matters to your X growth strategy.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Visualize Your Growth?</h2>
          <p className="text-xl text-blue-100 mb-8">Join creators who are turning their X growth into visual progress rings</p>
          
          <div className="bg-white rounded-2xl p-8 max-w-md mx-auto">
            {!emailSubmitted ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Get Early Access to Pro Features</h3>

                {emailError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{emailError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setEmailError(null); // Clear error when user types
                    }}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                    disabled={emailLoading}
                    aria-describedby="email-help"
                  />
                  <button
                    type="submit"
                    disabled={emailLoading || !email.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 min-w-[120px]"
                  >
                    {emailLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Joining...
                      </>
                    ) : (
                      <>
                        <Mail size={16} />
                        Notify Me
                      </>
                    )}
                  </button>
                </div>
                <p id="email-help" className="text-xs text-gray-500">
                  Auto X API sync • Advanced analytics • Priority support
                </p>
              </form>
            ) : (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re on the list!</h3>
                <p className="text-gray-600 mb-4">We&apos;ll notify you when Pro features are ready.</p>
                <button
                  onClick={() => {
                    setEmailSubmitted(false);
                    setEmailError(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Sign up another email
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <button
              onClick={navigateToTool}
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl font-semibold text-lg transition-colors inline-flex items-center gap-2"
            >
              Try Free Tool Now
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Target className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold">Growth Rings</span>
          </div>
          <p className="text-gray-400 mb-4">Made with ❤️ for X creators who want to grow</p>
          <div className="text-sm text-gray-500">
            <p>© 2025 Growth Rings. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}