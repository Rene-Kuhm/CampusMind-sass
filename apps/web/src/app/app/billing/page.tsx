'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/app/settings/billing');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg animate-pulse">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-xl animate-pulse" />
        </div>
        <p className="mt-6 text-secondary-500 font-medium">Redirigiendo...</p>
      </div>
    </div>
  );
}
