// ============================================================
// ERPEX — Sales Returns / Credit Notes Page
// ============================================================

import { useState, useEffect } from 'react';
import { creditNotesApi, contactsApi, invoicesApi, itemsApi } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', APPROVED: '#34d399', VOID: '#6b7280', APPLIED: '#a78bfa',
};

const emptyLine = () => ({ itemId: '', description: '', qty: 1, rate: 0, taxAmount: 0 });

export default function SalesReturnsPage() {
  const [creditNotes, setCreditNotes] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ contactId: '', invoiceId: '', date: new Date().toISOString().slice(0, 10), reason: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const res = await creditNotesApi.list({}); setCreditNotes(res.data); setTotal(res.total); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openForm() {
    setShowForm(true);
    try {
      const [c, i, it] = await Promise.all([contactsApi.list({ type: 'CUSTOMER' }), invoicesApi.list({}), itemsApi.list({})]);
      setContacts(c.data); setInvoices(i.data); setItems(it.data);
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
    setSubmitting(true);
    try {
      const lineData = lines.filter(l => l.description).map((l, i) => ({
        ...l, qty: Number(l.qty), rate: Number(l.rate), taxAmount: Number(l.taxAmount),
        amount: Number(l.qty) * Number(l.rate) + Number(l.taxAmount), sortOrder: i,
      }));
      const subtotal = lineData.reduce((s, l) => s + l.qty * l.rate, 0);
      const taxTotal = lineData.reduce((s, l) => s + l.taxAmount, 0);
      await creditNotesApi.create({
        ...form, invoiceId: form.invoiceId || undefined,
        subtotal, taxTotal, total: subtotal + taxTotal,
        balanceAmount: subtotal + taxTotal,
        lines: lineData,
      });
      setShowForm(false);
      setForm({ contactId: '', invoiceId: '', date: new Date().toISOString().slice(0, 10), reason: '' });
      setLines([emptyLine()]);
      load();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalAmount = creditNotes.reduce((s, cn) => s + (cn.total || 0), 0);
  const lineSubtotal = lines.reduce((s, l) => s + Number(l.qty) * Number(l.rate), 0);
  const lineTax = lines.reduce((s, l) => s + Number(l.taxAmount || 0), 0);
  const customerInvoices = invoices.filter(i => i.contactId === form.contactId);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Returns / Credit Notes</h1>
          <p className="page-subtitle">Issue credit notes for returned goods or billing adjustments</p>
        </div>
        <button className="btn btn-primary" onClick={openForm} id="btn-create-credit-note">+ Create Credit Note</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="kpi-card"><span className="kpi-label">Total Credit Notes</span><span className="kpi-value">{total}</span></div>
        <div className="kpi-card"><span className="kpi-label">Total Credit Value</span><span className="kpi-value" style={{fontSize:'1.3rem',color:'var(--color-rose)'}}>{fmt(totalAmount)}</span></div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create Credit Note (Sales Return)</h3>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Customer *</label>
                <select className="form-input" required value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value, invoiceId: '' }))}>
                  <option value="">Select customer...</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Against Invoice (optional)</label>
                <select className="form-input" value={form.invoiceId} onChange={e => setForm(p => ({ ...p, invoiceId: e.target.value }))}>
                  <option value="">Standalone credit note</option>
                  {customerInvoices.map(inv => <option key={inv.id} value={inv.id}>{inv.number} — {fmt(inv.total)}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Reason</label>
                <input className="form-input" placeholder="e.g., Goods returned, quality issue" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </div>
            </div>

            <h4 style={{ margin: '0.75rem 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>RETURNED ITEMS</h4>
            <table className="data-table" style={{ marginBottom: '0.75rem' }}>
              <thead>
                <tr><th style={{width:'30%'}}>Item</th><th>Description</th><th style={{width:80}}>Qty</th><th style={{width:110}}>Rate</th><th style={{width:100}}>Tax</th><th style={{width:110}}>Credit</th><th style={{width:40}}></th></tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td><select className="form-input" style={{fontSize:'0.82rem'}} value={line.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}><option value="">Select item...</option>{items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}</select></td>
                    <td><input className="form-input" style={{fontSize:'0.82rem'}} value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} min="1" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} value={line.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} value={line.taxAmount} onChange={e => updateLine(idx, 'taxAmount', e.target.value)} /></td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-rose)' }}>{fmt(Number(line.qty) * Number(line.rate) + Number(line.taxAmount || 0))}</td>
                    <td><button type="button" className="btn btn-ghost" style={{padding:'0.15rem 0.3rem',fontSize:'0.7rem',color:'var(--color-rose)'}} onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))} disabled={lines.length === 1}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setLines(prev => [...prev, emptyLine()])}>+ Add Line</button>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-rose)' }}>Credit Total: {fmt(lineSubtotal + lineTax)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Issue Credit Note'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Credit Note #</th><th>Customer</th><th>Invoice</th><th>Date</th><th>Reason</th><th>Status</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Balance</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
            creditNotes.length === 0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No credit notes issued</td></tr> :
            creditNotes.map(cn => (
              <tr key={cn.id}>
                <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600, fontSize: '0.85rem' }}>{cn.number}</code></td>
                <td style={{ fontWeight: 500 }}>{cn.contact?.name || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cn.invoice?.number || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(cn.date)}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{cn.reason || '—'}</td>
                <td><span className="status-badge" style={{ background: (STATUS_COLORS[cn.status] || '#94a3b8') + '22', color: STATUS_COLORS[cn.status], border: `1px solid ${STATUS_COLORS[cn.status]}44` }}>{cn.status}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-rose)' }}>-{fmt(cn.total)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(cn.balanceAmount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
