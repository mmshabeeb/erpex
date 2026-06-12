// ============================================================
// ERPEX — Company Detail Page (Super Admin)
// View company profile, users, subscription, stats
// ============================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  HiOutlineArrowLeft, HiOutlineOfficeBuilding, HiOutlineUserGroup,
  HiOutlineCreditCard, HiOutlinePlus, HiOutlineTrash,
  HiOutlinePencil, HiOutlineCheck, HiOutlineX,
} from 'react-icons/hi';

import { API_BASE as API } from '../../lib/api';

export default function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'subscription'>('overview');
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'VIEWER', phone: '' });
  const [userError, setUserError] = useState('');

  useEffect(() => { loadData(); }, [id]);

  async function loadData() {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API}/super-admin/companies/${id}`, { headers: getAuthHeaders() }),
        fetch(`${API}/super-admin/plans`, { headers: getAuthHeaders() }),
      ]);
      if (cRes.ok) setCompany(await cRes.json());
      if (pRes.ok) setPlans(await pRes.json());
    } catch {}
    setLoading(false);
  }

  async function toggleStatus() {
    try {
      await fetch(`${API}/super-admin/companies/${id}/toggle-status`, {
        method: 'PATCH', headers: getAuthHeaders(),
      });
      loadData();
    } catch {}
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setUserError('');
    try {
      const res = await fetch(`${API}/super-admin/companies/${id}/users`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowAddUser(false);
      setUserForm({ name: '', email: '', password: '', role: 'VIEWER', phone: '' });
      loadData();
    } catch (err: any) {
      setUserError(err.message);
    }
  }

  async function assignPlan(planId: string) {
    try {
      await fetch(`${API}/super-admin/companies/${id}/subscription`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      loadData();
    } catch {}
  }

  async function toggleUserStatus(userId: string) {
    try {
      await fetch(`${API}/super-admin/users/${userId}/toggle-status`, {
        method: 'PATCH', headers: getAuthHeaders(),
      });
      loadData();
    } catch {}
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!company) return <div className="page-content"><div className="glass-card">Company not found</div></div>;

  const currentPlan = company.subscriptions?.[0]?.plan;

  return (
    <div className="page-content page-enter">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate('/super-admin/companies')}>
            <HiOutlineArrowLeft />
          </button>
          <div>
            <h1 className="page-title">{company.name}</h1>
            <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)' }}>
              {company.slug} · {company.country === 'India' ? '🇮🇳' : '🌐'} {company.country} · {company.currency}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button className={`btn ${company.isActive ? 'btn-danger' : 'btn-success'}`}
            onClick={toggleStatus}>
            {company.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar" style={{ marginBottom: 'var(--space-5)' }}>
        {(['overview', 'users', 'subscription'] as const).map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t === 'overview' && <HiOutlineOfficeBuilding />}
            {t === 'users' && <HiOutlineUserGroup />}
            {t === 'subscription' && <HiOutlineCreditCard />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
          <div className="glass-card">
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Company Profile</h3>
            <div className="detail-grid">
              {[
                ['Legal Name', company.legalName],
                ['Industry', company.industry],
                ['Registration', company.registrationNo],
                ['PAN', company.pan],
                ['GSTIN', company.gstin],
                ['State Code', company.stateCode],
                ['Phone', company.phone],
                ['Email', company.email],
                ['Website', company.website],
              ].map(([label, val]) => val && (
                <div key={label as string} className="detail-row">
                  <span className="detail-label">{label}</span>
                  <span className="detail-value" style={['GSTIN', 'PAN'].includes(label as string) ? { fontFamily: 'var(--font-mono)' } : {}}>{val as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card">
            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>Address & Fiscal</h3>
            <div className="detail-grid">
              {[
                ['Address', [company.addressLine1, company.city, company.state, company.postalCode].filter(Boolean).join(', ')],
                ['Currency', `${company.currencySymbol} ${company.currency}`],
                ['Number Format', company.numberFormat],
                ['FY Start', company.fiscalYearStart === 4 ? 'April (India)' : 'January'],
                ['Created', new Date(company.createdAt).toLocaleDateString()],
              ].map(([label, val]) => val && (
                <div key={label as string} className="detail-row">
                  <span className="detail-label">{label}</span>
                  <span className="detail-value">{val as string}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, margin: 'var(--space-5) 0 var(--space-4)' }}>Stats</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
              {[
                ['Accounts', company._count?.accounts],
                ['Contacts', company._count?.contacts],
                ['Items', company._count?.items],
                ['Invoices', company._count?.invoices],
                ['Bills', company._count?.bills],
                ['Users', company.users?.length],
              ].map(([l, v]) => (
                <div key={l as string} style={{
                  padding: 'var(--space-3)', background: 'var(--color-bg-hover)',
                  borderRadius: 'var(--radius-md)', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{v || 0}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="glass-card">
          <div className="glass-card-header">
            <h3 className="glass-card-title">Users</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddUser(true)}>
              <HiOutlinePlus /> Add User
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={addUser} style={{
              padding: 'var(--space-4)', background: 'var(--color-bg-hover)',
              borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
                <input className="form-input" placeholder="Name *" required value={userForm.name}
                  onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} />
                <input type="email" className="form-input" placeholder="Email *" required value={userForm.email}
                  onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} />
                <input className="form-input" placeholder="Password *" required value={userForm.password}
                  onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <select className="form-input form-select" value={userForm.role}
                  onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}>
                  {['OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES', 'PURCHASE', 'VIEWER'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <input className="form-input" placeholder="Phone" value={userForm.phone}
                  onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))} />
                <button type="submit" className="btn btn-primary btn-sm"><HiOutlineCheck /> Add</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowAddUser(false)}><HiOutlineX /></button>
              </div>
              {userError && <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)', marginTop: 'var(--space-2)' }}>{userError}</div>}
            </form>
          )}

          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(company.users || []).map((u: any) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role === 'OWNER' ? 'posted' : u.role === 'ADMIN' ? 'partial' : 'draft'}`}>{u.role}</span></td>
                  <td><span className={`badge ${u.isActive ? 'badge-posted' : 'badge-locked'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                  </td>
                  <td>
                    {u.role !== 'OWNER' && (
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleUserStatus(u.id)} title={u.isActive ? 'Deactivate' : 'Activate'}>
                        {u.isActive ? <HiOutlineX /> : <HiOutlineCheck />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subscription Tab */}
      {tab === 'subscription' && (
        <div className="glass-card">
          <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-4)' }}>
            Current Plan: <span style={{ color: 'var(--color-accent-primary)' }}>{currentPlan?.displayName || 'None'}</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)' }}>
            {plans.map(p => (
              <div key={p.id} style={{
                padding: 'var(--space-5)',
                background: currentPlan?.id === p.id ? 'var(--color-accent-glow)' : 'var(--color-bg-hover)',
                border: `2px solid ${currentPlan?.id === p.id ? 'var(--color-accent-primary)' : 'var(--color-border)'}`,
                borderRadius: 'var(--radius-lg)',
              }}>
                <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>{p.displayName}</h4>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color: 'var(--color-accent-primary)', marginBottom: 'var(--space-3)' }}>
                  {p.monthlyPrice === 0 ? 'Free' : `₹${p.monthlyPrice}`}
                  {p.monthlyPrice > 0 && <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 400, color: 'var(--color-text-muted)' }}>/month</span>}
                </div>
                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
                  <div>Up to {p.maxUsers} users</div>
                  <div>Up to {p.maxBranches} branches</div>
                  <div>{p.maxItems >= 999999 ? 'Unlimited' : `Up to ${p.maxItems}`} items</div>
                </div>
                {currentPlan?.id !== p.id && (
                  <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => assignPlan(p.id)}>
                    Switch to {p.displayName}
                  </button>
                )}
                {currentPlan?.id === p.id && (
                  <div style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                    ✓ Current Plan
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
