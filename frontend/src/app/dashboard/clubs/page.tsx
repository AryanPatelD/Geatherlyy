'use client';

import { useAuthStore } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib/apiUrl';

export default function ClubsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          setClubs(data);
        }
      } catch (error) {
        console.error('Failed to fetch my clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyClubs();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Loading your clubs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">My Clubs</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {clubs.map((club) => (
          <div 
            key={club.id} 
            onClick={() => router.push(`/dashboard/clubs/${club.id}`)}
            className="card hover:shadow-lg transition-shadow cursor-pointer"
          >
            {club.imageUrl && (
              <div className="h-32 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
                <img 
                  src={club.imageUrl} 
                  alt={club.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <h3 className="text-xl font-bold mb-2">{club.name}</h3>
            <p className="text-sm text-muted-text mb-3 line-clamp-2">{club.description}</p>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-text">Mentor:</span> {club.mentor?.name || 'N/A'}
              </p>
              <p>
                <span className="text-muted-text">Members:</span> {club.memberCount || club._count?.members || 0}
              </p>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                className="flex-1 btn btn-primary text-sm"
              >
                View Club
              </button>
            </div>
          </div>
        ))}
      </div>

      {clubs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-muted-text mb-4">You haven't joined any clubs yet</p>
          <button
            onClick={() => router.push('/dashboard/discover')}
            className="btn btn-primary"
          >
            Browse Clubs
          </button>
        </div>
      )}
    </div>
  );
}
