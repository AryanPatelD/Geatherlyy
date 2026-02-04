'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/apiUrl';

export default function DiscoverPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [allClubs, setAllClubs] = useState<any[]>([]);
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningClubId, setJoiningClubId] = useState<number | null>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/clubs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setAllClubs(data);
        }
      } catch (error) {
        console.error('Failed to fetch clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, []);

  // Fetch user's clubs for membership checking
  useEffect(() => {
    const fetchMyClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/clubs/my-clubs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setMyClubs(data);
        }
      } catch (error) {
        console.error('Failed to fetch my clubs:', error);
      }
    };

    fetchMyClubs();
  }, []);

  const handleJoinClub = async (clubId: number) => {
    setJoiningClubId(clubId);
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
        // Refresh my clubs list
        const myClubsResponse = await fetch(`${apiUrl}/api/clubs/my-clubs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (myClubsResponse.ok) {
          const data = await myClubsResponse.json();
          setMyClubs(data);
        }
        
        // Navigate to the club detail page
        router.push(`/dashboard/clubs/${clubId}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to join club');
      }
    } catch (error) {
      console.error('Failed to join club:', error);
      toast.error('Failed to join club. Please try again.');
    } finally {
      setJoiningClubId(null);
    }
  };

  const filtered = allClubs.filter(
    (club) =>
      club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isUserMember = (clubId: number) => myClubs.some(c => c.id === clubId);

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-background via-background to-muted-bg/30 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Discover Clubs 🔍
          </h1>
          <p className="text-muted-text">Find and join clubs that match your interests</p>
        </div>

        <div className="card">
          <div className="relative">
            <input
              type="text"
              placeholder="Search clubs by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-12 py-4 rounded-xl bg-muted-bg border-2 border-transparent focus:border-primary focus:bg-background transition-all outline-none"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((club) => {
            const isMember = isUserMember(club.id);
            const isJoining = joiningClubId === club.id;
            
            return (
              <Link
                key={club.id}
                href={!isJoining ? `/dashboard/clubs/${club.id}` : '#'}
                className="card group cursor-pointer hover:scale-105 transition-transform duration-300 block"
              >
                <div className="relative -m-6 mb-4 h-32 rounded-t-xl bg-gradient-to-br from-primary to-secondary overflow-hidden">
                  {club.imageUrl && (
                    <img
                      src={club.imageUrl}
                      alt={club.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                  )}
                  <div className="absolute top-4 right-4 z-10">
                    <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-medium text-primary">
                      {club.category}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 text-white font-semibold flex items-center gap-2 z-10">
                    <span>👥</span>
                    <span>{club.memberCount || 0} members</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {club.name}
                  </h3>
                  <p className="text-sm text-muted-text line-clamp-2">
                    {club.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-text">
                    <span>👨‍🏫</span>
                    <span>Mentor: {club.mentor}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isMember && !isJoining) {
                        handleJoinClub(club.id);
                      } else if (isMember) {
                        router.push(`/dashboard/clubs/${club.id}`);
                      }
                    }}
                    disabled={isJoining}
                    className={`w-full mt-4 px-4 py-3 rounded-lg font-medium transition-opacity ${
                      isMember 
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90'
                        : 'bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90'
                    } ${isJoining ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isJoining ? 'Joining...' : isMember ? 'View Club →' : 'Join Club →'}
                  </button>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 card">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">No clubs found</h3>
            <p className="text-muted-text">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
}
