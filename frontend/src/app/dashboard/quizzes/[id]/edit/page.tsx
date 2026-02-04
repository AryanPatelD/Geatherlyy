'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, CheckIcon, ArrowLeftIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/apiUrl';

interface Question {
  id?: number;
  text: string;
  options: string[];
  correctAnswer: number | number[];
  marks: number;
  type: 'single' | 'multiple';
  imageUrl?: string | null;
}

export default function EditQuizPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 15,
    passingMarks: 40,
    totalMarks: 100,
    maxAttempts: 1,
    maxParticipants: 0,
    isActive: true,
  });

  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        // Fetch quiz with answers for editing
        const response = await fetch(`${apiUrl}/api/quizzes/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setQuiz(data);
          setFormData({
            title: data.title || '',
            description: data.description || '',
            timeLimit: data.timeLimit || 15,
            passingMarks: data.passingMarks || 40,
            totalMarks: data.totalMarks || 100,
            maxAttempts: data.maxAttempts || 1,
            maxParticipants: data.maxParticipants || 0,
            isActive: data.isActive !== false,
          });

          // Convert questions to editable format
          const editableQuestions = (data.questions || []).map((q: any) => ({
            id: q.id,
            text: q.text,
            options: q.options || ['', '', '', ''],
            // Convert string array correctAnswer to number format
            correctAnswer: q.correctAnswer?.length === 1 
              ? parseInt(q.correctAnswer[0]) 
              : (q.correctAnswer || []).map(Number),
            marks: q.marks || 10,
            type: q.correctAnswer?.length > 1 ? 'multiple' : 'single',
            imageUrl: q.imageUrl,
          }));

          setQuestions(editableQuestions.length > 0 ? editableQuestions : [{
            text: '',
            options: ['', '', '', ''],
            correctAnswer: 0,
            marks: 10,
            type: 'single',
          }]);
        } else {
          toast.error('Failed to load quiz');
          router.back();
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Error loading quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [params.id, router]);

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    if (field === 'type') {
      newQuestions[index].correctAnswer = value === 'multiple' ? [] : 0;
    }
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerSelect = (qIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    const question = newQuestions[qIndex];

    if (question.type === 'single') {
      newQuestions[qIndex].correctAnswer = optionIndex;
    } else {
      const currentAnswers = question.correctAnswer as number[];
      if (currentAnswers.includes(optionIndex)) {
        newQuestions[qIndex].correctAnswer = currentAnswers.filter(i => i !== optionIndex);
      } else {
        newQuestions[qIndex].correctAnswer = [...currentAnswers, optionIndex];
      }
    }
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 10,
        type: 'single',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate questions
    for (const q of questions) {
      if (!q.text) { 
        toast.error('All questions must have text'); 
        return; 
      }
      if (q.type === 'multiple' && (q.correctAnswer as number[]).length === 0) {
        toast.error('Multiple choice questions must have at least one correct answer'); 
        return;
      }
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();

      // Update quiz details
      const response = await fetch(`${apiUrl}/api/quizzes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          // Note: Updating questions requires a different approach
          // For now, we'll update quiz metadata only
        }),
      });

      if (response.ok) {
        toast.success('Quiz updated successfully!');
        router.back();
      } else {
        const err = await response.json();
        toast.error(`Failed: ${err.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Error updating quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-text">Loading quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-text hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-3xl font-bold">Edit Quiz</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Quiz Details */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-border space-y-4">
            <h2 className="text-xl font-semibold">Quiz Details</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={e => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time Limit (Min)</label>
                <input
                  type="number"
                  value={formData.timeLimit}
                  onChange={e => setFormData({ ...formData, timeLimit: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Total Marks</label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={e => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Passing Marks</label>
                <input
                  type="number"
                  value={formData.passingMarks}
                  onChange={e => setFormData({ ...formData, passingMarks: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Attempts</label>
                <input
                  type="number"
                  min={1}
                  value={formData.maxAttempts}
                  onChange={e => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Max Participants (0 = unlimited)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.maxParticipants}
                  onChange={e => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                />
              </div>
            </div>
          </div>

          {/* Questions Preview */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-4">Questions ({questions.length})</h2>
            <div className="space-y-4">
              {questions.map((q, index) => (
                <div key={index} className="p-4 bg-muted/30 rounded-lg">
                  <p className="font-medium">
                    <span className="text-muted-text mr-2">{index + 1}.</span>
                    {q.text || '(No question text)'}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {q.options.map((opt, oIdx) => (
                      <div 
                        key={oIdx} 
                        className={`p-2 rounded ${
                          (Array.isArray(q.correctAnswer) 
                            ? q.correctAnswer.includes(oIdx) 
                            : q.correctAnswer === oIdx)
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-background'
                        }`}
                      >
                        {String.fromCharCode(65 + oIdx)}. {opt || '(empty)'}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-xs text-muted-text">
                    Marks: {q.marks} | Type: {q.type === 'single' ? 'Single Choice' : 'Multiple Choice'}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-text mt-4">
              Note: To edit questions, please delete this quiz and create a new one.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-muted-bg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
