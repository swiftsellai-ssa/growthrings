/**
 * Logout Button Component
 *
 * Provides a button to sign out and clear authentication tokens.
 * Revokes tokens with X API and clears httpOnly cookies.
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'text' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  showIcon = true,
  children,
}) => {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even on error
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
    text: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-800',
    icon: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full p-2 focus:ring-gray-500 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const roundedClass = variant === 'icon' ? 'rounded-full' : 'rounded-lg';

  if (variant === 'icon') {
    return (
      <button
        onClick={handleLogout}
        disabled={isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${roundedClass}`}
        aria-label="Sign out"
        title="Sign out"
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <LogOut className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${roundedClass}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Signing out...</span>
        </>
      ) : (
        <>
          {showIcon && <LogOut className="h-5 w-5" aria-hidden="true" />}
          <span>{children || 'Sign out'}</span>
        </>
      )}
    </button>
  );
};

/**
 * Compact logout button for use in headers/navbars
 */
export const CompactLogoutButton: React.FC = () => {
  return (
    <LogoutButton variant="text" size="sm" showIcon={true}>
      Sign out
    </LogoutButton>
  );
};

/**
 * Icon-only logout button
 */
export const IconLogoutButton: React.FC = () => {
  return <LogoutButton variant="icon" showIcon={true} />;
};

/**
 * Logout menu item for use in dropdown menus
 */
export const LogoutMenuItem: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      await signOut();
      onClick?.();
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
      role="menuitem"
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <LogOut className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{isLoading ? 'Signing out...' : 'Sign out'}</span>
    </button>
  );
};

export default LogoutButton;