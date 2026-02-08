'use client';

import { useState, useCallback } from 'react';
import BottomNav from './BottomNav';
import DesktopNav from './DesktopNav';
import MobileDrawer from './MobileDrawer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavigationProps {
  /** Optional guest name to display in the mobile drawer */
  guestName?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Navigation({ guestName }: NavigationProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  return (
    <>
      {/* Desktop: top navigation bar */}
      <DesktopNav />

      {/* Mobile: bottom navigation bar */}
      <BottomNav onMenuToggle={handleMenuToggle} />

      {/* Mobile: full-screen drawer */}
      <MobileDrawer
        isOpen={drawerOpen}
        onClose={handleDrawerClose}
        guestName={guestName}
      />
    </>
  );
}
