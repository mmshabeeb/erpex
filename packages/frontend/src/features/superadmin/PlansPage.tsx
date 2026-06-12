// ============================================================
// ERPEX — Plans Page (Super Admin)
// View and manage subscription plans
// ============================================================

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { HiOutlineCreditCard, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

import { API_BASE as API } from '../../lib/api';

export default function PlansPage() {
  const { getAuthHeaders } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/super-admin/plans`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then(setPlans)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planColors = ['#10b981', '#6366f1', '#f59e0b'];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="page-content page-enter">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Subscription Plans</h1>
          <p className="page-subtitle">Manage available subscription tiers</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
        {plans.map((plan, idx) => {
          const features = plan.features ? JSON.parse(plan.features) : {};
          const color = planColors[idx % planColors.length];

          return (
            <div key={plan.id} className="glass-card" style={{
              border: `2px solid ${color}30`,
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Accent top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                background: color,
              }} />

              <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)', paddingTop: 'var(--space-2)' }}>
                <div style={{
                  width: 48, height: 48, margin: '0 auto var(--space-3)',
                  background: `${color}20`, borderRadius: 'var(--radius-lg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color, fontSize: '1.5rem',
                }}>
                  <HiOutlineCreditCard />
                </div>
                <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700 }}>{plan.displayName}</h3>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 800, color, margin: 'var(--space-2) 0' }}>
                  {plan.monthlyPrice === 0 ? 'Free' : `₹${plan.monthlyPrice.toLocaleString()}`}
                  {plan.monthlyPrice > 0 && (
                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 400, color: 'var(--color-text-muted)' }}>/month</span>
                  )}
                </div>
                {plan.yearlyPrice > 0 && (
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    ₹{plan.yearlyPrice.toLocaleString()}/year (save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
                  </div>
                )}
              </div>

              {/* Limits */}
              <div style={{
                padding: 'var(--space-4)', background: 'var(--color-bg-hover)',
                borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                  <span>Users</span><span style={{ fontWeight: 600 }}>{plan.maxUsers}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                  <span>Branches</span><span style={{ fontWeight: 600 }}>{plan.maxBranches}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)' }}>
                  <span>Items</span><span style={{ fontWeight: 600 }}>{plan.maxItems >= 999999 ? 'Unlimited' : plan.maxItems}</span>
                </div>
              </div>

              {/* Features */}
              <div style={{ fontSize: 'var(--font-size-sm)' }}>
                {Object.entries(features).map(([key, enabled]) => (
                  <div key={key} style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                    padding: 'var(--space-1) 0',
                    color: enabled ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  }}>
                    {enabled ? (
                      <HiOutlineCheck style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    ) : (
                      <HiOutlineX style={{ color: 'var(--color-danger)', flexShrink: 0, opacity: 0.5 }} />
                    )}
                    <span style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
