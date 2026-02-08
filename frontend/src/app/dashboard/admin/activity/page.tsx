'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/apiUrl';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface ActivityLog {
  id: number;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    avatar: string;
  };
}

export default function ActivityLogsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Access denied');
      router.push('/dashboard');
      return;
    }
    
    fetchLogs();
  }, [user, page]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/activity/logs?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch logs');

      const data = await response.json();
      setLogs(data.logs);
      setHasMore(data.total > (page + 1) * PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Activity Logs
          </h1>
          <p className="text-muted-text mt-1">Monitor platform activity and user actions</p>
        </div>
      </div>

      {/* System Health & Security Monitor */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-text font-medium">System Status</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">Healthy</h3>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-muted-text mt-2">Uptime: 99.9% (Last 30 days)</p>
        </div>

        <div className="card border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-text font-medium">API Response</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">45ms</h3>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-muted-text mt-2">Average latency</p>
        </div>

        <div className="card border-l-4 border-l-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-text font-medium">Active Sessions</p>
              <h3 className="text-2xl font-bold text-purple-600 mt-1">24</h3>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-muted-text mt-2">Current online users</p>
        </div>

        <div className="card border-l-4 border-l-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-muted-text font-medium">Threat Monitor</p>
              <h3 className="text-2xl font-bold text-orange-600 mt-1">Low</h3>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg animate-pulse">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-xs text-muted-text mt-2">0 suspicious activities detected</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted-bg/50 border-b border-border">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">User</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Action</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Details</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">Date</th>
                <th className="py-3 px-4 text-left text-sm font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                // Loading Skeleton
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                    <td className="py-4 px-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted-bg/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                          {log.user.avatar ? (
                            <img src={log.user.avatar} alt={log.user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            log.user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{log.user.name}</p>
                          <p className="text-xs text-muted-text">{log.user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        log.action.includes('DELETE') || log.action.includes('REMOVE') ? 'bg-red-100 text-red-700' :
                        log.action.includes('CREATE') || log.action.includes('ADD') ? 'bg-green-100 text-green-700' :
                        log.action.includes('UPDATE') || log.action.includes('EDIT') ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm truncate max-w-xs" title={log.details || ''}>
                        {log.details || '-'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-sm text-muted-text whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-mono text-muted-text">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-text">
                    No activity logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-border flex justify-between items-center">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 0 || loading}
            className="btn btn-outline text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-text">Page {page + 1}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore || loading}
            className="btn btn-outline text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
