// ============================================================
// ERPEX — Purchase Orders Page
// With dedicated Create PO form + View/Print/Download
// ============================================================

import { useState, useEffect } from 'react';
import { purchaseOrdersApi, contactsApi, itemsApi } from '../../api/client';
import DocumentViewer, { DocActionButtons } from '../shared/DocumentViewer';
import type { DocumentData } from '../shared/DocumentViewer';
import { useAuth } from '../auth/AuthProvider';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', ISSUED: '#60a5fa', PARTIALLY_RECEIVED: '#fbbf24', RECEIVED: '#34d399', CANCELLED: '#6b7280',
};

const emptyLine = () => ({ itemId: '', description: '', qty: 1, rate: 0, taxAmount: 0 });

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ contactId: '', date: new Date().toISOString().slice(0, 10), expectedDelivery: '', notes: '' });
  const [lines, setLines] = useState([emptyLine()]);
  const [submitting, setSubmitting] = useState(false);
  const [viewDoc, setViewDoc] = useState<DocumentData | null>(null);
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { const res = await purchaseOrdersApi.list({}); setOrders(res.data); setTotal(res.total); } catch (e) { console.error(e); }
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
        amount: Number(l.qty) * Number(l.rate) + Number(l.taxAmount), sortOrder: i, receivedQty: 0,
      }));
      const subtotal = lineData.reduce((s, l) => s + l.qty * l.rate, 0);
      const taxTotal = lineData.reduce((s, l) => s + l.taxAmount, 0);
      await purchaseOrdersApi.create({
        ...form, expectedDelivery: form.expectedDelivery || undefined,
        subtotal, taxTotal, discount: 0, total: subtotal + taxTotal,
        lines: lineData,
      });
      setShowForm(false);
      setForm({ contactId: '', date: new Date().toISOString().slice(0, 10), expectedDelivery: '', notes: '' });
      setLines([emptyLine()]);
      load();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  async function handleConvert(id: string) {
    if (!confirm('Convert this PO to a bill?')) return;
    try { await purchaseOrdersApi.convertToBill(id); load(); } catch (e: any) { alert(e.message); }
  }

  async function handleStatus(id: string, status: string) {
    try { await purchaseOrdersApi.updateStatus(id, status); load(); } catch (e: any) { alert(e.message); }
  }

  function handleView(po: any) {
    const docData: DocumentData = {
      type: 'PURCHASE_ORDER',
      number: po.number,
      status: po.status,
      date: po.date,
      dueDate: po.expectedDelivery,
      company: user?.company ? {
        name: user.company.name, legalName: user.company.legalName,
        address: user.company.address, city: user.company.city,
        state: user.company.state, pinCode: user.company.pinCode,
        gstin: user.company.gstin, pan: user.company.pan,
      } : undefined,
      contact: po.contact ? {
        name: po.contact.name, address: po.contact.address,
        city: po.contact.city, state: po.contact.state,
        gstin: po.contact.gstin, pan: po.contact.pan,
        phone: po.contact.phone, email: po.contact.email,
      } : undefined,
      lines: (po.lines || []).map((l: any) => ({
        description: l.description || l.item?.name || '',
        itemName: l.item?.name, qty: l.qty, rate: l.rate,
        amount: l.amount, taxAmount: l.taxAmount || 0,
        hsnCode: l.item?.hsnCode, sacCode: l.item?.sacCode,
      })),
      subtotal: po.subtotal || 0, taxTotal: po.taxTotal || 0,
      discount: po.discount || 0, total: po.total || 0,
      notes: po.notes,
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
          <h1 className="page-title">Purchase Orders</h1>
          <p className="page-subtitle">Procurement management • {total} orders</p>
        </div>
        <button className="btn btn-primary" onClick={openForm} id="btn-create-po">+ Create Purchase Order</button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create New Purchase Order</h3>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Vendor *</label>
                <select className="form-input" required value={form.contactId} onChange={e => setForm(p => ({ ...p, contactId: e.target.value }))}>
                  <option value="">Select vendor...</option>
                  {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Order Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Expected Delivery</label>
                <input className="form-input" type="date" value={form.expectedDelivery} onChange={e => setForm(p => ({ ...p, expectedDelivery: e.target.value }))} />
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
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create PO'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="data-table">
          <thead>
            <tr><th>PO #</th><th>Vendor</th><th>Date</th><th>Expected</th><th>Status</th><th style={{textAlign:'right'}}>Total</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
            orders.length === 0 ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No purchase orders found</td></tr> :
            orders.map(po => (
              <tr key={po.id}>
                <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontWeight: 600, fontSize: '0.85rem' }}>{po.number}</code></td>
                <td style={{ fontWeight: 500 }}>{po.contact?.name}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{fmtDate(po.date)}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{po.expectedDelivery ? fmtDate(po.expectedDelivery) : '—'}</td>
                <td><span className="status-badge" style={{ background: (STATUS_COLORS[po.status] || '#94a3b8') + '22', color: STATUS_COLORS[po.status], border: `1px solid ${STATUS_COLORS[po.status]}44` }}>{po.status.replace('_', ' ')}</span></td>
                <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(po.total)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <DocActionButtons onView={() => handleView(po)} />
                    {po.status === 'DRAFT' && <button className="btn btn-ghost" style={{fontSize:'0.7rem',padding:'0.2rem 0.4rem'}} onClick={() => handleStatus(po.id, 'ISSUED')}>Issue</button>}
                    {po.status === 'ISSUED' && <button className="btn btn-primary" style={{fontSize:'0.7rem',padding:'0.2rem 0.5rem'}} onClick={() => handleConvert(po.id)}>→ Bill</button>}
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
