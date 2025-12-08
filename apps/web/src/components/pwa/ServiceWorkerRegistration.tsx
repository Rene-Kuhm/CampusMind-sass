'use client';

import { useEffect, useState } from 'react';
import { Download, X, RefreshCw } from 'lucide-react';

export function ServiceWorkerRegistration() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('SW registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      } catch (error) {
        console.error('SW registration failed:', error);
      }
    };

    registerSW();

    // Listen for beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Only show if not already installed and not dismissed recently
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 7 * 24 * 60 * 60 * 1000) {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA installed');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // @ts-expect-error - prompt exists on BeforeInstallPromptEvent
    await deferredPrompt.prompt();
    // @ts-expect-error - userChoice exists on BeforeInstallPromptEvent
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  const handleUpdate = () => {
    window.location.reload();
  };

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {/* Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-secondary-800 rounded-2xl shadow-xl border border-secondary-200 dark:border-secondary-700 p-4 z-50 animate-fade-in-up">
          <button
            onClick={handleDismissInstall}
            className="absolute top-3 right-3 p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-secondary-900 dark:text-white">
                Instalar CampusMind
              </h3>
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                Instala la app para acceso rápido y funcionamiento offline.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleInstall}
                  className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
                >
                  Instalar
                </button>
                <button
                  onClick={handleDismissInstall}
                  className="px-4 py-2 rounded-lg text-secondary-600 dark:text-secondary-400 text-sm font-medium hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                >
                  Ahora no
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Prompt */}
      {showUpdatePrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-secondary-800 rounded-2xl shadow-xl border border-secondary-200 dark:border-secondary-700 p-4 z-50 animate-fade-in-up">
          <button
            onClick={handleDismissUpdate}
            className="absolute top-3 right-3 p-1 text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-300"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-secondary-900 dark:text-white">
                Nueva versión disponible
              </h3>
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
                Hay una actualización disponible. Recarga para obtener las últimas mejoras.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  Actualizar
                </button>
                <button
                  onClick={handleDismissUpdate}
                  className="px-4 py-2 rounded-lg text-secondary-600 dark:text-secondary-400 text-sm font-medium hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
                >
                  Más tarde
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
