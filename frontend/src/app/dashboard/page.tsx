'use client';

import { useAuthStore } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ExclamationTriangleIcon, PersonIcon, PlusIcon } from '@radix-ui/react-icons';
import Image from 'next/image';
import { getApiUrl } from '@/lib/apiUrl';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [pendingClubs, setPendingClubs] = useState<any[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(true);
  const [joiningClub, setJoiningClub] = useState<number | null>(null);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [stats, setStats] = useState({
    availableClubs: 0,
    joinedClubs: 0,
  });

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const headers = {
          'Authorization': `Bearer ${token}`,
        };
        
        // Build query params for category filter
        const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';

        // Execute all fetch requests in parallel
        const [categoriesResponse, allClubsResponse, myClubsResponse, pendingClubsResponse] = await Promise.all([
          fetch(`${apiUrl}/api/clubs/categories`, { headers }),
          fetch(`${apiUrl}/api/clubs${categoryParam}`, { headers }),
          fetch(`${apiUrl}/api/clubs/my-clubs`, { headers }),
          fetch(`${apiUrl}/api/clubs/pending-requests`, { headers })
        ]);

        // Process Responses
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        if (allClubsResponse.ok) {
          const allData = await allClubsResponse.json();
          setClubs(allData);
          
          if (myClubsResponse.ok) {
            const myData = await myClubsResponse.json();
            setMyClubs(myData);
            setStats({
              availableClubs: allData.length,
              joinedClubs: myData.length,
            });
          }

          if (pendingClubsResponse.ok) {
            const pendingData = await pendingClubsResponse.json();
            setPendingClubs(pendingData);
          }
        }
      } catch (error) {
        console.error('Failed to fetch clubs:', error);
      } finally {
        setLoadingClubs(false);
      }
    };

    if (user) {
      fetchClubs();
    }
  }, [user, selectedCategory]);

  const handleJoinClub = async (clubId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setJoiningClub(clubId);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/clubs/${clubId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        // Refresh clubs data
        const categoryParam = selectedCategory !== 'all' ? `?category=${selectedCategory}` : '';
        const allClubsResponse = await fetch(`${apiUrl}/api/clubs${categoryParam}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const myClubsResponse = await fetch(`${apiUrl}/api/clubs/my-clubs`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const pendingClubsResponse = await fetch(`${apiUrl}/api/clubs/pending-requests`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (allClubsResponse.ok && myClubsResponse.ok) {
          const allData = await allClubsResponse.json();
          const myData = await myClubsResponse.json();
          setClubs(allData);
          setMyClubs(myData);
          setStats({
            availableClubs: allData.length,
            joinedClubs: myData.length,
          });

          if (pendingClubsResponse.ok) {
            const pendingData = await pendingClubsResponse.json();
            setPendingClubs(pendingData);
          }
          
          // Update selected club if modal is open
          if (selectedClub?.id === clubId) {
            const updatedClub = myData.find((c: any) => c.id === clubId);
            if (updatedClub) setSelectedClub(updatedClub);
          }
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to join club');
      }
    } catch (error) {
      console.error('Failed to join club:', error);
      alert('Failed to join club. Please try again.');
    } finally {
      setJoiningClub(null);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user.profileComplete) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-border p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
            <PersonIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <p className="text-muted-text">
              Please complete your profile details to access the dashboard and join clubs.
            </p>
          </div>

          <button
            onClick={() => router.push('/complete-profile')}
            className="w-full py-3 px-4 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            Complete Profile
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-1">Available Clubs</h1>
          <p className="text-sm md:text-base text-muted-text">
            {stats.availableClubs} clubs available, {stats.joinedClubs} clubs joined
          </p>
        </div>
        {user && ['faculty', 'admin'].includes(user.role) && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => router.push('/dashboard/create-club')}
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              New Clubs
            </button>
          </div>
        )}
      </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
          <span className="text-xs sm:text-sm font-medium text-muted-text whitespace-nowrap">Filter by:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All Clubs
          </button>
          <button
            onClick={() => setSelectedCategory('Technical')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'Technical'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Technical
          </button>
          <button
            onClick={() => setSelectedCategory('Non-Technical')}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'Non-Technical'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Non-Technical
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 md:gap-6 border-b border-border overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 px-2 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'all'
                ? 'text-primary'
                : 'text-muted-text hover:text-foreground'
            }`}
          >
            All Clubs
            {activeTab === 'all' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('my-clubs')}
            className={`pb-3 px-2 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'my-clubs'
                ? 'text-primary'
                : 'text-muted-text hover:text-foreground'
            }`}
          >
            My Clubs
            {activeTab === 'my-clubs' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-2 font-medium transition-colors relative whitespace-nowrap ${
              activeTab === 'pending'
                ? 'text-primary'
                : 'text-muted-text hover:text-foreground'
            }`}
          >
            Pending Clubs
            {pendingClubs.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                {pendingClubs.length}
              </span>
            )}
            {activeTab === 'pending' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {loadingClubs ? (
            <div className="col-span-full text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-500">Loading clubs...</p>
            </div>
          ) : (activeTab === 'my-clubs' ? myClubs : activeTab === 'pending' ? pendingClubs : clubs).length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">
                {activeTab === 'pending' ? '⏳' : '🎯'}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {activeTab === 'pending' ? 'No pending requests' : 'No clubs available'}
              </h3>
              <p className="text-gray-500 mb-6">
                {activeTab === 'pending' ? 'You have no pending club join requests' : 'Be the first to create a club!'}
              </p>
              {user && activeTab !== 'pending' && ['faculty', 'admin'].includes(user.role) && (
                <button
                  onClick={() => router.push('/dashboard/create-club')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <PlusIcon className="w-5 h-5" />
                  Create New Club
                </button>
              )}
            </div>
          ) : (
            (activeTab === 'my-clubs' ? myClubs : activeTab === 'pending' ? pendingClubs : clubs).map((club) => (
              <div
                key={club.id}
                onClick={() => setSelectedClub(club)}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-border cursor-pointer"
              >
                {/* Club Image */}
                <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20">
                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                        club.badge === 'ADMIN'
                          ? 'bg-red-500'
                          : club.badge === 'MEMBER'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                    >
                      {club.badge}
                    </span>
                  </div>
                  {club.imageUrl ? (
                    <img
                      src={club.imageUrl}
                      alt={club.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                      🎯
                    </div>
                  )}
                </div>

                {/* Club Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{club.name}</h3>
                    <p className="text-sm text-muted-text line-clamp-2">
                      {club.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-muted-text">
                    <PersonIcon className="w-4 h-4" />
                    <span className="text-sm">
                      {club._count?.members ?? club.memberCount ?? club.members ?? 0} / {club.maxMembers || 100} Members
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const isMember = myClubs.some(c => c.id === club.id);
                      const isPending = pendingClubs.some(c => c.id === club.id);
                      
                      if (isMember) {
                        setSelectedClub(club);
                      } else if (isPending) {
                        // Show it's pending
                        alert('Your join request is pending approval');
                      } else {
                        handleJoinClub(club.id, e);
                      }
                    }}
                    disabled={joiningClub === club.id}
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      joiningClub === club.id
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                        : myClubs.some(c => c.id === club.id)
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : pendingClubs.some(c => c.id === club.id)
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 cursor-default'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {joiningClub === club.id ? 'Joining...' : myClubs.some(c => c.id === club.id) ? 'View Club' : pendingClubs.some(c => c.id === club.id) ? 'Pending' : 'Join Club'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Club Details Modal */}
        {selectedClub && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 md:p-4" onClick={() => setSelectedClub(null)}>
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="relative h-36 md:h-48 bg-gradient-to-br from-blue-600 to-indigo-700 overflow-hidden">
                {selectedClub.imageUrl && (
                  <img
                    src={selectedClub.imageUrl}
                    alt={selectedClub.name}
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                )}
                <button
                  onClick={() => setSelectedClub(null)}
                  className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors z-10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${
                      selectedClub.badge === 'ADMIN' ? 'bg-red-500' :
                      selectedClub.badge === 'MEMBER' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {selectedClub.badge}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-3xl font-bold text-white drop-shadow-lg">{selectedClub.name}</h2>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="text-center p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <PersonIcon className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-primary" />
                    <p className="text-lg md:text-2xl font-bold">{selectedClub._count?.members ?? selectedClub.members?.length ?? 0}</p>
                    <p className="text-xs md:text-sm text-muted-text">Members</p>
                  </div>
                  <div className="text-center p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <svg className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-lg md:text-2xl font-bold">{selectedClub._count?.activities ?? selectedClub.activities?.length ?? 0}</p>
                    <p className="text-xs md:text-sm text-muted-text">Activities</p>
                  </div>
                  <div className="text-center p-2 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <svg className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg md:text-2xl font-bold">{selectedClub._count?.resources ?? selectedClub.resources?.length ?? 0}</p>
                    <p className="text-xs md:text-sm text-muted-text">Resources</p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-bold mb-2">About</h3>
                  <p className="text-muted-text">{selectedClub.description || 'No description available.'}</p>
                </div>

                {/* Category */}
                {selectedClub.category && (
                  <div>
                    <h3 className="text-lg font-bold mb-2">Category</h3>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                      {selectedClub.category}
                    </span>
                  </div>
                )}

                {/* Event Photos Gallery */}
                {selectedClub.eventPhotos && selectedClub.eventPhotos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-3">Past Events</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedClub.eventPhotos.map((photo: string, index: number) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border hover:scale-105 transition-transform cursor-pointer">
                          <img
                            src={photo}
                            alt={`Event ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      const isMember = myClubs.some(c => c.id === selectedClub.id);
                      if (isMember) {
                        router.push(`/dashboard/clubs/${selectedClub.id}`);
                      } else {
                        handleJoinClub(selectedClub.id);
                      }
                    }}
                    disabled={joiningClub === selectedClub.id}
                    className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                      joiningClub === selectedClub.id
                        ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {joiningClub === selectedClub.id ? 'Joining...' : myClubs.some(c => c.id === selectedClub.id) ? 'Go to Club' : 'Join Club'}
                  </button>
                  <button
                    onClick={() => setSelectedClub(null)}
                    className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
