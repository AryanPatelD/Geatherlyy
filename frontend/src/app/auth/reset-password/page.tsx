'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { getApiUrl } from '@/lib/apiUrl';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setMessage({ type: 'error', text: 'Invalid password reset link. Please request a new one.' });
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password reset successfully. Redirecting to login...' });
        setTimeout(() => router.push('/login'), 3000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Something went wrong.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to connect to the server.' });
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
     return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Invalid Link</CardTitle>
                <CardDescription>This password reset link is invalid or incomplete.</CardDescription>
            </CardHeader>
             <CardFooter className="flex justify-center">
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                    Request a new link
                </Link>
            </CardFooter>
        </Card>
     )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <div className="flex justify-center mb-4">
          <img src="/brand-logo.png" alt="Getherlyy" className="h-12 object-contain" />
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          Enter your new password below.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={loading}
              minLength={6}
            />
          </div>
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className={message.type === 'success' ? 'border-green-500 text-green-500' : ''}>
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Link href="/login" className="text-sm text-primary hover:underline">
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
             <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordForm />
             </Suspense>
        </div>
    )
}
