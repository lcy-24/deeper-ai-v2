// ============================================================
// Main Entry Point
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom/client';
import AppShell from '@/components/AppShell';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  </React.StrictMode>,
);