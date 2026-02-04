'use client';

import { useAuthStore } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation';
import { ExitIcon, MoonIcon, SunIcon } from '@radix-ui/react-icons';
import { useState } from 'react';

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-text">Manage your account settings and preferences</p>
        </div>

        {/* User Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-semibold shadow-lg">
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold">{user?.name}</p>
                <p className="text-sm text-muted-text">{user?.email}</p>
                <span className="inline-block mt-1 px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary capitalize">
                  {user?.role}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-sm text-muted-text">University ID</p>
                <p className="font-medium">{user?.universityId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-text">Department</p>
                <p className="font-medium">{user?.department}</p>
              </div>
              {user?.year && (
                <div>
                  <p className="text-sm text-muted-text">Year</p>
                  <p className="font-medium">{user?.year}</p>
                </div>
              )}
              {user?.phone && (
                <div>
                  <p className="text-sm text-muted-text">Phone</p>
                  <p className="font-medium">{user?.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium mb-1">Theme</p>
              <p className="text-sm text-muted-text">Choose your preferred theme</p>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-200 dark:border-red-800"
            >
              <ExitIcon className="w-5 h-5" />
              {loggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
