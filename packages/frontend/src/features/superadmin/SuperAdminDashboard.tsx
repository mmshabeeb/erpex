// ============================================================
// ERPEX — Super Admin Dashboard
// KPI cards, recent companies, quick actions
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  HiOutlineOfficeBuilding, HiOutlineUserGroup,
  HiOutlineCreditCard, HiOutlineCheckCircle,
  HiOutlinePlus, HiOutlineClock,
} from 'react-icons/hi';

import { API_BASE as API } from '../../lib/api';

export default function SuperAdminDashboard() {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalCompanies: 0, activeCompanies: 0, totalUsers: 0, totalPlans: 0 });
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsRes, companiesRes] = await Promise.all([
        fetch(`${API}/super-admin/stats`, { headers: getAuthHeaders() }),
        fetch(`${API}/super-admin/companies`, { headers: getAuthHeaders() }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (companiesRes.ok) setCompanies(await companiesRes.json());
    } catch {}
    setLoading(false);
  }

  const kpis = [
    { label: 'Total Companies', value: stats.totalCompanies, icon: <HiOutlineOfficeBuilding />, color: '#6366f1' },
    { label: 'Active Companies', value: stats.activeCompanies, icon: <HiOutlineCheckCircle />, color: '#10b981' },
    { label: 'Total Users', value: stats.totalUsers, icon: <HiOutlineUserGroup />, color: '#3b82f6' },
    { label: 'Subscription Plans', value: stats.totalPlans, icon: <HiOutlineCreditCard />, color: '#f59e0b' },
  ];

  return (
    <div className="page-content page-enter">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">ERPX Main Home</h1>
          <p className="page-subtitle">Platform administration dashboard</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/super-admin/companies?create=1')}>
          <HiOutlinePlus /> New Company
        </button>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpis.map(kpi => (
          <div key={kpi.label} className="kpi-card" style={{ '--kpi-accent': kpi.color } as any}>
            <div className="kpi-label">
              <span style={{ color: kpi.color }}>{kpi.icon}</span>
              {kpi.label}
            </div>
            <div className="kpi-value">{loading ? '—' : kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Companies */}
      <div className="glass-card" style={{ marginTop: 'var(--space-4)' }}>
        <div className="glass-card-header">
          <div>
            <h2 className="glass-card-title">Recent Companies</h2>
            <p className="glass-card-subtitle">Latest company registrations</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/super-admin/companies')}>
            View All
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : companies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">No Companies Yet</div>
            <div className="empty-state-desc">Create your first company to get started</div>
            <button
              className="btn btn-primary"
              style={{ marginTop: 'var(--space-4)' }}
              onClick={() => navigate('/super-admin/companies?create=1')}
            >
              <HiOutlinePlus /> Create Company
            </button>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Country</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {companies.slice(0, 10).map((c: any) => (
                  <tr
                    key={c.id}
                    className="clickable-row"
                    onClick={() => navigate(`/super-admin/companies/${c.id}`)}
                  >
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{c.slug}</div>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        {c.country === 'India' ? '🇮🇳' : '🌐'} {c.country}
                      </span>
                    </td>
                    <td>
                      {c.subscriptions?.[0]?.plan?.displayName || (
                        <span style={{ color: 'var(--color-text-muted)' }}>No Plan</span>
                      )}
                    </td>
                    <td>{c._count?.users || 0}</td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-posted' : 'badge-locked'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', color: 'var(--color-text-secondary)' }}>
                        <HiOutlineClock />
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
