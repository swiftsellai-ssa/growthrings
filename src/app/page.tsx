'use client';

import React from 'react';
import { AppProvider } from './contexts/AppContext';
import GrowthRingsApp from './GrowthRingsApp';

export default function Page() {
  return (
    <AppProvider>
      <GrowthRingsApp />
    </AppProvider>
  );
}