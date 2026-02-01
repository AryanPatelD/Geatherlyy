'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/apiUrl';

export default function QuizzesPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/quizzes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data.filter((q: any) => q.isActive));
        }
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

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
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Available Quizzes</h1>
        <p className="text-muted-text">Test your knowledge with our quizzes</p>
      </div>

      {quizzes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No quizzes available</h3>
          <p className="text-muted-text">Check back later for new quizzes</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="card hover:border-primary transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/quizzes/${quiz.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">{quiz.title}</h3>
                  <p className="text-sm text-muted-text">{quiz.club?.name}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                  Active
                </span>
              </div>

              {quiz.description && (
                <p className="text-sm text-muted-text mb-4 line-clamp-2">
                  {quiz.description}
                </p>
              )}

              <div className="flex gap-4 text-sm text-muted-text mb-4">
                <div className="flex items-center gap-1">
                  <span>📝</span>
                  <span>{quiz._count?.questions || 0} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>{quiz.timeLimit} min</span>
                </div>
              </div>

              <button className="w-full btn btn-primary">
                Start Quiz
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
