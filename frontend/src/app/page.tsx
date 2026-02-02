'use client';

import Link from 'next/link';
import { useAuthStore } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';

// Feature data
const features = [
  {
    icon: '🎯',
    title: 'Club Management',
    description: 'Create, manage, and grow your university clubs with powerful tools for coordinators and members.',
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    icon: '📅',
    title: 'Event Planning',
    description: 'Organize activities, workshops, and events. Track attendance and send notifications to members.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '🧠',
    title: 'Interactive Quizzes',
    description: 'Create engaging quizzes with images, track scores on leaderboards, and gamify learning.',
    gradient: 'from-orange-500 to-pink-500',
  },
  {
    icon: '📚',
    title: 'Resource Library',
    description: 'Share study materials, documents, and resources with club members in an organized way.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  // {
  //   icon: '💬',
  //   title: 'Anonymous Feedback',
  //   description: 'Collect honest feedback with hidden identities. Safe space for genuine opinions.',
  //   gradient: 'from-rose-500 to-red-500',
  // },
  // {
  //   icon: '📊',
  //   title: 'Analytics Dashboard',
  //   description: 'Track club growth, member engagement, and activity metrics with visual insights.',
  //   gradient: 'from-indigo-500 to-blue-600',
  // },
];

const stats = [
  { value: '100+', label: 'Active Clubs', icon: '🏛️' },
  { value: '5000+', label: 'Members', icon: '👥' },
  { value: '500+', label: 'Events Hosted', icon: '🎉' },
  { value: '10K+', label: 'Quiz Attempts', icon: '🧠' },
];

// 3D Floating Elements Component
const FloatingElements = () => {
  return (
    <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
      {/* 3D Cubes */}
      <div className="absolute top-20 left-[10%] w-16 h-16 animate-float-slow">
        <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 rounded-xl shadow-xl transform rotate-12 hover:rotate-45 transition-transform duration-1000" 
             style={{ transform: 'perspective(1000px) rotateX(20deg) rotateY(-20deg)' }}>
        </div>
      </div>
      
      <div className="absolute top-40 right-[15%] w-12 h-12 animate-float-medium">
        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg shadow-xl"
             style={{ transform: 'perspective(1000px) rotateX(-15deg) rotateY(25deg)' }}>
        </div>
      </div>
      
      <div className="absolute bottom-32 left-[20%] w-10 h-10 animate-float-fast">
        <div className="w-full h-full bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-xl"
             style={{ transform: 'perspective(1000px) rotateX(25deg) rotateY(-30deg)' }}>
        </div>
      </div>

      <div className="absolute top-1/3 right-[8%] w-8 h-8 animate-float-slow animation-delay-2000">
        <div className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 rounded shadow-lg"
             style={{ transform: 'perspective(1000px) rotateX(-20deg) rotateY(15deg)' }}>
        </div>
      </div>

      {/* 3D Spheres */}
      <div className="absolute top-1/4 left-[5%] w-6 h-6 animate-float-medium animation-delay-1000">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg"
             style={{ boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.2), inset 2px 2px 6px rgba(255,255,255,0.3)' }}>
        </div>
      </div>

      <div className="absolute bottom-1/4 right-[12%] w-8 h-8 animate-float-fast animation-delay-4000">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-violet-400 to-purple-600 shadow-lg"
             style={{ boxShadow: 'inset -3px -3px 8px rgba(0,0,0,0.2), inset 3px 3px 8px rgba(255,255,255,0.3)' }}>
        </div>
      </div>

      {/* 3D Rings */}
      <div className="absolute top-2/3 left-[8%] w-20 h-20 animate-spin-slow">
        <div className="w-full h-full border-4 border-indigo-300/50 rounded-full"
             style={{ transform: 'perspective(500px) rotateX(60deg)' }}>
        </div>
      </div>

      <div className="absolute top-1/2 right-[5%] w-16 h-16 animate-spin-slow animation-delay-2000">
        <div className="w-full h-full border-4 border-purple-300/50 rounded-full"
             style={{ transform: 'perspective(500px) rotateX(70deg) rotateZ(30deg)' }}>
        </div>
      </div>
    </div>
  );
};

// Animated Bar Chart Component
const AnimatedBarChart = ({ mounted }: { mounted: boolean }) => {
  const bars = [
    { height: 60, color: 'from-indigo-500 to-indigo-600', label: 'Mon' },
    { height: 80, color: 'from-purple-500 to-purple-600', label: 'Tue' },
    { height: 45, color: 'from-pink-500 to-pink-600', label: 'Wed' },
    { height: 90, color: 'from-indigo-500 to-indigo-600', label: 'Thu' },
    { height: 70, color: 'from-purple-500 to-purple-600', label: 'Fri' },
    { height: 55, color: 'from-pink-500 to-pink-600', label: 'Sat' },
    { height: 85, color: 'from-indigo-500 to-indigo-600', label: 'Sun' },
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Weekly Activity</span>
        <span className="text-xs text-green-500 font-medium">+24%</span>
      </div>
      <div className="flex items-end justify-between gap-2 h-24">
        {bars.map((bar, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div 
              className={`w-full bg-gradient-to-t ${bar.color} rounded-t-md transition-all duration-1000 ease-out`}
              style={{ 
                height: mounted ? `${bar.height}%` : '0%',
                transitionDelay: `${i * 100}ms`
              }}
            />
            <span className="text-[10px] text-muted-text">{bar.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Animated Line Chart Component
const AnimatedLineChart = ({ mounted }: { mounted: boolean }) => {
  const points = [20, 40, 35, 60, 55, 80, 75, 90];
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 30} ${100 - p}`).join(' ');
  
  return (
    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Member Growth</span>
        <span className="text-xs text-green-500 font-medium">↑ 156 this week</span>
      </div>
      <svg viewBox="0 0 210 100" className="w-full h-20 overflow-visible">
        {/* Grid lines */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Area under the line */}
        <path 
          d={`${pathD} L 210 100 L 0 100 Z`}
          fill="url(#areaGradient)"
          className={`transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        />
        
        {/* The line */}
        <path 
          d={pathD}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{
            strokeDasharray: 500,
            strokeDashoffset: mounted ? 0 : 500,
            transition: 'stroke-dashoffset 2s ease-out'
          }}
        />
        
        {/* Data points */}
        {points.map((p, i) => (
          <circle 
            key={i}
            cx={i * 30} 
            cy={100 - p} 
            r="4"
            fill="white"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            className={`transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}
            style={{ transitionDelay: `${800 + i * 100}ms` }}
          />
        ))}
      </svg>
    </div>
  );
};

// Circular Progress Component
const CircularProgress = ({ percentage, label, mounted }: { percentage: number; label: string; mounted: boolean }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-200 dark:text-slate-700"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="url(#circleGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={mounted ? offset : circumference}
            className="transition-all duration-1500 ease-out"
          />
          <defs>
            <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {mounted ? percentage : 0}%
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-text mt-2">{label}</span>
    </div>
  );
};

// 3D Card Component
const Card3D = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
      style={{ transform }}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const { user, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-text animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-lg text-muted-text">
                You're logged in as <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user.role}</span>
              </p>
            </div>
            
            <div className="flex justify-center">
              <Link 
                href="/dashboard" 
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1"
              >
                <span>Go to Dashboard</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 dark:bg-purple-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 dark:bg-indigo-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 dark:bg-pink-900/30 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* 3D Floating Elements */}
      <FloatingElements />

      {/* Navigation */}
      <nav className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl rotate-12 flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:rotate-[20deg] transition-transform duration-300">
              <span className="text-white font-bold text-sm sm:text-lg -rotate-12">G</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Geatherlyy
            </span>
          </div>
          <Link 
            href="/login" 
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-medium text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all duration-300 hover:scale-105"
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section with 3D Graphics */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-12 sm:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Side - Text Content */}
          <div className={`text-center lg:text-left transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              University Club Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-6 leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Connect. Collaborate.
              </span>
              <br />
              <span className="text-foreground">
                Grow Together.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-muted-text mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              The all-in-one platform to manage university clubs, organize events, 
              run quizzes, share resources, and build thriving communities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link 
                href="/login" 
                className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1 hover:scale-105 w-full sm:w-auto justify-center"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Get Started with Google</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a 
                href="#features" 
                className="inline-flex items-center gap-2 px-6 py-4 text-muted-text font-medium hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span>Learn More</span>
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-muted-text">
              <div className="flex -space-x-2">
                {['🧑‍🎓', '👩‍🎓', '🧑‍💻', '👨‍🏫'].map((emoji, i) => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-xs sm:text-sm border-2 border-white dark:border-slate-800">
                    {emoji}
                  </div>
                ))}
              </div>
              <span>Join <strong className="text-foreground">5,000+</strong> students</span>
            </div>
          </div>

          {/* Right Side - 3D Dashboard Preview */}
          <div className={`hidden lg:block transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="relative" style={{ perspective: '1500px' }}>
              {/* Main Dashboard Card */}
              <Card3D className="relative">
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-slate-700/50"
                     style={{ transform: 'rotateY(-5deg) rotateX(5deg)' }}>
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        G
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Dashboard</div>
                        <div className="text-xs text-muted-text">Welcome back!</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>

                  {/* Charts Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <AnimatedBarChart mounted={mounted} />
                    <AnimatedLineChart mounted={mounted} />
                  </div>

                  {/* Circular Progress Row */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4">
                    <div className="flex items-center justify-around">
                      <CircularProgress percentage={87} label="Attendance" mounted={mounted} />
                      <CircularProgress percentage={72} label="Engagement" mounted={mounted} />
                      <CircularProgress percentage={95} label="Quiz Score" mounted={mounted} />
                    </div>
                  </div>
                </div>
              </Card3D>

              {/* Floating Notification Card */}
              <div className={`absolute -top-4 -right-8 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                   style={{ transform: 'rotateY(10deg)' }}>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xl border border-white/20 dark:border-slate-700/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center text-green-600">
                    ✓
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">New member joined!</div>
                    <div className="text-xs text-muted-text">Tech Club • Just now</div>
                  </div>
                </div>
              </div>

              {/* Floating Stats Card */}
              <div className={`absolute -bottom-4 -left-8 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                   style={{ transform: 'rotateY(-10deg)' }}>
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 shadow-xl text-white">
                  <div className="text-2xl font-bold">+156</div>
                  <div className="text-xs text-white/80">New signups this week</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {stats.map((stat, index) => (
            <Card3D key={index}>
              <div className="p-4 sm:p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-slate-700/50 text-center hover:shadow-xl transition-shadow duration-300">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{stat.icon}</div>
                <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-muted-text">{stat.label}</div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className={`text-center mb-8 sm:mb-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              build community
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-text max-w-2xl mx-auto px-4">
            Powerful features designed for students, coordinators, and faculty to collaborate effectively.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Card3D key={index}>
              <div
                className={`group h-full p-4 sm:p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-white/20 dark:border-slate-700/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-500 hover:shadow-xl hover:shadow-indigo-500/10 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-xl sm:text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-text leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* Role-based Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl shadow-indigo-500/20 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center md:text-left">
                Built for Everyone in the Campus
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    👨‍🎓
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Students</h4>
                    <p className="text-white/80 text-sm">Join clubs, participate in activities, take quizzes, and access resources.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    🎓
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Coordinators</h4>
                    <p className="text-white/80 text-sm">Manage club activities, create quizzes, upload resources, and engage members.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    👨‍🏫
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Faculty</h4>
                    <p className="text-white/80 text-sm">Mentor clubs, approve activities, and guide student initiatives.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    ⚙️
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Administrators</h4>
                    <p className="text-white/80 text-sm">Oversee all clubs, manage approvals, and access platform analytics.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-white/10 rounded-3xl backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <div className="text-8xl">🏛️</div>
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-4xl animate-float-slow">
                  🎉
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl animate-float-medium animation-delay-1000">
                  📚
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <Card3D>
          <div className={`text-center p-6 sm:p-8 md:p-12 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/20 dark:border-slate-700/50 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6">
              Ready to get started?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-text max-w-xl mx-auto mb-6 sm:mb-8">
              Join thousands of students and faculty already using Geatherlyy to build thriving campus communities.
            </p>
            <Link 
              href="/login" 
              className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              <span>Start Your Journey</span>
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </Card3D>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg rotate-12 flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-base -rotate-12">G</span>
              </div>
              <span className="text-base sm:text-lg font-semibold text-muted-text">Geatherlyy</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-text text-center">
              © 2026 Geatherlyy. Built with ❤️ for university communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
