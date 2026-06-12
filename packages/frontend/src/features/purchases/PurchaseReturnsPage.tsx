// ============================================================
// ERPEX — Purchase Returns / Debit Notes Page
// ============================================================

import { useState, useEffect } from 'react';
import { vendorCreditsApi, contactsApi, billsApi, itemsApi } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', APPROVED: '#34d399', VOID: '#6b7280', APPLIED: '#a78bfa',
};

const emptyLine = () => ({ itemId: '', description: '', qty: 1, rate: 0, taxAmount: 0 });

export default function PurchaseReturnsPage() {
  const [vendorCredits, setVendorCredits] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ contactId: '', billId: '', date: new Date().toISOString().slice(0, 10), reason: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const res = await vendorCreditsApi.list({}); setVendorCredits(res.data); setTotal(res.total); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openForm() {
    setShowForm(true);
    try {
      const [c, b, it] = await Promise.all([contactsApi.list({ type: 'VENDOR' }), billsApi.list({}), itemsApi.list({})]);
      setContacts(c.data); setBills(b.data); setItems(it.data);
    } catch (e) { console.error(e); }
  }

  function updateLine(idx: number, field: string, value: any) {
    setLines(prev => prev.map((l, i) => {
      if (i !== idx) return l;
      const updated = { ...l, [field]: value };
      if (field === 'itemId') {
        const item = items.find(it => it.id === value);
        if (item) { updated.description = item.name; updated.rate = item.purchasePrice; }
      }
      return updated;
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.contactId) return alert('Select a vendor');
    setSubmitting(true);
    try {
      const lineData = lines.filter(l => l.description).map((l, i) => ({
        ...l, qty: Number(l.qty), rate: Number(l.rate), taxAmount: Number(l.taxAmount),
        amount: Number(l.qty) * Number(l.rate) + Number(l.taxAmount), sortOrder: i,
      }));
      const subtotal = lineData.reduce((s, l) => s + l.qty * l.rate, 0);
      const taxTotal = lineData.reduce((s, l) => s + l.taxAmount, 0);
      await vendorCreditsApi.create({
        ...form, billId: form.billId || undefined,
        subtotal, taxTotal, total: subtotal + taxTotal,
        balanceAmount: subtotal + taxTotal,
        lines: lineData,
      });
      setShowForm(false);
      setForm({ contactId: '', billId: '', date: new Date().toISOString().slice(0, 10), reason: '' });
      setLines([emptyLine()]);
      load();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalAmount = vendorCredits.reduce((s, vc) => s + (vc.total || 0), 0);
  const lineSubtotal = lines.reduce((s, l) => s + Number(l.qty) * Number(l.rate), 0);
  const lineTax = lines.reduce((s, l) => s + Number(l.taxAmount || 0), 0);
  const vendorBills = bills.filter(b => b.contactId === form.contactId);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchase Returns / Debit Notes</h1>
          <p className="page-subtitle">Issue debit notes for goods returned to vendors</p>
        </div>
        <button className="btn btn-primary" onClick={openForm} id="btn-create-debit-note">+ Create Debit Note</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="kpi-card"><span className="kpi-label">Total Debit Notes</span><span className="kpi-value">{total}</span></div>
        <div className="kpi-card"><span className="kpi-label">Total Return Value</span><span className="kpi-value" style={{fontSize:'1.3rem',color:'var(--color-emerald)'}}>{fmt(totalAmount)}</span></div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create Debit Note (Purchase Return)</h3>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Vendor *</label>
                <select className="form-input" required value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value, billId: '' }))}>
                  <option value="">Select vendor...</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Against Bill (optional)</label>
                <select className="form-input" value={form.billId} onChange={e => setForm(p => ({ ...p, billId: e.target.value }))}>
                  <option value="">Standalone debit note</option>
                  {vendorBills.map(bill => <option key={bill.id} value={bill.id}>{bill.number} — {fmt(bill.total)}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Reason</label>
                <input className="form-input" placeholder="e.g., Defective goods, wrong shipment" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
              </div>
            </div>

            <h4 style={{ margin: '0.75rem 0 0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>RETURNED ITEMS</h4>
            <table className="data-table" style={{ marginBottom: '0.75rem' }}>
              <thead>
                <tr><th style={{width:'30%'}}>Item</th><th>Description</th><th style={{width:80}}>Qty</th><th style={{width:110}}>Rate</th><th style={{width:100}}>Tax</th><th style={{width:110}}>Debit</th><th style={{width:40}}></th></tr>
              </thead>
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td><select className="form-input" style={{fontSize:'0.82rem'}} value={line.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}><option value="">Select item...</option>{items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}</select></td>
                    <td><input className="form-input" style={{fontSize:'0.82rem'}} value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} min="1" value={line.qty} onChange={e => updateLine(idx, 'qty', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} value={line.rate} onChange={e => updateLine(idx, 'rate', e.target.value)} /></td>
                    <td><input className="form-input" type="number" style={{fontSize:'0.82rem',textAlign:'right'}} value={line.taxAmount} onChange={e => updateLine(idx, 'taxAmount', e.target.value)} /></td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-emerald)' }}>{fmt(Number(line.qty) * Number(line.rate) + Number(line.taxAmount || 0))}</td>
                    <td><button type="button" className="btn btn-ghost" style={{padding:'0.15rem 0.3rem',fontSize:'0.7rem',color:'var(--color-rose)'}} onClick={() => setLines(prev => prev.filter((_, i) => i !== idx))} disabled={lines.length === 1}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setLines(prev => [...prev, emptyLine()])}>+ Add Line</button>
              <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-emerald)' }}>Debit Total: {fmt(lineSubtotal + lineTax)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Issue Debit Note'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Debit Note #</th><th>Vendor</th><th>Bill</th><th>Date</th><th>Reason</th><th>Status</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Balance</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
            vendorCredits.length === 0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No debit notes issued</td></tr> :
            vendorCredits.map(vc => (
              <tr key={vc.id}>
                <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600, fontSize: '0.85rem' }}>{vc.number}</code></td>
                <td style={{ fontWeight: 500 }}>{vc.contact?.name || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{vc.bill?.number || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(vc.date)}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{vc.reason || '—'}</td>
                <td><span className="status-badge" style={{ background: (STATUS_COLORS[vc.status] || '#94a3b8') + '22', color: STATUS_COLORS[vc.status], border: `1px solid ${STATUS_COLORS[vc.status]}44` }}>{vc.status}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-emerald)' }}>{fmt(vc.total)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(vc.balanceAmount || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
