// ============================================================
// ERPEX — Contra Transactions Page
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { contraApi, accountsApi } from '../../api/client';
import { formatCurrency, formatDate, toInputDate } from '../../utils/formatters';
import { HiOutlinePlus, HiOutlineSwitchHorizontal } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function ContraPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [cashBankAccounts, setCashBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: toInputDate(), fromAccountId: '', toAccountId: '', amount: '', narration: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [contraRes, accountsRes] = await Promise.all([contraApi.list(), accountsApi.cashBank()]);
      setEntries(contraRes.data || []);
      setCashBankAccounts(accountsRes.data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await contraApi.create({ ...form, amount: parseFloat(form.amount) });
      toast.success('Contra transaction created');
      setShowModal(false);
      setForm({ date: toInputDate(), fromAccountId: '', toAccountId: '', amount: '', narration: '' });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Contra Transactions</h1>
          <p className="text-muted text-sm mt-2">Internal fund transfers between Cash & Bank accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Contra Entry
        </button>
      </div>

      <div className="glass-card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Date</th><th>Voucher No</th><th>From → To</th><th>Narration</th><th className="text-right">Amount</th></tr></thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No contra transactions yet</td></tr>
              ) : entries.map((entry: any) => {
                const creditItem = entry.items?.find((i: any) => Number(i.credit) > 0);
                const debitItem = entry.items?.find((i: any) => Number(i.debit) > 0);
                return (
                  <tr key={entry.id} className="clickable-row" onClick={() => navigate(`/journals/${entry.id}`)}>
                    <td>{formatDate(entry.date)}</td>
                    <td><span className="font-mono" style={{ color: 'var(--color-accent-secondary)' }}>{entry.voucherNo}</span></td>
                    <td>
                      <span style={{ color: 'var(--color-debit)' }}>{creditItem?.account?.name || '—'}</span>
                      <HiOutlineSwitchHorizontal style={{ margin: '0 8px', opacity: 0.4 }} />
                      <span style={{ color: 'var(--color-credit)' }}>{debitItem?.account?.name || '—'}</span>
                    </td>
                    <td className="text-muted">{entry.narration || '—'}</td>
                    <td className="text-right amount font-bold">{formatCurrency(Number(debitItem?.debit || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">New Contra Transaction</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" required value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">From Account (Source) *</label>
                  <select className="form-input form-select" required value={form.fromAccountId}
                    onChange={e => setForm({ ...form, fromAccountId: e.target.value })}>
                    <option value="">Select source account...</option>
                    {cashBankAccounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                  <p className="form-help">Only Cash & Bank accounts are shown</p>
                </div>
                <div className="form-group">
                  <label className="form-label">To Account (Destination) *</label>
                  <select className="form-input form-select" required value={form.toAccountId}
                    onChange={e => setForm({ ...form, toAccountId: e.target.value })}>
                    <option value="">Select destination account...</option>
                    {cashBankAccounts.filter(a => a.id !== form.fromAccountId).map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-input" required min="0.01" step="0.01" value={form.amount}
                    onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00"
                    style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Narration</label>
                  <input className="form-input" value={form.narration}
                    onChange={e => setForm({ ...form, narration: e.target.value })} placeholder="e.g., Cash withdrawn for office use" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Contra Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
