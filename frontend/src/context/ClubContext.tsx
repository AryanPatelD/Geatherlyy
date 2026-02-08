'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthStore } from './AuthContext';
import { getApiUrl } from '@/lib/apiUrl';

export interface Club {
  id: number;
  name: string;
  imageUrl?: string;
  description?: string;
  mentor?: string;
  coordinators?: string[];
  members?: number;
  createdAt?: string | Date;
}

export interface Activity {
  id: string;
  clubId: string;
  title: string;
  description: string;
  date: Date;
  type: 'event' | 'workshop' | 'webinar';
  status: 'upcoming' | 'past';
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'text';
  options?: string[];
  correctAnswer?: number | string;
}

export interface Quiz {
  id: string;
  clubId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit: number;
  published: boolean;
}

interface ClubContextType {
  myClubs: Club[];
  selectedClubId: number | null;
  setSelectedClubId: (id: number | null) => void;
  isLoading: boolean;
  fetchMyClubs: () => Promise<void>;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export function ClubProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [myClubs, setMyClubs] = useState<Club[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize from local storage or default to null (All Clubs)
  useEffect(() => {
    const savedClubId = localStorage.getItem('selectedClubId');
    if (savedClubId) {
      setSelectedClubId(Number(savedClubId));
    }
  }, []);

  const handleSetSelectedClubId = (id: number | null) => {
    setSelectedClubId(id);
    if (id) {
      localStorage.setItem('selectedClubId', String(id));
    } else {
      localStorage.removeItem('selectedClubId');
    }
  };

  const fetchMyClubs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/clubs/my-clubs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyClubs(data);
        
        // Validation: If selectedClubId is no longer in myClubs, reset it
        if (selectedClubId && !data.find((c: Club) => c.id === selectedClubId)) {
          handleSetSelectedClubId(null);
        }
      }
    } catch (error) {
      console.error('Error fetching my clubs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMyClubs();
    } else {
      setMyClubs([]);
      setSelectedClubId(null);
    }
  }, [user]);

  return (
    <ClubContext.Provider
      value={{
        myClubs,
        selectedClubId,
        setSelectedClubId: handleSetSelectedClubId,
        isLoading,
        fetchMyClubs,
      }}
    >
      {children}
    </ClubContext.Provider>
  );
}

export function useClubContext() {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClubContext must be used within a ClubProvider');
  }
  return context;
}
