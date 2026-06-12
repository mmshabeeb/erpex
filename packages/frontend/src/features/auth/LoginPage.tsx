// ============================================================
// ERPEX — Login Page
// Premium glassmorphism login with Super Admin / Company toggle
// ============================================================

import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import {
  HiOutlineShieldCheck, HiOutlineOfficeBuilding,
  HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineExclamationCircle, HiOutlineCheckCircle,
} from 'react-icons/hi';

export default function LoginPage() {
  const { login } = useAuth();
  const [loginType, setLoginType] = useState<'super_admin' | 'user'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companySlug, setCompanySlug] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Array<{ slug: string; name: string }> | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, loginType, companySlug || undefined);
      if (result?.requireCompanySelection) {
        setCompanies(result.companies);
        setLoading(false);
        return;
      }
      // Redirect based on login type
      window.location.href = loginType === 'super_admin' ? '/super-admin' : '/';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const selectCompany = async (slug: string) => {
    setCompanySlug(slug);
    setCompanies(null);
    setError('');
    setLoading(true);
    try {
      await login(email, password, 'user', slug);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-6)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background effects */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
      }} />

      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        border: 'var(--glass-border)',
        borderRadius: 'var(--radius-2xl)',
        boxShadow: 'var(--glass-shadow)',
        padding: 'var(--space-8)',
        animation: 'slideUp var(--transition-normal)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo & Brand */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 56, height: 56, margin: '0 auto var(--space-4)',
            background: 'var(--color-accent-gradient)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: 800, color: 'white',
            boxShadow: 'var(--shadow-glow)',
          }}>
            EX
          </div>
          <h1 style={{
            fontSize: 'var(--font-size-xl)', fontWeight: 700,
            background: 'var(--color-accent-gradient)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            ERPEX
          </h1>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Financial Accounting Engine
          </p>
        </div>

        {/* Login Type Toggle */}
        <div style={{
          display: 'flex', gap: 'var(--space-1)',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 'var(--radius-lg)',
          padding: '3px', marginBottom: 'var(--space-6)',
        }}>
          {[
            { type: 'user' as const, label: 'Company Login', icon: <HiOutlineOfficeBuilding /> },
            { type: 'super_admin' as const, label: 'Super Admin', icon: <HiOutlineShieldCheck /> },
          ].map(opt => (
            <button
              key={opt.type}
              type="button"
              onClick={() => { setLoginType(opt.type); setError(''); setCompanies(null); }}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                fontSize: 'var(--font-size-sm)', fontWeight: 500,
                background: loginType === opt.type ? 'var(--color-accent-gradient)' : 'transparent',
                color: loginType === opt.type ? 'white' : 'var(--color-text-secondary)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {opt.icon} {opt.label}
            </button>
          ))}
        </div>

        {/* Company Selection (if multi-company) */}
        {companies && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
              Select a company to continue:
            </p>
            {companies.map(c => (
              <button
                key={c.slug}
                onClick={() => selectCompany(c.slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  width: '100%', padding: 'var(--space-3) var(--space-4)',
                  background: 'var(--color-bg-hover)', border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)',
                  marginBottom: 'var(--space-2)', transition: 'all var(--transition-fast)',
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--color-accent-primary)')}
                onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
              >
                <HiOutlineOfficeBuilding /> {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Login Form */}
        {!companies && (
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500,
                color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)',
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineMail style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)', fontSize: '1.1rem',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={loginType === 'super_admin' ? 'admin@erpx.com' : 'user@company.com'}
                  required
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{
                display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500,
                color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <HiOutlineLockClosed style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)', fontSize: '1.1rem',
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-input"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-text-muted)', fontSize: '1.1rem', padding: 4,
                  }}
                >
                  {showPassword ? <HiOutlineEyeOff /> : <HiOutlineEye />}
                </button>
              </div>
            </div>

            {/* Company Slug (for company login) */}
            {loginType === 'user' && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{
                  display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 500,
                  color: 'var(--color-text-secondary)', marginBottom: 'var(--space-2)',
                }}>
                  Company Code <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <HiOutlineOfficeBuilding style={{
                    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--color-text-muted)', fontSize: '1.1rem',
                  }} />
                  <input
                    type="text"
                    value={companySlug}
                    onChange={e => setCompanySlug(e.target.value)}
                    placeholder="my-company"
                    className="form-input"
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-danger-bg)', border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)',
                fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)',
              }}>
                <HiOutlineExclamationCircle /> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginBottom: 'var(--space-4)' }}
            >
              {loading ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <>Sign In</>
              )}
            </button>

            {/* Demo Credentials */}
            {loginType === 'super_admin' && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--color-info-bg)', border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)',
                color: 'var(--color-info)',
              }}>
                <HiOutlineCheckCircle style={{ fontSize: '1rem', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>Demo Credentials:</strong><br />
                  Email: admin@erpx.com<br />
                  Password: Admin@123
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
