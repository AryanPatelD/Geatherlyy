'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/apiUrl';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('Connecting securely...');

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

    // Animate status text
    const statusMessages = [
      'Connecting securely...',
      'Verifying your account...',
      'Setting up your session...',
      'Almost there...',
    ];
    let messageIndex = 0;
    const statusInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % statusMessages.length;
      setStatusText(statusMessages[messageIndex]);
    }, 1500);

    // Fetch full user data from backend using the token
    const fetchUserData = async () => {
      try {
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/auth/me`, {
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

        setStatusText('Welcome! Redirecting...');

        // Small delay so the user sees the success state
        await new Promise(resolve => setTimeout(resolve, 500));

        clearInterval(statusInterval);

        // Redirect based on profile completion status
        if (profileComplete === 'false' || !userData.profileComplete) {
          router.push('/complete-profile');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        clearInterval(statusInterval);
        setError('Failed to complete sign in. Please try again.');
        setTimeout(() => router.push('/login'), 2000);
      }
    };

    fetchUserData();

    return () => clearInterval(statusInterval);
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/5 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 p-8 max-w-md w-full">
        {error ? (
          /* Error State */
          <div className="flex flex-col items-center gap-6 animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="text-center space-y-2">
              <p className="text-red-400 font-semibold text-lg">{error}</p>
              <p className="text-slate-500 text-sm">Redirecting to login...</p>
            </div>
          </div>
        ) : (
          /* Loading State — Premium skeleton / animation */
          <div className="flex flex-col items-center gap-8 w-full">
            {/* Brand Logo */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center overflow-hidden p-2 shadow-2xl">
                <img src="/brand-logo.png" alt="Getherlyy" className="w-full h-full object-contain" />
              </div>
              {/* Pulsing ring around the logo */}
              <div className="absolute inset-0 -m-2 rounded-2xl border-2 border-orange-500/30 animate-ping" style={{ animationDuration: '2s' }} />
            </div>

            {/* Custom Spinner */}
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700/50" />
              <div
                className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 border-r-orange-500/50"
                style={{
                  animation: 'spin 1s linear infinite',
                }}
              />
              <div
                className="absolute inset-1 rounded-full border-4 border-transparent border-b-amber-500 border-l-amber-500/50"
                style={{
                  animation: 'spin 1.5s linear infinite reverse',
                }}
              />
            </div>

            {/* Status Text */}
            <div className="text-center space-y-3">
              <p className="text-white font-semibold text-lg transition-all duration-300">
                {statusText}
              </p>
              <p className="text-slate-500 text-sm">
                Signing you in with Google
              </p>
            </div>

            {/* Skeleton Card — mimics the dashboard being loaded */}
            <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-4 mt-4">
              {/* Skeleton header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-700/80 animate-pulse" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 bg-slate-700/80 rounded-full w-2/3 animate-pulse" />
                  <div className="h-2 bg-slate-700/60 rounded-full w-1/3 animate-pulse" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
              {/* Skeleton content lines */}
              <div className="space-y-3 pt-2">
                <div className="h-2.5 bg-slate-700/60 rounded-full w-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                <div className="h-2.5 bg-slate-700/60 rounded-full w-5/6 animate-pulse" style={{ animationDelay: '0.4s' }} />
                <div className="h-2.5 bg-slate-700/60 rounded-full w-4/6 animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              {/* Skeleton stats */}
              <div className="grid grid-cols-3 gap-3 pt-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="bg-slate-700/40 rounded-xl p-3 space-y-2">
                    <div className="h-4 bg-slate-600/60 rounded w-1/2 mx-auto animate-pulse" style={{ animationDelay: `${0.6 + i * 0.15}s` }} />
                    <div className="h-2 bg-slate-600/40 rounded w-3/4 mx-auto animate-pulse" style={{ animationDelay: `${0.7 + i * 0.15}s` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-orange-500/60"
                  style={{
                    animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Inline styles for animations */}
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

/* Full-page loading skeleton shown as the Suspense fallback */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center overflow-hidden p-2 shadow-2xl">
          <img src="/brand-logo.png" alt="Getherlyy" className="w-full h-full object-contain" />
        </div>
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 animate-pulse">Loading...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
