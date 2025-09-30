/**
 * Environment Variables Validation and Type-Safe Access
 *
 * This module provides:
 * - Runtime validation of required environment variables
 * - Type-safe access to environment variables
 * - Helpful error messages for missing variables
 */

interface EnvironmentVariables {
  // X API Configuration
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  X_CALLBACK_URL?: string;
  X_API_BEARER_TOKEN?: string;

  // NextAuth Configuration
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL?: string;

  // Optional: ConvertKit
  CONVERTKIT_API_KEY?: string;
  CONVERTKIT_FORM_ID?: string;

  // Optional: Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID?: string;

  // Node Environment
  NODE_ENV?: string;
}

/**
 * Configuration for environment variables
 */
const envConfig = {
  // Required variables
  required: {
    NEXTAUTH_SECRET: {
      description: 'NextAuth secret for session encryption',
      howToGet: 'Generate with: openssl rand -base64 32',
    },
  },

  // Optional but recommended variables
  recommended: {
    X_API_BEARER_TOKEN: {
      description: 'X API Bearer Token for authentication',
      howToGet: 'Get from https://developer.x.com/en/portal/dashboard',
    },
    X_CLIENT_ID: {
      description: 'X API OAuth Client ID',
      howToGet: 'Get from https://developer.x.com/en/portal/dashboard',
    },
    X_CLIENT_SECRET: {
      description: 'X API OAuth Client Secret',
      howToGet: 'Get from https://developer.x.com/en/portal/dashboard',
    },
  },
};

/**
 * Validates required environment variables
 * Throws detailed errors if required variables are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];
  const recommendations: string[] = [];

  // Check required variables
  Object.entries(envConfig.required).forEach(([key, config]) => {
    if (!process.env[key]) {
      missing.push(
        `\n❌ Missing required: ${key}\n   ${config.description}\n   💡 ${config.howToGet}`
      );
    }
  });

  // Check recommended variables
  Object.entries(envConfig.recommended).forEach(([key, config]) => {
    if (!process.env[key]) {
      recommendations.push(
        `\n⚠️  Recommended: ${key}\n   ${config.description}\n   💡 ${config.howToGet}`
      );
    }
  });

  // Throw error if required variables are missing
  if (missing.length > 0) {
    throw new Error(
      `\n${'='.repeat(80)}\n` +
      `ENVIRONMENT CONFIGURATION ERROR\n` +
      `${'='.repeat(80)}\n` +
      missing.join('\n') +
      `\n\n📝 Create a .env.local file with these variables\n` +
      `   See .env.local.example for a template\n` +
      `${'='.repeat(80)}\n`
    );
  }

  // Log recommendations in development
  if (recommendations.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `\n${'='.repeat(80)}\n` +
      `ENVIRONMENT RECOMMENDATIONS\n` +
      `${'='.repeat(80)}` +
      recommendations.join('\n') +
      `\n\n📝 Add these to .env.local for full functionality\n` +
      `${'='.repeat(80)}\n`
    );
  }
}

/**
 * Type-safe environment variable access
 */
export const env: EnvironmentVariables = {
  // X API Configuration
  X_CLIENT_ID: process.env.X_CLIENT_ID,
  X_CLIENT_SECRET: process.env.X_CLIENT_SECRET,
  X_CALLBACK_URL: process.env.X_CALLBACK_URL,
  X_API_BEARER_TOKEN: process.env.X_API_BEARER_TOKEN,

  // NextAuth Configuration
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,

  // Optional: ConvertKit
  CONVERTKIT_API_KEY: process.env.CONVERTKIT_API_KEY,
  CONVERTKIT_FORM_ID: process.env.CONVERTKIT_FORM_ID,

  // Optional: Analytics
  NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,

  // Node Environment
  NODE_ENV: process.env.NODE_ENV,
};

/**
 * Client-safe environment variables
 * Only includes NEXT_PUBLIC_ prefixed variables
 */
export const clientEnv = {
  GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  NODE_ENV: process.env.NODE_ENV,
};

/**
 * Helper to check if running in production
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Helper to check if running in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Helper to check if X API is configured
 */
export const isXApiConfigured = Boolean(
  env.X_API_BEARER_TOKEN || (env.X_CLIENT_ID && env.X_CLIENT_SECRET)
);

/**
 * Helper to check if ConvertKit is configured
 */
export const isConvertKitConfigured = Boolean(
  env.CONVERTKIT_API_KEY && env.CONVERTKIT_FORM_ID
);

/**
 * Helper to get the base URL
 */
export const getBaseUrl = (): string => {
  if (env.NEXTAUTH_URL) return env.NEXTAUTH_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

// Run validation on import (only in Node.js environment)
if (typeof window === 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    // In development, log the error but don't crash
    if (isDevelopment) {
      console.error(error);
    } else {
      // In production, throw the error
      throw error;
    }
  }
}