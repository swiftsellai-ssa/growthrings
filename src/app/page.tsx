'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Target, Users, TrendingUp, Zap, Download, Upload, Settings, Trophy, CheckCircle, Sparkles, Star, ArrowRight, Mail } from 'lucide-react';

export default function GrowthRingsApp() {
  const [showTool, setShowTool] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Tool state
  const [currentFollowers, setCurrentFollowers] = useState(2500);
  const [targetFollowers, setTargetFollowers] = useState(10000);
  const [profileImage, setProfileImage] = useState(null);
  const [goalType, setGoalType] = useState('followers');
  const [timeframe, setTimeframe] = useState('3months');
  const [ringStyle, setRingStyle] = useState('classic');
  const [showCanvas, setShowCanvas] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const goalTypes = {
    followers: { icon: Users, label: 'Followers', color: '#1DA1F2', format: (val) => val.toLocaleString() },
    engagement: { icon: TrendingUp, label: 'Engagement Rate', color: '#17BF63', suffix: '%', format: (val) => val.toFixed(1) },
    tweets: { icon: Zap, label: 'Monthly Tweets', color: '#8B5CF6', format: (val) => val.toString() }
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
  const currentGoal = goalTypes[goalType];

  const generateRingOverlay = async () => {
    if (!profileImage) return;
    
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = 400;
    
    canvas.width = size;
    canvas.height = size;

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 25, 0, 2 * Math.PI);
    ctx.clip();
    
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
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
      const endAngle = startAngle + (progressPercentage / 100) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      
      if (ringStyles[ringStyle].gradient) {
        const gradient = ctx.createLinearGradient(0, 0, size, size);
        gradient.addColorStop(0, currentGoal.color);
        gradient.addColorStop(1, currentGoal.color + '80');
        ctx.strokeStyle = gradient;
      } else {
        ctx.strokeStyle = currentGoal.color;
      }
      
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      
      if (ringStyles[ringStyle].glow) {
        ctx.shadowColor = currentGoal.color;
        ctx.shadowBlur = 15;
      }
      
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Add percentage text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`${Math.round(progressPercentage)}%`, centerX, centerY + 10);
      ctx.fillText(`${Math.round(progressPercentage)}%`, centerX, centerY + 10);
      
      // Add goal label
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(currentGoal.label.toUpperCase(), centerX, centerY + 40);
      
      // Achievement badge if goal reached
      if (progressPercentage >= 100) {
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
    };
    img.src = profileImage;
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Please choose an image smaller than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
        setShowCanvas(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `growth-ring-${goalType}-${Math.round(progressPercentage)}%-${timestamp}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Here you would normally send to your email service
      // For now, we'll just show success
      setEmailSubmitted(true);
      console.log('Email submitted:', email);
    }
  };

  useEffect(() => {
    if (profileImage) {
      generateRingOverlay();
    }
  }, [profileImage, currentFollowers, targetFollowers, goalType, progressPercentage, ringStyle]);

  const getMotivationalMessage = () => {
    if (progressPercentage >= 100) return "🎉 Goal smashed! Time to level up!";
    if (progressPercentage >= 75) return "💪 Almost there! Keep pushing!";
    if (progressPercentage >= 50) return "🚀 Halfway there! Great momentum!";
    if (progressPercentage >= 25) return "📈 Great start! Keep it up!";
    return "🌱 Every expert was once a beginner!";
  };

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
              <button
                onClick={() => setShowTool(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Home
              </button>
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Growth Metric</label>
                  <div className="space-y-2">
                    {Object.entries(goalTypes).map(([key, goal]) => (
                      <button
                        key={key}
                        onClick={() => setGoalType(key)}
                        className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          goalType === key 
                            ? `border-blue-500 bg-blue-50 text-blue-700` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <goal.icon size={18} style={{ color: goal.color }} />
                        <span className="font-medium">{goal.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Values */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current</label>
                    <input
                      type="number"
                      value={currentFollowers}
                      onChange={(e) => setCurrentFollowers(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
                    <input
                      type="number"
                      value={targetFollowers}
                      onChange={(e) => setTargetFollowers(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Timeframe */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(timeframes).map(([key, frame]) => (
                      <option key={key} value={key}>{frame.label}</option>
                    ))}
                  </select>
                </div>

                {/* Ring Style */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ring Style</label>
                  <select
                    value={ringStyle}
                    onChange={(e) => setRingStyle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(ringStyles).map(([key, style]) => (
                      <option key={key} value={key}>{style.name}</option>
                    ))}
                  </select>
                </div>

                {/* Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors flex items-center justify-center gap-2 text-gray-600"
                  >
                    <Upload size={20} />
                    {profileImage ? 'Change Image' : 'Upload Your Profile Picture'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Your Growth Ring</h3>
                  {showCanvas && (
                    <button
                      onClick={downloadImage}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  )}
                </div>
                
                {!profileImage ? (
                  <div className="flex flex-col items-center justify-center h-80 border-2 border-dashed border-gray-300 rounded-lg">
                    <Upload className="text-gray-400 mb-4" size={48} />
                    <p className="text-gray-600 text-center text-lg font-medium mb-2">
                      Upload your profile picture
                    </p>
                    <p className="text-gray-500 text-center">
                      See your growth progress as a visual ring
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
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
                      />
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto">
                      <p className="text-sm font-medium text-gray-900 mb-2">{getMotivationalMessage()}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${progressPercentage}%`,
                            backgroundColor: currentGoal.color 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => setShowTool(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center gap-2 shadow-lg"
            >
              Create My Growth Ring
              <ArrowRight size={20} />
            </button>
            <p className="text-sm text-gray-500">No signup required • 100% free</p>
          </div>
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
              <p className="text-gray-600">Your progress becomes visible to everyone. Others see you're actively working toward growth.</p>
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
                <div className="flex gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Mail size={16} />
                    Notify Me
                  </button>
                </div>
                <p className="text-xs text-gray-500">Auto X API sync • Advanced analytics • Priority support</p>
              </form>
            ) : (
              <div className="text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">You're on the list!</h3>
                <p className="text-gray-600">We'll notify you when Pro features are ready.</p>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => setShowTool(true)}
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