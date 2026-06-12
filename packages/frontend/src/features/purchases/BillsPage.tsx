// ============================================================
// ERPEX — Bills Page (Accounts Payable) with Create Bill form
// + View/Print/Download
// ============================================================

import { useState, useEffect } from 'react';
import { billsApi, contactsApi, itemsApi } from '../../api/client';
import DocumentViewer, { DocActionButtons } from '../shared/DocumentViewer';
import type { DocumentData } from '../shared/DocumentViewer';
import { useAuth } from '../auth/AuthProvider';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', RECEIVED: '#60a5fa', PARTIALLY_PAID: '#fbbf24', PAID: '#34d399', OVERDUE: '#f87171',
};

const emptyLine = () => ({ itemId: '', description: '', qty: 1, rate: 0, taxAmount: 0 });

export default function BillsPage() {
  const [bills, setBills] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ contactId: '', date: new Date().toISOString().slice(0, 10), dueDate: '', billNo: '', notes: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentData | null>(null);
  const { user } = useAuth();

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    setLoading(true);
    try { const res = await billsApi.list({ status: statusFilter || undefined }); setBills(res.data); setTotal(res.total); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function openForm() {
    setShowForm(true);
    try {
      const [c, i] = await Promise.all([contactsApi.list({ type: 'VENDOR' }), itemsApi.list({})]);
      setContacts(c.data); setItems(i.data);
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
      await billsApi.create({
        ...form, dueDate: form.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        subtotal, taxTotal, discount: 0, total: subtotal + taxTotal,
        amountPaid: 0, amountDue: subtotal + taxTotal,
        lines: lineData,
      });
      setShowForm(false);
      setForm({ contactId: '', date: new Date().toISOString().slice(0, 10), dueDate: '', billNo: '', notes: '' });
      setLines([emptyLine()]);
      load();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  async function handlePost(id: string) {
    if (!confirm('Post this bill? This will create journal entries and add inventory.')) return;
    try { await billsApi.post(id); load(); } catch (e: any) { alert(e.message); }
  }

  function handleView(bill: any) {
    const docData: DocumentData = {
      type: 'BILL',
      number: bill.number,
      status: bill.status,
      date: bill.date,
      dueDate: bill.dueDate,
      company: user?.company ? {
        name: user.company.name, legalName: user.company.legalName,
        address: user.company.address, city: user.company.city,
        state: user.company.state, pinCode: user.company.pinCode,
        gstin: user.company.gstin, pan: user.company.pan,
      } : undefined,
      contact: bill.contact ? {
        name: bill.contact.name, address: bill.contact.address,
        city: bill.contact.city, state: bill.contact.state,
        gstin: bill.contact.gstin, pan: bill.contact.pan,
        phone: bill.contact.phone, email: bill.contact.email,
      } : undefined,
      lines: (bill.lines || []).map((l: any) => ({
        description: l.description || l.item?.name || '',
        itemName: l.item?.name, qty: l.qty, rate: l.rate,
        amount: l.amount, taxAmount: l.taxAmount || 0,
        hsnCode: l.item?.hsnCode, sacCode: l.item?.sacCode,
      })),
      subtotal: bill.subtotal || 0, taxTotal: bill.taxTotal || 0,
      discount: bill.discount || 0, total: bill.total || 0,
      amountPaid: bill.amountPaid || 0, amountDue: bill.amountDue || 0,
      notes: bill.notes, referenceNo: bill.billNo,
      placeOfSupply: bill.placeOfSupply, isReverseCharge: bill.isReverseCharge,
    };
    setViewDoc(docData);
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalPayable = bills.filter(b => ['RECEIVED','PARTIALLY_PAID','OVERDUE'].includes(b.status)).reduce((s, b) => s + b.amountDue, 0);
  const lineSubtotal = lines.reduce((s, l) => s + Number(l.qty) * Number(l.rate), 0);
  const lineTax = lines.reduce((s, l) => s + Number(l.taxAmount || 0), 0);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bills</h1>
          <p className="page-subtitle">Vendor bills & accounts payable • {total} total</p>
        </div>
        <button className="btn btn-primary" onClick={openForm} id="btn-create-bill">+ Create Bill</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="kpi-card"><span className="kpi-label">Total Bills</span><span className="kpi-value">{total}</span></div>
        <div className="kpi-card"><span className="kpi-label">Total Payable</span><span className="kpi-value" style={{fontSize:'1.3rem',color:'var(--color-amber)'}}>{fmt(totalPayable)}</span></div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create New Bill</h3>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Vendor *</label>
                <select className="form-input" required value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value }))}>
                  <option value="">Select vendor...</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Bill Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Vendor Invoice #</label>
                <input className="form-input" placeholder="Vendor's reference" value={form.billNo} onChange={e => setForm(p => ({ ...p, billNo: e.target.value }))} />
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
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Bill'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['', 'DRAFT', 'RECEIVED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'].map(s => (
          <button key={s} className={`btn ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(s)} style={{ fontSize: '0.8rem' }}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>Bill #</th><th>Vendor</th><th>Vendor Ref</th><th>Date</th><th>Due Date</th><th>Status</th><th style={{textAlign:'right'}}>Total</th><th style={{textAlign:'right'}}>Due</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
            bills.length === 0 ? <tr><td colSpan={9} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No bills found</td></tr> :
            bills.map(bill => (
              <tr key={bill.id}>
                <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600, fontSize: '0.85rem' }}>{bill.number}</code></td>
                <td style={{ fontWeight: 500 }}>{bill.contact?.name}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{bill.billNo || '—'}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(bill.date)}</td>
                <td style={{ fontSize: '0.85rem', color: new Date(bill.dueDate) < new Date() && bill.amountDue > 0 ? 'var(--color-rose)' : 'var(--text-secondary)' }}>{fmtDate(bill.dueDate)}</td>
                <td><span className="status-badge" style={{ background: (STATUS_COLORS[bill.status] || '#94a3b8') + '22', color: STATUS_COLORS[bill.status], border: `1px solid ${STATUS_COLORS[bill.status]}44` }}>{bill.status.replace('_', ' ')}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(bill.total)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: bill.amountDue > 0 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>{fmt(bill.amountDue)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
                    <DocActionButtons onView={() => handleView(bill)} />
                    {bill.status === 'DRAFT' && <button className="btn btn-ghost" style={{fontSize:'0.75rem',padding:'0.25rem 0.5rem'}} onClick={() => handlePost(bill.id)}>Post</button>}
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
