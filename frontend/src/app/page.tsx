'use client';

import Link from 'next/link';
import { useAuthStore } from '@/context/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { getApiUrl } from '@/lib/apiUrl';

// Feature data
const features = [
  {
    icon: '🎯',
    title: 'Club Management',
    description: 'Create, manage, and grow your university clubs with powerful tools for coordinators and members.',
    gradient: 'from-orange-500 to-amber-500',
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
    gradient: 'from-orange-400 to-red-500',
  },
  {
    icon: '📚',
    title: 'Resource Library',
    description: 'Share study materials, documents, and resources with club members in an organized way.',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

// Stats will be fetched from the API

// 3D Floating Elements Component
const FloatingElements = () => {
  return (
    <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
      {/* 3D Cubes */}
      <div className="absolute top-20 left-[10%] w-16 h-16 animate-float-slow">
        <div className="w-full h-full bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl shadow-xl transform rotate-12 hover:rotate-45 transition-transform duration-1000" 
             style={{ transform: 'perspective(1000px) rotateX(20deg) rotateY(-20deg)' }}>
        </div>
      </div>
      
      <div className="absolute top-40 right-[15%] w-12 h-12 animate-float-medium">
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-xl"
             style={{ transform: 'perspective(1000px) rotateX(-15deg) rotateY(25deg)' }}>
        </div>
      </div>
      
      <div className="absolute bottom-32 left-[20%] w-10 h-10 animate-float-fast">
        <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-500 rounded-lg shadow-xl"
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
        <div className="w-full h-full rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-lg"
             style={{ boxShadow: 'inset -2px -2px 6px rgba(0,0,0,0.2), inset 2px 2px 6px rgba(255,255,255,0.3)' }}>
        </div>
      </div>

      <div className="absolute bottom-1/4 right-[12%] w-8 h-8 animate-float-fast animation-delay-4000">
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg"
             style={{ boxShadow: 'inset -3px -3px 8px rgba(0,0,0,0.2), inset 3px 3px 8px rgba(255,255,255,0.3)' }}>
        </div>
      </div>

      {/* 3D Rings */}
      <div className="absolute top-2/3 left-[8%] w-20 h-20 animate-spin-slow">
        <div className="w-full h-full border-4 border-orange-500/30 rounded-full"
             style={{ transform: 'perspective(500px) rotateX(60deg)' }}>
        </div>
      </div>

      <div className="absolute top-1/2 right-[5%] w-16 h-16 animate-spin-slow animation-delay-2000">
        <div className="w-full h-full border-4 border-blue-500/30 rounded-full"
             style={{ transform: 'perspective(500px) rotateX(70deg) rotateZ(30deg)' }}>
        </div>
      </div>
    </div>
  );
};

// Animated Bar Chart Component
const AnimatedBarChart = ({ mounted }: { mounted: boolean }) => {
  const bars = [
    { height: 60, color: 'from-orange-500 to-orange-600', label: 'Mon' },
    { height: 80, color: 'from-amber-500 to-amber-600', label: 'Tue' },
    { height: 45, color: 'from-orange-500 to-orange-600', label: 'Wed' },
    { height: 90, color: 'from-amber-500 to-amber-600', label: 'Thu' },
    { height: 70, color: 'from-orange-500 to-orange-600', label: 'Fri' },
    { height: 55, color: 'from-amber-500 to-amber-600', label: 'Sat' },
    { height: 85, color: 'from-orange-500 to-orange-600', label: 'Sun' },
  ];

  return (
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-white">Weekly Activity</span>
        <span className="text-xs text-green-500 font-medium">Overview</span>
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
            <span className="text-[10px] text-slate-400">{bar.label}</span>
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
    <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-slate-700/50">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-white">Member Growth</span>
        <span className="text-xs text-green-500 font-medium">Trend</span>
      </div>
      <svg viewBox="0 0 210 100" className="w-full h-20 overflow-visible">
        {/* Grid lines */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
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
            className="text-slate-700"
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
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            {mounted ? percentage : 0}%
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 mt-2">{label}</span>
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

const Typewriter = ({ words, delay = 100, pause = 2000 }: { words: string[], delay?: number, pause?: number }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const word = words[currentWordIndex];
      if (isDeleting) {
        if (currentText.length > 0) {
          setCurrentText(word.substring(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        }
      } else {
        if (currentText.length < word.length) {
          setCurrentText(word.substring(0, currentText.length + 1));
        } else {
          setIsDeleting(true);
        }
      }
    }, isDeleting ? delay / 2 : (currentText.length === words[currentWordIndex].length ? pause : delay));

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentWordIndex, words, delay, pause]);

  return (
    <span className="inline-block min-w-[200px] text-left">
      {currentText}
      <span className="animate-pulse ml-1 text-orange-500">|</span>
    </span>
  );
};

// FeatureQuote removed - no fake testimonials

export default function Home() {
  const { user, isLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [platformStats, setPlatformStats] = useState<{
    activeClubs: number;
    totalMembers: number;
    eventsHosted: number;
    quizAttempts: number;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch real platform stats
    fetch(`${getApiUrl()}/api/analytics/public-stats`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        // Validate that data has expected shape before setting state
        if (data && typeof data.activeClubs === 'number') {
          setPlatformStats(data);
        }
      })
      .catch(err => console.error('Failed to fetch platform stats:', err));
  }, []);

  const formatNumber = (num: number | undefined | null): string => {
    if (num == null) return '—';
    if (num >= 10000) return `${Math.floor(num / 1000)}K+`;
    if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
    return num.toString();
  };

  const stats = platformStats
    ? [
        { value: formatNumber(platformStats.activeClubs), label: 'Active Clubs', icon: '🏛️' },
        { value: formatNumber(platformStats.totalMembers), label: 'Members', icon: '👥' },
        { value: formatNumber(platformStats.eventsHosted), label: 'Events Hosted', icon: '🎉' },
        { value: formatNumber(platformStats.quizAttempts), label: 'Quiz Attempts', icon: '🧠' },
      ]
    : [
        { value: '—', label: 'Active Clubs', icon: '🏛️' },
        { value: '—', label: 'Members', icon: '👥' },
        { value: '—', label: 'Events Hosted', icon: '🎉' },
        { value: '—', label: 'Quiz Attempts', icon: '🧠' },
      ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen bg-slate-900 selection:bg-orange-500 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-lg text-slate-400">
                You're logged in as <span className="font-semibold text-orange-400">{user.role}</span>
              </p>
            </div>
            
            <div className="flex justify-center">
              <Link 
                href="/dashboard" 
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-1"
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
    <div className="min-h-screen bg-slate-900 selection:bg-orange-500 selection:text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-slate-700/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* 3D Floating Elements */}
      <FloatingElements />

      {/* Navigation */}
      <nav className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-14 sm:h-16 w-auto">
                <img src="/brand-logo.png" alt="Getherlyy" className="h-full object-contain" />
             </div>
          </div>
          <Link 
            href="/login" 
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-orange-400 font-medium text-sm sm:text-base rounded-lg sm:rounded-xl hover:bg-slate-700/50 transition-all duration-300 hover:scale-105"
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
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-800/80 border border-slate-700 text-orange-400 rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              University Club Platform
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 leading-tight text-white">
              Unite. Engage.
              <span className="block bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent h-[1.2em]">
                <Typewriter words={['Grow Together.', 'Connect.', 'Inspire.']} />
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-400 mb-6 sm:mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              The all-in-one platform to manage university clubs, organize events, 
              run quizzes, share resources, and build thriving communities.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link 
                href="/login" 
                className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-lg shadow-orange-600/20 transition-all duration-300 hover:-translate-y-1 hover:scale-105 w-full sm:w-auto justify-center"
              >
                <span>Get Started</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a 
                href="#features" 
                className="inline-flex items-center gap-2 px-6 py-4 text-slate-400 font-medium hover:text-white transition-colors"
              >
                <span>Learn More</span>
                <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 mb-8">
              <div className="flex -space-x-2">
                {['🧑‍🎓', '👩‍🎓', '🧑‍💻', '👨‍🏫'].map((emoji, i) => (
                  <div key={i} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs sm:text-sm border-2 border-slate-900">
                    {emoji}
                  </div>
                ))}
              </div>
              <span>Join <strong className="text-slate-300">{platformStats ? `${formatNumber(platformStats.totalMembers)}` : '...'}</strong> members</span>
            </div>

            {/* Platform highlights */}
            <div className="flex justify-center lg:justify-start">
              <div className="mt-8 p-4 bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/50 max-w-sm hover:border-orange-500/30 transition-colors duration-300">
                <div className="flex gap-4">
                  <div className="text-4xl text-orange-500/50 font-serif leading-none">🚀</div>
                  <div>
                    <p className="text-slate-300 text-sm mb-2 leading-relaxed font-medium">
                      Your campus community platform
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Manage clubs, run events, create quizzes, and share resources — all in one place.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - 3D Dashboard Preview */}
          <div className={`hidden lg:block transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
            <div className="relative" style={{ perspective: '1500px' }}>
              {/* Main Dashboard Card */}
              <Card3D className="relative">
                <div className="bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-slate-700/50"
                     style={{ transform: 'rotateY(-5deg) rotateX(5deg)' }}>
                  {/* Dashboard Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-white font-bold overflow-hidden p-1">
                        <img src="/brand-logo.png" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">Dashboard</div>
                        <div className="text-xs text-slate-400">Welcome back!</div>
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
                  <div className="bg-slate-900/50 rounded-2xl p-4">
                    <div className="flex items-center justify-around">
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-orange-400">{platformStats ? platformStats.activeClubs : '—'}</div>
                        <span className="text-xs text-slate-400 mt-1">Clubs</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-orange-400">{platformStats ? platformStats.totalMembers : '—'}</div>
                        <span className="text-xs text-slate-400 mt-1">Members</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-2xl font-bold text-orange-400">{platformStats ? platformStats.eventsHosted : '—'}</div>
                        <span className="text-xs text-slate-400 mt-1">Events</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card3D>

              {/* Floating Stats Card - Real Data */}
              <div className={`absolute -top-4 -right-8 transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}
                   style={{ transform: 'rotateY(10deg)' }}>
                <div className="bg-slate-800 rounded-xl p-3 shadow-xl border border-slate-700/50 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-900/30 flex items-center justify-center text-orange-500 text-lg">
                    🏛️
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{platformStats ? `${platformStats.activeClubs} Active Clubs` : 'Loading...'}</div>
                    <div className="text-xs text-slate-400">On the platform</div>
                  </div>
                </div>
              </div>

              {/* Floating Quiz Card - Real Data */}
              <div className={`absolute -bottom-4 -left-8 transition-all duration-700 delay-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                   style={{ transform: 'rotateY(-10deg)' }}>
                <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl p-4 shadow-xl text-white">
                  <div className="text-2xl font-bold">{platformStats ? formatNumber(platformStats.quizAttempts) : '—'}</div>
                  <div className="text-xs text-white/80">Quiz Attempts</div>
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
              <div className="p-4 sm:p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 text-center hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 group">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2 grayscale group-hover:grayscale-0 transition-all duration-300">{stat.icon}</div>
                <div className="text-xl sm:text-3xl font-bold text-white group-hover:text-orange-400 transition-colors">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-slate-400">{stat.label}</div>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className={`text-center mb-8 sm:mb-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-white">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-orange-400 to-amber-500 bg-clip-text text-transparent">
              build community
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-2xl mx-auto px-4">
            Powerful features designed for students, coordinators, and faculty to collaborate effectively.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <Card3D key={index}>
              <div
                className={`group h-full p-4 sm:p-6 bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 hover:border-orange-500/50 transition-all duration-500 hover:shadow-xl hover:shadow-orange-500/10 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-xl sm:text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2 text-white group-hover:text-orange-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                  {feature.description}
                </p>
              </div>
            </Card3D>
          ))}
        </div>
      </section>

      {/* Role-based Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className={`bg-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 shadow-2xl border border-slate-700/50 transition-all duration-700 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-white">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center md:text-left">
                Built for Everyone in the Campus
              </h2>
              <div className="space-y-4 sm:space-y-6">
                {[
                  { icon: '👨‍🎓', title: 'Students', desc: 'Join clubs, participate in activities, take quizzes, and access resources.' },
                  { icon: '🎓', title: 'Coordinators', desc: 'Manage club activities, create quizzes, upload resources, and engage members.' },
                  { icon: '👨‍🏫', title: 'Faculty', desc: 'Mentor clubs, approve activities, and guide student initiatives.' },
                  { icon: '⚙️', title: 'Administrators', desc: 'Oversee all clubs, manage approvals, and access platform analytics.' }
                ].map((role, i) => (
                  <div key={i} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-700/30 transition-colors">
                    <div className="w-10 h-10 bg-slate-700/50 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                      {role.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 text-orange-400">{role.title}</h4>
                      <p className="text-slate-400 text-sm">{role.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden md:flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 bg-slate-700/20 rounded-3xl backdrop-blur-sm border border-slate-600/30 flex items-center justify-center p-8">
                   <div className="relative w-full h-full opacity-80">
                      <img src="/brand-logo.png" className="w-full h-full object-contain" />
                   </div>
                </div>
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-slate-800 rounded-2xl flex items-center justify-center text-4xl animate-float-slow shadow-xl border border-slate-700">
                  🎉
                </div>
                <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl animate-float-medium animation-delay-1000 shadow-xl border border-slate-700">
                  📚
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-24">
        <div className={`text-center p-6 sm:p-8 md:p-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-white">
            Ready to get started?
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-400 max-w-xl mx-auto mb-6 sm:mb-8">
            {platformStats
              ? `Join ${formatNumber(platformStats.totalMembers)} members already using Getherlyy to build thriving campus communities.`
              : 'Join students and faculty already using Getherlyy to build thriving campus communities.'}
          </p>
          <Link 
            href="/login" 
            className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm sm:text-base md:text-lg rounded-xl sm:rounded-2xl shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40 transition-all duration-300 hover:-translate-y-1 hover:scale-105"
          >
            <span>Start Your Journey</span>
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-auto">
                <img src="/brand-logo.png" alt="Getherlyy" className="h-full object-contain" />
              </div>
              <span className="text-base sm:text-lg font-semibold text-slate-300">Getherlyy</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 text-center">
              © 2026 Getherlyy. Built with ❤️ for university communities.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
