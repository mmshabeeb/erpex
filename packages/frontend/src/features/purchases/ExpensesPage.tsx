// ============================================================
// ERPEX — Expenses Page with Create Expense form
// + View/Print/Download
// ============================================================

import { useState, useEffect } from 'react';
import { expensesApi, contactsApi, accountsApi } from '../../api/client';
import DocumentViewer, { DocActionButtons } from '../shared/DocumentViewer';
import type { DocumentData } from '../shared/DocumentViewer';
import { useAuth } from '../auth/AuthProvider';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10), accountId: '', amount: 0,
    description: '', paymentMethod: 'UPI', referenceNo: '', contactId: '',
    isBillable: false, category: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentData | null>(null);
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const res = await expensesApi.list({}); setExpenses(res.data); setTotal(res.total); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openForm() {
    setShowForm(true);
    try {
      const [a, c] = await Promise.all([accountsApi.list(), contactsApi.list({})]);
      // Only show expense-type accounts (5xxxx)
      setAccounts((a.data || a).filter((ac: any) => ac.code?.startsWith('5')));
      setContacts(c.data);
    } catch (e) { console.error(e); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.accountId) return alert('Select an expense account');
    if (!form.amount) return alert('Enter an amount');
    setSubmitting(true);
    try {
      await expensesApi.create({
        ...form, amount: Number(form.amount),
        contactId: form.contactId || undefined,
      });
      setShowForm(false);
      setForm({ date: new Date().toISOString().slice(0, 10), accountId: '', amount: 0, description: '', paymentMethod: 'UPI', referenceNo: '', contactId: '', isBillable: false, category: '' });
      load();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  function handleView(exp: any) {
    const docData: DocumentData = {
      type: 'EXPENSE',
      number: exp.referenceNo || `EXP-${exp.id?.slice(0, 8).toUpperCase() || '0000'}`,
      status: exp.isBillable ? 'BILLABLE' : 'RECORDED',
      date: exp.date,
      company: user?.company ? {
        name: user.company.name, legalName: user.company.legalName,
        address: user.company.address, city: user.company.city,
        state: user.company.state, pinCode: user.company.pinCode,
        gstin: user.company.gstin, pan: user.company.pan,
      } : undefined,
      contact: exp.contact ? {
        name: exp.contact.name, address: exp.contact.address,
        city: exp.contact.city, state: exp.contact.state,
      } : undefined,
      lines: [{
        description: exp.description || 'Expense',
        qty: 1,
        rate: exp.amount,
        amount: exp.amount,
        taxAmount: 0,
      }],
      subtotal: exp.amount,
      taxTotal: 0,
      total: exp.amount,
      paymentMethod: exp.paymentMethod,
      category: exp.category,
      referenceNo: exp.referenceNo,
    };
    setViewDoc(docData);
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track business expenses • {total} entries</p>
        </div>
        <button className="btn btn-primary" onClick={openForm} id="btn-create-expense">+ Record Expense</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="kpi-card"><span className="kpi-label">Total Expenses</span><span className="kpi-value" style={{fontSize:'1.3rem'}}>{fmt(totalExpenses)}</span></div>
        <div className="kpi-card"><span className="kpi-label">Billable</span><span className="kpi-value">{expenses.filter(e => e.isBillable).length}</span></div>
        <div className="kpi-card"><span className="kpi-label">This Month</span><span className="kpi-value">{expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length}</span></div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Record New Expense</h3>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label className="form-label">Expense Account *</label>
              <select className="form-input" required value={form.accountId} onChange={e => setForm(p => ({ ...p, accountId: e.target.value }))}>
                <option value="">Select account...</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Amount *</label>
              <input className="form-input" type="number" required min="1" placeholder="₹ 0" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Payment Method</label>
              <select className="form-input" value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value }))}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <div>
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="What was this expense for?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Reference #</label>
              <input className="form-input" placeholder="Receipt/reference number" value={form.referenceNo} onChange={e => setForm(p => ({ ...p, referenceNo: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Vendor (optional)</label>
              <select className="form-input" value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value }))}>
                <option value="">None</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Category</label>
              <input className="form-input" placeholder="Travel, Office, etc." value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
              <input type="checkbox" id="billable-check" checked={form.isBillable} onChange={e => setForm(p => ({ ...p, isBillable: e.target.checked }))} />
              <label htmlFor="billable-check" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mark as Billable</label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Record Expense'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Description</th><th>Account</th><th>Vendor</th><th>Method</th><th>Category</th><th>Billable</th><th style={{textAlign:'right'}}>Amount</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
            expenses.length === 0 ? <tr><td colSpan={9} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No expenses recorded</td></tr> :
            expenses.map(exp => (
              <tr key={exp.id}>
                <td style={{ fontSize: '0.85rem' }}>{fmtDate(exp.date)}</td>
                <td style={{ fontWeight: 500 }}>{exp.description}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{exp.account?.name || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{exp.contact?.name || '—'}</td>
                <td><span className="status-badge" style={{ background: 'var(--bg-tertiary)', fontSize: '0.75rem' }}>{exp.paymentMethod}</span></td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{exp.category || '—'}</td>
                <td>{exp.isBillable ? <span style={{color:'var(--color-amber)'}}>● Billable</span> : '—'}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(exp.amount)}</td>
                <td><DocActionButtons onView={() => handleView(exp)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewDoc && <DocumentViewer data={viewDoc} open={true} onClose={() => setViewDoc(null)} />}
    </div>
  );
}
