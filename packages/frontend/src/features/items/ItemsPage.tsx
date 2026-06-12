// ============================================================
// ERPEX — Items & Inventory Page
// ============================================================

import { useState, useEffect } from 'react';
import { itemsApi, inventoryApi } from '../../api/client';

const TYPE_COLORS: Record<string, string> = { PRODUCT: '#60a5fa', SERVICE: '#34d399', DIGITAL: '#a78bfa' };

export default function ItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [stockSummary, setStockSummary] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'items' | 'stock'>('items');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', type: 'PRODUCT', unit: 'pcs', purchasePrice: 0, sellingPrice: 0, reorderLevel: 0, description: '' });

  useEffect(() => { loadItems(); loadStock(); }, []);

  async function loadItems() {
    setLoading(true);
    try {
      const res = await itemsApi.list({});
      setItems(res.data);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadStock() {
    try { const res = await inventoryApi.stockSummary(); setStockSummary(res.data); } catch (e) { console.error(e); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await itemsApi.create(form);
      setShowForm(false);
      setForm({ name: '', sku: '', type: 'PRODUCT', unit: 'pcs', purchasePrice: 0, sellingPrice: 0, reorderLevel: 0, description: '' });
      loadItems(); loadStock();
    } catch (e: any) { alert(e.message); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const totalValue = stockSummary.reduce((s, i) => s + i.totalValue, 0);
  const lowStockCount = stockSummary.filter(i => i.isLowStock).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Items & Inventory</h1>
          <p className="page-subtitle">Product catalog, services, and stock management</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Item</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <div className="kpi-card"><span className="kpi-label">Total Items</span><span className="kpi-value">{total}</span></div>
        <div className="kpi-card"><span className="kpi-label">Inventory Value</span><span className="kpi-value" style={{fontSize:'1.4rem'}}>{fmt(totalValue)}</span></div>
        <div className="kpi-card"><span className="kpi-label">Low Stock Alerts</span><span className="kpi-value" style={{color: lowStockCount > 0 ? 'var(--color-rose)' : 'var(--color-emerald)'}}>{lowStockCount}</span></div>
      </div>

      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
        {(['items', 'stock'] as const).map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t === 'items' ? 'Product Catalog' : 'Stock Summary'}</button>
        ))}
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>New Item</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <input className="form-input" placeholder="Name *" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            <input className="form-input" placeholder="SKU *" required value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} />
            <select className="form-input" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="PRODUCT">Product</option>
              <option value="SERVICE">Service</option>
              <option value="DIGITAL">Digital</option>
            </select>
            <input className="form-input" placeholder="Unit (pcs, kg, hrs)" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} />
            <input className="form-input" type="number" placeholder="Purchase Price" value={form.purchasePrice} onChange={e => setForm(p => ({ ...p, purchasePrice: Number(e.target.value) }))} />
            <input className="form-input" type="number" placeholder="Selling Price" value={form.sellingPrice} onChange={e => setForm(p => ({ ...p, sellingPrice: Number(e.target.value) }))} />
            <input className="form-input" type="number" placeholder="Reorder Level" value={form.reorderLevel} onChange={e => setForm(p => ({ ...p, reorderLevel: Number(e.target.value) }))} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" type="submit">Create</button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {tab === 'items' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>SKU</th><th>Name</th><th>Type</th><th>Unit</th><th style={{textAlign:'right'}}>Purchase Price</th><th style={{textAlign:'right'}}>Selling Price</th><th style={{textAlign:'right'}}>Stock</th></tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>Loading...</td></tr> :
              items.map(item => (
                <tr key={item.id}>
                  <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.82rem' }}>{item.sku}</code></td>
                  <td style={{ fontWeight: 600 }}>{item.name}</td>
                  <td><span className="status-badge" style={{ background: TYPE_COLORS[item.type] + '22', color: TYPE_COLORS[item.type], border: `1px solid ${TYPE_COLORS[item.type]}44` }}>{item.type}</span></td>
                  <td>{item.unit}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(item.purchasePrice)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(item.sellingPrice)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.type === 'PRODUCT' ? item.stockOnHand : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'stock' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>SKU</th><th>Item</th><th style={{textAlign:'right'}}>On Hand</th><th style={{textAlign:'right'}}>Committed</th><th style={{textAlign:'right'}}>Available</th><th style={{textAlign:'right'}}>Avg Cost</th><th style={{textAlign:'right'}}>Total Value</th><th>Status</th></tr>
            </thead>
            <tbody>
              {stockSummary.map(s => (
                <tr key={s.itemId} style={s.isLowStock ? { background: 'rgba(248,113,113,0.06)' } : undefined}>
                  <td><code style={{ background: 'var(--bg-tertiary)', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.82rem' }}>{s.sku}</code></td>
                  <td style={{ fontWeight: 600 }}>{s.itemName}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.stockOnHand}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--color-amber)' }}>{s.committedStock}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{s.availableStock}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(s.avgCost)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmt(s.totalValue)}</td>
                  <td>
                    {s.isLowStock
                      ? <span className="status-badge" style={{ background: '#f8717122', color: '#f87171', border: '1px solid #f8717144' }}>⚠ Low</span>
                      : <span className="status-badge" style={{ background: '#34d39922', color: '#34d399', border: '1px solid #34d39944' }}>OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
