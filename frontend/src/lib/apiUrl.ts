/**
 * Get the API base URL from environment variables or fallback to localhost
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }
  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
}

/**
 * Build a complete API endpoint URL
 */
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiUrl();
  // Remove leading slash from endpoint if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

export const apiUrl = getApiUrl();
