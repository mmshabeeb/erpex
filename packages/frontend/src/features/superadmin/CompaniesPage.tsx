// ============================================================
// ERPEX — Companies Page (Super Admin)
// List companies + Create Company form with India localization
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  HiOutlinePlus, HiOutlineOfficeBuilding, HiOutlineSearch,
  HiOutlineCheckCircle, HiOutlineExclamationCircle,
  HiOutlineX, HiOutlineClock, HiOutlineUserGroup,
  HiOutlineLogin,
} from 'react-icons/hi';
import { API_BASE as API } from '../../lib/api';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Singapore', 'UAE', 'Germany', 'France', 'Japan', 'Other',
];

const INDUSTRIES = [
  'Technology', 'Manufacturing', 'Retail', 'Healthcare', 'Education',
  'Finance & Banking', 'Real Estate', 'Consulting', 'Agriculture',
  'E-Commerce', 'Logistics', 'Hospitality', 'Media', 'Other',
];

const INDIA_STATES_MAP: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function CompaniesPage() {
  const { getAuthHeaders, impersonate } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [companies, setCompanies] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(searchParams.get('create') === '1');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  async function handleImpersonate(companyId: string) {
    if (impersonatingId) return;
    setImpersonatingId(companyId);
    setError('');
    try {
      await impersonate(companyId);
      window.location.href = import.meta.env.BASE_URL || '/';
    } catch (err: any) {
      setError(err.message || 'Direct login failed');
      setImpersonatingId(null);
    }
  }

  // Form state
  const [form, setForm] = useState({
    name: '', legalName: '', industry: '', registrationNo: '',
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '',
    country: 'India',
    pan: '', gstin: '',
    currency: 'INR', currencySymbol: '₹', numberFormat: 'INDIAN', fiscalYearStart: 4,
    phone: '', email: '', website: '', annualTurnover: '',
    adminName: '', adminEmail: '', adminPassword: '',
    planId: '',
  });

  const [gstinValid, setGstinValid] = useState<boolean | null>(null);
  const [gstinInfo, setGstinInfo] = useState<string>('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setError('');
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`${API}/super-admin/companies`, { headers: getAuthHeaders() }),
        fetch(`${API}/super-admin/plans`, { headers: getAuthHeaders() }),
      ]);
      if (!cRes.ok) {
        const data = await cRes.json().catch(() => null);
        throw new Error(data?.error || `Failed to load companies (${cRes.status})`);
      }
      if (!pRes.ok) {
        const data = await pRes.json().catch(() => null);
        throw new Error(data?.error || `Failed to load plans (${pRes.status})`);
      }

      setCompanies(await cRes.json());
      const p = await pRes.json();
      setPlans(p);
      if (p.length > 0 && !form.planId) setForm(f => ({ ...f, planId: p[0].id }));
    } catch (err: any) {
      setError(err.message || 'Unable to connect to the server');
    }
    setLoading(false);
  }

  // Auto-update currency when country changes
  function handleCountryChange(country: string) {
    const isIndia = country === 'India';
    setForm(f => ({
      ...f,
      country,
      currency: isIndia ? 'INR' : 'USD',
      currencySymbol: isIndia ? '₹' : '$',
      numberFormat: isIndia ? 'INDIAN' : 'INTERNATIONAL',
      fiscalYearStart: isIndia ? 4 : 1,
      gstin: isIndia ? f.gstin : '',
      pan: isIndia ? f.pan : '',
    }));
    if (!isIndia) {
      setGstinValid(null);
      setGstinInfo('');
    }
  }

  // GSTIN live validation
  function handleGSTINChange(value: string) {
    const upper = value.toUpperCase();
    setForm(f => ({ ...f, gstin: upper }));

    if (upper.length === 0) {
      setGstinValid(null);
      setGstinInfo('');
      return;
    }
    if (upper.length === 15) {
      if (GSTIN_REGEX.test(upper)) {
        const sc = upper.substring(0, 2);
        const stateName = INDIA_STATES_MAP[sc];
        const pan = upper.substring(2, 12);
        if (stateName) {
          setGstinValid(true);
          setGstinInfo(`✓ State: ${stateName} (${sc}) | PAN: ${pan}`);
          setForm(f => ({ ...f, pan, state: stateName }));
        } else {
          setGstinValid(false);
          setGstinInfo(`✗ Invalid state code: ${sc}`);
        }
      } else {
        setGstinValid(false);
        setGstinInfo('✗ Invalid GSTIN format');
      }
    } else {
      setGstinValid(null);
      setGstinInfo(`${upper.length}/15 characters`);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const body = {
        ...form,
        annualTurnover: form.annualTurnover ? parseFloat(form.annualTurnover) : undefined,
        planId: form.planId || undefined,
      };
      const res = await fetch(`${API}/super-admin/companies`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCreatedResult(data);
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
    setCreating(false);
  }

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  // ─── Success Modal ──────────────────────────────────────────
  if (createdResult) {
    return (
      <div className="page-content page-enter">
        <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: 'var(--space-8)' }}>
          <div className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🎉</div>
            <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
              Company Created Successfully!
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-6)' }}>
              <strong>{createdResult.company.name}</strong> has been provisioned with a full Chart of Accounts,
              GST configurations, fiscal year, and sample data.
            </p>

            {/* Credentials Box */}
            <div style={{
              background: 'var(--color-bg-tertiary)',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-5)',
              textAlign: 'left',
              marginBottom: 'var(--space-6)',
            }}>
              <h3 style={{
                fontSize: 'var(--font-size-md)', fontWeight: 600,
                marginBottom: 'var(--space-4)', color: 'var(--color-warning)',
              }}>
                🔐 Admin Login Credentials
              </h3>
              <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Company Code</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--font-size-md)' }}>
                    {createdResult.slug}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Admin Email</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--font-size-md)' }}>
                    {createdResult.admin.email}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>Admin Password</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--color-warning)' }}>
                    {createdResult.admin.password}
                  </div>
                </div>
              </div>
              <div style={{
                marginTop: 'var(--space-4)', padding: 'var(--space-3)',
                background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)',
              }}>
                ⚠️ Save these credentials now — the password will not be shown again.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setCreatedResult(null); setShowCreate(false); }}>
                Back to Companies
              </button>
              <button className="btn btn-primary" onClick={() => navigate(`/super-admin/companies/${createdResult.company.id}`)}>
                View Company Details
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Create Company Form ────────────────────────────────────
  if (showCreate) {
    return (
      <div className="page-content page-enter">
        <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <h1 className="page-title">Create New Company</h1>
            <p className="page-subtitle">Set up a new company with full Chart of Accounts and tax configuration</p>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
            <HiOutlineX /> Cancel
          </button>
        </div>

        <form onSubmit={handleCreate}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
            {/* Left Column: Company Details */}
            <div className="glass-card">
              <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <HiOutlineOfficeBuilding /> Company Details
              </h3>

              <div className="form-group">
                <label className="form-label">Company Name *</label>
                <input className="form-input" required value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., Acme Pvt Ltd" />
              </div>
              <div className="form-group">
                <label className="form-label">Legal Name</label>
                <input className="form-input" value={form.legalName}
                  onChange={e => setForm(f => ({ ...f, legalName: e.target.value }))}
                  placeholder="Full legal entity name" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Industry</label>
                  <select className="form-input form-select" value={form.industry}
                    onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Registration No.</label>
                  <input className="form-input" value={form.registrationNo}
                    onChange={e => setForm(f => ({ ...f, registrationNo: e.target.value }))}
                    placeholder="CIN/LLP/etc." />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label">Country *</label>
                <select className="form-input form-select" required value={form.country}
                  onChange={e => handleCountryChange(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Address Line 1</label>
                <input className="form-input" value={form.addressLine1}
                  onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input className="form-input" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-input" value={form.state}
                    onChange={e => setForm(f => ({ ...f, state: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">PIN Code</label>
                  <input className="form-input" value={form.postalCode}
                    onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Right Column: Tax, Fiscal, Admin */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {/* Tax Settings (India) */}
              {form.country === 'India' && (
                <div className="glass-card">
                  <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-5)' }}>
                    🇮🇳 India Tax Settings
                  </h3>
                  <div className="form-group">
                    <label className="form-label">GSTIN (15-character)</label>
                    <input className="form-input" value={form.gstin}
                      onChange={e => handleGSTINChange(e.target.value)}
                      maxLength={15} placeholder="e.g., 27AAPFU0939F1ZV"
                      style={{
                        fontFamily: 'var(--font-mono)', letterSpacing: '1px', textTransform: 'uppercase',
                        borderColor: gstinValid === true ? 'var(--color-success)' : gstinValid === false ? 'var(--color-danger)' : undefined,
                      }}
                    />
                    {gstinInfo && (
                      <div style={{
                        marginTop: 'var(--space-1)', fontSize: 'var(--font-size-xs)',
                        color: gstinValid ? 'var(--color-success)' : gstinValid === false ? 'var(--color-danger)' : 'var(--color-text-muted)',
                      }}>
                        {gstinInfo}
                      </div>
                    )}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">PAN</label>
                      <input className="form-input" value={form.pan}
                        onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                        style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                        placeholder="Auto-extracted from GSTIN" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Annual Turnover (₹)</label>
                      <input type="number" className="form-input" value={form.annualTurnover}
                        onChange={e => setForm(f => ({ ...f, annualTurnover: e.target.value }))}
                        placeholder="For e-invoice threshold" />
                    </div>
                  </div>
                  <div style={{
                    padding: 'var(--space-3)', background: 'var(--color-info-bg)',
                    borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-info)',
                  }}>
                    ✨ Auto-provisions: CGST/SGST/IGST ledgers, GST tax rates (5%, 12%, 18%, 28%),
                    TDS sections, FY April–March, and ₹ Indian numbering format.
                  </div>
                </div>
              )}

              {/* Fiscal Settings */}
              <div className="glass-card">
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-5)' }}>
                  📅 Fiscal Settings
                </h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <input className="form-input" value={`${form.currencySymbol} ${form.currency}`} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Number Format</label>
                    <input className="form-input" value={form.numberFormat === 'INDIAN' ? '##,##,###.## (Indian)' : '###,###.## (Intl)'} disabled />
                  </div>
                  <div className="form-group">
                    <label className="form-label">FY Start Month</label>
                    <input className="form-input" value={form.fiscalYearStart === 4 ? 'April (India FY)' : 'January'} disabled />
                  </div>
                </div>
              </div>

              {/* Admin Credentials */}
              <div className="glass-card">
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-5)' }}>
                  🔐 Admin User Credentials
                </h3>
                <div className="form-group">
                  <label className="form-label">Admin Name *</label>
                  <input className="form-input" required value={form.adminName}
                    onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))}
                    placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Email *</label>
                  <input type="email" className="form-input" required value={form.adminEmail}
                    onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
                    placeholder="admin@company.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(auto-generated if empty)</span></label>
                  <input className="form-input" value={form.adminPassword}
                    onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                    placeholder="Leave blank to auto-generate" />
                </div>
              </div>

              {/* Subscription Plan */}
              <div className="glass-card">
                <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, marginBottom: 'var(--space-5)' }}>
                  💳 Subscription Plan
                </h3>
                <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
                  {plans.map(p => (
                    <label key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                      padding: 'var(--space-3) var(--space-4)',
                      background: form.planId === p.id ? 'var(--color-accent-glow)' : 'var(--color-bg-hover)',
                      border: `1px solid ${form.planId === p.id ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}>
                      <input type="radio" name="plan" checked={form.planId === p.id}
                        onChange={() => setForm(f => ({ ...f, planId: p.id }))}
                        style={{ accentColor: 'var(--color-accent-primary)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{p.displayName}</div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                          {p.maxUsers} users · {p.maxBranches} branches · {p.maxItems >= 999999 ? 'Unlimited' : p.maxItems} items
                        </div>
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent-secondary)' }}>
                        {p.monthlyPrice === 0 ? 'Free' : `₹${p.monthlyPrice}/mo`}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
              marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)',
            }}>
              <HiOutlineExclamationCircle /> {error}
            </div>
          )}

          {/* Submit */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary btn-lg" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={creating}>
              {creating ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><HiOutlinePlus /> Create Company</>}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ─── Companies List ─────────────────────────────────────────
  return (
    <div className="page-content page-enter">
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">Manage all registered companies</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <HiOutlinePlus /> Create Company
        </button>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <div style={{ position: 'relative', flex: 1 }}>
          <HiOutlineSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 34, width: '100%' }}
            placeholder="Search companies..." value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
          padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)',
          background: 'var(--color-danger-bg)', color: 'var(--color-danger)',
          borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.2)',
          fontSize: 'var(--font-size-sm)',
        }}>
          <HiOutlineExclamationCircle /> {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="glass-card">
          <div className="empty-state">
            <div className="empty-state-icon">🏢</div>
            <div className="empty-state-title">No Companies Found</div>
            <div className="empty-state-desc">Create your first company to get started</div>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Country</th>
                  <th>GSTIN</th>
                  <th>Plan</th>
                  <th>Users</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: any) => (
                  <tr key={c.id} className="clickable-row" onClick={() => navigate(`/super-admin/companies/${c.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {c.slug}
                      </div>
                    </td>
                    <td>{c.country === 'India' ? '🇮🇳' : '🌐'} {c.country}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--font-size-xs)' }}>
                      {c.gstin || '—'}
                    </td>
                    <td>{c.subscriptions?.[0]?.plan?.displayName || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <HiOutlineUserGroup /> {c._count?.users || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-posted' : 'badge-locked'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                      <HiOutlineClock style={{ display: 'inline', marginRight: 4 }} />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleImpersonate(c.id)}
                        disabled={impersonatingId !== null}
                        className="btn btn-secondary btn-sm"
                        title="Login to Company Admin"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 10px',
                          fontSize: 'var(--font-size-xs)',
                          borderRadius: 'var(--border-radius-sm)',
                          cursor: 'pointer',
                          background: 'var(--color-bg-secondary)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                      >
                        <HiOutlineLogin />
                        {impersonatingId === c.id ? 'Connecting...' : 'Login'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
