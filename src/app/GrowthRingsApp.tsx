'use client';

import React from 'react';
import { useNavigation } from './hooks/useNavigation';
import { LandingPage, ToolView, AnalyticsDashboard } from './components';

export default function GrowthRingsApp() {
  const { currentView } = useNavigation();

  const renderView = () => {
    switch (currentView) {
      case 'tool':
        return <ToolView />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'landing':
      default:
        return <LandingPage />;
    }
  };

  return <>{renderView()}</>;
}