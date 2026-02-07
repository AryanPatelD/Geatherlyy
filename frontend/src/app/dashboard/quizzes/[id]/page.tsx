'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { getApiUrl } from '@/lib/apiUrl';

// Cookie helper functions
const setCookie = (name: string, value: string, hours: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + hours * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};

export default function QuizTakePage({ params }: { params: { id: string } }) {

  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number | number[] }>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  
  // Fullscreen and anti-cheat states
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violations, setViolations] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const quizContainerRef = useRef<HTMLDivElement>(null);
  const MAX_VIOLATIONS = 3;

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/quizzes/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
          setTimeRemaining(data.timeLimit * 60); // Convert minutes to seconds
        } else {
          console.error('Failed to fetch quiz');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id]);

  useEffect(() => {
    if (quizStarted && timeRemaining > 0 && !quizSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quizStarted, timeRemaining, quizSubmitted]);

  // Fullscreen and anti-cheat effect
  useEffect(() => {
    if (!quizStarted || quizSubmitted) return;

    // Set cookie when quiz starts
    setCookie(`quiz_in_progress_${params.id}`, 'true', 2);

    // Enter fullscreen
    const enterFullscreen = async () => {
      try {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error('Could not enter fullscreen:', err);
      }
    };

    enterFullscreen();

    // Handle fullscreen change
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement
      );
      
      setIsFullscreen(isCurrentlyFullscreen);
      
      // Check if cookie still exists (if destroyed, allow exit)
      const cookieExists = getCookie(`quiz_in_progress_${params.id}`);
      
      if (!isCurrentlyFullscreen && !quizSubmitted && cookieExists) {
        // User exited fullscreen - record violation
        setViolations(prev => {
          const newCount = prev + 1;
          if (newCount >= MAX_VIOLATIONS) {
            setWarningMessage(`You have exceeded the maximum number of violations (${MAX_VIOLATIONS}). Your quiz will be submitted automatically.`);
            setShowWarningModal(true);
            setTimeout(async () => {
              await handleSubmit();
              // Redirect to dashboard after violation limit exceeded
              router.push('/dashboard');
            }, 2000);
          } else {
            setWarningMessage(`Warning: You exited fullscreen mode. Violation ${newCount}/${MAX_VIOLATIONS}. Please return to fullscreen to continue.`);
            setShowWarningModal(true);
          }
          return newCount;
        });
        
        // Try to re-enter fullscreen
        setTimeout(() => {
          enterFullscreen();
        }, 1000);
      }
    };

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden && !quizSubmitted) {
        const cookieExists = getCookie(`quiz_in_progress_${params.id}`);
        if (cookieExists) {
          setViolations(prev => {
            const newCount = prev + 1;
            if (newCount >= MAX_VIOLATIONS) {
              setWarningMessage(`You have exceeded the maximum number of violations (${MAX_VIOLATIONS}). Your quiz will be submitted automatically.`);
              setShowWarningModal(true);
              setTimeout(async () => {
                await handleSubmit();
                // Redirect to dashboard after violation limit exceeded
                router.push('/dashboard');
              }, 2000);
            } else {
              setWarningMessage(`Warning: Tab switching detected! Violation ${newCount}/${MAX_VIOLATIONS}. Stay on this page.`);
              setShowWarningModal(true);
            }
            return newCount;
          });
        }
      }
    };

    // Handle window blur (losing focus)
    const handleWindowBlur = () => {
      if (!quizSubmitted) {
        const cookieExists = getCookie(`quiz_in_progress_${params.id}`);
        if (cookieExists) {
          setViolations(prev => {
            const newCount = prev + 1;
            if (newCount >= MAX_VIOLATIONS) {
              setWarningMessage(`You have exceeded the maximum number of violations (${MAX_VIOLATIONS}). Your quiz will be submitted automatically.`);
              setShowWarningModal(true);
              setTimeout(async () => {
                await handleSubmit();
                // Redirect to dashboard after violation limit exceeded
                router.push('/dashboard');
              }, 2000);
            } else {
              setWarningMessage(`Warning: Window focus lost! Violation ${newCount}/${MAX_VIOLATIONS}. Do not switch windows.`);
              setShowWarningModal(true);
            }
            return newCount;
          });
        }
      }
    };

    // Prevent keyboard shortcuts for tab switching
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Alt+Tab, Ctrl+Tab, etc.
      if (
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && e.key === 'Tab') ||
        (e.key === 'Escape') ||
        (e.key === 'F11')
      ) {
        e.preventDefault();
        setWarningMessage('Keyboard shortcuts are disabled during the quiz.');
        setShowWarningModal(true);
      }
    };

    // Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [quizStarted, quizSubmitted, params.id]);

  // Exit fullscreen when quiz is submitted
  useEffect(() => {
    if (quizSubmitted) {
      // Delete the cookie
      deleteCookie(`quiz_in_progress_${params.id}`);
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error('Could not exit fullscreen:', err));
      }
    }
  }, [quizSubmitted, params.id]);

  const handleSubmit = async () => {
    if (quizSubmitted) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      

      
      const response = await fetch(`${apiUrl}/api/quizzes/${params.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setQuizSubmitted(true);
        
        // Fetch leaderboard after submission
        fetchLeaderboard();
      } else {
        const errorData = await response.json();
        console.error('Quiz submission failed:', errorData);
        alert(`Failed to submit quiz: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Error submitting quiz. Please try again.');
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/quizzes/${params.id}/leaderboard?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFlag = (questionId: number) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">Quiz not found</h3>
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

  if (!quizStarted) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-muted-text">{quiz.description}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">{quiz.questions?.length || 0}</p>
              <p className="text-sm text-muted-text">Questions</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">{quiz.timeLimit}</p>
              <p className="text-sm text-muted-text">Minutes</p>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <p className="text-2xl font-bold text-primary">{quiz.totalMarks || quiz.questions?.length || 0}</p>
              <p className="text-sm text-muted-text">Total Marks</p>
            </div>
          </div>

          <div className="space-y-3 mb-6 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5" />
              <p>You can navigate between questions using the navigation buttons</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircledIcon className="w-5 h-5 text-green-500 mt-0.5" />
              <p>Timer will start once you begin the quiz</p>
            </div>
            <div className="flex items-start gap-2">
              <CrossCircledIcon className="w-5 h-5 text-red-500 mt-0.5" />
              <p>Quiz will auto-submit when time runs out</p>
            </div>
          </div>

          {/* Fullscreen and Anti-Cheat Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 flex items-center gap-2">
              <span>⚠️</span> Important Quiz Rules
            </h4>
            <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• The quiz will open in <strong>fullscreen mode</strong></li>
              <li>• <strong>Do not switch tabs</strong> or windows during the quiz</li>
              <li>• <strong>Do not exit fullscreen</strong> until the quiz is submitted</li>
              <li>• You have <strong>3 violations</strong> before auto-submission</li>
              <li>• Right-click and keyboard shortcuts are disabled</li>
            </ul>
          </div>

          <button
            onClick={() => setQuizStarted(true)}
            className="w-full btn btn-primary py-3 text-lg"
          >
            🚀 Start Quiz in Fullscreen
          </button>
        </div>
      </div>
    );
  }

  if (quizSubmitted && result) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          {/* Results Card */}
          <div className="card text-center">
            <div className="text-4xl md:text-6xl mb-4">🎉</div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Quiz Completed!</h1>
            <p className="text-muted-text text-sm md:text-base mb-4 md:mb-6">Your answers have been recorded</p>

            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-xl md:text-3xl font-bold text-green-600">{result.score || 0}</p>
                <p className="text-xs md:text-sm text-muted-text">Score</p>
              </div>
              <div className="p-2 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xl md:text-3xl font-bold text-blue-600">{result.correctAnswers || 0}/{quiz.questions?.length || 0}</p>
                <p className="text-xs md:text-sm text-muted-text">Correct</p>
              </div>
              <div className="p-2 md:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-xl md:text-3xl font-bold text-purple-600">{result.percentage || 0}%</p>
                <p className="text-xs md:text-sm text-muted-text">Accuracy</p>
              </div>
            </div>

            {/* Detailed Results Analysis */}
            {result.details && (
              <div className="mt-8 text-left space-y-4 mb-8">
                <h3 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
                  <span>📝</span> Review Answers
                </h3>
                {result.details.map((detail: any, index: number) => {
                  const question = quiz.questions?.find((q: any) => q.id === detail.questionId) || quiz.questions?.[index];
                  return (
                    <div key={index} className={`p-4 rounded-lg border ${detail.isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/10' : 'bg-red-50 border-red-200 dark:bg-red-900/10'}`}>
                      <div className="flex justify-between items-start mb-2">
                         <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200">
                           <span className="text-muted-text mr-2">Q{index + 1}.</span>
                           {detail.questionText}
                         </h4>
                         <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${detail.isCorrect ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                           {detail.isCorrect ? 'Correct' : 'Incorrect'}
                         </span>
                      </div>
                      
                      <div className="space-y-2 text-sm bg-white/50 dark:bg-black/20 p-3 rounded-lg mt-3">
                         <div className="flex flex-col sm:flex-row sm:gap-4">
                           <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">Your Answer:</span>
                           <span className={`font-medium ${detail.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {Array.isArray(detail.userAnswer) 
                                  ? (detail.userAnswer.length > 0 
                                      ? detail.userAnswer.map((i: any) => question?.options?.[parseInt(i)]).join(', ') 
                                      : 'No answer selected')
                                  : (detail.userAnswer !== undefined 
                                      ? question?.options?.[parseInt(detail.userAnswer)] 
                                      : 'Skipped')}
                           </span>
                         </div>
                         {!detail.isCorrect && (
                           <div className="flex flex-col sm:flex-row sm:gap-4 border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                              <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[100px]">Correct Answer:</span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {detail.correctAnswer.map((i: any) => question?.options?.[parseInt(i)]).join(', ')}
                              </span>
                           </div>
                         )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-2 md:gap-3">
              <button
                onClick={() => router.push('/dashboard/quizzes')}
                className="flex-1 btn btn-outline"
              >
                More Quizzes
              </button>
              <button
                onClick={() => router.push('/dashboard/leaderboard')}
                className="flex-1 btn btn-primary"
              >
                View Global Leaderboard
              </button>
            </div>
          </div>

          {/* Quiz Leaderboard */}
          <div className="card">
            <div className="p-4 border-b border-border">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🏆</span>
                Quiz Leaderboard
              </h2>
              <p className="text-sm text-muted-text">Top performers in this quiz</p>
            </div>
            <div className="p-4">
              {leaderboard.length === 0 ? (
                <p className="text-center text-muted-text py-8">Be the first to take this quiz!</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, index) => (
                    <div
                      key={entry.userId}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20' : 'bg-muted/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {entry.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{entry.name}</p>
                        <p className="text-xs text-muted-text">{entry.percentage.toFixed(1)}% • {entry.timeTaken}s</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{entry.score}</p>
                        <p className="text-xs text-muted-text">pts</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button
                onClick={() => router.push(`/dashboard/clubs/${quiz.clubId}`)}
                className="w-full mt-4 btn btn-outline text-sm"
              >
                View Club Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const question = quiz.questions?.[currentQuestion];
  const totalQuestions = quiz.questions?.length || 0;
  // Count answered questions - for multiple choice, only count if at least one option is selected
  const answeredCount = Object.entries(answers).filter(([_, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined;
  }).length;

  return (
    <div ref={quizContainerRef} className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-pulse">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                Violation Detected!
              </h2>
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                {warningMessage}
              </p>
              <div className="flex items-center justify-center gap-2 mb-6">
                {Array.from({ length: MAX_VIOLATIONS }, (_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full ${
                      i < violations ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => setShowWarningModal(false)}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
              >
                I Understand - Continue Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violation Counter - Always visible during quiz */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className={`px-4 py-2 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${
          violations === 0 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : violations < MAX_VIOLATIONS
            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          <span>🛡️</span>
          Violations: {violations}/{MAX_VIOLATIONS}
        </div>
      </div>

      {/* Fullscreen status indicator */}
      {!isFullscreen && quizStarted && !quizSubmitted && (
        <div className="fixed top-4 left-4 z-40">
          <div className="px-4 py-2 rounded-xl shadow-lg text-sm font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
            ⛶ Not in Fullscreen
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Question {currentQuestion + 1} of {totalQuestions}
                </p>
                <span className="text-sm text-gray-500">•</span>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {answeredCount} answered
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className={`px-5 py-2.5 rounded-xl font-bold text-lg shadow-md ${
                timeRemaining < 60 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse' 
                  : timeRemaining < 300
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                ⏱️ {formatTime(timeRemaining)}
              </div>
              <button
                onClick={handleSubmit}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Submit & End
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar - Shows answered questions */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-green-600 to-emerald-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[80px] text-right">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Question {currentQuestion + 1}
              </span>
              <button
                onClick={() => toggleFlag(question?.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  flaggedQuestions.has(question?.id)
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {flaggedQuestions.has(question?.id) ? '🚩 Flagged' : '🏳️ Flag for Review'}
              </button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-relaxed">
              {question?.text}
            </h2>
          </div>

          {question?.imageUrl && (
            <div className="mb-8 bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
              <img
                src={question.imageUrl}
                alt="Question"
                className="max-w-full max-h-96 mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          {/* Show question type indicator */}
          {question?.type === 'MULTIPLE_ANSWER' && (
            <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              ℹ️ This question allows multiple answers. Select all that apply.
            </div>
          )}

          <div className="space-y-3">
            {question?.options?.map((option: string, index: number) => {
              const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
              const isMultipleChoice = question?.type === 'MULTIPLE_ANSWER';
              
              // Check if this option is selected
              const currentAnswer = answers[question.id];
              const isSelected = isMultipleChoice
                ? Array.isArray(currentAnswer) && currentAnswer.includes(index)
                : currentAnswer === index;
              
              const handleOptionClick = () => {
                if (isMultipleChoice) {
                  // Multiple choice: toggle the option
                  const currentSelections = Array.isArray(currentAnswer) ? currentAnswer : [];
                  if (currentSelections.includes(index)) {
                    // Remove the option
                    setAnswers({ ...answers, [question.id]: currentSelections.filter(i => i !== index) });
                  } else {
                    // Add the option
                    setAnswers({ ...answers, [question.id]: [...currentSelections, index] });
                  }
                } else {
                  // Single choice: select only this option
                  setAnswers({ ...answers, [question.id]: index });
                }
              };
              
              return (
                <button
                  type="button"
                  key={index}
                  onClick={handleOptionClick}
                  className={`w-full text-left p-5 rounded-xl border-2 transition-all transform hover:scale-[1.01] ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Show checkbox for multiple choice, radio for single */}
                    <div className={`w-10 h-10 ${isMultipleChoice ? 'rounded-lg' : 'rounded-full'} border-2 flex items-center justify-center font-bold text-sm ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                      {isSelected ? '✓' : optionLabels[index]}
                    </div>
                    <span className={`flex-1 text-base ${
                      isSelected 
                        ? 'text-gray-900 dark:text-white font-medium' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="space-y-4">
          {/* Question Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">
              Question Navigation
            </h3>
            <div className="grid grid-cols-10 gap-2">
              {Array.from({ length: totalQuestions }, (_, i) => {
                const questionId = quiz.questions[i]?.id;
                const questionAnswer = answers[questionId];
                // Check if answered: for single choice it's a number, for multiple choice it's an array with at least one item
                const isAnswered = questionAnswer !== undefined && 
                  (Array.isArray(questionAnswer) ? questionAnswer.length > 0 : true);
                const isCurrent = i === currentQuestion;
                const isFlagged = flaggedQuestions.has(questionId);
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentQuestion(i)}
                    className={`relative h-12 rounded-lg font-semibold transition-all transform hover:scale-105 ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 dark:ring-blue-500'
                        : isAnswered
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {i + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 text-xs">🚩</span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30"></div>
                <span className="text-gray-600 dark:text-gray-400">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700"></div>
                <span className="text-gray-600 dark:text-gray-400">Not Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Current</span>
              </div>
            </div>
          </div>

          {/* Previous/Next Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              className="px-8 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              ← Previous Question
            </button>

            <button
              onClick={() => setCurrentQuestion(Math.min(totalQuestions - 1, currentQuestion + 1))}
              disabled={currentQuestion === totalQuestions - 1}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all"
            >
              Next Question →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
