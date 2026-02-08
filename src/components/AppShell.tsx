'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import AccessCodeModal from '@/components/auth/AccessCodeModal';
import Navigation from '@/components/navigation/Navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <AccessCodeModal />
      {isAuthenticated && <Navigation />}
      <main className={isAuthenticated ? 'pb-20 md:pb-0 md:pt-16' : ''}>
        {children}
      </main>
    </>
  );
}
