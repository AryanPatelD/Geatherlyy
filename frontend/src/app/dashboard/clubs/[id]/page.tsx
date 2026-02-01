'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [joiningClub, setJoiningClub] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

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

  useEffect(() => {
    const fetchClub = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/clubs/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setClub(data);
        } else {
          console.error('Failed to fetch club');
        }
      } catch (error) {
        console.error('Error fetching club:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClub();
  }, [params.id]);

  // Fetch resources when resources tab is active
  useEffect(() => {
    if (activeTab === 'resources' && club) {
      const fetchResources = async () => {
        setLoadingResources(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/resources?clubId=${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setResources(data);
          }
        } catch (error) {
          console.error('Error fetching resources:', error);
        } finally {
          setLoadingResources(false);
        }
      };
      fetchResources();
    }
  }, [activeTab, club, params.id]);

  // Fetch quizzes when quizzes tab is active
  useEffect(() => {
    if (activeTab === 'quizzes' && club) {
      const fetchQuizzes = async () => {
        setLoadingQuizzes(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/quizzes?clubId=${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setQuizzes(data);
          }
        } catch (error) {
          console.error('Error fetching quizzes:', error);
        } finally {
          setLoadingQuizzes(false);
        }
      };
      fetchQuizzes();
    }
  }, [activeTab, club, params.id]);

  // Fetch activities when activities tab is active
  useEffect(() => {
    if (activeTab === 'activities' && club) {
      const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`http://localhost:5000/api/activities?clubId=${params.id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setActivities(data);
          }
        } catch (error) {
          console.error('Error fetching activities:', error);
        } finally {
          setLoadingActivities(false);
        }
      };
      fetchActivities();
    }
  }, [activeTab, club, params.id]);

  const handleJoinClub = async () => {
    setJoiningClub(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/clubs/${params.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Refresh club data to update membership status
        const clubResponse = await fetch(`http://localhost:5000/api/clubs/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (clubResponse.ok) {
          const data = await clubResponse.json();
          setClub(data);
        }
        
        alert('Successfully joined the club!');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to join club');
      }
    } catch (error) {
      console.error('Error joining club:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setJoiningClub(false);
    }
  };

  const handleApplyAsCoordinator = async () => {
    if (!coordinatorReason.trim()) {
      alert('Please provide a reason for your application');
      return;
    }

    setApplyingCoordinator(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/clubs/${params.id}/apply-coordinator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: coordinatorReason }),
      });

      if (response.ok) {
        alert('Your coordinator application has been submitted! Wait for admin/faculty approval.');
        setShowCoordinatorModal(false);
        setCoordinatorReason('');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to apply as coordinator');
      }
    } catch (error) {
      console.error('Error applying as coordinator:', error);
      alert('An error occurred. Please try again.');
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
      const response = await fetch(`http://localhost:5000/api/clubs/${params.id}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('You have successfully left the club.');
        // Refresh to update UI
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to leave club');
      }
    } catch (error) {
      console.error('Error leaving club:', error);
      alert('An error occurred. Please try again.');
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
    { id: 'comments', label: 'Comments' },
  ];

  return (
    <div className="p-8">
      {/* Club Header with Photo */}
      {club.imageUrl && (
        <div className="relative h-64 -mx-8 -mt-8 mb-6 overflow-hidden">
          <img
            src={club.imageUrl}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-8">
            <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-2">{club.name}</h1>
            <p className="text-white/90 text-lg drop-shadow">{club.description}</p>
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
              <button 
                onClick={() => setShowCoordinatorModal(true)}
                className="btn btn-outline"
              >
                🎖️ Apply as Coordinator
              </button>
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

        <div className="grid md:grid-cols-4 gap-4 pt-6 border-t border-border">
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
      <div className="flex gap-4 mb-6 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'overview' || isUserMember || isUserCoordinator || userRole === 'ADMIN' || userRole === 'FACULTY') {
                setActiveTab(tab.id);
              } else {
                alert('Join the club to access this section!');
              }
            }}
            className={`pb-4 px-2 font-medium transition-colors border-b-2 flex items-center gap-2 ${
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
                  href={`http://localhost:5000/api/resources/${resource.id}/download`}
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

      {/* Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-bold mb-4">Share Feedback (Anonymous)</h3>
            <textarea
              placeholder="Your comment here (your identity will be hidden)..."
              className="input h-24"
            />
            <button className="btn btn-primary mt-3">Post Comment</button>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold">Comments</h3>
            {[
              'Great activities and supportive community!',
              'Would love more advanced topics',
              'Amazing club, highly recommend!',
            ].map((comment, index) => (
              <div key={index} className="card">
                <p className="text-sm text-muted-text mb-2">Anonymous</p>
                <p className="text-sm">{comment}</p>
              </div>
            ))}
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
