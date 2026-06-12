// ============================================================
// ERPEX — Journals List Page
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { journalsApi } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { HiOutlinePlus, HiOutlineSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function JournalsPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', status: '', search: '', page: 1, pageSize: 15 });

  useEffect(() => { loadData(); }, [filters]);

  async function loadData() {
    try {
      setLoading(true);
      const res = await journalsApi.list(filters);
      setEntries(res.data || []);
      setTotal(res.total || 0);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Journal Vouchers</h1>
          <p className="text-muted text-sm mt-2">{total} entries total</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/journals/new')}>
          <HiOutlinePlus /> New Journal Entry
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <HiOutlineSearch style={{ color: 'var(--color-text-muted)' }} />
        <input className="form-input" placeholder="Search voucher no or narration..."
          value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
          style={{ flex: 1, background: 'transparent', border: 'none' }} />
        <select className="form-input form-select" value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value, page: 1 })}>
          <option value="">All Types</option>
          <option value="JOURNAL">Journal</option>
          <option value="CONTRA">Contra</option>
          <option value="PAYMENT">Payment</option>
          <option value="RECEIPT">Receipt</option>
          <option value="SALES">Sales</option>
          <option value="PURCHASE">Purchase</option>
        </select>
        <select className="form-input form-select" value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Status</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Voucher No</th>
                    <th>Type</th>
                    <th>Narration</th>
                    <th>Status</th>
                    <th className="text-right">Debit</th>
                    <th className="text-right">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted" style={{ padding: 'var(--space-8)' }}>No journal entries found</td></tr>
                  ) : entries.map(entry => (
                    <tr key={entry.id} className="clickable-row" onClick={() => navigate(`/journals/${entry.id}`)}>
                      <td>{formatDate(entry.date)}</td>
                      <td><span className="font-mono" style={{ color: 'var(--color-accent-secondary)' }}>{entry.voucherNo}</span></td>
                      <td><span className="badge badge-open">{entry.type}</span></td>
                      <td className="truncate" style={{ maxWidth: 250 }}>{entry.narration || '—'}</td>
                      <td><span className={`badge badge-${entry.status.toLowerCase()}`}>{entry.status}</span></td>
                      <td className="text-right amount debit">{formatCurrency(entry.totalDebit)}</td>
                      <td className="text-right amount credit">{formatCurrency(entry.totalCredit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > filters.pageSize && (
              <div className="pagination">
                <span>Showing {(filters.page - 1) * filters.pageSize + 1}–{Math.min(filters.page * filters.pageSize, total)} of {total}</span>
                <div className="pagination-controls">
                  <button className="btn btn-ghost btn-sm" disabled={filters.page <= 1}
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>← Prev</button>
                  <span className="text-sm font-mono">Page {filters.page}</span>
                  <button className="btn btn-ghost btn-sm" disabled={filters.page * filters.pageSize >= total}
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
