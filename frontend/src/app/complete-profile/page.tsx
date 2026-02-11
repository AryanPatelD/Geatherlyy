'use client';

import { useAuthStore, UserRole } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getApiUrl } from '@/lib/apiUrl';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    department: user?.department || '',
    year: user?.year || '',
    phone: user?.phone || '',
    universityId: user?.universityId || '', // Editable now
    role: 'member' as UserRole, // Default and fixed
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No auth token found");
      }

      const { password, confirmPassword, role, ...profileData } = formData;
      const apiData = {
        ...profileData,
        // Role is NOT sent, so backend preserves existing role (e.g. FACULTY)
        password: password,
        profileComplete: true,
        approvalStatus: 'APPROVED', // Uppercase to match Prisma enum
      };

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Update local state without password
      updateUser({
        ...profileData,
        profileComplete: true,
        approvalStatus: 'APPROVED',
      });

      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <div className="card max-w-md w-full">
        <div className="mb-4 md:mb-6 text-center">
          <div className="flex justify-center mb-6">
            <img src="/brand-logo.png" alt="Getherlyy" className="h-16 object-contain" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-text text-sm mt-2">Step {step} of 2</p>
          <div className="w-full bg-border rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 ? (
            <>
              <div>
                <label htmlFor="name" className="label">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={user.name}
                  disabled
                  className="input opacity-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="email" className="label">
                  University Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="input opacity-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="universityId" className="label">
                  University ID
                </label>
                <input
                  id="universityId"
                  name="universityId"
                  type="text"
                  value={formData.universityId}
                  onChange={handleInputChange}
                  placeholder="Optional"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="department" className="label">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="input cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Department</option>
                  <option value="AIML">AIML - Artificial Intelligence & Machine Learning</option>
                  <option value="CE">CE - Computer Engineering</option>
                  <option value="CSE">CSE - Computer Science & Engineering</option>
                  <option value="IT">IT - Information Technology</option>
                  <option value="DCE">DCE - Diploma Computer Engineering</option>
                  <option value="DCSE">DCSE - Diploma Computer Science & Engineering</option>
                  <option value="DIT">DIT - Diploma Information Technology</option>
                  <option value="EC">EC - Electronics & Communication</option>
                  <option value="EE">EE - Electrical Engineering</option>
                  <option value="ME">ME - Mechanical Engineering</option>
                  <option value="CE-Civil">CE - Civil Engineering</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full btn btn-primary mt-6"
              >
                Next →
              </button>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="year" className="label">
                  Year / Designation
                </label>
                <select
                  id="year"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="input"
                  required
                >
                  <option value="">Select Year</option>
                  <option value="1st">1st Year</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>

              <div>
                <label htmlFor="phone" className="label">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Set Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className="input"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  className="input"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 btn btn-outline"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 btn btn-primary"
                >
                  {submitting ? 'Completing...' : 'Complete Profile'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
