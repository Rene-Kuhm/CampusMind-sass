'use client';

import { useState } from 'react';
import { useRequireAuth } from '../../lib/auth-context';
import { Sidebar } from '../../components/layout';
import { LoadingScreen } from '../../components/ui';
import Header from '../../components/layout/header';
import { Sparkles } from 'lucide-react';
import { OnboardingModal } from '../../components/onboarding/OnboardingModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl gradient-primary animate-pulse-glow mx-auto mb-6 flex items-center justify-center shadow-2xl">
              <Sparkles className="h-10 w-10 text-white animate-bounce-subtle" />
            </div>
            <div className="absolute -inset-4 bg-primary-500/20 rounded-3xl blur-2xl animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">CampusMind</h2>
          <p className="text-secondary-500 animate-pulse">Cargando tu espacio de estudio...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useRequireAuth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[40%] -right-[20%] w-[80%] h-[80%] bg-primary-500/[0.02] rounded-full blur-3xl" />
        <div className="absolute -bottom-[40%] -left-[20%] w-[80%] h-[80%] bg-violet-500/[0.02] rounded-full blur-3xl" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-secondary-900/40"></div>
        </div>
      )}

      {/* Sidebar - Mobile */}
      <div className={`
        lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-all duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-72 relative">
        {/* Top header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Page content */}
        <main className="flex-1 relative">
          {children}
        </main>
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal />
    </div>
  );
}
