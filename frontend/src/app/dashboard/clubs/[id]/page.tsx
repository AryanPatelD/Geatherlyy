'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircledIcon, CrossCircledIcon, DownloadIcon } from '@radix-ui/react-icons';
import { getApiUrl } from '@/lib/apiUrl';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  totalScore: number;
  clubsJoined: number;
  quizzesCompleted: number;
  avgPercentage?: string;
}

export default function ClubDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [club, setClub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCoordinatorModal, setShowCoordinatorModal] = useState(false);
  const [coordinatorReason, setCoordinatorReason] = useState('');
  const [applyingCoordinator, setApplyingCoordinator] = useState(false);
  const [hasAppliedAsCoordinator, setHasAppliedAsCoordinator] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [joiningClub, setJoiningClub] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [postingComment, setPostingComment] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [clubLeaderboard, setClubLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  useEffect(() => {
    // Get current user ID and role from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUserId(payload.sub);
        setUserRole(payload.role);
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
  }, []);

  // Check if user has a pending coordinator application for this club
  useEffect(() => {
    const checkPendingApplication = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/approvals/my-requests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const requests = await response.json();
          // Check if there's a pending COORDINATOR request for this club
          const hasPendingRequest = requests.some(
            (req: any) => 
              req.clubId === parseInt(params.id) && 
              req.requestedRole === 'COORDINATOR' && 
              req.status === 'PENDING'
          );
          setHasAppliedAsCoordinator(hasPendingRequest);
        }
      } catch (error) {
        console.error('Error checking pending applications:', error);
      }
    };

    checkPendingApplication();
  }, [params.id]);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const headers = { 'Authorization': `Bearer ${token}` };

        setLoading(true);
        setLoadingResources(true);
        setLoadingQuizzes(true);
        setLoadingActivities(true);

        const [clubRes, resourcesRes, quizzesRes, activitiesRes] = await Promise.all([
          fetch(`${apiUrl}/api/clubs/${params.id}`, { headers }),
          fetch(`${apiUrl}/api/resources?clubId=${params.id}`, { headers }),
          fetch(`${apiUrl}/api/quizzes?clubId=${params.id}`, { headers }),
          fetch(`${apiUrl}/api/activities?clubId=${params.id}`, { headers })
        ]);

        if (clubRes.ok) {
          const clubData = await clubRes.json();
          setClub(clubData);
        } else {
          console.error('Failed to fetch club');
        }

        if (resourcesRes.ok) setResources(await resourcesRes.json());
        if (quizzesRes.ok) setQuizzes(await quizzesRes.json());
        if (activitiesRes.ok) setActivities(await activitiesRes.json());

      } catch (error) {
        console.error('Error fetching club data:', error);
      } finally {
        setLoading(false);
        setLoadingResources(false);
        setLoadingQuizzes(false);
        setLoadingActivities(false);
      }
    };

    fetchClubData();
  }, [params.id]);

  // Fetch comments when comments tab is active
  useEffect(() => {
    if (activeTab === 'comments' && club) {
      const fetchComments = async () => {
        setLoadingComments(true);
        try {
          const token = localStorage.getItem('token');
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/comments/club/${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setComments(data);
          }
        } catch (error) {
          console.error('Error fetching comments:', error);
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [activeTab, club, params.id]);

  // Fetch leaderboard when leaderboard tab is active
  useEffect(() => {
    if (activeTab === 'leaderboard' && club) {
      const fetchLeaderboard = async () => {
        setLoadingLeaderboard(true);
        try {
          const token = localStorage.getItem('token');
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/leaderboards/club/${params.id}?limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setClubLeaderboard(data);
          }
        } catch (error) {
          console.error('Error fetching leaderboard:', error);
        } finally {
          setLoadingLeaderboard(false);
        }
      };
      fetchLeaderboard();
    }
  }, [activeTab, club, params.id]);

  const handleExportLeaderboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/leaderboards/club/${params.id}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${club.name}_Leaderboard_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Leaderboard exported successfully');
      } else {
        toast.error('Failed to export leaderboard');
      }
    } catch (error) {
      console.error('Error exporting leaderboard:', error);
      toast.error('Error exporting leaderboard');
    }
  };

  const handleExportComments = () => {
    if (comments.length === 0) {
      toast.error('No comments to export');
      return;
    }

    // Define CSV headers
    const headers = ['User', 'Date', 'Content', 'Anonymous'];
    
    // Convert comments to CSV rows
    const csvRows = comments.map(comment => {
      const userName = comment.isAnonymous ? 'Anonymous' : (comment.user?.name || 'Unknown');
      const date = new Date(comment.createdAt).toLocaleDateString();
      // Escape quotes in content
      const content = `"${comment.content.replace(/"/g, '""')}"`;
      const isAnon = comment.isAnonymous ? 'Yes' : 'No';
      
      return [userName, date, content, isAnon].join(',');
    });

    // Combine headers and rows
    const csvContent = [headers.join(','), ...csvRows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${club.name}_Comments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: Number(params.id),
          content: newComment,
          isAnonymous,
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        // Since we don't get the user details back in the create response for anonymous/non-anonymous immediately populated 
        // (unless backend includes it), we might want to refetch or manually construct it.
        // But backend `create` includes club, not user. 
        // The endpoint returns `Comment & { club: ... }`.
        
        // Let's refetch to be safe and simple, or append with current user data if we had it.
        // Refetching is easier for now to get consistent data structure (including user object if not anonymous)
        const fetchResponse = await fetch(`${apiUrl}/api/comments/club/${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if(fetchResponse.ok) {
            const data = await fetchResponse.json();
            setComments(data);
        }

        setNewComment('');
        toast.success('Comment posted successfully!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleJoinClub = async () => {
    setJoiningClub(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/clubs/${params.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh club data to update membership status
        const clubResponse = await fetch(`${apiUrl}/api/clubs/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (clubResponse.ok) {
          const data = await clubResponse.json();
          setClub(data);
        }
        
        toast.success('Successfully joined the club!');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to join club');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setJoiningClub(false);
    }
  };

  const handleApplyAsCoordinator = async () => {
    if (!coordinatorReason.trim()) {
      toast.error('Please provide a reason for your application');
      return;
    }

    setApplyingCoordinator(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/clubs/${params.id}/apply-coordinator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: coordinatorReason }),
      });

      if (response.ok) {
        toast.success('Your coordinator application has been submitted! Wait for admin/faculty approval.');
        setShowCoordinatorModal(false);
        setCoordinatorReason('');
        setHasAppliedAsCoordinator(true);
      } else {
        const errorData = await response.json();
        // If user already has a pending application, update state
        if (errorData.message?.toLowerCase().includes('already') || errorData.message?.toLowerCase().includes('pending')) {
          setHasAppliedAsCoordinator(true);
        }
        toast.error(errorData.message || 'Failed to apply as coordinator');
      }
    } catch (error) {
      console.error('Error applying as coordinator:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setApplyingCoordinator(false);
    }
  };

  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveStep, setLeaveStep] = useState(1);
  const [leavingClub, setLeavingClub] = useState(false);

  const handleLeaveClub = async () => {
    setLeavingClub(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/clubs/${params.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast.success('You have successfully left the club.');
        // Refresh to update UI
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to leave club');
      }
    } catch (error) {
      console.error('Error leaving club:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setLeavingClub(false);
      setShowLeaveModal(false);
      setLeaveStep(1);
    }
  };

  const isUserMember = club?.members?.some((m: any) => m.userId === currentUserId) || false;
  const isUserCoordinator = club?.coordinators?.some((c: any) => c.userId === currentUserId) || false;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading club...</p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Club not found</h3>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-2 bg-primary text-white rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'activities', label: 'Activities' },
    { id: 'quizzes', label: 'Quizzes' },
    { id: 'resources', label: 'Resources' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'comments', label: 'Comments' },
  ];

  return (
    <div className="p-4 md:p-8">
      {/* Club Header with Photo */}
      {club.imageUrl && (
        <div className="relative h-48 md:h-64 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-6 overflow-hidden">
          <img
            src={club.imageUrl}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow-lg mb-1 md:mb-2">{club.name}</h1>
            <p className="text-white/90 text-sm md:text-lg drop-shadow line-clamp-2">{club.description}</p>
          </div>
        </div>
      )}

      {/* Club Info Card */}
      <div className="card mb-6">
        {!club.imageUrl && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
            <p className="text-muted-text">{club.description}</p>
          </div>
        )}

        <div className="flex justify-end mb-6 gap-3">
          {isUserMember && !isUserCoordinator && userRole !== 'FACULTY' && userRole !== 'ADMIN' && (
            <>
              {hasAppliedAsCoordinator ? (
                <button 
                  disabled
                  className="btn btn-outline opacity-60 cursor-not-allowed"
                >
                  ⏳ Application Pending
                </button>
              ) : (
                <button 
                  onClick={() => setShowCoordinatorModal(true)}
                  className="btn btn-outline"
                >
                  🎖️ Apply as Coordinator
                </button>
              )}
              <button 
                onClick={() => {
                  setLeaveStep(1);
                  setShowLeaveModal(true);
                }}
                className="btn btn-outline text-red-500 hover:bg-red-50 border-red-200 dark:border-red-900/30"
              >
                Leave Club
              </button>
            </>
          )}
          {!isUserMember && (
            <button 
              onClick={handleJoinClub}
              disabled={joiningClub}
              className="btn btn-primary"
            >
              {joiningClub ? 'Joining...' : 'Join Club'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border">
          <div>
            <p className="text-muted-text text-sm">Members</p>
            <p className="text-2xl font-bold">{club._count?.members ?? club.memberCount ?? 0}</p>
          </div>
          <div>
            <p className="text-muted-text text-sm">Mentors</p>
            <p className="text-lg font-medium">
               {club.mentors && club.mentors.length > 0 
                  ? club.mentors.map((m: any) => m.name).join(', ') 
                  : (club.mentor?.name || 'N/A')}
            </p>
          </div>
          <div>
            <p className="text-muted-text text-sm">Founded</p>
            <p className="text-lg font-medium">
              {club.createdAt ? new Date(club.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-muted-text text-sm">Coordinators</p>
            <p className="text-sm font-medium">
              {club.coordinators?.map((c: any) => c.user?.name).filter(Boolean).join(', ') || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'overview' || isUserMember || isUserCoordinator || userRole === 'ADMIN' || userRole === 'FACULTY') {
                setActiveTab(tab.id);
              } else {
                toast.error('Join the club to access this section!');
              }
            }}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-text hover:text-foreground'
            } ${
              !(tab.id === 'overview' || isUserMember || isUserCoordinator || userRole === 'ADMIN' || userRole === 'FACULTY')
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {tab.label}
            {!(tab.id === 'overview' || isUserMember || isUserCoordinator || userRole === 'ADMIN' || userRole === 'FACULTY') && (
              <span className="text-xs">🔒</span>
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold mb-4">About This Club</h3>
            <p className="text-muted-text leading-relaxed">
              {club.description || 'No description available.'}
            </p>
          </div>

          {/* Event Photos Gallery */}
          {club.eventPhotos && club.eventPhotos.length > 0 ? (
            <div className="card">
              <h3 className="font-bold mb-4">Past Events 📸</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {club.eventPhotos.map((photo: string, index: number) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border hover:scale-105 transition-transform cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <img
                      src={photo}
                      alt={`Event ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-bold mb-4">Leadership</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-muted-text text-sm">Convenor</p>
                  <p className="font-medium">{club.convenor?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-text text-sm">Mentors</p>
                  {club.mentors && club.mentors.length > 0 ? (
                        club.mentors.map((m: any) => (
                            <p key={m.id} className="font-medium">{m.name}</p>
                        ))
                  ) : (
                      <p className="font-medium">{club.mentor?.name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <p className="text-muted-text text-sm">Coordinators</p>
                  {club.coordinators && club.coordinators.length > 0 ? (
                    club.coordinators.map((coord: any) => (
                      <p key={coord.id} className="font-medium">
                        {coord.user?.name || 'N/A'}
                      </p>
                    ))
                  ) : (
                    <p className="text-muted-text text-sm">No coordinators assigned</p>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-bold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`mailto:${club.mentor?.email || ''}`)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-muted-bg transition-colors"
                >
                  📧 Contact Mentor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activities */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <h3 className="font-bold">Upcoming Activities</h3>
          {loadingActivities ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activities.length > 0 ? (
            activities.map((activity) => (
              <div 
                key={activity.id} 
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedActivity(activity)}
              >
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-sm text-muted-text">
                      {new Date(activity.startDate).toLocaleDateString()} at {new Date(activity.startDate).toLocaleTimeString()}
                    </p>
                    {activity.location && <p className="text-sm text-muted-text">📍 {activity.location}</p>}
                  </div>
                  <span className={`text-xs px-3 py-1 rounded h-fit ${
                    activity.status === 'UPCOMING' ? 'bg-blue-100 text-blue-600' :
                    activity.status === 'ONGOING' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-text">
              <p>No activities scheduled yet</p>
            </div>
          )}
        </div>
      )}

      {/* Quizzes */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <h3 className="font-bold">Active Quizzes</h3>
          {loadingQuizzes ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : quizzes.length > 0 ? (
            quizzes.map((quiz) => (
              <div key={quiz.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{quiz.title}</p>
                    <p className="text-sm text-muted-text">{quiz.questions?.length || 0} questions</p>
                  </div>
                  <button 
                    onClick={() => router.push(`/dashboard/quiz/${quiz.id}`)}
                    className="btn btn-primary text-sm"
                  >
                    Attempt
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-text">
              <p>No quizzes available yet</p>
            </div>
          )}
        </div>
      )}

      {/* Resources */}
      {activeTab === 'resources' && (
        <div className="grid md:grid-cols-2 gap-4">
          {loadingResources ? (
            <div className="col-span-2 text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : resources.length > 0 ? (
            resources.map((resource) => (
              <div key={resource.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{resource.type === 'PDF' ? '📄' : '🖼️'}</span>
                  <p className="font-medium">{resource.title}</p>
                </div>
                <p className="text-sm text-muted-text mb-3">{resource.description}</p>
                <div className="flex gap-2 text-xs text-muted-text mb-3">
                  <span>By {resource.uploader?.name}</span>
                  <span>•</span>
                  <span>{(resource.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <a
                  href={`${getApiUrl()}/api/resources/${resource.id}/download`}
                  className="btn btn-outline text-sm w-full"
                >
                  Download
                </a>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-text">
              <p>No resources uploaded yet</p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Club Leaderboard 🏆</h3>
              {(isUserCoordinator || userRole === 'ADMIN' || userRole === 'FACULTY') && (
                <button
                  onClick={handleExportLeaderboard}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Export Excel
                </button>
              )}
            </div>
            
            {loadingLeaderboard ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : clubLeaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-text uppercase">Rank</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-text uppercase">Member</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-text uppercase">Score</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-muted-text uppercase">Quizzes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clubLeaderboard.map((entry) => (
                      <tr key={entry.userId} className="hover:bg-muted/10">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                            entry.rank === 2 ? 'bg-gray-100 text-gray-700' :
                            entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                            'text-muted-text'
                          }`}>
                            {entry.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                {entry.name.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <p className="text-sm font-medium">{entry.name}</p>
                               <p className="text-xs text-muted-text">{entry.role}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center font-bold text-primary">
                          {entry.totalScore}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                          {entry.quizzesCompleted}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div className="text-center py-8 text-muted-text">
                  <p>No leaderboard data yet</p>
                </div>
            )}
          </div>
        </div>
      )}

      {/* Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Share Feedback</h3>
              {(isUserCoordinator || userRole === 'ADMIN' || userRole === 'FACULTY') && comments.length > 0 && (
                <button
                  onClick={handleExportComments}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Export CSV
                </button>
              )}
            </div>
            <textarea
              placeholder="Your comment here..."
              className="input h-24 mb-3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={postingComment}
            />
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="checkbox"
                />
                <span className="text-sm">Post Anonymously</span>
              </label>
              <button
                className="btn btn-primary"
                onClick={handlePostComment}
                disabled={postingComment || !newComment.trim()}
              >
                {postingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold">Comments ({comments.length})</h3>
            {loadingComments ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="card">
                  <div className="flex items-center gap-2 mb-2">
                    {comment.isAnonymous ? (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        👤
                      </div>
                    ) : (
                      <img
                        src={comment.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user?.name || 'User')}`}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {comment.isAnonymous ? 'Anonymous' : comment.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-text">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm pl-10">{comment.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-text">
                <p>No comments yet. Be the first to share your thoughts!</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Coordinator Application Modal */}
      {showCoordinatorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Apply as Coordinator</h3>
            <p className="text-muted-text text-sm mb-4">
              Tell us why you want to be a coordinator for <span className="font-semibold text-foreground">{club.name}</span>
            </p>
            
            <textarea
              value={coordinatorReason}
              onChange={(e) => setCoordinatorReason(e.target.value)}
              placeholder="Enter your reason here..."
              className="input h-32 mb-4 resize-none"
              disabled={applyingCoordinator}
            />

            {/* Disclaimer */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <span className="font-semibold">📋 Note:</span> If your application is <span className="text-green-600 dark:text-green-400 font-semibold">approved</span>, you will get access to the <strong>Coordinator Hub</strong> where you can manage club activities, events, and quizzes. If your application is <span className="text-red-600 dark:text-red-400 font-semibold">rejected</span>, no coordinator access will be provided and you will remain a regular member.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCoordinatorModal(false);
                  setCoordinatorReason('');
                }}
                className="btn btn-outline flex-1"
                disabled={applyingCoordinator}
              >
                Cancel
              </button>
              <button
                onClick={handleApplyAsCoordinator}
                className="btn btn-primary flex-1"
                disabled={applyingCoordinator || !coordinatorReason.trim()}
              >
                {applyingCoordinator ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Leave Club Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6">
            {leaveStep === 1 ? (
              <>
                <h3 className="text-xl font-bold mb-4 text-red-600">⚠ Warning: Leaving Club</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-4 text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800">
                  <p className="font-bold mb-2">Please read carefully:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>You will lose access to all club resources and quizzes.</li>
                    <li>You will lose any "Member" status privileges.</li>
                    <li>If this was a paid club, <strong>no refund</strong> will be issued.</li>
                    <li>You will need to re-apply/re-pay to join again.</li>
                  </ul>
                </div>
                <p className="mb-6 text-muted-text">Are you sure you want to proceed?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLeaveModal(false)}
                    className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setLeaveStep(2)}
                    className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    I Understand, Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-4 text-red-600">Final Confirmation</h3>
                <p className="mb-6 text-muted-text">
                  This action is irreversible. Do you really want to leave <strong>{club.name}</strong>?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLeaveStep(1)}
                    className="btn btn-outline flex-1"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleLeaveClub}
                    className="btn btn-primary flex-1 bg-red-600 hover:bg-red-700 text-white"
                    disabled={leavingClub}
                  >
                    {leavingClub ? 'Leaving...' : 'Confirm & Leave'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedActivity(null)}>
          <div className="bg-background rounded-xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded font-medium uppercase ${
                    selectedActivity.activityType === 'WORKSHOP' ? 'bg-purple-100 text-purple-700' :
                    selectedActivity.activityType === 'QUIZ' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedActivity.activityType}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded font-medium ${
                    selectedActivity.status === 'UPCOMING' ? 'bg-green-100 text-green-700' :
                    selectedActivity.status === 'ONGOING' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedActivity.status}
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{selectedActivity.title}</h2>
              </div>
              <button 
                onClick={() => setSelectedActivity(null)}
                className="text-muted-text hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-muted-bg/50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-sm text-muted-text">Date & Time</p>
                    <p className="font-medium">
                      {new Date(selectedActivity.startDate).toLocaleDateString(undefined, {
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-sm">
                      at {new Date(selectedActivity.startDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
                {selectedActivity.location && (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📍</span>
                    <div>
                      <p className="text-sm text-muted-text">Location</p>
                      <p className="font-medium">{selectedActivity.location}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-text whitespace-pre-wrap leading-relaxed">
                  {selectedActivity.description}
                </p>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button 
                  onClick={() => setSelectedActivity(null)}
                  className="btn btn-primary px-6"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
