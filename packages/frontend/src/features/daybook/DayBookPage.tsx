// ============================================================
// ERPEX — Day Book Page
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { daybookApi } from '../../api/client';
import { formatCurrency, formatDate, toInputDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function DayBookPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ startDate: toInputDate(), endDate: toInputDate(), voucherType: '', status: '' });

  useEffect(() => { loadData(); }, [filters]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await daybookApi.get(filters);
      setEntries(res.data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Day Book</h1>
          <p className="text-muted text-sm mt-2">All transactions for {formatDate(filters.startDate)}</p>
        </div>
      </div>

      <div className="filter-bar">
        <label className="text-sm text-muted">Date:</label>
        <input type="date" className="form-input" value={filters.startDate}
          onChange={e => setFilters({ ...filters, startDate: e.target.value, endDate: e.target.value })} />
        <select className="form-input form-select" value={filters.voucherType}
          onChange={e => setFilters({ ...filters, voucherType: e.target.value })}>
          <option value="">All Types</option>
          <option value="JOURNAL">Journal</option><option value="CONTRA">Contra</option>
          <option value="PAYMENT">Payment</option><option value="RECEIPT">Receipt</option>
          <option value="SALES">Sales</option><option value="PURCHASE">Purchase</option>
        </select>
        <select className="form-input form-select" value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option><option value="POSTED">Posted</option>
        </select>
      </div>

      <div className="glass-card">
        {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr><th>Voucher No</th><th>Type</th><th>Status</th><th>Narration</th><th>Accounts</th>
                  <th className="text-right">Debit</th><th className="text-right">Credit</th></tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No transactions for this date</td></tr>
                ) : entries.map((e: any) => (
                  <tr key={e.journalEntryId} className="clickable-row" onClick={() => navigate(`/journals/${e.journalEntryId}`)}>
                    <td><span className="font-mono" style={{ color: 'var(--color-accent-secondary)' }}>{e.voucherNo}</span></td>
                    <td><span className="badge badge-open">{e.type}</span></td>
                    <td><span className={`badge badge-${e.status.toLowerCase()}`}>{e.status}</span></td>
                    <td className="truncate" style={{ maxWidth: 200 }}>{e.narration || '—'}</td>
                    <td className="text-sm text-muted">
                      {e.items?.slice(0, 2).map((i: any) => i.account?.name).join(', ')}
                      {e.items?.length > 2 && ` +${e.items.length - 2} more`}
                    </td>
                    <td className="text-right amount debit">{formatCurrency(e.totalDebit)}</td>
                    <td className="text-right amount credit">{formatCurrency(e.totalCredit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
