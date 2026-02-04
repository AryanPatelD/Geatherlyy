'use client';

import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { useInitializeAuth } from '@/context/AuthContext';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/context/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useInitializeAuth();
  const { user, initialized } = useAuthStore();
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
