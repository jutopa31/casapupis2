'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type IOSWindow = Window & { MSStream?: unknown };
type IOSNavigator = Navigator & { standalone?: boolean };

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !(window as IOSWindow).MSStream;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(ios);

    // Check if already running as standalone (installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as IOSNavigator).standalone === true
    ) {
      setIsInstalled(true);
      return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }, [deferredPrompt]);

  return {
    /** True if the native install prompt is available (Android/Chrome) */
    canInstall: deferredPrompt !== null,
    /** True if the app is already installed as standalone */
    isInstalled,
    /** True if the device is iOS (needs manual instructions) */
    isIOS,
    /** Trigger the native install prompt (Android/Chrome) */
    promptInstall,
  };
}
