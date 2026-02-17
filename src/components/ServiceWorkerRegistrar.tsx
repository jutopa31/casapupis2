'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Silent fail — SW is optional, only needed for install prompt
      });
    }
  }, []);

  return null;
}
