// ============================================================
// ERPEX — API Client
// Centralized fetch wrapper that auto-injects auth headers
// ============================================================

// In production: use relative path (Nginx proxies /erpex/api/ → localhost:3001/api/)
// In dev: hit the backend directly (Vite proxy handles /api/)
const API_BASE = import.meta.env.PROD
  ? '/erpex/api'
  : 'http://localhost:3001/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('erpx_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  };

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}

export async function apiGet<T = any>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function apiPost<T = any>(path: string, body: any): Promise<T> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function apiPatch<T = any>(path: string, body: any): Promise<T> {
  const res = await apiFetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await apiFetch(path, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
}

// Legacy compatibility: inject auth into global fetch for pages that haven't migrated yet
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    
    // Only inject auth for our API calls (both absolute and relative paths)
    if (url.includes('/api/') && (url.includes('localhost:3001') || url.startsWith('/api/') || url.startsWith('http://localhost:3001'))) {
      init = init || {};
      const token = localStorage.getItem('erpx_token');
      if (token) {
        const existingHeaders = init.headers || {};
        let hasAuth = false;
        
        if (existingHeaders instanceof Headers) {
          hasAuth = existingHeaders.has('Authorization');
        } else if (Array.isArray(existingHeaders)) {
          hasAuth = existingHeaders.some(([k]) => k.toLowerCase() === 'authorization');
        } else if (typeof existingHeaders === 'object') {
          hasAuth = Object.keys(existingHeaders).some(k => k.toLowerCase() === 'authorization');
        }
        
        if (!hasAuth) {
          if (typeof existingHeaders === 'object' && !Array.isArray(existingHeaders) && !(existingHeaders instanceof Headers)) {
            init.headers = { ...existingHeaders, Authorization: `Bearer ${token}` };
          } else {
            const h = new Headers(existingHeaders as HeadersInit);
            h.set('Authorization', `Bearer ${token}`);
            init.headers = h;
          }
        }
      }
    }
    
    return originalFetch(input, init);
  } as typeof fetch;
}

export { API_BASE };
