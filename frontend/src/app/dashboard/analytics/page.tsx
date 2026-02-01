'use client';

import { useAuthStore } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !['faculty', 'admin'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/analytics', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!user || !['faculty', 'admin'].includes(user.role)) {
    return (
      <div className="p-8">
        <p className="text-muted-text">Access denied. This page is for faculty and admins only.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Platform Analytics</h1>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <p className="text-muted-text text-sm">Total Users</p>
          <p className="text-3xl font-bold text-primary">{analytics?.totalUsers || 0}</p>
          <p className="text-xs text-green-600 mt-2">{analytics?.userGrowth || '0%'} this month</p>
        </div>
        <div className="card">
          <p className="text-muted-text text-sm">Active Clubs</p>
          <p className="text-3xl font-bold text-primary">{analytics?.activeClubs || 0}</p>
          <p className="text-xs text-green-600 mt-2">{analytics?.newClubs || 0} new clubs</p>
        </div>
        <div className="card">
          <p className="text-muted-text text-sm">Total Activities</p>
          <p className="text-3xl font-bold text-primary">{analytics?.totalActivities || 0}</p>
          <p className="text-xs text-muted-text mt-2">Avg attendance: {analytics?.avgAttendance || 0}%</p>
        </div>
        <div className="card">
          <p className="text-muted-text text-sm">Engagement Rate</p>
          <p className="text-3xl font-bold text-primary">{analytics?.engagementRate || 0}%</p>
          <p className="text-xs text-green-600 mt-2">{analytics?.engagementChange || '0%'} vs last week</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* User Growth */}
        <div className="card">
          <h3 className="font-bold mb-4">User Growth (Last 30 Days)</h3>
          <div className="h-64 bg-muted-bg rounded flex items-center justify-center">
            <p className="text-muted-text">[Chart Placeholder]</p>
          </div>
        </div>

        {/* Quiz Analytics */}
        <div className="card">
          <h3 className="font-bold mb-4">Quiz Completion Rate</h3>
          <div className="h-64 bg-muted-bg rounded flex items-center justify-center">
            <p className="text-muted-text">[Chart Placeholder]</p>
          </div>
        </div>

        {/* Top Clubs */}
        <div className="card">
          <h3 className="font-bold mb-4">Top Performing Clubs</h3>
          <table className="w-full text-sm">
            <tbody>
              {analytics?.topClubs?.map((club: any, index: number) => (
                <tr key={club.id} className="border-b border-border hover:bg-muted-bg">
                  <td className="py-2">{index + 1}.</td>
                  <td className="py-2 font-medium">{club.name}</td>
                  <td className="py-2 text-right text-muted-text">{club.members}</td>
                </tr>
              ))}
              {(!analytics?.topClubs || analytics.topClubs.length === 0) && (
                 <tr><td colSpan={3} className="text-center py-4 text-muted-text">No data available</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Member Status */}
        <div className="card">
          <h3 className="font-bold mb-4">Member Status Distribution</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Active</span>
                <span className="font-semibold">856 (69%)</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '69%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Inactive</span>
                <span className="font-semibold">265 (21%)</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '21%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Pending</span>
                <span className="font-semibold">124 (10%)</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="card">
        <h3 className="font-bold mb-4">System Health</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-text">API Response Time</p>
            <p className="font-bold text-green-600">45ms</p>
          </div>
          <div>
            <p className="text-muted-text">Server Uptime</p>
            <p className="font-bold text-green-600">99.9%</p>
          </div>
          <div>
            <p className="text-muted-text">Database Queries</p>
            <p className="font-bold text-blue-600">1,234/min</p>
          </div>
          <div>
            <p className="text-muted-text">Active Sessions</p>
            <p className="font-bold text-primary">487</p>
          </div>
        </div>
      </div>
    </div>
  );
}
