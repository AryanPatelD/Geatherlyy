'use client';

import { useAuthStore } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { RocketIcon, PersonIcon, CalendarIcon, ReaderIcon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { getApiUrl } from '@/lib/apiUrl';

export default function CoordinatorsPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClubs: 0,
    totalMembers: 0,
    upcomingActivities: 0,
  });

  useEffect(() => {
    const fetchManagedClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/clubs/managed`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setClubs(data);
          
          // Calculate stats
          const totalMembers = data.reduce((sum: number, club: any) => sum + (club.memberCount || 0), 0);
          const upcomingActivities = data.reduce((sum: number, club: any) => 
            sum + (club.activities?.filter((a: any) => new Date(a.startDate) > new Date()).length || 0), 0
          );
          
          setStats({
            totalClubs: data.length,
            totalMembers,
            upcomingActivities,
          });
        }
      } catch (error) {
        console.error('Failed to fetch managed clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchManagedClubs();
    }
  }, [user]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
            You are not a coordinator in any event
          </h2>
          <p className="text-yellow-700 dark:text-yellow-300">
            Apply to be a coordinator for a club to get access to this hub.
          </p>
          <Link 
            href="/dashboard" 
            className="mt-4 inline-block px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <RocketIcon className="w-8 h-8 text-primary" />
            My Hub
          </h1>
          <p className="text-muted-text">Manage the clubs you coordinate</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-text mb-1">Total Clubs</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalClubs}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <RocketIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-text mb-1">Total Members</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.totalMembers}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <PersonIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-text mb-1">Upcoming Activities</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{stats.upcomingActivities}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Clubs Grid */}
        <div>
          <h2 className="text-xl font-bold mb-4">Your Clubs</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-text">Loading clubs...</p>
            </div>
          ) : clubs.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-border">
              <RocketIcon className="w-16 h-16 mx-auto mb-4 text-muted-text opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No Clubs Yet</h3>
              <p className="text-muted-text mb-6">You're not coordinating any clubs yet. Apply to be a coordinator for existing clubs.</p>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium inline-block"
              >
                Browse Clubs
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clubs.map((club) => (
                <div
                  key={club.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all group"
                >
                  {/* Club Image */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20">
                    {club.imageUrl ? (
                      <img
                        src={club.imageUrl}
                        alt={club.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                        🎯
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                        COORDINATOR
                      </span>
                    </div>
                  </div>

                  {/* Club Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                        {club.name}
                      </h3>
                      <p className="text-sm text-muted-text line-clamp-2">
                        {club.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-muted-text">
                        <PersonIcon className="w-4 h-4" />
                        <span>{club.memberCount || 0} members</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-text">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{club.activities?.length || 0} activities</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/dashboard/manage?clubId=${club.id}`}
                        className="flex-1 text-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                      >
                        Manage Club
                      </Link>
                      <Link
                        href={`/dashboard/activities/create?clubId=${club.id}`}
                        className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors text-sm font-medium"
                      >
                        Add Activity
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
