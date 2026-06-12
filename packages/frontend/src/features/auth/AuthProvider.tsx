// ============================================================
// ERPEX — Auth Provider
// React Context for authentication state management
// ============================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE } from '../../lib/api';

interface Company {
  id: string;
  name: string;
  slug: string;
  currency: string;
  currencySymbol: string;
  country: string;
  legalName?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  type: 'super_admin' | 'user';
  role?: string;
  company?: Company;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string, type: 'super_admin' | 'user', companySlug?: string) => Promise<any>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
  impersonate: (companyId: string) => Promise<any>;
  exitImpersonation: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('erpx_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(!!localStorage.getItem('erpx_impersonator_token'));

  // On mount, verify stored token
  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function verifyToken(t: string) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setToken(t);
      } else {
        // Token expired
        localStorage.removeItem('erpx_token');
        localStorage.removeItem('erpx_refresh');
        setToken(null);
        setUser(null);
      }
    } catch {
      localStorage.removeItem('erpx_token');
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }

  async function login(email: string, password: string, type: 'super_admin' | 'user', companySlug?: string) {
    const endpoint = type === 'super_admin' ? '/auth/super-admin/login' : '/auth/login';
    const body: any = { email, password };
    if (companySlug) body.companySlug = companySlug;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    // Multi-company selection needed
    if (data.requireCompanySelection) {
      return data; // Return companies list for selection
    }

    // Store tokens
    localStorage.setItem('erpx_token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('erpx_refresh', data.refreshToken);
    }
    setToken(data.token);
    setUser(data.user);

    return data;
  }

  async function impersonate(companyId: string) {
    const res = await fetch(`${API_BASE}/super-admin/companies/${companyId}/impersonate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Impersonation failed');

    // Save current Super Admin token
    if (token) {
      localStorage.setItem('erpx_impersonator_token', token);
    }

    // Store impersonated tokens
    localStorage.setItem('erpx_token', data.token);
    if (data.refreshToken) {
      localStorage.setItem('erpx_refresh', data.refreshToken);
    }
    setToken(data.token);
    setUser(data.user);
    setIsImpersonating(true);
    return data;
  }

  function exitImpersonation() {
    const impersonatorToken = localStorage.getItem('erpx_impersonator_token');
    if (!impersonatorToken) return;

    localStorage.setItem('erpx_token', impersonatorToken);
    localStorage.removeItem('erpx_impersonator_token');
    localStorage.removeItem('erpx_refresh');
    setToken(impersonatorToken);
    setIsImpersonating(false);
    
    window.location.href = import.meta.env.BASE_URL + 'super-admin';
  }

  function logout() {
    localStorage.removeItem('erpx_token');
    localStorage.removeItem('erpx_refresh');
    localStorage.removeItem('erpx_impersonator_token');
    setToken(null);
    setUser(null);
    setIsImpersonating(false);
  }

  function getAuthHeaders(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isSuperAdmin: user?.type === 'super_admin',
        isImpersonating,
        login,
        logout,
        getAuthHeaders,
        impersonate,
        exitImpersonation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Protected Route Component
export function ProtectedRoute({ children, requireSuperAdmin = false }: { children: ReactNode; requireSuperAdmin?: boolean }) {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = import.meta.env.BASE_URL + 'login';
    return null;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    window.location.href = import.meta.env.BASE_URL;
    return null;
  }

  return <>{children}</>;
}
