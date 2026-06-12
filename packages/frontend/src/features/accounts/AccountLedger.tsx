// ============================================================
// ERPEX — Account Ledger View
// Running balance with drill-down to journal entries
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { accountsApi } from '../../api/client';
import { formatCurrency, formatDate, toInputDate, getAccountTypeBadge } from '../../utils/formatters';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function AccountLedger() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(toInputDate());

  useEffect(() => {
    if (id) loadLedger();
  }, [id, startDate, endDate]);

  async function loadLedger() {
    try {
      setLoading(true);
      const res = await accountsApi.ledger(id!, { startDate: startDate || undefined, endDate: endDate || undefined });
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return <div className="empty-state"><div className="empty-state-title">Account not found</div></div>;

  return (
    <div>
      <button className="btn btn-ghost mb-4" onClick={() => navigate('/accounts')}>
        <HiOutlineArrowLeft /> Back to Chart of Accounts
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
            <span className="font-mono" style={{ color: 'var(--color-text-muted)' }}>{data.account.code}</span>
            {' '}{data.account.name}
          </h1>
          <p className="mt-2">
            <span className={getAccountTypeBadge(data.account.type)}>{data.account.type}</span>
          </p>
        </div>
      </div>

      {/* Date Filters */}
      <div className="filter-bar">
        <label className="text-sm text-muted">From:</label>
        <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label className="text-sm text-muted">To:</label>
        <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {/* Summary Cards */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #8b95a8, #5a6478)' } as any}>
          <div className="kpi-label">Opening Balance</div>
          <div className="kpi-value" style={{ fontSize: 'var(--font-size-xl)' }}>{formatCurrency(data.openingBalance)}</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #f87171, #ef4444)' } as any}>
          <div className="kpi-label">Total Debit</div>
          <div className="kpi-value" style={{ fontSize: 'var(--font-size-xl)' }}>{formatCurrency(data.totalDebit)}</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #34d399, #10b981)' } as any}>
          <div className="kpi-label">Total Credit</div>
          <div className="kpi-value" style={{ fontSize: 'var(--font-size-xl)' }}>{formatCurrency(data.totalCredit)}</div>
        </div>
        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #6366f1, #818cf8)' } as any}>
          <div className="kpi-label">Closing Balance</div>
          <div className="kpi-value" style={{ fontSize: 'var(--font-size-xl)' }}>{formatCurrency(data.closingBalance)}</div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="glass-card mt-4">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Voucher No</th>
                <th>Narration</th>
                <th className="text-right">Debit</th>
                <th className="text-right">Credit</th>
                <th className="text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {data.entries.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No entries found</td></tr>
              ) : (
                data.entries.map((entry: any, idx: number) => (
                  <tr key={idx} className="clickable-row" onClick={() => navigate(`/journals/${entry.journalEntryId}`)}>
                    <td>{formatDate(entry.date)}</td>
                    <td>
                      <span className="font-mono" style={{ color: 'var(--color-accent-secondary)' }}>
                        {entry.voucherNo}
                      </span>
                    </td>
                    <td className="truncate" style={{ maxWidth: 300 }}>{entry.narration || '—'}</td>
                    <td className="text-right amount debit">{entry.debit > 0 ? formatCurrency(entry.debit) : ''}</td>
                    <td className="text-right amount credit">{entry.credit > 0 ? formatCurrency(entry.credit) : ''}</td>
                    <td className="text-right amount font-mono" style={{ fontWeight: 600 }}>
                      {formatCurrency(entry.runningBalance)}
                    </td>
                  </tr>
                ))
              )}
              {data.entries.length > 0 && (
                <tr className="total-row">
                  <td colSpan={3} className="font-bold">Totals</td>
                  <td className="text-right amount debit font-bold">{formatCurrency(data.totalDebit)}</td>
                  <td className="text-right amount credit font-bold">{formatCurrency(data.totalCredit)}</td>
                  <td className="text-right amount font-bold">{formatCurrency(data.closingBalance)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
