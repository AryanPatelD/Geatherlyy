'use client';

import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { useInitializeAuth } from '@/context/AuthContext';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';
import { QuizProvider, useQuizContext } from '@/context/QuizContext';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/context/AuthContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  useInitializeAuth();
  const { user, initialized } = useAuthStore();
  const { isQuizInProgress } = useQuizContext();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (initialized && user && !user.profileComplete) {
      if (pathname !== '/complete-profile') {
        router.push('/complete-profile');
      }
    }
  }, [user, initialized, router, pathname]);

  // Hide sidebar completely when quiz is in progress
  if (isQuizInProgress) {
    return (
      <div className="flex h-screen w-full max-w-[100vw] overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-hide md:scrollbar-default bg-gray-50 dark:bg-gray-900 w-full">
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full max-w-[100vw] overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-hide md:scrollbar-default bg-gray-50 dark:bg-gray-900 w-full p-4 md:p-6">
          <ChangePasswordModal />
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QuizProvider>
      <DashboardContent>{children}</DashboardContent>
    </QuizProvider>
  );
}
