'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/context/AuthContext';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const profileComplete = searchParams.get('profileComplete');

    if (!token) {
      console.error('No token received from OAuth callback');
      router.push('/login');
      return;
    }

    // Store token in localStorage
    localStorage.setItem('token', token);

    // Fetch full user data from backend using the token
    const fetchUserData = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        
        // Create complete user object
        const user = {
          id: userData.id?.toString() || '',
          email: userData.email || '',
          name: userData.name || '',
          universityId: userData.universityId || '',
          department: userData.department || '',
          year: userData.year || '',
          phone: userData.phone || '',
          role: userData.role?.toLowerCase() || 'member',
          profileComplete: userData.profileComplete || false,
          approvalStatus: userData.approvalStatus,
          avatar: userData.avatar,
        };

        // Store user in Zustand
        setUser(user);

        // Redirect based on profile completion status
        if (profileComplete === 'false' || !userData.profileComplete) {
          router.push('/complete-profile');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setError('Failed to complete sign in. Please try again.');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    fetchUserData();
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
            <p className="text-gray-500 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthCallbackContent />
    </Suspense>
  );
}
