'use client';

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-secondary-100 dark:from-secondary-900 dark:to-secondary-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-secondary-200 dark:bg-secondary-800 flex items-center justify-center mb-6">
            <WifiOff className="w-12 h-12 text-secondary-400" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-3">
            Sin conexión
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400">
            Parece que no tienes conexión a internet. Algunas funciones pueden no estar disponibles.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700">
            <h2 className="font-semibold text-secondary-900 dark:text-white mb-2">
              Funciones disponibles offline:
            </h2>
            <ul className="text-sm text-secondary-600 dark:text-secondary-400 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Ver flashcards guardadas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Revisar notas guardadas
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Ver tu progreso
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-500" />
                Los cambios se sincronizarán al conectar
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Reintentar
            </button>
            <Link
              href="/app"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary-200 dark:bg-secondary-700 text-secondary-700 dark:text-secondary-300 font-medium hover:bg-secondary-300 dark:hover:bg-secondary-600 transition-colors"
            >
              <Home className="w-5 h-5" />
              Ir al inicio
            </Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-secondary-400">
          CampusMind funciona mejor con conexión a internet para acceder a todas las funcionalidades.
        </p>
      </div>
    </div>
  );
}
