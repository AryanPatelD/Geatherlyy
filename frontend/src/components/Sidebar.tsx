'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/apiUrl';
import {
  DashboardIcon,
  MagnifyingGlassIcon,
  Component1Icon,
  PlusCircledIcon,
  GearIcon,
  CheckCircledIcon,
  BarChartIcon,
  PersonIcon,
  RocketIcon,
  FileTextIcon,
  BarChartIcon as TrophyIcon,
  Cross2Icon
} from '@radix-ui/react-icons';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [isCoordinator, setIsCoordinator] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname]);

  // Check if user is a coordinator
  useEffect(() => {
    const checkCoordinatorStatus = async () => {
      if (!user) return;

      // Admin always has access
      if (user.role === 'admin') {
        setIsCoordinator(true);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/clubs/managed`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setIsCoordinator(data.length > 0);
        }
      } catch (error) {
        console.error('Error checking coordinator status:', error);
      }
    };

    checkCoordinatorStatus();
  }, [user]);

  const menuItems: { label: string; href: string; roles: string[]; icon: React.ReactNode }[] = [
    { label: 'Dashboard', href: '/dashboard', roles: ['member', 'coordinator', 'faculty', 'admin'], icon: <DashboardIcon className="w-5 h-5" /> },
    { label: 'Discover', href: '/dashboard/discover', roles: ['member', 'coordinator', 'faculty', 'admin'], icon: <MagnifyingGlassIcon className="w-5 h-5" /> },
    { label: 'Quizzes', href: '/dashboard/quizzes', roles: ['member', 'coordinator', 'faculty', 'admin'], icon: <FileTextIcon className="w-5 h-5" /> },
    { label: 'Leaderboard', href: '/dashboard/leaderboard', roles: ['member', 'coordinator', 'faculty', 'admin'], icon: <TrophyIcon className="w-5 h-5" /> },
    { label: 'My Hub', href: '/dashboard/coordinators', roles: ['coordinator', 'admin'], icon: <RocketIcon className="w-5 h-5" /> },
    { label: 'Create Club', href: '/dashboard/create-club', roles: ['faculty', 'admin'], icon: <PlusCircledIcon className="w-5 h-5" /> },
    { label: 'Create Activity', href: '/dashboard/activities/create', roles: ['coordinator', 'admin'], icon: <PlusCircledIcon className="w-5 h-5" /> },
    { label: 'Manage Club', href: '/dashboard/manage', roles: ['coordinator', 'admin'], icon: <GearIcon className="w-5 h-5" /> },
    { label: 'Approvals', href: '/dashboard/approvals', roles: ['faculty', 'admin'], icon: <CheckCircledIcon className="w-5 h-5" /> },
    { label: 'Analytics', href: '/dashboard/analytics', roles: ['faculty', 'admin'], icon: <BarChartIcon className="w-5 h-5" /> },
    { label: 'Profile', href: '/dashboard/profile', roles: ['member', 'coordinator', 'faculty', 'admin'], icon: <PersonIcon className="w-5 h-5" /> },
  ];

  const settingsItem = { label: 'Settings', href: '/dashboard/settings', roles: ['member', 'coordinator', 'faculty', 'admin'], icon: <GearIcon className="w-5 h-5" /> };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-[100dvh] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700
        flex flex-col shadow-xl transition-transform duration-300 ease-in-out
        md:translate-x-0 md:static md:h-screen md:shadow-sm
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">Gatherly</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
          >
            <Cross2Icon className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const hasRoleAccess = user && item.roles.includes(user.role);
            const hasCoordinatorAccess = (item.label === 'Manage Club' || item.label === 'My Hub') && isCoordinator && user?.role !== 'faculty';
            const hasActivityAccess = (item.label === 'Create Activity') && isCoordinator;

            if (!user || !(hasRoleAccess || hasCoordinatorAccess || hasActivityAccess)) {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${pathname === item.href
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
                  }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Settings at Bottom */}
        {user && settingsItem.roles.includes(user.role) && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href={settingsItem.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${pathname === settingsItem.href
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm'
                }`}
            >
              {settingsItem.icon}
              <span>{settingsItem.label}</span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
