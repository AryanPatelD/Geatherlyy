'use client';

import { useAuthStore } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { getApiUrl } from '@/lib/apiUrl';
import { LockClosedIcon, EnvelopeClosedIcon, PersonIcon, EyeOpenIcon, EyeNoneIcon } from '@radix-ui/react-icons';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    universityId: '',
    department: '',
    year: '',
    phone: '',
  });
  const [error, setError] = useState('');

  // Helper to import PEM public key
  const importPublicKey = async (pem: string) => {
    // 1. Decode base64 to get the original PEM string
    const pemString = atob(pem);
    
    // 2. Remove headers/footers and newlines to get the base64 body
    const pemBody = pemString
      .replace(/-----BEGIN PUBLIC KEY-----/g, '')
      .replace(/-----END PUBLIC KEY-----/g, '')
      .replace(/\s/g, '');
      
    // 3. Decode base64 body to binary string
    const binaryDerString = atob(pemBody);
    
    // 4. Convert binary string to ArrayBuffer
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
        binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    return window.crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["encrypt"]
    );
  };

  const encryptPassword = async (password: string) => {
    const publicKeyBase64 = process.env.NEXT_PUBLIC_RSA_PUBLIC_KEY;
    if (!publicKeyBase64) return password;
    
    try {
        const key = await importPublicKey(publicKeyBase64);
        const encoded = new TextEncoder().encode(password);
        
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "RSA-OAEP",
            },
            key,
            encoded
        );
        
        // Convert ArrayBuffer to Base64
        const encryptedArray = new Uint8Array(encrypted);
        let binaryString = '';
        for (let i = 0; i < encryptedArray.length; i++) {
            binaryString += String.fromCharCode(encryptedArray[i]);
        }
        return btoa(binaryString);
    } catch (e) {
        console.error("Encryption error:", e);
        return password; // Fallback (though backend will likely fail if expecting encrypted)
    }
  };

  const handleGoogleLogin = () => {
    const apiUrl = getApiUrl();
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = getApiUrl();
      // Ensure we await encryption now
      const encryptedPassword = await encryptPassword(formData.password);
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: encryptedPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      
      // Format user data with lowercase role
      const user = {
        id: data.user.id?.toString() || '',
        email: data.user.email || '',
        name: data.user.name || '',
        universityId: data.user.universityId || '',
        department: data.user.department || '',
        year: data.user.year || '',
        phone: data.user.phone || '',
        role: data.user.role?.toLowerCase() || 'member',
        profileComplete: data.user.profileComplete || false,
        approvalStatus: data.user.approvalStatus,
        avatar: data.user.avatar,
      };
      
      setUser(user);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Registration failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      
      // Format user data with lowercase role
      const user = {
        id: data.user.id?.toString() || '',
        email: data.user.email || '',
        name: data.user.name || '',
        universityId: data.user.universityId || '',
        department: data.user.department || '',
        year: data.user.year || '',
        phone: data.user.phone || '',
        role: data.user.role?.toLowerCase() || 'member',
        profileComplete: data.user.profileComplete || false,
        approvalStatus: data.user.approvalStatus,
        avatar: data.user.avatar,
      };
      
      setUser(user);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration failed:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Left Side - Hero & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
             <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse"></div>
             <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-orange-600/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-lg text-center space-y-8 flex flex-col items-center">
            {/* Logo Image */}
            <div className="relative w-64 h-64 mb-8 transform hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl"></div>
                {/* Displaying brand-logo.png as requested for the main logo */}
                {/* The user asked for "previous as the logo", which is brand-logo.png */}
                <img 
                    src="/brand-logo.png" 
                    alt="Getherlyy Logo" 
                    className="relative w-full h-full object-contain drop-shadow-2xl"
                />
            </div>

            <div className="space-y-4">
                <h1 className="text-5xl font-bold tracking-tight text-white">
                    Unite. <span className="text-orange-500">Engage.</span> Grow.
                </h1>
                <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed">
                    The ultimate platform for university clubs. Manage events, track memberships, and build your community with Getherlyy.
                </p>
            </div>
            
            {/* Testimonial Card */}
            <div className="mt-12 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl text-left max-w-sm mx-auto transform hover:-translate-y-1 transition-transform">
                <div className="flex gap-1 text-orange-500 mb-3">
                    {[1,2,3,4,5].map(i => <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}
                </div>
                <p className="text-slate-300 italic mb-4">"Getherlyy transformed how we manage our coding club. Attendance is up 40%!"</p>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">JD</div>
                    <div>
                        <p className="text-white font-medium text-sm">John Doe</p>
                        <p className="text-slate-500 text-xs">CS Club President</p>
                    </div>
                </div>
            </div>
        </div>

        <div className="absolute bottom-8 text-slate-600 text-sm font-medium">
            © 2026 Getherlyy Inc.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 bg-white dark:bg-slate-950">
        <div className="w-full max-w-[420px] space-y-8">
            {/* Mobile Branding */}
            <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
               <img src="/brand-logo.png" alt="Getherlyy" className="w-32 h-auto object-contain" />
            </div>

            <div className="space-y-2">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {isRegister ? 'Join the Community' : 'Welcome Back'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                {isRegister ? 'Start your journey with us today.' : 'Please enter your details to sign in.'}
                </p>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400 p-4 rounded-r shadow-sm flex items-center gap-3 animate-shake">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="space-y-4">
                <button
                    onClick={handleGoogleLogin}
                    type="button"
                    className="w-full relative flex items-center justify-center gap-3 px-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 group"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span className="font-semibold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Continue with Google</span>
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400">
                        Or continue with email
                    </span>
                    </div>
                </div>
            </div>

            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-5">
                {isRegister && (
                    <div className="space-y-1">
                        <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            required
                            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="student@university.edu"
                        required
                        className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                    />
                </div>

                <div className="space-y-1">
                    <div className="flex items-center justify-between ml-1">
                        <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        {!isRegister && (
                            <a href="/auth/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-500 transition-colors">
                                Forgot password?
                            </a>
                        )}
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="••••••••"
                            required
                            className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                            {showPassword ? <EyeNoneIcon className="h-5 w-5" /> : <EyeOpenIcon className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                {isRegister && (
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">ID</label>
                             <input
                                id="universityId"
                                name="universityId"
                                type="text"
                                value={formData.universityId}
                                onChange={handleInputChange}
                                placeholder="STU123"
                                required
                                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                             />
                        </div>
                        <div className="space-y-1">
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Year</label>
                             <input
                                id="year"
                                name="year"
                                type="text"
                                value={formData.year}
                                onChange={handleInputChange}
                                placeholder="2nd"
                                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                             />
                        </div>
                         <div className="col-span-2 space-y-1">
                             <label className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Department</label>
                             <input
                                id="department"
                                name="department"
                                type="text"
                                value={formData.department}
                                onChange={handleInputChange}
                                placeholder="Computer Science"
                                required
                                className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all font-medium"
                             />
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full relative overflow-hidden bg-orange-600 hover:bg-orange-700 text-white py-3.5 px-4 rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="relative z-10">{loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}</span>
                </button>
            </form>

            <div className="text-center pt-2">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                    <button
                        onClick={() => {
                        setIsRegister(!isRegister);
                        setError('');
                        }}
                        className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                        {isRegister ? 'Login here' : 'Register now'}
                    </button>
                </p>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">Terms of Service</a>
            </div>
        </div>
      </div>
    </div>
  );
}
