'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect from old /app/pomodoro to new /app/timer
 * Keeping this for backwards compatibility
 */
export default function PomodoroRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app/timer');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4" />
        <p className="text-secondary-600">Redirigiendo al temporizador...</p>
      </div>
    </div>
  );
}
