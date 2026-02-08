'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trophy, 
  Users, 
  Clock, 
  Calendar, 
  Search, 
  Download,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/apiUrl';

interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  email: string;
  avatar: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number;
  attemptedAt: string;
}

interface QuizDetails {
  id: number;
  title: string;
  totalMarks: number;
  _count?: {
    attempts: number;
  };
}

export default function QuizLeaderboardPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<QuizDetails | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        
        // Fetch Quiz Details
        const quizRes = await fetch(`${apiUrl}/api/quizzes/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (quizRes.ok) {
          setQuiz(await quizRes.json());
        }

        // Fetch Leaderboard
        const lbRes = await fetch(`${apiUrl}/api/quizzes/${params.id}/leaderboard?limit=100`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });

        if (lbRes.ok) {
          setLeaderboard(await lbRes.json());
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load leaderboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const filteredLeaderboard = leaderboard.filter(entry => 
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (rank === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (rank === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-white text-gray-600 border-gray-100';
  };

  const handleExport = () => {
    // Simple CSV export
    const headers = ['Rank,Name,Email,Score,Total Marks,Percentage,Time Taken,Date\n'];
    const rows = leaderboard.map(e => 
      `${e.rank},"${e.name}",${e.email},${e.score},${e.totalMarks},${e.percentage}%,${e.timeTaken}s,${new Date(e.attemptedAt).toLocaleDateString()}`
    );
    
    const blob = new Blob([...headers, ...rows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz_${params.id}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Quiz Not Found</h1>
        <button onClick={() => router.back()} className="btn btn-primary mt-4">
          Go Back
        </button>
      </div>
    );
  }

  // Calculate stats
  const totalAttempts = leaderboard.length;
  const avgScore = totalAttempts > 0 
    ? (leaderboard.reduce((acc, curr) => acc + curr.percentage, 0) / totalAttempts).toFixed(1)
    : 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-sm text-muted-text hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </button>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            {quiz.title} Results
          </h1>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="btn btn-outline flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-text">Total Attempts</p>
            <p className="text-2xl font-bold">{totalAttempts}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-full">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-text">Average Score</p>
            <p className="text-2xl font-bold">{avgScore}%</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-full">
             <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-muted-text">Fastest Time</p>
            <p className="text-2xl font-bold">
              {leaderboard.length > 0 ? formatTime(Math.min(...leaderboard.map(l => l.timeTaken))) : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-text w-4 h-4" />
        <input 
          type="text" 
          placeholder="Search student by name or email..." 
          className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Leaderboard Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-muted-text uppercase">Rank</th>
                <th className="px-6 py-3 text-xs font-semibold text-muted-text uppercase">Student</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-text uppercase">Score</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-text uppercase">Percentage</th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-muted-text uppercase">Time</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-text uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeaderboard.length > 0 ? (
                filteredLeaderboard.map((entry) => (
                  <tr key={entry.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getRankBadge(entry.rank)}`}>
                        {entry.rank}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                          {entry.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{entry.name}</p>
                          <p className="text-xs text-muted-text">{entry.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-sm">
                      <span className="font-bold">{entry.score}</span>
                      <span className="text-muted-text text-xs">/{entry.totalMarks}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        entry.percentage >= 80 ? 'bg-green-100 text-green-700' :
                        entry.percentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {entry.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-muted-text">
                      {formatTime(entry.timeTaken)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-muted-text whitespace-nowrap">
                       <span title={new Date(entry.attemptedAt).toLocaleString()}>
                         {new Date(entry.attemptedAt).toLocaleDateString()}
                       </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-text">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 mb-2 opacity-50" />
                      <p>No results found matching your search.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
