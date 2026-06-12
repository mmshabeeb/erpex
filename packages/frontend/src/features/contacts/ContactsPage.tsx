// ============================================================
// ERPEX — Contacts Page (Customers & Vendors)
// ============================================================

import { useState, useEffect } from 'react';
import { contactsApi } from '../../api/client';

const STATUS_BADGE: Record<string, string> = {
  CUSTOMER: 'var(--color-emerald)',
  VENDOR: 'var(--color-amber)',
  BOTH: 'var(--color-blue)',
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'CUSTOMER', email: '', phone: '', companyName: '', taxId: '', creditTermDays: 30 });

  useEffect(() => { load(); }, [typeFilter, search]);

  async function load() {
    setLoading(true);
    try {
      const res = await contactsApi.list({ type: typeFilter || undefined, search: search || undefined });
      setContacts(res.data);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await contactsApi.create(form);
      setShowForm(false);
      setForm({ name: '', type: 'CUSTOMER', email: '', phone: '', companyName: '', taxId: '', creditTermDays: 30 });
      load();
    } catch (e) { console.error(e); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">Manage customers, vendors, and business contacts • {total} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Contact</button>
      </div>

      <div className="card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input className="form-input" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        {['', 'CUSTOMER', 'VENDOR', 'BOTH'].map(t => (
          <button key={t} className={`btn ${typeFilter === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter(t)} style={{ fontSize: '0.8rem' }}>
            {t || 'All'}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>New Contact</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <input className="form-input" placeholder="Name *" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <select className="form-input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="CUSTOMER">Customer</option>
              <option value="VENDOR">Vendor</option>
              <option value="BOTH">Both</option>
            </select>
            <input className="form-input" placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            <input className="form-input" placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            <input className="form-input" placeholder="Company Name" value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))} />
            <input className="form-input" placeholder="Tax ID (GSTIN)" value={form.taxId} onChange={e => setForm(p => ({ ...p, taxId: e.target.value }))} />
            <input className="form-input" type="number" placeholder="Credit Terms (days)" value={form.creditTermDays} onChange={e => setForm(p => ({ ...p, creditTermDays: Number(e.target.value) }))} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="submit">Create</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Company</th><th>Email</th><th>Credit Terms</th><th style={{textAlign:'right'}}>Outstanding</th><th style={{textAlign:'right'}}>Overdue</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
            ) : contacts.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No contacts found</td></tr>
            ) : contacts.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td><span className="status-badge" style={{ background: STATUS_BADGE[c.type] + '22', color: STATUS_BADGE[c.type], border: `1px solid ${STATUS_BADGE[c.type]}44` }}>{c.type}</span></td>
                <td style={{ color: 'var(--text-secondary)' }}>{c.companyName || '—'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{c.email || '—'}</td>
                <td>{c.creditTermDays} days</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(c.outstandingBalance || 0)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: c.overdueAmount > 0 ? 'var(--color-rose)' : 'inherit' }}>
                  {c.overdueAmount > 0 ? fmt(c.overdueAmount) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
