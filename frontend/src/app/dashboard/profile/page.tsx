'use client';

import { useAuthStore } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PersonIcon, EnvelopeClosedIcon, MobileIcon, BackpackIcon, IdCardIcon } from '@radix-ui/react-icons';
import { getApiUrl } from '@/lib/apiUrl';

interface QuizAttempt {
  id: number;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number;
  attemptedAt: string;
  quiz: {
    id: number;
    title: string;
    club: {
      id: number;
      name: string;
    };
  };
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({
    clubsJoined: 0,
    quizzesCompleted: 0,
    averageScore: 0,
  });
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
      });

      // Fetch user stats from API
      const fetchStats = async () => {
        try {
          const token = localStorage.getItem('token');
          const apiUrl = getApiUrl();
          const response = await fetch(`${apiUrl}/api/users/me/stats`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            setStats({
              clubsJoined: data.clubsJoined || 0,
              quizzesCompleted: data.quizzesCompleted || 0,
              averageScore: data.averageScore || 0,
            });
          }
        } catch (error) {
          console.error('Failed to fetch stats:', error);
        }
      };

      // Fetch quiz history
      const fetchQuizHistory = async () => {
        try {
          const token = localStorage.getItem('token');
          const apiUrl = getApiUrl();
          // Fetch all quiz attempts for the user
          const response = await fetch(`${apiUrl}/api/quizzes`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const quizzes = await response.json();
            // For each quiz, check if user has attempted it
            const attempts: QuizAttempt[] = [];
            
            for (const quiz of quizzes) {
              try {
                const attemptResponse = await fetch(
                  `${apiUrl}/api/quizzes/${quiz.id}/my-attempt`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  }
                );
                
                if (attemptResponse.ok) {
                  const attempt = await attemptResponse.json();
                  if (attempt) {
                    attempts.push({
                      ...attempt,
                      quiz: {
                        id: quiz.id,
                        title: quiz.title,
                        club: quiz.club,
                      },
                    });
                  }
                }
              } catch (err) {
                // Skip if no attempt found
              }
            }
            
            // Sort by most recent first
            attempts.sort((a, b) => 
              new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime()
            );
            
            setQuizHistory(attempts);
          }
        } catch (error) {
          console.error('Failed to fetch quiz history:', error);
        } finally {
          setLoadingHistory(false);
        }
      };

      fetchStats();
      fetchQuizHistory();
    }
  }, [user]);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        updateUser(formData);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getApprovalStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return '✓ Approved';
      case 'pending':
        return '⏳ Pending';
      case 'rejected':
        return '✗ Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-text">Manage your account information and preferences</p>
        </div>

        {/* Profile Overview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border shadow-sm overflow-hidden">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
            <div className="absolute -bottom-16 left-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-5xl font-bold shadow-xl border-4 border-white dark:border-gray-800">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="pt-20 px-6 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
                <p className="text-muted-text capitalize mb-3 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {user.role}
                  </span>
                  {user.approvalStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getApprovalStatusColor(user.approvalStatus)}`}>
                      {getApprovalStatusText(user.approvalStatus)}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 rounded-lg border border-primary text-primary hover:bg-primary hover:text-white transition-colors text-sm font-medium"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {isEditing ? (
              <div className="mt-6 pt-6 border-t border-border">
                <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      <PersonIcon className="inline w-4 h-4 mr-2" />
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      <EnvelopeClosedIcon className="inline w-4 h-4 mr-2" />
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-4 py-2 border border-border rounded-lg bg-gray-50 dark:bg-gray-700 opacity-60 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium mb-2">
                      <MobileIcon className="inline w-4 h-4 mr-2" />
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium mb-2">
                      <BackpackIcon className="inline w-4 h-4 mr-2" />
                      Department
                    </label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleSave}
                      className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-text flex items-center gap-2">
                      <EnvelopeClosedIcon className="w-4 h-4" />
                      Email
                    </p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-text flex items-center gap-2">
                      <IdCardIcon className="w-4 h-4" />
                      University ID
                    </p>
                    <p className="font-medium">{user.universityId}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-text flex items-center gap-2">
                      <BackpackIcon className="w-4 h-4" />
                      Department
                    </p>
                    <p className="font-medium">{user.department}</p>
                  </div>
                  {user.phone && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-text flex items-center gap-2">
                        <MobileIcon className="w-4 h-4" />
                        Phone
                      </p>
                      <p className="font-medium">{user.phone}</p>
                    </div>
                  )}
                  {user.year && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-text">Year</p>
                      <p className="font-medium">{user.year}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Activity Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-6">Your Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stats.clubsJoined}
              </div>
              <p className="text-sm text-muted-text font-medium">Clubs Joined</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                {stats.quizzesCompleted}
              </div>
              <p className="text-sm text-muted-text font-medium">Quizzes Completed</p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {stats.averageScore}%
              </div>
              <p className="text-sm text-muted-text font-medium">Average Score</p>
            </div>
          </div>
        </div>

        {/* Quiz History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-6">📝 Quiz History</h3>
          
          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-text mt-4">Loading quiz history...</p>
            </div>
          ) : quizHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-muted-text">No quizzes attempted yet</p>
              <p className="text-sm text-muted-text mt-2">Join a club and start taking quizzes!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizHistory.map((attempt) => (
                <div
                  key={attempt.id}
                  className="p-4 border border-border rounded-lg hover:bg-muted-bg transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/quiz/results/${attempt.quiz.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{attempt.quiz.title}</h4>
                      <p className="text-sm text-muted-text">{attempt.quiz.club.name}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        attempt.percentage >= 80 ? 'text-green-600' :
                        attempt.percentage >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(attempt.percentage)}%
                      </div>
                      <p className="text-xs text-muted-text">
                        {attempt.score}/{attempt.totalMarks} marks
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-text">
                    <span>⏱️ {formatTime(attempt.timeTaken)}</span>
                    <span>📅 {formatDate(attempt.attemptedAt)}</span>
                    {attempt.percentage >= 80 && <span className="text-green-600 font-medium">🏆 Excellent!</span>}
                    {attempt.percentage >= 60 && attempt.percentage < 80 && <span className="text-yellow-600 font-medium">👍 Good</span>}
                    {attempt.percentage < 60 && <span className="text-red-600 font-medium">📖 Keep Learning</span>}
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
