'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy, Medal, Award, Users, TrendingUp, Target } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/context/AuthContext';
import { useClubContext } from '@/context/ClubContext';
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

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { myClubs, selectedClubId } = useClubContext();
  const [activeTab, setActiveTab] = useState<'global' | 'clubs'>('global');
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [localSelectedClub, setLocalSelectedClub] = useState<number | null>(null);
  const [clubLeaderboard, setClubLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync active tab with selectedClubId
  useEffect(() => {
    if (selectedClubId) {
      setActiveTab('clubs');
    }
  }, [selectedClubId]);

  useEffect(() => {
    fetchGlobalLeaderboard();
    fetchMyRank();
  }, [user]);



  const fetchGlobalLeaderboard = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/leaderboards/global?limit=50`);
      if (response.ok) {
        const data = await response.json();
        setGlobalLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch global leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRank = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/leaderboards/my-rank`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setMyRank(data);
      }
    } catch (error) {
      console.error('Failed to fetch my rank:', error);
    }
  };

  useEffect(() => {
    const clubIdToFetch = selectedClubId || localSelectedClub || (activeTab === 'clubs' && myClubs.length > 0 ? myClubs[0].id : null);
    
    if (clubIdToFetch && activeTab === 'clubs') {
      fetchClubLeaderboard(clubIdToFetch);
    }
  }, [selectedClubId, localSelectedClub, activeTab, myClubs]);

  const fetchClubLeaderboard = async (clubId: number) => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/leaderboards/club/${clubId}?limit=30`);
      if (response.ok) {
        const data = await response.json();
        setClubLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch club leaderboard:', error);
    }
  };

  const handleExportGlobal = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/leaderboards/global/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Global_Leaderboard_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export global leaderboard:', error);
      toast.error('Failed to export leaderboard');
    }
  };

  const handleExportClub = async (clubId: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/leaderboards/club/${clubId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const clubName = myClubs.find(c => c.id === clubId)?.name || 'Club';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${clubName}_Leaderboard_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to export club leaderboard:', error);
      toast.error('Failed to export leaderboard');
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center font-bold text-gray-400">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-4xl font-bold mb-2 flex items-center gap-2 md:gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-muted-text">Compete with others and climb to the top!</p>
      </div>

      {/* My Rank Card */}
      {myRank && myRank.rank && (
        <div className="mb-8 card p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 mb-1">Your Global Rank</p>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold">#{myRank.rank}</div>
                <div>
                  <p className="text-lg font-semibold">{myRank.totalScore} Points</p>
                  <p className="text-sm text-blue-100">{myRank.quizzesCompleted} Quizzes • {myRank.clubsJoined} Clubs</p>
                </div>
              </div>
            </div>
            <TrendingUp className="w-16 h-16 opacity-20" />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 md:gap-4 mb-6 border-b border-border overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-3 md:px-6 py-2 md:py-3 font-medium transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'global'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-1 md:gap-2">
            <Trophy className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">Global</span> Leaderboard
          </div>
        </button>
        <button
          onClick={() => setActiveTab('clubs')}
          className={`px-3 md:px-6 py-2 md:py-3 font-medium transition-all whitespace-nowrap text-sm md:text-base ${activeTab === 'clubs'
            ? 'border-b-2 border-blue-600 text-blue-600'
            : 'text-gray-500 hover:text-gray-700'
            }`}
        >
          <div className="flex items-center gap-1 md:gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5" />
            Club <span className="hidden sm:inline">Leaderboards</span>
          </div>
        </button>
      </div>

      {/* Global Leaderboard */}
      {activeTab === 'global' && (
        <>
          {/* Top 3 Podium */}
          {globalLeaderboard.length >= 3 && (
            <div className="mb-6 md:mb-8 grid grid-cols-3 gap-2 md:gap-6 items-end">
              {/* 2nd Place */}
              <div className="card text-center pt-4 md:pt-8 pb-4 md:pb-6 transform transition-all hover:scale-105 px-2 md:px-4">
                <div className="w-12 h-12 md:w-20 md:h-20 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-lg md:text-3xl mb-2 md:mb-3">
                  {globalLeaderboard[1]?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="w-6 h-6 md:w-10 md:h-10 mx-auto rounded-full bg-gradient-to-r from-gray-300 to-gray-500 flex items-center justify-center text-white font-bold text-xs md:text-base mb-2 md:mb-3">
                  2
                </div>
                <h3 className="font-bold text-xs md:text-lg mb-1 truncate">{globalLeaderboard[1]?.name}</h3>
                <p className="text-xs text-muted-text mb-2 md:mb-3 hidden md:block truncate">{globalLeaderboard[1]?.email}</p>
                <div className="text-lg md:text-3xl font-bold text-gray-500">{globalLeaderboard[1]?.totalScore}</div>
                <p className="text-[10px] md:text-xs text-muted-text">points</p>
              </div>

              {/* 1st Place */}
              <div className="card text-center pt-4 md:pt-8 pb-4 md:pb-6 transform transition-all hover:scale-105 border-2 border-yellow-500 px-2 md:px-4">
                <div className="w-14 h-14 md:w-24 md:h-24 mx-auto rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl md:text-4xl mb-2 md:mb-3 shadow-lg">
                  {globalLeaderboard[0]?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="w-8 h-8 md:w-12 md:h-12 mx-auto rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-sm md:text-lg mb-2 md:mb-3 shadow-lg">
                  <Trophy className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <h3 className="font-bold text-sm md:text-xl mb-1 truncate">{globalLeaderboard[0]?.name}</h3>
                <p className="text-xs text-muted-text mb-2 md:mb-3 hidden md:block truncate">{globalLeaderboard[0]?.email}</p>
                <div className="text-xl md:text-4xl font-bold text-yellow-600">{globalLeaderboard[0]?.totalScore}</div>
                <p className="text-[10px] md:text-xs text-muted-text">points</p>
              </div>

              {/* 3rd Place */}
              <div className="card text-center pt-4 md:pt-8 pb-4 md:pb-6 transform transition-all hover:scale-105 px-2 md:px-4">
                <div className="w-12 h-12 md:w-20 md:h-20 mx-auto rounded-full bg-gradient-to-r from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-lg md:text-3xl mb-2 md:mb-3">
                  {globalLeaderboard[2]?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="w-6 h-6 md:w-10 md:h-10 mx-auto rounded-full bg-gradient-to-r from-amber-600 to-amber-800 flex items-center justify-center text-white font-bold text-xs md:text-base mb-2 md:mb-3">
                  3
                </div>
                <h3 className="font-bold text-xs md:text-lg mb-1 truncate">{globalLeaderboard[2]?.name}</h3>
                <p className="text-xs text-muted-text mb-2 md:mb-3 hidden md:block truncate">{globalLeaderboard[2]?.email}</p>
                <div className="text-lg md:text-3xl font-bold text-amber-700">{globalLeaderboard[2]?.totalScore}</div>
                <p className="text-[10px] md:text-xs text-muted-text">points</p>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="card">
            <div className="p-4 md:p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
                  All Rankings
                </h2>
                <p className="text-xs md:text-sm text-muted-text mt-1 hidden sm:block">
                  Ranked by total score. Tiebreaker: Fewer clubs joined ranks higher
                </p>
              </div>
              {(user?.role === 'coordinator' || user?.role === 'faculty' || user?.role === 'admin') && (
                <button
                  onClick={handleExportGlobal}
                  className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md text-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Excel
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 border-b border-border">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-left text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-center text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-center text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Quizzes</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-center text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Clubs</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-center text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">Avg %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {globalLeaderboard.slice(3).map((entry) => (
                    <tr
                      key={entry.userId}
                      className={`hover:bg-gray-50 transition-colors ${entry.userId === Number(user?.id) ? 'bg-blue-50 hover:bg-blue-100' : ''
                        }`}
                    >
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center font-semibold text-gray-600 text-sm md:text-base">
                            {entry.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 md:gap-3">
                          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs md:text-base">
                            {entry.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-sm md:text-base truncate max-w-[100px] md:max-w-none">
                              {entry.name}
                              {entry.userId === Number(user?.id) && (
                                <span className="ml-1 md:ml-2 text-[10px] md:text-xs bg-blue-600 text-white px-1 md:px-2 py-0.5 md:py-1 rounded-full">You</span>
                              )}
                            </p>
                            <p className="text-[10px] md:text-xs text-gray-500 truncate hidden md:block">{entry.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Target className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                          <span className="font-bold text-sm md:text-lg text-blue-600">{entry.totalScore}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center hidden sm:table-cell">
                        <span className="font-semibold text-gray-700">{entry.quizzesCompleted}</span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 px-2 md:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs md:text-sm font-medium">
                          <Users className="w-3 h-3 md:w-4 md:h-4" />
                          {entry.clubsJoined}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-center">
                        <span className="font-semibold text-gray-700 text-sm md:text-base">{entry.avgPercentage || 0}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Club Leaderboards */}
      {activeTab === 'clubs' && (
        <div className="space-y-6">
          {/* Club Selector */}
          {/* Club Selector - Only show if no global club selected */}
          {!selectedClubId && myClubs.length > 0 && (
            <div className="card p-6">
              <label className="block text-sm font-medium mb-3">Select Club</label>
              <select
                value={localSelectedClub || ''}
                onChange={(e) => setLocalSelectedClub(Number(e.target.value))}
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a club...</option>
                {myClubs.map((club) => (
                  <option key={club.id} value={club.id}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Club Leaderboard */}
          {/* Club Leaderboard */}
          {(selectedClubId || localSelectedClub) && clubLeaderboard.length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600" />
                    {myClubs.find(c => c.id === (selectedClubId || localSelectedClub))?.name} Leaderboard
                  </h2>
                  <p className="text-sm text-muted-text mt-1">
                    Members ranked by quiz performance in this club
                  </p>
                </div>
                {(user?.role === 'coordinator' || user?.role === 'faculty' || user?.role === 'admin') && (
                  <button
                    onClick={() => handleExportClub((selectedClubId || localSelectedClub)!)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quizzes</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Avg %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clubLeaderboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        className={`hover:bg-gray-50 transition-colors ${entry.userId === Number(user?.id) ? 'bg-purple-50 hover:bg-purple-100' : ''
                          }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getRankBadge(entry.rank)}`}>
                            {getRankIcon(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                              {entry.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {entry.name}
                                {entry.userId === Number(user?.id) && (
                                  <span className="ml-2 text-xs bg-purple-600 text-white px-2 py-1 rounded-full">You</span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500">{entry.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="font-bold text-lg text-purple-600">{entry.totalScore}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="font-semibold text-gray-700">{entry.quizzesCompleted}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="font-semibold text-gray-700">{entry.avgPercentage || 0}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {myClubs.length === 0 && (
            <div className="card p-12 text-center">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Clubs Yet</h3>
              <p className="text-muted-text mb-6">Join a club to see club-specific leaderboards</p>
              <button
                onClick={() => router.push('/dashboard/clubs')}
                className="btn-primary"
              >
                Browse Clubs
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
