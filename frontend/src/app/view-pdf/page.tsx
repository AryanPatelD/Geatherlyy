'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function ViewPDFContent() {
  const searchParams = useSearchParams();
  const url = searchParams.get('url');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!url) {
      setError(true);
    }
  }, [url]);

  if (error || !url) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid PDF URL</h1>
          <p className="text-muted-text">No PDF URL provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background">
      <div className="w-full h-full flex flex-col">
        <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
          <h1 className="text-lg font-semibold">PDF Viewer</h1>
          <div className="flex gap-2">
            <a
              href={url}
              download
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              Download
            </a>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              Close
            </button>
          </div>
        </div>
        <iframe
          src={url}
          className="w-full flex-1 border-0"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
}

export default function ViewPDFPage() {
  return (
    <Suspense fallback={<div>Loading PDF Viewer...</div>}>
      <ViewPDFContent />
    </Suspense>
  );
}
