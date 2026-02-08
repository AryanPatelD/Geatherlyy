'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/apiUrl';
import { useClubContext } from '@/context/ClubContext';

export default function QuizzesPage() {
  const router = useRouter();
  const { selectedClubId, myClubs, isLoading: clubContextLoading } = useClubContext();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for myClubs to be loaded
    if (clubContextLoading) return;

    const fetchQuizzes = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        
        // If a specific club is selected, fetch only for that club
        const query = selectedClubId ? `?clubId=${selectedClubId}` : '';
        
        const response = await fetch(`${apiUrl}/api/quizzes${query}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          
          let filteredQuizzes = data.filter((q: any) => q.isActive);

          // If "All My Clubs" is selected, filter to only show quizzes from clubs I've joined
          if (!selectedClubId) {
             const myClubIds = new Set(myClubs.map(c => c.id));
             filteredQuizzes = filteredQuizzes.filter((q: any) => myClubIds.has(q.clubId));
          }
          
          setQuizzes(filteredQuizzes);
        }
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [selectedClubId, myClubs, clubContextLoading]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Available Quizzes</h1>
        <p className="text-muted-text">Test your knowledge with our quizzes</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="card text-center py-8 md:py-12">
          <div className="text-5xl md:text-6xl mb-4">📝</div>
          <h3 className="text-lg md:text-xl font-semibold mb-2">No quizzes available</h3>
          <p className="text-muted-text text-sm md:text-base">Check back later for new quizzes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="card hover:border-primary transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/quizzes/${quiz.id}`)}
            >
              <div className="flex items-start justify-between mb-3 md:mb-4">
                <div className="min-w-0 flex-1 mr-2">
                  <h3 className="font-bold text-base md:text-lg mb-1 truncate">{quiz.title}</h3>
                  <p className="text-xs md:text-sm text-muted-text truncate">{quiz.club?.name}</p>
                </div>
                <span className="px-2 md:px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] md:text-xs rounded-full font-medium whitespace-nowrap">
                  Active
                </span>
              </div>

              {quiz.description && (
                <p className="text-xs md:text-sm text-muted-text mb-3 md:mb-4 line-clamp-2">
                  {quiz.description}
                </p>
              )}

              <div className="flex gap-3 md:gap-4 text-xs md:text-sm text-muted-text mb-3 md:mb-4">
                <div className="flex items-center gap-1">
                  <span>📝</span>
                  <span>{quiz._count?.questions || 0} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>{quiz.timeLimit} min</span>
                </div>
              </div>

              <button className="w-full btn btn-primary text-sm md:text-base py-2 md:py-2.5">
                Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
