'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PlusIcon, TrashIcon, CheckIcon, Cross2Icon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/apiUrl';

interface Question {
  text: string;
  options: string[];
  correctAnswer: number | number[]; // Index or Indices
  marks: number;
  type: 'single' | 'multiple';
  image?: string | null;
}



interface Props {
  searchParams: { clubId?: string };
}

export default function CreateQuizPage({ searchParams }: Props) {
  const router = useRouter();
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 15, // in minutes
    passingMarks: 40,
    totalMarks: 100,
    clubId: searchParams.clubId || '',
    maxAttempts: 1,
    maxParticipants: 0, // 0 means unlimited
  });

  // Auto-update passing marks when totalMarks changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      passingMarks: Math.ceil(prev.totalMarks * 0.33)
    }));
  }, [formData.totalMarks]);

  const [questions, setQuestions] = useState<Question[]>([
    {
      text: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 10,
      type: 'single',
    },
  ]);

  useEffect(() => {
    // Fetch joined clubs (so members can create quizzes)
    const fetchMyClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/clubs/managed`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setMyClubs(data);
        }
      } catch (error) {
        console.error('Error fetching clubs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyClubs();
  }, []);

  const handleQuestionChange = (index: number, field: keyof Question, value: any) => {
    if (field === 'marks') {
        const newMarks = parseInt(value) || 0;
        const currentTotal = questions.reduce((sum, q, i) => sum + (i === index ? newMarks : (q.marks || 0)), 0);
        
        if (currentTotal > formData.totalMarks) {
            toast.error(`Total marks cannot exceed ${formData.totalMarks}`);
            return;
        }
    }

    const newQuestions = [...questions];
    
    // Logic for switching types
    if (field === 'type') {
         // Reset correct answer when switching type
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
          // Multiple choice logic (toggle)
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
    // Calculate current total marks
    const currentTotal = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    // Default marks for new question
    const newQuestionMarks = 10;
    // Prevent adding if would exceed totalMarks
    if (currentTotal + newQuestionMarks > formData.totalMarks) {
      toast.error('Cannot add more questions. Total marks limit reached.');
      return;
    }
    setQuestions([
      ...questions,
      {
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: newQuestionMarks,
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
    if (!formData.clubId) {
        toast.error('Please select a club');
        return;
    }

    // Validate questions
    const currentTotal = questions.reduce((sum, q) => sum + (q.marks || 0), 0);
    if (currentTotal !== formData.totalMarks) {
        toast.error(`Sum of question marks (${currentTotal}) must equal Total Marks (${formData.totalMarks})`);
        return;
    }

    for (const q of questions) {
        if (!q.text) { toast.error('All questions must have text'); return; }
        if (q.type === 'multiple' && (q.correctAnswer as number[]).length === 0) {
            toast.error('Multiple choice questions must have at least one correct answer'); return;
        }
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/quizzes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          clubId: parseInt(formData.clubId),
          questions: questions.map((q, i) => ({
            ...q,
            imageUrl: q.image,
            order: i + 1,
          })),
        }),
      });

      if (response.ok) {
        toast.success('Quiz created successfully!');
        router.refresh(); // Refresh server components/data
        router.back();
      } else {
        const err = await response.json();
        toast.error(`Failed: ${err.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast.error('Error creating quiz');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold">Create New Quiz</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
            {/* Quiz Details */}
            <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl border border-border space-y-4">
                <h2 className="text-xl font-semibold">Quiz Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input 
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Club</label>
                        <select 
                            value={formData.clubId}
                            onChange={e => setFormData({...formData, clubId: e.target.value})}
                            required
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                        >
                            <option value="">Select Club...</option>
                            {myClubs.map(club => (
                                <option key={club.id} value={club.id}>{club.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                            rows={2}
                        />
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">Time Limit (Min)</label>
                         <input 
                            type="number"
                            value={formData.timeLimit}
                            onChange={e => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                         />
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">Total Marks</label>
                         <input 
                             type="number"
                             value={formData.totalMarks}
                             onChange={e => setFormData({...formData, totalMarks: parseInt(e.target.value) || 0})}
                             className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                           />
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">Passing Marks (Auto-calculated)</label>
                         <input 
                            type="number"
                            value={formData.passingMarks}
                            disabled
                            className="w-full px-4 py-2 rounded-lg border border-border bg-muted cursor-not-allowed"
                         />
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">Max Attempts</label>
                         <input 
                            type="number"
                            min={1}
                            value={formData.maxAttempts}
                            onChange={e => setFormData({...formData, maxAttempts: parseInt(e.target.value) || 1})}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                         />
                    </div>
                    <div>
                         <label className="block text-sm font-medium mb-1">Max Participants (0 = unlimited)</label>
                         <input 
                            type="number"
                            min={0}
                            value={formData.maxParticipants}
                            onChange={e => setFormData({...formData, maxParticipants: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
                         />
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
                {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-border relative">
                        <div className="absolute top-4 right-4">
                            <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                        
                        <div className="mb-4 pr-10">
                            <label className="block text-sm font-medium mb-1">Question {qIndex + 1}</label>
                            <input 
                                value={q.text}
                                onChange={e => handleQuestionChange(qIndex, 'text', e.target.value)}
                                placeholder="Enter question text..."
                                className="w-full px-4 py-2 rounded-lg border border-border bg-background mb-2"
                                required
                            />

                            {/* Image Upload for Question */}
                            <div className="mt-2">
                                <label className="block text-xs font-medium mb-1 text-muted-text">Question Image (Optional)</label>
                                <div className="flex items-center gap-3">
                                  {!q.image ? (
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          try {
                                            const formData = new FormData();
                                            formData.append('image', file);
                                            const token = localStorage.getItem('token');
                                            const apiUrl = getApiUrl();
                                            
                                            // Optimistic update to show loading status if needed, 
                                            // or just block UI. For now, simple alert on error.
                                            const res = await fetch(`${apiUrl}/api/upload/quiz-image`, {
                                              method: 'POST',
                                              headers: { 'Authorization': `Bearer ${token}` },
                                              body: formData
                                            });
                                            
                                            if (res.ok) {
                                              const data = await res.json();
                                              handleQuestionChange(qIndex, 'image', data.url);
                                            } else {
                                                toast.error('Image upload failed');
                                            }
                                          } catch (err) {
                                              console.error(err);
                                              toast.error('Image upload error');
                                          }
                                        }
                                      }}
                                      className="text-sm text-muted-text file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                    />
                                  ) : (
                                    <div className="relative inline-block">
                                      <img src={q.image} alt="Question" className="h-20 w-auto rounded border border-border" />
                                      <button 
                                        type="button" 
                                        onClick={() => handleQuestionChange(qIndex, 'image', null)}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                                      >
                                        <TrashIcon className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-4">
                             <div>
                                <label className="block text-xs font-medium mb-1 uppercase text-muted-text">Type</label>
                                <div className="flex rounded-lg border border-border overflow-hidden">
                                    <button 
                                        type="button"
                                        onClick={() => handleQuestionChange(qIndex, 'type', 'single')}
                                        className={`px-3 py-1.5 text-sm ${q.type === 'single' ? 'bg-primary text-white' : 'hover:bg-muted-bg'}`}
                                    >
                                        Single Choice
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleQuestionChange(qIndex, 'type', 'multiple')}
                                        className={`px-3 py-1.5 text-sm ${q.type === 'multiple' ? 'bg-primary text-white' : 'hover:bg-muted-bg'}`}
                                    >
                                        Multiple Choice
                                    </button>
                                </div>
                             </div>
                             <div>
                                <label className="block text-xs font-medium mb-1 uppercase text-muted-text">Marks</label>
                                <input 
                                    type="number"
                                    value={q.marks}
                                    onChange={e => handleQuestionChange(qIndex, 'marks', parseInt(e.target.value))}
                                    className="w-24 px-3 py-1.5 rounded-lg border border-border bg-background"
                                />
                             </div>
                        </div>

                        <div className="space-y-3">
                            {q.options.map((opt, oIndex) => {
                                const isSelected = q.type === 'single' 
                                    ? q.correctAnswer === oIndex 
                                    : (q.correctAnswer as number[]).includes(oIndex);
                                
                                return (
                                    <div key={oIndex} className="flex items-center gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => handleCorrectAnswerSelect(qIndex, oIndex)}
                                            className={`w-6 h-6 flex items-center justify-center rounded border transition-colors ${
                                                isSelected 
                                                ? 'bg-green-500 border-green-500 text-white' 
                                                : 'border-border hover:border-green-500'
                                            } ${q.type === 'single' ? 'rounded-full' : 'rounded-md'}`}
                                        >
                                            {isSelected && <CheckIcon />}
                                        </button>
                                        <input 
                                            value={opt}
                                            onChange={e => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm"
                                            required
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <button 
                type="button" 
                onClick={addQuestion}
                className="w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-text hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2 font-medium"
            >
                <PlusIcon className="w-5 h-5" />
                Add Question
            </button>

            <div className="flex gap-4 pt-4">
                <button 
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                >
                    Create Quiz
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
