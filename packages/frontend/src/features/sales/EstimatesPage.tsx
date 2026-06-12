// ============================================================
// ERPEX — Estimates Page (Quotes/Proposals)
// With dedicated Create Estimate form + View/Print/Download
// ============================================================

import { useState, useEffect } from 'react';
import { estimatesApi, contactsApi, itemsApi } from '../../api/client';
import DocumentViewer, { DocActionButtons } from '../shared/DocumentViewer';
import type { DocumentData } from '../shared/DocumentViewer';
import { useAuth } from '../auth/AuthProvider';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', SENT: '#60a5fa', ACCEPTED: '#34d399', DECLINED: '#f87171', INVOICED: '#a78bfa',
};

const emptyLine = () => ({ itemId: '', description: '', qty: 1, rate: 0, taxAmount: 0 });

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ contactId: '', date: new Date().toISOString().slice(0, 10), expiryDate: '', notes: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentData | null>(null);
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const res = await estimatesApi.list({}); setEstimates(res.data); setTotal(res.total); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openForm() {
    setShowForm(true);
    try {
      const [c, i] = await Promise.all([contactsApi.list({ type: 'CUSTOMER' }), itemsApi.list({})]);
      setContacts(c.data); setItems(i.data);
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
      await estimatesApi.create({
        ...form, expiryDate: form.expiryDate || undefined,
        subtotal, taxTotal, discount: 0, total: subtotal + taxTotal,
        lines: lineData,
      });
      setShowForm(false);
      setForm({ contactId: '', date: new Date().toISOString().slice(0, 10), expiryDate: '', notes: '' });
      setLines([emptyLine()]);
      load();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  async function handleConvert(id: string) {
    if (!confirm('Convert this estimate to an invoice?')) return;
    try { await estimatesApi.convertToInvoice(id); load(); } catch (e: any) { alert(e.message); }
  }

  async function handleStatus(id: string, status: string) {
    try { await estimatesApi.updateStatus(id, status); load(); } catch (e: any) { alert(e.message); }
  }

  function handleView(est: any) {
    const docData: DocumentData = {
      type: 'ESTIMATE',
      number: est.number,
      status: est.status,
      date: est.date,
      dueDate: est.expiryDate,
      company: user?.company ? {
        name: user.company.name, legalName: user.company.legalName,
        address: user.company.address, city: user.company.city,
        state: user.company.state, pinCode: user.company.pinCode,
        gstin: user.company.gstin, pan: user.company.pan,
      } : undefined,
      contact: est.contact ? {
        name: est.contact.name, address: est.contact.address,
        city: est.contact.city, state: est.contact.state,
        gstin: est.contact.gstin, pan: est.contact.pan,
        phone: est.contact.phone, email: est.contact.email,
      } : undefined,
      lines: (est.lines || []).map((l: any) => ({
        description: l.description || l.item?.name || '',
        itemName: l.item?.name, qty: l.qty, rate: l.rate,
        amount: l.amount, taxAmount: l.taxAmount || 0,
        hsnCode: l.item?.hsnCode, sacCode: l.item?.sacCode,
      })),
      subtotal: est.subtotal || 0, taxTotal: est.taxTotal || 0,
      discount: est.discount || 0, total: est.total || 0,
      notes: est.notes,
    };
    setViewDoc(docData);
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const lineSubtotal = lines.reduce((s, l) => s + Number(l.qty) * Number(l.rate), 0);
  const lineTax = lines.reduce((s, l) => s + Number(l.taxAmount || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estimates</h1>
          <p className="page-subtitle">Quotes and proposals • {total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openForm} id="btn-create-estimate">+ Create Estimate</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create New Estimate</h3>
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
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Expiry Date</label>
                <input className="form-input" type="date" value={form.expiryDate} onChange={e => setForm(p => ({ ...p, expiryDate: e.target.value }))} />
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
                    <td><select className="form-input" style={{fontSize:'0.82rem'}} value={line.itemId} onChange={e => updateLine(idx, 'itemId', e.target.value)}><option value="">Select item...</option>{items.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}</select></td>
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
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Total: {fmt(lineSubtotal + lineTax)}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Estimate'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Estimate #</th><th>Customer</th><th>Date</th><th>Expiry</th><th>Status</th><th style={{textAlign:'right'}}>Total</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
            estimates.length === 0 ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No estimates found</td></tr> :
            estimates.map(est => (
              <tr key={est.id}>
                <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600, fontSize: '0.85rem' }}>{est.number}</code></td>
                <td style={{ fontWeight: 500 }}>{est.contact?.name}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(est.date)}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{est.expiryDate ? fmtDate(est.expiryDate) : '—'}</td>
                <td><span className="status-badge" style={{ background: (STATUS_COLORS[est.status] || '#94a3b8') + '22', color: STATUS_COLORS[est.status], border: `1px solid ${STATUS_COLORS[est.status]}44` }}>{est.status}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(est.total)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <DocActionButtons onView={() => handleView(est)} />
                    {est.status === 'DRAFT' && <button className="btn btn-ghost" style={{fontSize:'0.7rem',padding:'0.2rem 0.4rem'}} onClick={() => handleStatus(est.id, 'SENT')}>Send</button>}
                    {est.status === 'SENT' && <>
                      <button className="btn btn-ghost" style={{fontSize:'0.7rem',padding:'0.2rem 0.4rem',color:'var(--color-emerald)'}} onClick={() => handleStatus(est.id, 'ACCEPTED')}>Accept</button>
                      <button className="btn btn-ghost" style={{fontSize:'0.7rem',padding:'0.2rem 0.4rem',color:'var(--color-rose)'}} onClick={() => handleStatus(est.id, 'DECLINED')}>Decline</button>
                    </>}
                    {est.status === 'ACCEPTED' && <button className="btn btn-primary" style={{fontSize:'0.7rem',padding:'0.2rem 0.5rem'}} onClick={() => handleConvert(est.id)}>→ Invoice</button>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewDoc && <DocumentViewer data={viewDoc} open={true} onClose={() => setViewDoc(null)} />}
    </div>
  );
}
