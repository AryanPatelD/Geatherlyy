'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QuizResultsRedirect({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct results page path
    router.replace(`/dashboard/quiz/results/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="p-8 flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-text">Redirecting to results...</p>
      </div>
    </div>
  );
}
