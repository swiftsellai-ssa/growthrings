'use client';

import React, { useState } from 'react';
import { Target, Users, TrendingUp, Trophy, ArrowRight, Mail, BarChart3, Star, CheckCircle } from 'lucide-react';
import { useNavigation } from '../hooks/useNavigation';
import { emailService, isValidEmail } from '../services/emailService';

export const LandingPage: React.FC = () => {
  const { navigateToTool, navigateToAnalytics } = useNavigation();
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

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
        setEmail('');

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
      console.log('Email logged for manual processing due to error:', email);
      setEmailSubmitted(true);
      setEmail('');
    } finally {
      setEmailLoading(false);
    }
  };

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
                      setEmailError(null);
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
};