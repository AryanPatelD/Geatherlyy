'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PlusIcon, ImageIcon, Cross2Icon } from '@radix-ui/react-icons';
import { toast } from 'sonner';
import { useAuthStore } from '@/context/AuthContext';
import { getApiUrl } from '@/lib/apiUrl';

export default function CreateClubPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    clubName: '',
    description: '',
    category: 'Technical',
    clubPhoto: null as File | null,
    oldEventsPhotos: [] as File[],
  });
  
  // New State for simple inputs
  const [mentorInput, setMentorInput] = useState('');
  const [mentorIdentifiers, setMentorIdentifiers] = useState<string[]>([]);
  const [convenorIdentifier, setConvenorIdentifier] = useState('');

  const [clubPhotoPreview, setClubPhotoPreview] = useState<string>('');
  const [eventPhotoPreviews, setEventPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is authorized (faculty or admin only)
  useEffect(() => {
    if (!isLoading && (!user || !['faculty', 'admin'].includes(user.role))) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading || !user) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Prevent rendering if not authorized
  if (!['faculty', 'admin'].includes(user.role)) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMentor = () => {
    if (mentorInput.trim() && mentorIdentifiers.length < 3) {
      setMentorIdentifiers([...mentorIdentifiers, mentorInput.trim()]);
      setMentorInput('');
    }
  };

  const handleRemoveMentor = (index: number) => {
    setMentorIdentifiers(mentorIdentifiers.filter((_, i) => i !== index));
  };

  const handleClubPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, clubPhoto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setClubPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEventPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxPhotos = 5;
    const currentCount = formData.oldEventsPhotos.length;
    const availableSlots = maxPhotos - currentCount;
    const filesToAdd = files.slice(0, availableSlots);

    if (filesToAdd.length > 0) {
      setFormData((prev) => ({
        ...prev,
        oldEventsPhotos: [...prev.oldEventsPhotos, ...filesToAdd],
      }));

      // Create previews
      filesToAdd.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEventPhotoPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeEventPhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      oldEventsPhotos: prev.oldEventsPhotos.filter((_, i) => i !== index),
    }));
    setEventPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (mentorIdentifiers.length < 2 || mentorIdentifiers.length > 3) {
        setError('Please provide between 2 and 3 Faculty Mentors.');
        setLoading(false);
        return;
    }
    if (!convenorIdentifier.trim()) {
        setError('Please provide a Club Convenor.');
        setLoading(false);
        return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append('name', formData.clubName);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      
      // Serialize mentors and convenor
      submitData.append('mentorEmails', JSON.stringify(mentorIdentifiers));
      submitData.append('convenorEmail', convenorIdentifier.trim());

      // Add club photo
      if (formData.clubPhoto) {
        submitData.append('clubPhoto', formData.clubPhoto);
      }
      
      // Add event photos
      formData.oldEventsPhotos.forEach((file) => {
        submitData.append('eventPhotos', file);
      });

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/clubs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: submitData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create club');
      }

      toast.success('Club created successfully! It is now pending approval.');
      router.push('/dashboard/manage'); // Redirect to manage or clubs list
    } catch (error: any) {
      console.error('Failed to create club:', error);
      setError(error.message || 'Failed to create club. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Create New Club</h1>
          <p className="text-muted-foreground">
            Fill in the details to create a new club.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-border p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Club Name */}
          <div>
            <label htmlFor="clubName" className="block text-sm font-medium mb-2">
              Club Name *
            </label>
            <input
              id="clubName"
              name="clubName"
              type="text"
              value={formData.clubName}
              onChange={handleChange}
              placeholder="e.g., Coding Club, Art Society"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-2">
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              required
            >
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
              <option value="Cultural">Cultural</option>
              <option value="Sports">Sports</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Faculty Mentors */}
          <div>
             <label className="block text-sm font-medium mb-2">
               Faculty Mentors (Enter Name or Email) *
             </label>
             <div className="flex gap-2 mb-2">
                <input 
                    type="text"
                    value={mentorInput}
                    onChange={(e) => setMentorInput(e.target.value)}
                    placeholder="e.g. Dr. Smith or smith@college.edu"
                    className="flex-1 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={mentorIdentifiers.length >= 3}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddMentor();
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={handleAddMentor}
                    disabled={!mentorInput.trim() || mentorIdentifiers.length >= 3}
                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg disabled:opacity-50"
                >
                    Add
                </button>
             </div>
             
             {/* Mentor List */}
             <div className="flex flex-wrap gap-2 mb-1">
                {mentorIdentifiers.map((mentor, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm">
                        <span>{mentor}</span>
                        <button type="button" onClick={() => handleRemoveMentor(index)} className="text-muted-foreground hover:text-red-500">
                            <Cross2Icon className="w-3 h-3" />
                        </button>
                    </div>
                ))}
             </div>
             <p className="text-xs text-muted-foreground mt-1">
                Min 2, Max 3 mentors required.
             </p>
          </div>

          {/* Club Convenor */}
          <div>
             <label className="block text-sm font-medium mb-2">
               Club Convenor (Name or Email) *
             </label>
             <input
                type="text"
                value={convenorIdentifier}
                onChange={(e) => setConvenorIdentifier(e.target.value)}
                placeholder="e.g. Prof. Johnson"
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                required
             />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">
              Club Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the club's mission, activities, and what members will gain..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              required
            />
          </div>

          {/* Club Photo */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Club Photo *
            </label>
            <div className="space-y-3">
              {clubPhotoPreview ? (
                <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                  <img
                    src={clubPhotoPreview}
                    alt="Club preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, clubPhoto: null }));
                      setClubPhotoPreview('');
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Cross2Icon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Click to upload club photo</span>
                  <span className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleClubPhotoChange}
                    className="hidden"
                    required
                  />
                </label>
              )}
            </div>
          </div>

          {/* Old Events Photos */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Previous Events Photos (Optional, 3-5 photos)
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Upload photos from past events to showcase your club's activities
            </p>

            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              {eventPhotoPreviews.map((preview, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                  <img
                    src={preview}
                    alt={`Event ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeEventPhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Cross2Icon className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add More Button */}
              {/* Limit is 5 */}
              {(formData.oldEventsPhotos.length < 5) && (
                <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <PlusIcon className="w-8 h-8 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                  <span className="text-xs text-muted-foreground">
                    ({formData.oldEventsPhotos.length}/5)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleEventPhotosChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            {formData.oldEventsPhotos.length > 0 && formData.oldEventsPhotos.length < 3 && (
                 <p className="text-xs text-amber-500">
                    Recommended: 3 or more photos.
                 </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="w-5 h-5" />
              {loading ? 'Creating Club...' : 'Create Club'}
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
