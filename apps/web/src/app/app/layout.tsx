'use client';

import { useRequireAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/layout';
import { LoadingScreen } from '@/components/ui';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useRequireAuth();

  if (isLoading) {
    return <LoadingScreen message="Cargando tu espacio de estudio..." />;
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useRequireAuth
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <Sidebar />
      <main className="ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
