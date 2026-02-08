'use client';

import Link from 'next/link';
import { useAuthStore } from '@/context/AuthContext';
import { useClubContext, Club } from '@/context/ClubContext';
import { MagnifyingGlassIcon, HamburgerMenuIcon, PersonIcon, ExitIcon } from '@radix-ui/react-icons';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/apiUrl';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuthStore();
  const { myClubs, selectedClubId, setSelectedClubId, isLoading: clubsLoading } = useClubContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>({
    clubs: [],
    activities: [],
    quizzes: [],
    resources: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showClubMenu, setShowClubMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const clubMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (clubMenuRef.current && !clubMenuRef.current.contains(event.target as Node)) {
        setShowClubMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        await performSearch(searchQuery.trim());
      } else {
        setSearchResults({ clubs: [], activities: [], quizzes: [], resources: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      const [clubsRes, activitiesRes, quizzesRes, resourcesRes] = await Promise.all([
        fetch(`${apiUrl}/api/clubs?search=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/activities?search=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/quizzes?search=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/resources?search=${encodeURIComponent(query)}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const results = {
        clubs: clubsRes.ok ? (await clubsRes.json()).slice(0, 3) : [],
        activities: activitiesRes.ok ? (await activitiesRes.json()).slice(0, 3) : [],
        quizzes: quizzesRes.ok ? (await quizzesRes.json()).slice(0, 3) : [],
        resources: resourcesRes.ok ? (await resourcesRes.json()).slice(0, 3) : [],
      };

      setSearchResults(results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowResults(false);
      router.push(`/dashboard/discover?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleResultClick = (type: string, id: number) => {
    setShowResults(false);
    setSearchQuery('');
    
    switch (type) {
      case 'club':
        router.push(`/dashboard/clubs/${id}`);
        break;
      case 'activity':
        router.push(`/dashboard/activities/${id}`);
        break;
      case 'quiz':
        router.push(`/dashboard/quizzes/${id}`);
        break;
      case 'resource':
        router.push(`/dashboard/resources/${id}`);
        break;
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const hasResults = searchResults.clubs.length > 0 || 
                     searchResults.activities.length > 0 || 
                     searchResults.quizzes.length > 0 || 
                     searchResults.resources.length > 0;

  return (
    <nav className="h-16 border-b border-border sticky top-0 bg-background/95 backdrop-blur-md z-30 shadow-sm w-full flex items-center">
      <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center gap-2 md:gap-4">
        
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open menu"
        >
          <HamburgerMenuIcon className="w-6 h-6" />
        </button>

        {/* Search Bar - Only show when user is logged in */}
        {user && (
          <>
            {/* Club Selector */}
            <div className="relative hidden md:block" ref={clubMenuRef}>
              <button
                onClick={() => setShowClubMenu(!showClubMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors min-w-[160px] justify-between text-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-muted-text">Club:</span>
                  <span className="font-medium truncate max-w-[120px]">
                    {selectedClubId
                      ? myClubs.find((c) => c.id === selectedClubId)?.name || 'Unknown Club'
                      : 'All My Clubs'}
                  </span>
                </div>
                <svg className="w-4 h-4 text-muted-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showClubMenu && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="p-1 max-h-[60vh] overflow-y-auto">
                    <button
                      onClick={() => {
                        setSelectedClubId(null);
                        setShowClubMenu(false);
                        // Optional: Navigate to dashboard home when switching to "All"
                        // router.push('/dashboard'); 
                      }}
                      className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors flex items-center gap-2 ${
                        selectedClubId === null
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      All My Clubs
                    </button>
                    
                    {myClubs.length > 0 && <div className="my-1 border-t border-border" />}
                    
                    {myClubs.map((club) => (
                      <button
                        key={club.id}
                        onClick={() => {
                          setSelectedClubId(club.id);
                          setShowClubMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors flex items-center gap-2 ${
                          selectedClubId === club.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {club.imageUrl ? (
                          <img src={club.imageUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[8px] text-white">
                            {club.name.charAt(0)}
                          </div>
                        )}
                        <span className="truncate">{club.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-text" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim().length >= 2 && setShowResults(true)}
                  placeholder="Search clubs, activities, quizzes, resources..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                {loading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showResults && (
              <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-lg shadow-lg max-h-[70vh] overflow-y-auto z-50">
                {hasResults ? (
                  <div className="p-2">
                    {/* Clubs */}
                    {searchResults.clubs.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-text uppercase">Clubs</div>
                        {searchResults.clubs.map((club: any) => (
                          <button
                            key={club.id}
                            onClick={() => handleResultClick('club', club.id)}
                            className="w-full px-3 py-2 hover:bg-muted/50 rounded-lg text-left flex items-center gap-3"
                          >
                            {club.imageUrl ? (
                              <img src={club.imageUrl} alt={club.name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {club.name.charAt(0)}
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{club.name}</p>
                              <p className="text-xs text-muted-text truncate">{club.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Activities */}
                    {searchResults.activities.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-text uppercase">Activities</div>
                        {searchResults.activities.map((activity: any) => (
                          <button
                            key={activity.id}
                            onClick={() => handleResultClick('activity', activity.id)}
                            className="w-full px-3 py-2 hover:bg-muted/50 rounded-lg text-left flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              📅
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{activity.title}</p>
                              <p className="text-xs text-muted-text">
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Quizzes */}
                    {searchResults.quizzes.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-text uppercase">Quizzes</div>
                        {searchResults.quizzes.map((quiz: any) => (
                          <button
                            key={quiz.id}
                            onClick={() => handleResultClick('quiz', quiz.id)}
                            className="w-full px-3 py-2 hover:bg-muted/50 rounded-lg text-left flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              📝
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{quiz.title}</p>
                              <p className="text-xs text-muted-text">
                                {quiz._count?.questions || 0} questions • {quiz.timeLimit} min
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Resources */}
                    {searchResults.resources.length > 0 && (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-semibold text-muted-text uppercase">Resources</div>
                        {searchResults.resources.map((resource: any) => (
                          <button
                            key={resource.id}
                            onClick={() => handleResultClick('resource', resource.id)}
                            className="w-full px-3 py-2 hover:bg-muted/50 rounded-lg text-left flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              📄
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{resource.title}</p>
                              <p className="text-xs text-muted-text">{resource.type}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* View All Results */}
                    <button
                      onClick={() => {
                        setShowResults(false);
                        router.push(`/dashboard/discover?search=${encodeURIComponent(searchQuery)}`);
                      }}
                      className="w-full px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg font-medium text-center"
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                ) : searchQuery.trim().length >= 2 && !loading ? (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-muted-text">No results found for "{searchQuery}"</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          </>
        )}

        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-border"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-sm font-medium leading-none mb-0.5">{user.name}</div>
                  <div className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize inline-block">
                    {user.role}
                  </div>
                </div>
              </button>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 border-b border-border mb-2 lg:hidden">
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-muted-text">{user.role}</p>
                    </div>
                    
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <PersonIcon className="w-4 h-4" />
                      Profile
                    </Link>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowProfileMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1"
                    >
                      <ExitIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/login" 
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-white font-medium hover:opacity-90 transition-opacity text-sm whitespace-nowrap"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
