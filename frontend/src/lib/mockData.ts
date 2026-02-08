/**
 * Mock data for development
 * Replace with real API calls in production
 */

import { Club, Activity, Quiz } from '@/context/ClubContext';

export const mockClubs: Club[] = [
  {
    id: 1,
    name: 'Coding Club',
    description: 'Learn programming and compete in hackathons',
    mentor: 'Dr. Smith',
    coordinators: ['Alice Chen', 'Bob Johnson'],
    members: 145,
    createdAt: new Date('2023-01-15'),
  },
  {
    id: 2,
    name: 'Web Development',
    description: 'Master frontend and backend technologies',
    mentor: 'Prof. Johnson',
    coordinators: ['Carol Davis'],
    members: 89,
    createdAt: new Date('2023-02-20'),
  },
  {
    id: 3,
    name: 'Machine Learning',
    description: 'Explore AI and machine learning projects',
    mentor: 'Dr. Lee',
    coordinators: ['Diana Wilson'],
    members: 67,
    createdAt: new Date('2023-03-10'),
  },
];

export const mockActivities: Activity[] = [
  {
    id: 'act_1',
    clubId: '1',
    title: 'JavaScript Workshop',
    description: 'Learn ES6+ features',
    date: new Date('2024-02-01'),
    type: 'event',
    status: 'upcoming',
  },
  {
    id: 'act_2',
    clubId: '1',
    title: 'Git Basics Session',
    description: 'Version control fundamentals',
    date: new Date('2024-02-05'),
    type: 'event',
    status: 'upcoming',
  },
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz_1',
    clubId: '1',
    title: 'Web Development Fundamentals - Week 3',
    description: 'Test your knowledge on HTML, CSS, and JavaScript basics',
    questions: [
      {
        id: 'q1',
        text: 'What does HTML stand for?',
        type: 'mcq',
        options: [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Home Tool Markup Language',
          'Hyperlinks and Text Markup Language',
        ],
        correctAnswer: 0,
      },
    ],
    timeLimit: 30,
    published: true,
  },
];
