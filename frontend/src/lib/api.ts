export function apiBase() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  // If running in browser during local development, default to the local backend
  if (typeof window !== 'undefined') {
    // If running frontend on localhost and no env var set, assume backend at localhost:4000
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    return window.location.origin;
  }
  return '';
}

export async function apiFetch(path: string, opts?: RequestInit) {
  const base = apiBase();
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(opts && opts.headers ? opts.headers as HeadersInit : undefined);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const finalOpts: RequestInit = { ...(opts || {}), headers };
  return fetch(url, finalOpts);
}
