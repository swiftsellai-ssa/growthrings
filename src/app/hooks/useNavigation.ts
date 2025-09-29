import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';

export function useNavigation() {
  const { state, navigateTo } = useApp();

  const navigateToTool = useCallback(() => {
    navigateTo('tool');
  }, [navigateTo]);

  const navigateToAnalytics = useCallback(() => {
    navigateTo('analytics');
  }, [navigateTo]);

  const navigateToHome = useCallback(() => {
    navigateTo('landing');
  }, [navigateTo]);

  return {
    currentView: state.currentView,
    navigateToTool,
    navigateToAnalytics,
    navigateToHome,
  };
}