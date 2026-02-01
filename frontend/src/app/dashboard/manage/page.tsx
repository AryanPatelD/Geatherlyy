'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuthStore } from '@/context/AuthContext';

function ManageClubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClubId = searchParams.get('clubId');
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [clubs, setClubs] = useState<any[]>([]);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [quizDuration, setQuizDuration] = useState(30);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    image: null as string | null,
  });
  const [creatingQuiz, setCreatingQuiz] = useState(false);
  const [clubStats, setClubStats] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [resourceData, setResourceData] = useState({
    title: '',
    description: '',
    file: null as File | null,
  });
  
  // Removal Request State
  const [showRemovalModal, setShowRemovalModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [removalReason, setRemovalReason] = useState('');
  const [submittingRemoval, setSubmittingRemoval] = useState(false);

  const handleRequestRemoval = async () => {
    if (!memberToRemove || !removalReason.trim()) {
      alert('Please provide a reason for removal');
      return;
    }

    setSubmittingRemoval(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/removal-requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clubId: selectedClub.id,
          memberId: memberToRemove.user?.id || memberToRemove.userId,
          reason: removalReason,
        }),
      });

      if (response.ok) {
        alert('Removal request submitted successfully. Waiting for faculty approval.');
        setShowRemovalModal(false);
        setMemberToRemove(null);
        setRemovalReason('');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit removal request');
      }
    } catch (error) {
      console.error('Error submitting removal request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setSubmittingRemoval(false);
    }
  };

  const fetchQuizzes = async () => {
    if (!selectedClub) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/quizzes?clubId=${selectedClub.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const fetchClubStats = async () => {
    if (!selectedClub) return;
    
    setLoadingStats(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/clubs/${selectedClub.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setClubStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch club stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchResources = async () => {
    if (!selectedClub) return;
    
    setLoadingResources(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/resources?clubId=${selectedClub.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const fetchComments = async () => {
    if (!selectedClub) return;
    
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/comments/club/${selectedClub.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleExportMembers = async () => {
    if (!selectedClub) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/clubs/${selectedClub.id}/members/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedClub.name}-members.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export members');
      }
    } catch (error) {
      console.error('Failed to export members:', error);
      alert('An error occurred while exporting members');
    }
  };

  const handleUploadResource = async () => {
    if (!resourceData.title || !resourceData.file || !selectedClub) {
      alert('Please provide a title and select a file');
      return;
    }

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024;
    if (resourceData.file.size > maxSize) {
      alert('File size must be less than 50MB');
      return;
    }

    setUploadingResource(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', resourceData.title);
      formData.append('description', resourceData.description);
      formData.append('clubId', selectedClub.id.toString());
      formData.append('file', resourceData.file);

      const response = await fetch('http://localhost:5000/api/resources', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('Resource uploaded successfully!');
        setShowResourceModal(false);
        setResourceData({ title: '', description: '', file: null });
        fetchResources();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to upload resource');
      }
    } catch (error) {
      console.error('Error uploading resource:', error);
      alert('An error occurred while uploading the resource');
    } finally {
      setUploadingResource(false);
    }
  };

  const handleDeleteResource = async (resourceId: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Resource deleted successfully');
        fetchResources();
      } else {
        alert('Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('An error occurred while deleting the resource');
    }
  };

  useEffect(() => {
    if (selectedClub && activeTab === 'quizzes') {
      fetchQuizzes();
    } else if (selectedClub && activeTab === 'overview') {
      fetchClubStats();
    } else if (selectedClub && activeTab === 'resources') {
      fetchResources();
    } else if (selectedClub && activeTab === 'comments') {
      fetchComments();
    }
  }, [selectedClub, activeTab]);

  useEffect(() => {
    const fetchManagedClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/clubs/managed', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setClubs(data);
          if (data.length === 1) {
            setSelectedClub(data[0]);
          }
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

  // Handle Initial Club Selection from URL
  useEffect(() => {
    if (initialClubId && clubs.length > 0 && !selectedClub) {
      const club = clubs.find(c => c.id === Number(initialClubId));
      if (club) {
        setSelectedClub(club);
      }
    }
  }, [initialClubId, clubs, selectedClub]);

  const handleCreateQuiz = async () => {
    if (!quizTitle || questions.length === 0 || !selectedClub) {
      alert('Please add a title and at least one question');
      return;
    }

    setCreatingQuiz(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/quizzes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: quizTitle,
          description: quizDescription,
          timeLimit: quizDuration,
          clubId: selectedClub.id,
          questions: questions.map((q, index) => ({
            text: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            imageUrl: q.image,
            marks: 1,
            order: index,
          })),
        }),
      });

      if (response.ok) {
        alert(`Quiz "${quizTitle}" created successfully!`);
        setShowQuizModal(false);
        setQuizTitle('');
        setQuizDescription('');
        setQuestions([]);
        fetchQuizzes();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create quiz');
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      alert('An error occurred while creating the quiz');
    } finally {
      setCreatingQuiz(false);
    }
  };

  const handleToggleQuizStatus = async (quizId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      if (response.ok) {
        alert(isActive ? 'Quiz stopped' : 'Quiz started');
        fetchQuizzes();
      }
    } catch (error) {
      console.error('Error toggling quiz status:', error);
    }
  };

  const handleDeleteQuiz = async (quizId: number) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Quiz deleted successfully');
        fetchQuizzes();
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading clubs...</p>
        </div>
      </div>
    );
  }

  if (clubs.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Club Management</h1>
        <div className="text-center py-12 card">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold mb-2">No clubs to manage</h3>
          <p className="text-gray-500 mb-6">You are not coordinating any clubs yet.</p>
          {user && ['faculty', 'admin'].includes(user.role) && (
            <button
              onClick={() => router.push('/dashboard/create-club')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              Create New Club
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!selectedClub) {
     return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Club Management</h1>
        <div className="text-center py-12 card bg-gradient-to-br from-background to-muted-bg border-dashed border-2">
          <div className="text-6xl mb-4">👈</div>
          <h3 className="text-xl font-semibold mb-2">Select a club to manage</h3>
          <p className="text-muted-text mb-8">You are a coordinator for mulitple clubs. Please select one to proceed.</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            {clubs.map(club => (
              <div 
                key={club.id}
                onClick={() => setSelectedClub(club)}
                className="card cursor-pointer hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-4">
                   {club.imageUrl ? (
                      <img src={club.imageUrl} alt={club.name} className="w-12 h-12 rounded-full object-cover" />
                   ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        {club.name[0]}
                      </div>
                   )}
                   <div>
                     <h4 className="font-bold">{club.name}</h4>
                     <p className="text-xs text-muted-text">{club.category}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
     );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Club Management</h1>
        
        {clubs.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-text font-medium">Manage Club:</span>
            <select
              value={selectedClub?.id || ''}
              onChange={(e) => {
                const clubId = Number(e.target.value);
                const club = clubs.find(c => c.id === clubId);
                setSelectedClub(club);
              }}
              className="px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary font-medium min-w-[200px]"
            >
              {clubs.map(club => (
                <option key={club.id} value={club.id}>{club.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'members', label: 'Members' },
          { id: 'activities', label: 'Activities' },
          { id: 'quizzes', label: 'Quizzes' },
          { id: 'resources', label: 'Resources' },
          { id: 'comments', label: 'Comments' },
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingStats ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-500 mt-2">Loading statistics...</p>
            </div>
          ) : clubStats ? (
            <>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="card">
                  <p className="text-muted-text text-sm">Total Members</p>
                  <p className="text-3xl font-bold text-primary">{clubStats.totalMembers}</p>
                </div>
                <div className="card">
                  <p className="text-muted-text text-sm">Activities Created</p>
                  <p className="text-3xl font-bold text-primary">{clubStats.totalActivities}</p>
                </div>
                <div className="card">
                  <p className="text-muted-text text-sm">Quiz Attempts</p>
                  <p className="text-3xl font-bold text-primary">{clubStats.totalQuizAttempts}</p>
                </div>
                <div className="card">
                  <p className="text-muted-text text-sm">Upcoming Events</p>
                  <p className="text-3xl font-bold text-primary">{clubStats.upcomingActivities}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-text">
              <p>No statistics available</p>
            </div>
          )}

          {clubStats && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="font-bold mb-4">Club Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-text">Club Name</p>
                    <p className="font-medium">{selectedClub?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-text">Category</p>
                    <p className="font-medium">{selectedClub?.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-text">Established</p>
                    <p className="font-medium">{new Date(selectedClub?.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <button className="w-full btn btn-outline text-sm mt-4">
                  Edit Club Info
                </button>
              </div>

              <div className="card">
                <h3 className="font-bold mb-4">Recent Members</h3>
                <div className="space-y-2 text-sm">
                  {clubStats.recentMembers?.slice(0, 5).map((member: any) => (
                    <div key={member.id} className="py-2 border-b border-border flex items-center gap-2">
                      {member.user.avatar ? (
                        <img src={member.user.avatar} alt={member.user.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">
                          {member.user.name[0]}
                        </div>
                      )}
                      <span>{member.user.name} joined</span>
                    </div>
                  ))}
                  {clubStats.recentCommentsCount > 0 && (
                    <p className="py-2 text-muted-text">
                      💬 {clubStats.recentCommentsCount} new comments this week
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold">Members ({selectedClub?.members?.length || 0})</h2>
            <button onClick={handleExportMembers} className="btn btn-primary text-sm">
              📥 Export to Excel
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-semibold">Name</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Email</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Department</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Joined</th>
                <th className="text-right py-3 px-4 text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedClub?.members?.map((member: any) => (
                <tr key={member.id} className="border-b border-border hover:bg-muted-bg">
                  <td className="py-3 px-4 text-sm">{member.user?.name || member.userId || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm">{member.user?.email || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm">{member.user?.department || 'N/A'}</td>
                  <td className="py-3 px-4 text-sm">{new Date(member.joinedAt).toLocaleDateString()}</td>
                  <td className="py-3 px-4 text-sm text-right">
                    <button
                      onClick={() => {
                        setMemberToRemove(member);
                        setShowRemovalModal(true);
                      }}
                      className="text-red-500 hover:text-red-700 font-medium text-xs border border-red-200 dark:border-red-900/30 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <button className="btn btn-primary">+ Create Activity</button>
          <div className="card">
            <h3 className="font-bold mb-4">Activities</h3>
            <div className="space-y-3">
              {selectedClub?.activities && selectedClub.activities.length > 0 ? (
                selectedClub.activities.map((activity: any) => (
                  <div 
                    key={activity.id} 
                    className="p-3 border border-border rounded hover:bg-muted-bg transition-colors cursor-pointer"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-muted-text">
                          {new Date(activity.startDate).toLocaleDateString()} • {activity.type}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        activity.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                        activity.status === 'ONGOING' ? 'bg-green-100 text-green-700' :
                        activity.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-text">No activities yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quizzes Tab */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Quiz Management</h2>
            <button 
              onClick={() => router.push(`/dashboard/quizzes/create?clubId=${selectedClub.id}`)}
              className="btn btn-primary"
            >
              + Create New Quiz
            </button>
          </div>

          {/* Active Quizzes */}
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Active Quizzes
            </h3>
            {quizzes.filter(q => q.isActive).length > 0 ? (
              <div className="space-y-3">
                {quizzes.filter(q => q.isActive).map((quiz) => (
                  <div key={quiz.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold text-lg">{quiz.title}</h4>
                          <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full font-medium">
                            Active
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-text">
                          <span>📝 {quiz._count?.questions || 0} questions</span>
                          <span>⏱️ {quiz.timeLimit} min</span>
                          <span>👥 {quiz._count?.attempts || 0} attempts</span>
                          <span>📅 {new Date(quiz.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => router.push(`/dashboard/quizzes/${quiz.id}/results`)}
                        className="btn btn-outline text-sm flex-1"
                      >
                        📊 View Results
                      </button>
                      <button 
                        onClick={() => handleToggleQuizStatus(quiz.id, true)}
                        className="btn btn-outline text-sm flex-1"
                      >
                        ⏸️ Stop Quiz
                      </button>
                      <button 
                        onClick={() => router.push(`/dashboard/quizzes/${quiz.id}`)}
                        className="btn btn-outline text-sm flex-1"
                      >
                        👁️ Preview
                      </button>
                      <button 
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-text">
                <p>No active quizzes</p>
              </div>
            )}
          </div>

          {/* Inactive/Scheduled Quizzes */}
          <div className="card">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              Inactive Quizzes
            </h3>
            {quizzes.filter(q => !q.isActive).length > 0 ? (
              <div className="space-y-3">
                {quizzes.filter(q => !q.isActive).map((quiz) => (
                  <div key={quiz.id} className="p-4 border border-border rounded-lg hover:border-primary transition-colors opacity-75">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-bold">{quiz.title}</h4>
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 px-3 py-1 rounded-full font-medium">
                            Inactive
                          </span>
                        </div>
                        <div className="flex gap-6 text-sm text-muted-text">
                          <span>📝 {quiz._count?.questions || 0} questions</span>
                          <span>⏱️ {quiz.timeLimit} min</span>
                          <span>👥 {quiz._count?.attempts || 0} attempts</span>
                          <span>📅 {new Date(quiz.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleToggleQuizStatus(quiz.id, false)}
                          className="btn btn-primary text-sm"
                        >
                          🚀 Start Quiz
                        </button>
                        <button 
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="btn btn-outline text-sm text-red-500"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-text">
                <p>No inactive quizzes</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quiz Creation Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Create New Quiz</h2>
                <button 
                  onClick={() => setShowQuizModal(false)}
                  className="text-muted-text hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Quiz Details */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Quiz Title</label>
                  <input
                    type="text"
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="e.g., JavaScript Fundamentals Quiz"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={quizDescription}
                    onChange={(e) => setQuizDescription(e.target.value)}
                    placeholder="Brief description about the quiz..."
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={quizDuration}
                    onChange={(e) => setQuizDuration(Number(e.target.value))}
                    min="5"
                    max="180"
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Add Question Section */}
              <div className="border border-border rounded-lg p-4">
                <h3 className="font-bold mb-4">Add Question</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Question</label>
                    <input
                      type="text"
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                      placeholder="Enter your question..."
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Question Image (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            // Show loading state
                            setCurrentQuestion({...currentQuestion, image: 'uploading'});
                            
                            const formData = new FormData();
                            formData.append('image', file);
                            
                            const token = localStorage.getItem('token');
                            const response = await fetch('http://localhost:5000/api/upload/quiz-image', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                              body: formData,
                            });
                            
                            if (response.ok) {
                              const { url } = await response.json();
                              setCurrentQuestion({...currentQuestion, image: url});
                            } else {
                              alert('Failed to upload image');
                              setCurrentQuestion({...currentQuestion, image: null});
                            }
                          } catch (error) {
                            console.error('Error uploading image:', error);
                            alert('Error uploading image');
                            setCurrentQuestion({...currentQuestion, image: null});
                          }
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {currentQuestion.image && currentQuestion.image !== 'uploading' && (
                      <div className="mt-2 relative">
                        <img src={currentQuestion.image} alt="Question" className="max-h-40 rounded-lg" />
                        <button
                          onClick={() => setCurrentQuestion({...currentQuestion, image: null})}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    {currentQuestion.image === 'uploading' && (
                      <div className="mt-2 text-sm text-primary">
                        Uploading image...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium mb-2">Options</label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === index}
                          onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: index})}
                          className="mt-3"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[index] = e.target.value;
                            setCurrentQuestion({...currentQuestion, options: newOptions});
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      if (currentQuestion.question && currentQuestion.options.every(o => o)) {
                        setQuestions([...questions, {...currentQuestion}]);
                        setCurrentQuestion({
                          question: '',
                          options: ['', '', '', ''],
                          correctAnswer: 0,
                          image: null,
                        });
                      } else {
                        alert('Please fill in the question and all options');
                      }
                    }}
                    className="btn btn-outline w-full"
                  >
                    + Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {questions.length > 0 && (
                <div className="border border-border rounded-lg p-4">
                  <h3 className="font-bold mb-4">Added Questions ({questions.length})</h3>
                  <div className="space-y-3">
                    {questions.map((q, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">Q{index + 1}: {q.question}</p>
                            {q.image && (
                              <img src={q.image} alt="Question" className="max-h-20 rounded mt-2" />
                            )}
                            <div className="mt-2 space-y-1 text-sm">
                              {q.options.map((opt: string, i: number) => (
                                <div key={i} className={`${i === q.correctAnswer ? 'text-green-600 font-medium' : 'text-muted-text'}`}>
                                  {i === q.correctAnswer && '✓ '}{opt}
                                </div>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => setQuestions(questions.filter((_, i) => i !== index))}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border p-6 flex gap-3">
              <button
                onClick={() => setShowQuizModal(false)}
                className="flex-1 btn btn-outline"
                disabled={creatingQuiz}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateQuiz}
                className="flex-1 btn btn-primary"
                disabled={creatingQuiz}
              >
                {creatingQuiz ? 'Creating...' : 'Create Quiz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <button onClick={() => setShowResourceModal(true)} className="btn btn-primary">📤 Upload Resource</button>
          {loadingResources ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <div 
                    key={resource.id} 
                    className="card hover:shadow-lg transition-shadow relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{resource.type === 'PDF' ? '📄' : '🖼️'}</span>
                          <p className="font-medium">{resource.title}</p>
                        </div>
                        <p className="text-sm text-muted-text mt-1">{resource.description}</p>
                        <div className="flex gap-4 text-xs text-muted-text mt-2">
                          <span>By {resource.uploader.name}</span>
                          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                          <span>{resource.downloads} downloads</span>
                          <span>{(resource.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`http://localhost:5000/api/resources/${resource.id}/download`}
                          className="text-xs px-3 py-1 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30"
                        >
                          {resource.type === 'PDF' ? 'Download' : 'Download'}
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResource(resource.id);
                          }}
                          className="text-xs px-3 py-1 rounded bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-8 text-muted-text">
                  <p>No resources uploaded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Resource Upload Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Upload Resource</h2>
                <button
                  onClick={() => setShowResourceModal(false)}
                  className="text-muted-text hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title *</label>
                <input
                  type="text"
                  value={resourceData.title}
                  onChange={(e) => setResourceData({ ...resourceData, title: e.target.value })}
                  placeholder="e.g., Study Material - Chapter 5"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={resourceData.description}
                  onChange={(e) => setResourceData({ ...resourceData, description: e.target.value })}
                  placeholder="Brief description of the resource..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">File (JPEG or PDF, max 50MB) *</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.pdf"
                  onChange={(e) => setResourceData({ ...resourceData, file: e.target.files?.[0] || null })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {resourceData.file && (
                  <p className="text-sm text-muted-text mt-2">
                    Selected: {resourceData.file.name} ({(resourceData.file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => setShowResourceModal(false)}
                className="flex-1 btn btn-outline"
                disabled={uploadingResource}
              >
                Cancel
              </button>
              <button
                onClick={handleUploadResource}
                className="flex-1 btn btn-primary"
                disabled={uploadingResource}
              >
                {uploadingResource ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="card">
          <h3 className="font-bold mb-4">Comments & Feedback</h3>
          {loadingComments ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 border border-border rounded">
                    <p className="text-sm text-muted-text font-medium">
                      {comment.isAnonymous ? 'Anonymous' : comment.user?.name}
                    </p>
                    <p className="text-sm mt-2">{comment.content}</p>
                    <p className="text-xs text-muted-text mt-2">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-text">No comments yet</p>
              )}
            </div>
          )}
        </div>
      )}
      {/* Removal Modal */}
      {showRemovalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRemovalModal(false)}>
          <div className="bg-background rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2 text-red-600">Remove Member</h3>
            <p className="text-muted-text text-sm mb-4">
              Request removal of <span className="font-bold text-foreground">{memberToRemove?.user?.name}</span> from <span className="font-bold text-foreground">{selectedClub?.name}</span>. This requires faculty approval.
            </p>
            
            <textarea
              value={removalReason}
              onChange={(e) => setRemovalReason(e.target.value)}
              placeholder="Reason for removal (required)..."
              className="input h-32 mb-4 resize-none w-full"
              disabled={submittingRemoval}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRemovalModal(false);
                  setMemberToRemove(null);
                  setRemovalReason('');
                }}
                className="btn btn-outline flex-1"
                disabled={submittingRemoval}
              >
                Cancel
              </button>
              <button
                onClick={handleRequestRemoval}
                className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
                disabled={submittingRemoval || !removalReason.trim()}
              >
                {submittingRemoval ? 'Submitting...' : 'Request Removal'}
              </button>
            </div>
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
                    {selectedActivity.activityType || selectedActivity.type || 'EVENT'}
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
                  {selectedActivity.description || 'No description provided.'}
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

export default function ManageClubPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ManageClubContent />
    </Suspense>
  );
}
