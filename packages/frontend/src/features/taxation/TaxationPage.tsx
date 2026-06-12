// ============================================================
// ERPEX — Taxation Page
// Tax configuration + reports
// ============================================================

import { useState, useEffect } from 'react';
import { taxApi, accountsApi } from '../../api/client';
import { formatCurrency, toInputDate } from '../../utils/formatters';
import { HiOutlinePlus } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function TaxationPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [report, setReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'configs' | 'report'>('configs');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', taxType: 'GST', rate: '', effectiveFrom: toInputDate(), accountId: '' });
  const [reportDates, setReportDates] = useState({ startDate: '2025-04-01', endDate: toInputDate() });

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (tab === 'report') loadReport(); }, [tab, reportDates]);

  async function loadData() {
    try {
      const [configRes, acctRes] = await Promise.all([taxApi.listConfigs(), accountsApi.list()]);
      setConfigs(configRes.data || []);
      setAccounts(acctRes.data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function loadReport() {
    try {
      const res = await taxApi.report(reportDates.startDate, reportDates.endDate);
      setReport(res.data || []);
    } catch { setReport([]); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await taxApi.createConfig({ ...form, rate: parseFloat(form.rate) });
      toast.success('Tax configuration created');
      setShowModal(false);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Taxation</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}><HiOutlinePlus /> New Tax Config</button>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'configs' ? 'active' : ''}`} onClick={() => setTab('configs')}>Tax Configurations</button>
        <button className={`tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>Tax Report</button>
      </div>

      {tab === 'configs' && (
        <div className="glass-card">
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Type</th><th className="text-right">Rate (%)</th><th>Effective From</th><th>Account</th><th>Status</th></tr></thead>
              <tbody>
                {configs.map((c: any) => (
                  <tr key={c.id}>
                    <td className="font-bold">{c.name}</td>
                    <td><span className="badge badge-open">{c.taxType}</span></td>
                    <td className="text-right font-mono">{Number(c.rate).toFixed(2)}%</td>
                    <td className="text-sm">{new Date(c.effectiveFrom).toLocaleDateString()}</td>
                    <td className="text-sm">{c.account?.name || '—'}</td>
                    <td>{c.isActive ? <span className="badge badge-posted">Active</span> : <span className="badge badge-draft">Inactive</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'report' && (
        <>
          <div className="filter-bar mb-4">
            <label className="text-sm text-muted">From:</label>
            <input type="date" className="form-input" value={reportDates.startDate} onChange={e => setReportDates({ ...reportDates, startDate: e.target.value })} />
            <label className="text-sm text-muted">To:</label>
            <input type="date" className="form-input" value={reportDates.endDate} onChange={e => setReportDates({ ...reportDates, endDate: e.target.value })} />
          </div>
          <div className="glass-card">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Tax</th><th className="text-right">Taxable Value</th><th className="text-right">Tax Collected</th><th className="text-right">Tax Paid (ITC)</th><th className="text-right">Net Payable</th></tr></thead>
                <tbody>
                  {report.map((r: any) => (
                    <tr key={r.taxConfig.id}>
                      <td className="font-bold">{r.taxConfig.name}</td>
                      <td className="text-right font-mono">{formatCurrency(r.taxableValue)}</td>
                      <td className="text-right font-mono amount credit">{formatCurrency(r.taxCollected)}</td>
                      <td className="text-right font-mono amount debit">{formatCurrency(r.taxPaid)}</td>
                      <td className="text-right font-mono font-bold">{formatCurrency(r.netPayable)}</td>
                    </tr>
                  ))}
                  {report.length > 0 && (
                    <tr className="total-row">
                      <td className="font-bold">Total</td>
                      <td className="text-right font-mono">{formatCurrency(report.reduce((s: number, r: any) => s + r.taxableValue, 0))}</td>
                      <td className="text-right font-mono amount credit">{formatCurrency(report.reduce((s: number, r: any) => s + r.taxCollected, 0))}</td>
                      <td className="text-right font-mono amount debit">{formatCurrency(report.reduce((s: number, r: any) => s + r.taxPaid, 0))}</td>
                      <td className="text-right font-mono font-bold">{formatCurrency(report.reduce((s: number, r: any) => s + r.netPayable, 0))}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">New Tax Configuration</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Name *</label><input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., GST 18%" /></div>
                  <div className="form-group"><label className="form-label">Type *</label><select className="form-input form-select" value={form.taxType} onChange={e => setForm({ ...form, taxType: e.target.value })}><option value="GST">GST</option><option value="VAT">VAT</option><option value="SALES_TAX">Sales Tax</option><option value="CUSTOM">Custom</option></select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Rate (%) *</label><input type="number" className="form-input" required min="0" max="100" step="0.01" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} /></div>
                  <div className="form-group"><label className="form-label">Effective From *</label><input type="date" className="form-input" required value={form.effectiveFrom} onChange={e => setForm({ ...form, effectiveFrom: e.target.value })} /></div>
                </div>
                <div className="form-group"><label className="form-label">Tax Account *</label><select className="form-input form-select" required value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}><option value="">Select account...</option>{accounts.filter((a: any) => a.type === 'LIABILITY' || a.type === 'ASSET').map((a: any) => (<option key={a.id} value={a.id}>{a.code} — {a.name}</option>))}</select></div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Tax Config</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
