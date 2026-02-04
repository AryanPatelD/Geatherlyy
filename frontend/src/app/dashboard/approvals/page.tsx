'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/apiUrl';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [removalRequests, setRemovalRequests] = useState<any[]>([]); // New state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/approvals`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPendingRequests(data.filter((req: any) => req.status === 'PENDING'));
          setApprovedRequests(data.filter((req: any) => req.status === 'APPROVED'));
        }

        // Fetch Removal Requests
        const removalResponse = await fetch(`${apiUrl}/api/removal-requests?status=PENDING`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (removalResponse.ok) {
          const removalData = await removalResponse.json();
          setRemovalRequests(removalData);
        }
      } catch (error) {
        console.error('Failed to fetch approvals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/approvals/${id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      
      if (response.ok) {
        // Refresh data
        const updatedRequest = pendingRequests.find(r => r.id === id);
        setPendingRequests(pendingRequests.filter(r => r.id !== id));
        if (updatedRequest) {
          setApprovedRequests([...approvedRequests, { ...updatedRequest, status: 'APPROVED' }]);
        }
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/approvals/${id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      
      if (response.ok) {
        setPendingRequests(pendingRequests.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleReviewRemoval = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/removal-requests/${id}/review`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (response.ok) {
        setRemovalRequests(removalRequests.filter(r => r.id !== id));
        toast.success(`Request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}`);
      } else {
        toast.error('Failed to review request');
      }
    } catch (error) {
      console.error('Failed to review removal request:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Approval Requests</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="card">
          <p className="text-muted-text text-sm">Pending Approvals</p>
          <p className="text-3xl font-bold text-primary">{pendingRequests.length}</p>
        </div>
        <div className="card">
          <p className="text-muted-text text-sm">Approved</p>
          <p className="text-3xl font-bold text-primary">{approvedRequests.length}</p>
        </div>
        <div className="card">
          <p className="text-muted-text text-sm">Total Requests</p>
          <p className="text-3xl font-bold text-primary">{pendingRequests.length + approvedRequests.length}</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-border">
        {[
          { id: 'pending', label: 'Pending Roles' },
          { id: 'removals', label: 'Removal Requests' },
          { id: 'approved', label: 'History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-text hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pending Requests */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div key={request.id} className="card">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {request.user?.avatar ? (
                      <img 
                        src={request.user.avatar} 
                        alt={request.user?.name} 
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {request.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{request.user?.name || 'Unknown User'}</p>
                      <p className="text-sm text-muted-text">{request.user?.email}</p>
                      <p className="text-xs text-muted-text mt-1">
                        Current Role: {request.user?.role}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      {request.status}
                    </span>
                    <p className="text-xs text-muted-text mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-3 mb-3">
                  <p className="text-sm font-medium mb-1">
                    Requesting: <span className="text-primary">{request.requestedRole}</span>
                    {request.club && (
                      <span className="text-muted-text"> for {request.club.name}</span>
                    )}
                  </p>
                  {request.reason && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-text mb-1">Reason:</p>
                      <p className="text-sm">{request.reason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => handleApprove(request.id)}
                  className="flex-1 btn btn-primary text-sm"
                >
                  ✓ Approve
                </button>
                <button 
                  onClick={() => handleReject(request.id)}
                  className="flex-1 btn btn-outline text-sm"
                >
                  ✗ Reject
                </button>
              </div>
            </div>
          ))}
          {pendingRequests.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-muted-text">No pending approvals</p>
            </div>
          )}
        </div>
      )}

      {/* Removal Requests */}
      {activeTab === 'removals' && (
        <div className="space-y-4">
          {removalRequests.map((request) => (
            <div key={request.id} className="card border-l-4 border-l-red-500">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg mb-1">Removal Request</h3>
                  <p className="text-sm">
                    <strong>Member:</strong> {request.member?.name} ({request.member?.email})
                  </p>
                  <p className="text-sm">
                    <strong>Club:</strong> {request.club?.name}
                  </p>
                  <div className="mt-3 bg-muted/30 p-3 rounded text-sm">
                    <strong>Reason:</strong> {request.reason}
                  </div>
                  <p className="text-xs text-muted-text mt-2">
                    Requested by Coordinator on {new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleReviewRemoval(request.id, 'APPROVED')}
                    className="btn bg-red-600 text-white hover:bg-red-700 text-sm"
                  >
                    Approve Removal
                  </button>
                  <button 
                    onClick={() => handleReviewRemoval(request.id, 'REJECTED')}
                    className="btn btn-outline text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
          {removalRequests.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-muted-text">No pending removal requests</p>
            </div>
          )}
        </div>
      )}

      {/* Approved Requests */}
      {activeTab === 'approved' && (
        <div className="space-y-4">
          {approvedRequests.map((request) => (
            <div key={request.id} className="card border-green-200 dark:border-green-800">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {request.user?.avatar ? (
                    <img 
                      src={request.user.avatar} 
                      alt={request.user?.name} 
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-700 dark:text-green-400 font-bold">
                      {request.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{request.user?.name || 'Unknown User'}</p>
                    <p className="text-sm text-muted-text">{request.user?.email}</p>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                      {request.user?.role} → {request.requestedRole}
                      {request.club && (
                        <span className="text-muted-text"> for {request.club.name}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    ✓ Approved
                  </p>
                  <p className="text-xs text-muted-text mt-1">
                    {request.reviewedAt ? new Date(request.reviewedAt).toLocaleDateString() : new Date(request.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {approvedRequests.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-muted-text">No approved requests yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
