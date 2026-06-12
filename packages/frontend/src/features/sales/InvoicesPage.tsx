// ============================================================
// ERPEX — Invoices Page (Sales / Accounts Receivable)
// With dedicated Create Invoice form
// ============================================================

import { useState, useEffect } from 'react';
import { invoicesApi, contactsApi, itemsApi } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', SENT: '#60a5fa', PARTIALLY_PAID: '#fbbf24', PAID: '#34d399', OVERDUE: '#f87171', VOID: '#6b7280',
};

const emptyLine = () => ({ itemId: '', description: '', qty: 1, rate: 0, taxAmount: 0 });

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ contactId: '', date: new Date().toISOString().slice(0, 10), dueDate: '', notes: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await invoicesApi.list({ status: statusFilter || undefined });
      setInvoices(res.data);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openForm() {
    setShowForm(true);
    try {
      const [c, i] = await Promise.all([contactsApi.list({ type: 'CUSTOMER' }), itemsApi.list({})]);
      setContacts(c.data);
      setItems(i.data);
    } catch (e) { console.error(e); }
  }

  function updateLine(idx: number, field: string, value: any) {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      if (field === 'itemId') {
        const item = items.find(it => it.id === value);
        if (item) { updated.description = item.name; updated.rate = item.sellingPrice; }
      }
      return updated;
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactId) return alert('Select a customer');
    if (lines.every(l => !l.itemId && !l.description)) return alert('Add at least one line item');
    setSubmitting(true);
    try {
      const lineData = lines.filter(l => l.description).map((l, i) => ({
        ...l, qty: Number(l.qty), rate: Number(l.rate), taxAmount: Number(l.taxAmount),
        amount: Number(l.qty) * Number(l.rate) + Number(l.taxAmount), sortOrder: i,
      }));
      const subtotal = lineData.reduce((s, l) => s + l.qty * l.rate, 0);
      const taxTotal = lineData.reduce((s, l) => s + l.taxAmount, 0);
      await invoicesApi.create({
        ...form, dueDate: form.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        subtotal, taxTotal, discount: 0, total: subtotal + taxTotal,
        amountPaid: 0, amountDue: subtotal + taxTotal,
        lines: lineData,
      });
      setShowForm(false);
      setForm({ contactId: '', date: new Date().toISOString().slice(0, 10), dueDate: '', notes: '' });
      setLines([emptyLine()]);
      load();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  async function handlePost(id: string) {
    if (!confirm('Post this invoice? This will create journal entries and deduct inventory.')) return;
    try { await invoicesApi.post(id); load(); } catch (e: any) { alert(e.message); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalOutstanding = invoices.filter(i => ['SENT','PARTIALLY_PAID','OVERDUE'].includes(i.status)).reduce((s, i) => s + i.amountDue, 0);
  const totalOverdue = invoices.filter(i => i.status === 'OVERDUE' || (new Date(i.dueDate) < new Date() && i.amountDue > 0)).reduce((s, i) => s + i.amountDue, 0);
  const lineSubtotal = lines.reduce((s, l) => s + Number(l.qty) * Number(l.rate), 0);
  const lineTax = lines.reduce((s, l) => s + Number(l.taxAmount || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Invoices</h1>
          <p className="page-subtitle">Sales invoices & accounts receivable • {total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openForm} id="btn-create-invoice">+ Create Invoice</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="kpi-card"><span className="kpi-label">Total Invoices</span><span className="kpi-value">{total}</span></div>
        <div className="kpi-card"><span className="kpi-label">Outstanding</span><span className="kpi-value" style={{fontSize:'1.3rem',color:'var(--color-amber)'}}>{fmt(totalOutstanding)}</span></div>
        <div className="kpi-card"><span className="kpi-label">Overdue</span><span className="kpi-value" style={{fontSize:'1.3rem',color:'var(--color-rose)'}}>{fmt(totalOverdue)}</span></div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create New Invoice</h3>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Customer *</label>
                <select className="form-input" required value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value }))}>
                  <option value="">Select customer...</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Invoice Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <input className="form-input" placeholder="Optional notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>

            <h4 style={{ margin: '0.75rem 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>LINE ITEMS</h4>
            <table className="data-table" style={{ marginBottom: '0.75rem' }}>
              <thead>
                <tr><th style={{width:'30%'}}>Item</th><th>Description</th><th style={{width:80}}>Qty</th><th style={{width:110}}>Rate</th><th style={{width:100}}>Tax</th><th style={{width:110}}>Amount</th><th style={{width:40}}></th></tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <select className="form-input" style={{fontSize:'0.82rem'}} value={line.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}>
                        <option value="">Select item...</option>
                        {items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
                      </select>
                    </td>
                    <td><input className="form-input" style={{fontSize:'0.82rem'}} value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} min="1" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} value={line.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} value={line.taxAmount} onChange={e => updateLine(idx, 'taxAmount', e.target.value)} /></td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem' }}>{fmt(Number(line.qty) * Number(line.rate) + Number(line.taxAmount || 0))}</td>
                    <td><button type="button" className="btn btn-ghost" style={{padding:'0.15rem 0.3rem',fontSize:'0.7rem',color:'var(--color-rose)'}} onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))} disabled={lines.length === 1}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setLines(prev => [...prev, emptyLine()])}>+ Add Line</button>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subtotal: {fmt(lineSubtotal)}</div>
                {lineTax > 0 && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tax: {fmt(lineTax)}</div>}
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total: {fmt(lineSubtotal + lineTax)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Invoice'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['', 'DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'VOID'].map(s => (
          <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)} style={{ fontSize: '0.8rem' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Invoice #</th><th>Customer</th><th>Date</th><th>Due Date</th><th>Status</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Due</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
            invoices.length === 0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No invoices found</td></tr> :
            invoices.map(inv => (
              <tr key={inv.id}>
                <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600, fontSize: '0.85rem' }}>{inv.number}</code></td>
                <td style={{ fontWeight: 500 }}>{inv.contact?.name || '—'}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{fmtDate(inv.date)}</td>
                <td style={{ color: new Date(inv.dueDate) < new Date() && inv.amountDue > 0 ? 'var(--color-rose)' : 'var(--text-secondary)', fontSize: '0.85rem' }}>{fmtDate(inv.dueDate)}</td>
                <td><span className="status-badge" style={{ background: (STATUS_COLORS[inv.status] || '#94a3b8') + '22', color: STATUS_COLORS[inv.status], border: `1px solid ${STATUS_COLORS[inv.status]}44` }}>{inv.status.replace('_', ' ')}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(inv.total)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: inv.amountDue > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>{fmt(inv.amountDue)}</td>
                <td>
                  {inv.status === 'DRAFT' && <button className="btn btn-ghost" style={{fontSize:'0.75rem',padding:'0.25rem 0.5rem'}} onClick={() => handlePost(inv.id)}>Post</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
