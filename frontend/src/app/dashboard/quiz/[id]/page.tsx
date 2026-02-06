'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/apiUrl';
import { useQuizContext } from '@/context/QuizContext';

interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  imageUrl?: string;
  marks: number;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  timeLimit: number;
  totalMarks: number;
  maxAttempts: number;
  questions: QuizQuestion[];
  club: {
    id: number;
    name: string;
  };
}

interface UserAttempt {
  id: number;
  score: number;
  totalMarks: number;
  percentage: number;
  timeTaken: number;
  attemptCount: number;
  isPassed: boolean;
}

export default function QuizPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const getToken = useAuthStore((state) => state.getToken);
  const token = getToken();
  const { setQuizInProgress } = useQuizContext();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [cheatingWarnings, setCheatingWarnings] = useState(0);
  const [userAttempt, setUserAttempt] = useState<UserAttempt | null>(null);
  const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const submittingRef = useRef(false);

  // Fetch quiz data and user's attempt status
  useEffect(() => {
    const fetchQuizAndAttempt = async () => {
      try {
        const apiUrl = getApiUrl();
        
        // Fetch quiz data
        const quizResponse = await fetch(`${apiUrl}/api/quizzes/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!quizResponse.ok) {
          throw new Error('Failed to fetch quiz');
        }

        const quizData = await quizResponse.json();
        setQuiz(quizData);
        setTimeLeft(quizData.timeLimit * 60);

        // Fetch user's attempt status
        try {
          const attemptResponse = await fetch(`${apiUrl}/api/quizzes/${params.id}/my-attempt`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (attemptResponse.ok) {
            const attemptData = await attemptResponse.json();
            if (attemptData) {
              setUserAttempt(attemptData);
            }
          }
        } catch (attemptError) {
          // User hasn't attempted the quiz yet - this is fine
          console.log('No previous attempt found');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchQuizAndAttempt();
    }
  }, [params.id, token]);

  // Fullscreen and anti-cheating enforcement
  useEffect(() => {
    if (!started || submitted) return;

    const enterFullscreen = async () => {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error('Failed to enter fullscreen:', err);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && started && !submitted) {
        setCheatingWarnings(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            toast.error('Multiple fullscreen exits detected. Quiz will be auto-submitted.');
            handleSubmit();
          } else {
            toast.warning(`Warning ${newCount}/3: Please stay in fullscreen mode. Exiting fullscreen is considered cheating.`);
            enterFullscreen();
          }
          return newCount;
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && started && !submitted) {
        setCheatingWarnings(prev => {
          const newCount = prev + 1;
          if (newCount >= 3) {
            toast.error('Multiple tab switches detected. Quiz will be auto-submitted.');
            handleSubmit();
          } else {
            toast.warning(`Warning ${newCount}/3: Tab switching is not allowed during the quiz.`);
          }
          return newCount;
        });
      }
    };

    const handleBlur = () => {
      if (started && !submitted) {
        setCheatingWarnings(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            toast.error('Multiple focus changes detected. Quiz will be auto-submitted.');
            handleSubmit();
          }
          return newCount;
        });
      }
    };

    // Enter fullscreen when quiz starts
    enterFullscreen();

    // Add event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Prevent right-click
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);

    // Prevent common keyboard shortcuts
    const preventShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' || // DevTools
        (e.ctrlKey && e.shiftKey && e.key === 'I') || // DevTools
        (e.ctrlKey && e.shiftKey && e.key === 'J') || // Console
        (e.ctrlKey && e.key === 'u') || // View source
        (e.metaKey && e.altKey && e.key === 'i') // Mac DevTools
      ) {
        e.preventDefault();
        toast.warning('This action is not allowed during the quiz.');
      }
    };
    document.addEventListener('keydown', preventShortcuts);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventShortcuts);
      
      // Exit fullscreen when component unmounts
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    };
  }, [started, submitted]);

  const handleStartQuiz = () => {
    setStarted(true);
    setQuizInProgress(true); // Hide sidebar
    // Start timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleRetakeQuiz = () => {
    // Reset states for retake
    setAnswers({});
    setCurrentQuestion(0);
    setSubmitted(false);
    setResult(null);
    setCheatingWarnings(0);
    setShowRetakeConfirm(false);
    if (quiz) {
      setTimeLeft(quiz.timeLimit * 60);
    }
    handleStartQuiz();
  };

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });
  };

  const handleNext = () => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (submittingRef.current || submitting || !quiz) return;
    submittingRef.current = true;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setSubmitting(true);

    try {
      const apiUrl = getApiUrl();
      console.log('Submitting quiz with answers:', answers);
      
      const response = await fetch(`${apiUrl}/api/quizzes/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answers }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit quiz');
      }

      setResult(data);
      setSubmitted(true);
      setQuizInProgress(false); // Show sidebar again

      // Update userAttempt with new data
      setUserAttempt({
        id: data.id,
        score: data.score,
        totalMarks: data.totalMarks,
        percentage: data.percentage,
        timeTaken: data.timeTaken,
        attemptCount: data.attemptCount || 1,
        isPassed: data.isPassed,
      });

      // Exit fullscreen after submission
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }

      // Fetch leaderboard
      const leaderboardResponse = await fetch(`${apiUrl}/api/quizzes/${params.id}/leaderboard?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (leaderboardResponse.ok) {
        const leaderboardData = await leaderboardResponse.json();
        setLeaderboard(leaderboardData);
      }
      
      toast.success('Quiz submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      toast.error(error.message || 'Failed to submit quiz. Please try again.');
      setSubmitting(false);
      submittingRef.current = false;
      setQuizInProgress(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup timer and quiz state on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setQuizInProgress(false); // Reset sidebar visibility on unmount
    };
  }, [setQuizInProgress]);

  // Check if user can retake the quiz
  const canRetake = quiz && userAttempt && 
    quiz.maxAttempts > 1 && 
    userAttempt.attemptCount < quiz.maxAttempts;

  const attemptsRemaining = quiz && userAttempt 
    ? quiz.maxAttempts - userAttempt.attemptCount 
    : quiz?.maxAttempts || 1;

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-text">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto card text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p className="text-muted-text mb-6">The quiz you're looking for doesn't exist.</p>
          <button onClick={() => router.back()} className="btn btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!started) {
    // Check if user has already attempted and cannot retake
    const hasAttempted = userAttempt && userAttempt.attemptCount > 0;
    const canStartQuiz = !hasAttempted || canRetake;

    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto card">
          <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
          <p className="text-muted-text mb-6">{quiz.description}</p>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-muted-text">Club:</span>
              <span className="font-semibold">{quiz.club.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-text">Questions:</span>
              <span className="font-semibold">{quiz.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-text">Total Marks:</span>
              <span className="font-semibold">{quiz.totalMarks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-text">Time Limit:</span>
              <span className="font-semibold">{quiz.timeLimit} minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-text">Allowed Attempts:</span>
              <span className="font-semibold">{quiz.maxAttempts}</span>
            </div>
            {hasAttempted && (
              <div className="flex justify-between">
                <span className="text-muted-text">Your Attempts:</span>
                <span className="font-semibold">{userAttempt.attemptCount} / {quiz.maxAttempts}</span>
              </div>
            )}
          </div>

          {/* Show previous attempt details if user has attempted */}
          {hasAttempted && (
            <div className="mb-6 p-4 bg-muted-bg rounded-lg border border-border">
              <h3 className="font-semibold mb-3">📊 Your Previous Attempt</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-text">Score:</span>
                  <span className="font-semibold">{userAttempt.score} / {userAttempt.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">Percentage:</span>
                  <span className="font-semibold">{Math.round(userAttempt.percentage)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">Status:</span>
                  <span className={`font-semibold ${userAttempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {userAttempt.isPassed ? '✓ Passed' : '✗ Failed'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-text">Time Taken:</span>
                  <span className="font-semibold">
                    {Math.floor(userAttempt.timeTaken / 60)}:{(userAttempt.timeTaken % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Retake confirmation modal */}
          {showRetakeConfirm && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">⚠️ Confirm Retake</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                Are you sure you want to retake this quiz? You have {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining.
                Your new score will replace your previous score.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetakeQuiz}
                  className="flex-1 btn btn-primary"
                >
                  Yes, Retake Quiz
                </button>
                <button
                  onClick={() => setShowRetakeConfirm(false)}
                  className="flex-1 btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          {!showRetakeConfirm && (
            <>
              {!hasAttempted ? (
                <button
                  onClick={handleStartQuiz}
                  className="w-full btn btn-primary"
                >
                  Start Quiz →
                </button>
              ) : canRetake ? (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowRetakeConfirm(true)}
                    className="w-full btn btn-primary"
                  >
                    🔄 Retake Quiz ({attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining)
                  </button>
                  <button
                    onClick={() => router.back()}
                    className="w-full btn btn-outline"
                  >
                    Back to Club
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center">
                    <p className="text-muted-text">
                      You have used all {quiz.maxAttempts} attempt{quiz.maxAttempts !== 1 ? 's' : ''} for this quiz.
                    </p>
                  </div>
                  <button
                    onClick={() => router.back()}
                    className="w-full btn btn-primary"
                  >
                    Back to Club
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (submitted && result) {
    const percentage = Math.round((result.score / result.totalMarks) * 100);
    const userEntry = leaderboard.find(entry => entry.userId === result.userId);
    const userRank = userEntry?.rank || 0;
    
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Results Card */}
          <div className="card">
            <div className="text-center space-y-6">
              <h1 className="text-3xl font-bold">Quiz Submitted! ✓</h1>
              <div className="text-6xl font-bold text-primary">{percentage}%</div>
              <p className="text-muted-text">
                You scored {result.score} out of {result.totalMarks} marks
              </p>
              <p className="text-sm text-muted-text">
                Time taken: {Math.floor(result.timeTaken / 60)}:{(result.timeTaken % 60).toString().padStart(2, '0')}
              </p>
              {userRank > 0 && (
                <p className="text-lg font-semibold text-primary">
                  🏆 Your Rank: #{userRank}
                </p>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="card">
              <h2 className="text-2xl font-bold mb-6">🏆 Quiz Leaderboard</h2>
              <p className="text-sm text-muted-text mb-4">
                {leaderboard.length} student{leaderboard.length !== 1 ? 's' : ''} took this quiz
              </p>
              <div className="space-y-2">
                {leaderboard.map((entry, index) => (
                  <div
                    key={entry.userId || index}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      entry.userId === result.userId
                        ? 'bg-primary/10 border-primary'
                        : 'border-border hover:bg-muted-bg'
                    } transition-colors`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-600' :
                        'text-muted-text'
                      }`}>
                        #{entry.rank || (index + 1)}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {entry.name}
                          {entry.userId === result.userId && (
                            <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded">You</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-text">{entry.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{entry.score}</p>
                      <p className="text-sm text-muted-text">{Math.round(entry.percentage)}%</p>
                      <p className="text-xs text-muted-text">
                        {Math.floor(entry.timeTaken / 60)}:{(entry.timeTaken % 60).toString().padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Show retake option if available */}
            {canRetake && (
              <button 
                onClick={() => {
                  setSubmitted(false);
                  setResult(null);
                  setShowRetakeConfirm(true);
                }}
                className="w-full btn btn-primary bg-green-600 hover:bg-green-700"
              >
                🔄 Retake Quiz ({attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining)
              </button>
            )}
            <button 
              onClick={() => router.push(`/dashboard/clubs/${quiz.club.id}`)}
              className={`w-full btn ${canRetake ? 'btn-outline' : 'btn-primary'}`}
            >
              Back to Club
            </button>
            <button
              onClick={() => router.push('/dashboard/leaderboards')}
              className="w-full btn btn-outline"
            >
              View Global Leaderboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-xl font-bold">{quiz.title}</h1>
          <div className={`font-semibold ${timeLeft < 60 ? 'text-red-600' : ''}`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <p className="text-sm text-muted-text mb-2">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{
                width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold flex-1">{question.text}</h2>
            <span className="text-sm font-semibold text-primary ml-4">{question.marks} marks</span>
          </div>

          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Question"
              className="mb-6 rounded-lg max-h-64 w-full object-contain"
            />
          )}

          <div className="space-y-2">
            {question.options.map((option, index) => (
              <label
                key={index}
                className="flex items-center p-4 border border-border rounded-lg cursor-pointer hover:bg-muted-bg transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answers[question.id] === index}
                  onChange={() => handleAnswer(question.id, index)}
                  className="mr-3"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1 btn btn-outline disabled:opacity-50"
          >
            ← Previous
          </button>
          {currentQuestion < quiz.questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 btn btn-primary"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          )}
        </div>

        {/* Question Indicators */}
        <div className="mt-6 flex flex-wrap gap-2">
          {quiz.questions.map((q, index) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded text-xs font-semibold transition-colors ${
                index === currentQuestion
                  ? 'bg-primary text-white'
                  : answers[q.id] !== undefined
                    ? 'bg-green-500 text-white'
                    : 'bg-border'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
