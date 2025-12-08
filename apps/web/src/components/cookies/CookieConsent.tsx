'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Settings, ChevronDown, ChevronUp } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_CONSENT_KEY = 'campusmind-cookie-consent';

export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

export function saveCookiePreferences(preferences: CookiePreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
}

export function hasConsentedToCookies(): boolean {
  return getCookiePreferences() !== null;
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    functional: true,
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const existingPreferences = getCookiePreferences();
    if (!existingPreferences) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    saveCookiePreferences(allAccepted);
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly: CookiePreferences = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    saveCookiePreferences(necessaryOnly);
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    saveCookiePreferences(preferences);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Main Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex-shrink-0">
              <Cookie className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Usamos cookies
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                Utilizamos cookies para mejorar tu experiencia, analizar el tráfico y personalizar contenido.
                Puedes aceptar todas las cookies o personalizar tus preferencias.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAcceptAll}
                  className="px-5 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  Aceptar todas
                </button>
                <button
                  onClick={handleAcceptNecessary}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Solo necesarias
                </button>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-400 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Personalizar
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              onClick={handleAcceptNecessary}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Cookie Details */}
        {showDetails && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
            <div className="space-y-4">
              {/* Necessary Cookies */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Cookies necesarias
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Esenciales para el funcionamiento del sitio. No se pueden desactivar.
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-primary-500 rounded-full opacity-50 cursor-not-allowed" />
                  <div className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition translate-x-5" />
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Cookies funcionales
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Permiten funciones como modo oscuro, preferencias de idioma y configuraciones.
                  </p>
                </div>
                <label className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-checked:bg-primary-500 rounded-full transition-colors" />
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.functional ? 'translate-x-5' : ''}`} />
                </label>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Cookies de análisis
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Nos ayudan a entender cómo usas la plataforma para mejorarla.
                  </p>
                </div>
                <label className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-checked:bg-primary-500 rounded-full transition-colors" />
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.analytics ? 'translate-x-5' : ''}`} />
                </label>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Cookies de marketing
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Permiten mostrar contenido relevante basado en tus intereses.
                  </p>
                </div>
                <label className="relative cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-checked:bg-primary-500 rounded-full transition-colors" />
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${preferences.marketing ? 'translate-x-5' : ''}`} />
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between mt-6">
              <a
                href="/legal/cookies"
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                Ver política de cookies
              </a>
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2.5 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
              >
                Guardar preferencias
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
