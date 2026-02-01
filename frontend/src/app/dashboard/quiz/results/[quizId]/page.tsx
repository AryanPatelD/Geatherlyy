'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { getApiUrl } from '@/lib/apiUrl';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string[];
  marks: number;
  order: number;
}

interface QuizAttempt {
  id: number;
  score: number;
  totalMarks: number;
  percentage: number;
  answers: Record<string, number>; // JSON object: questionId -> selectedOptionIndex
  attemptedAt: string;
  quiz: {
    id: number;
    title: string;
    description: string;
    questions: Question[];
  };
}

export default function QuizResultPage({
  params,
}: {
  params: { quizId: string };
}) {
  const router = useRouter();
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/quizzes/${params.quizId}/my-attempt`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAttempt(data);
        } else {
            // If no attempt found or error, redirect back
            console.error('Failed to fetch attempt');
        }
      } catch (error) {
        console.error('Error fetching attempt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [params.quizId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-text">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!attempt) {
     return (
        <div className="p-8 flex flex-col items-center justify-center min-h-screen space-y-4">
            <h1 className="text-2xl font-bold">No Attempt Found</h1>
            <p className="text-muted-text">You haven't taken this quiz yet.</p>
            <button 
                onClick={() => router.back()}
                className="px-4 py-2 bg-primary text-white rounded-lg"
            >
                Go Back
            </button>
        </div>
     )
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-text hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Profile
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-border p-8 shadow-sm text-center">
          <h1 className="text-3xl font-bold mb-2">{attempt.quiz.title}</h1>
          <p className="text-muted-text mb-6">Result Summary</p>
          
          <div className="flex justify-center gap-8 md:gap-16">
            <div>
                <div className={`text-4xl font-bold mb-1 ${
                    attempt.percentage >= 80 ? 'text-green-600' :
                    attempt.percentage >= 60 ? 'text-yellow-600' :
                    'text-red-600'
                }`}>
                    {Math.round(attempt.percentage)}%
                </div>
                <p className="text-sm text-muted-text">Score</p>
            </div>
            <div>
                <div className="text-4xl font-bold mb-1 text-foreground">
                    {attempt.score}/{attempt.totalMarks}
                </div>
                <p className="text-sm text-muted-text">Marks</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
            <h2 className="text-xl font-bold">Detailed Review</h2>
            {attempt.quiz.questions.map((question, index) => {
                const userAnswerIndex = attempt.answers[question.id];
                // correctAnswer is string[] from backend["0"]
                const correctAnsIndices = question.correctAnswer.map(Number); 
                const isCorrect = correctAnsIndices.includes(userAnswerIndex);
                
                return (
                    <div key={question.id} className={`p-6 rounded-xl border ${
                        isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800' : 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800'
                    }`}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-medium">
                                <span className="text-muted-text mr-2">{index + 1}.</span>
                                {question.text}
                            </h3>
                            {isCorrect ? (
                                <span className="flex items-center gap-1 text-green-600 font-medium text-sm bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full">
                                    <CheckCircledIcon className='w-4 h-4'/> Correct (+{question.marks})
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-red-600 font-medium text-sm bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full">
                                    <CrossCircledIcon className='w-4 h-4'/> Wrong (0)
                                </span>
                            )}
                        </div>

                        <div className="space-y-3">
                            {question.options.map((option, optIndex) => {
                                const isSelected = userAnswerIndex === optIndex;
                                const isCorrectOption = correctAnsIndices.includes(optIndex);

                                let optionClass = "p-3 rounded-lg border flex justify-between items-center ";
                                if (isCorrectOption) {
                                    optionClass += "bg-green-100 border-green-300 text-green-800 dark:bg-green-800/30 dark:border-green-700 dark:text-green-300";
                                } else if (isSelected && !isCorrectOption) {
                                    optionClass += "bg-red-100 border-red-300 text-red-800 dark:bg-red-800/30 dark:border-red-700 dark:text-red-300";
                                } else {
                                    optionClass += "bg-background border-border opacity-70";
                                }

                                return (
                                    <div key={optIndex} className={optionClass}>
                                        <span>{option}</span>
                                        {isSelected && <span className="text-xs font-bold uppercase tracking-wider">Your Answer</span>}
                                        {isCorrectOption && !isSelected && <span className="text-xs font-bold uppercase tracking-wider">Correct Answer</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
}
