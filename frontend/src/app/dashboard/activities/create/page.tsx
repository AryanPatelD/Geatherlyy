'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CalendarIcon, ClockIcon, PlusIcon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { getApiUrl } from '@/lib/apiUrl';

export default function CreateActivityPage() {
  const router = useRouter();
  const [managedClubs, setManagedClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'event',
    clubId: '',
  });

  // Fetch managed clubs on mount
  useEffect(() => {
    const fetchManagedClubs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = getApiUrl();
        const response = await fetch(`${apiUrl}/api/clubs/managed`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setManagedClubs(data);
        }
      } catch (error) {
        console.error('Error fetching managed clubs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchManagedClubs();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clubId) {
    if (!formData.clubId) {
      toast.error('Please select a club');
      return;
    }
    }

    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          startDate: new Date(`${formData.date}T${formData.time}`).toISOString(),
          location: formData.location,
          activityType: formData.type.toUpperCase(),
          clubId: parseInt(formData.clubId),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create activity');
      }

      toast.success('Activity created successfully!');
      router.push('/dashboard/manage');
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Failed to create activity. Please try again.');
    }
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Create New Activity</h1>
          <p className="text-muted-text">
            Schedule an event, workshop, or quiz for your club members
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 space-y-6">
          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium mb-3">Activity Type *</label>
            <div className="grid grid-cols-3 gap-3">
              {['event', 'workshop', 'quiz'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type }))}
                  className={`px-4 py-3 rounded-lg border-2 font-medium capitalize transition-all ${formData.type === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Club Selection */}
          <div>
            <label htmlFor="clubId" className="block text-sm font-medium mb-2">
              Select Club *
            </label>
            <select
              id="clubId"
              name="clubId"
              value={formData.clubId}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
              disabled={loading || managedClubs.length === 0}
            >
              <option value="">
                {loading ? 'Loading clubs...' : managedClubs.length === 0 ? 'No managed clubs' : 'Choose a club...'}
              </option>
              {managedClubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
            {!loading && managedClubs.length === 0 && (
              <p className="mt-2 text-sm text-red-500">
                You are not a coordinator of any club. Only coordinators can create activities.
              </p>
            )}
          </div>

          {/* Activity Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">
              Activity Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., JavaScript Workshop"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the activity, learning outcomes, and what participants will gain..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium mb-2">
                <CalendarIcon className="inline w-4 h-4 mr-1" />
                Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium mb-2">
                <ClockIcon className="inline w-4 h-4 mr-1" />
                Time *
              </label>
              <input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium mb-2">
              📍 Location *
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Main Hall, Room 301, or Online"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create Activity
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-border rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
