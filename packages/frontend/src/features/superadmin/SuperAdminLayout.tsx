// ============================================================
// ERPEX — Super Admin Layout
// Separate layout for the ERPX Main Home portal
// ============================================================

import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  HiOutlineHome, HiOutlineOfficeBuilding,
  HiOutlineCreditCard, HiOutlineLogout, HiOutlineShieldCheck,
} from 'react-icons/hi';

const navItems = [
  { path: '/super-admin', label: 'Dashboard', icon: <HiOutlineHome />, end: true },
  { path: '/super-admin/companies', label: 'Companies', icon: <HiOutlineOfficeBuilding /> },
  { path: '/super-admin/plans', label: 'Plans', icon: <HiOutlineCreditCard /> },
];

export default function SuperAdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo" style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          }}>
            EX
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              ERPX Main Home
            </span>
            <span className="sidebar-brand-sub">Super Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">
            <div className="sidebar-section-title">Platform</div>
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Admin Profile */}
        <div style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            <HiOutlineShieldCheck />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--font-size-sm)', fontWeight: 600,
              color: 'var(--color-text-primary)', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name || 'Super Admin'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-ghost btn-icon"
            title="Logout"
            style={{ flexShrink: 0 }}
          >
            <HiOutlineLogout />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
