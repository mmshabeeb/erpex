// ============================================================
// ERPEX — Cash Book Page
// Dual-column receipt/payment with running balance
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cashbookApi } from '../../api/client';
import { formatCurrency, formatDate, toInputDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function CashBookPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(toInputDate());

  useEffect(() => { loadData(); }, [startDate, endDate]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await cashbookApi.get({ startDate: startDate || undefined, endDate: endDate || undefined });
      setEntries(res.data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const totalReceipts = entries.reduce((s, e) => s + (e.receipt || 0), 0);
  const totalPayments = entries.reduce((s, e) => s + (e.payment || 0), 0);
  const cashInHand = entries.length > 0 ? entries[entries.length - 1].balance : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Cash Book</h1>
          <p className="text-muted text-sm mt-2">Physical cash receipts and payments</p>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #34d399, #10b981)', padding: 'var(--space-3) var(--space-5)' } as any}>
          <div className="kpi-label" style={{ fontSize: 'var(--font-size-xs)' }}>Cash in Hand</div>
          <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>{formatCurrency(cashInHand)}</div>
        </div>
      </div>

      <div className="filter-bar">
        <label className="text-sm text-muted">From:</label>
        <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label className="text-sm text-muted">To:</label>
        <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      <div className="glass-card">
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th><th>Voucher No</th><th>Counter Account</th><th>Narration</th>
                  <th className="text-right">Receipt (Dr)</th><th className="text-right">Payment (Cr)</th>
                  <th className="text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No cash transactions found</td></tr>
                ) : entries.map((e: any, i: number) => (
                  <tr key={i} className="clickable-row" onClick={() => navigate(`/journals/${e.journalEntryId}`)}>
                    <td>{formatDate(e.date)}</td>
                    <td><span className="font-mono" style={{ color: 'var(--color-accent-secondary)' }}>{e.voucherNo}</span></td>
                    <td>{e.counterAccount}</td>
                    <td className="truncate" style={{ maxWidth: 200 }}>{e.narration || '—'}</td>
                    <td className="text-right amount debit">{e.receipt > 0 ? formatCurrency(e.receipt) : ''}</td>
                    <td className="text-right amount credit">{e.payment > 0 ? formatCurrency(e.payment) : ''}</td>
                    <td className="text-right amount font-bold">{formatCurrency(e.balance)}</td>
                  </tr>
                ))}
                {entries.length > 0 && (
                  <tr className="total-row">
                    <td colSpan={4} className="font-bold">Totals</td>
                    <td className="text-right amount debit font-bold">{formatCurrency(totalReceipts)}</td>
                    <td className="text-right amount credit font-bold">{formatCurrency(totalPayments)}</td>
                    <td className="text-right amount font-bold">{formatCurrency(cashInHand)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
