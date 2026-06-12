// ============================================================
// ERPEX — Dashboard Page
// KPI overview with financial summaries
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi, journalsApi, accountsApi } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { HiOutlineTrendingUp, HiOutlineTrendingDown, HiOutlineCash, HiOutlineScale } from 'react-icons/hi';

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [recentEntries, setRecentEntries] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const fyStart = '2025-04-01';

      const [plRes, bsRes, tbRes, journalsRes] = await Promise.all([
        reportsApi.profitLoss(fyStart, today).catch(() => ({ data: { netProfit: 0, revenue: { total: 0 }, operatingExpenses: { total: 0 } } })),
        reportsApi.balanceSheet(today).catch(() => ({ data: { totalAssets: 0, totalLiabilities: 0, totalEquity: 0, isBalanced: true } })),
        reportsApi.trialBalance(today, fyStart).catch(() => ({ data: { isBalanced: true, totalClosingDebit: 0, totalClosingCredit: 0 } })),
        journalsApi.list({ pageSize: 5 }).catch(() => ({ data: [] })),
      ]);

      setStats({
        revenue: plRes.data?.revenue?.total || 0,
        netProfit: plRes.data?.netProfit || 0,
        totalAssets: bsRes.data?.totalAssets || 0,
        totalLiabilities: bsRes.data?.totalLiabilities || 0,
        totalEquity: bsRes.data?.totalEquity || 0,
        isBalanced: tbRes.data?.isBalanced ?? true,
        expenses: plRes.data?.operatingExpenses?.total || 0,
      });
      setRecentEntries(journalsRes.data || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Dashboard</h1>
          <p className="text-muted text-sm mt-2">Financial overview for the current fiscal year</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #34d399, #10b981)' } as any}>
          <div className="kpi-label">
            <HiOutlineTrendingUp /> Total Revenue
          </div>
          <div className="kpi-value">{formatCurrency(stats.revenue)}</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': stats.netProfit >= 0 ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'linear-gradient(135deg, #ef4444, #f87171)' } as any}>
          <div className="kpi-label">
            {stats.netProfit >= 0 ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
            Net Profit
          </div>
          <div className="kpi-value">{formatCurrency(stats.netProfit)}</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #60a5fa, #3b82f6)' } as any}>
          <div className="kpi-label">
            <HiOutlineCash /> Total Assets
          </div>
          <div className="kpi-value">{formatCurrency(stats.totalAssets)}</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #a78bfa, #8b5cf6)' } as any}>
          <div className="kpi-label">
            <HiOutlineScale /> Equity
          </div>
          <div className="kpi-value">{formatCurrency(stats.totalEquity)}</div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="glass-card mt-6">
        <div className="glass-card-header">
          <div>
            <div className="glass-card-title">Recent Journal Entries</div>
            <div className="glass-card-subtitle">Last 5 transactions</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/journals')}>
            View All
          </button>
        </div>

        {recentEntries.length > 0 ? (
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
                {recentEntries.map((entry: any) => (
                  <tr
                    key={entry.id}
                    className="clickable-row"
                    onClick={() => navigate(`/journals/${entry.id}`)}
                  >
                    <td>{formatDate(entry.date)}</td>
                    <td>
                      <span className="font-mono text-sm" style={{ color: 'var(--color-accent-secondary)' }}>
                        {entry.voucherNo}
                      </span>
                    </td>
                    <td><span className="badge badge-open">{entry.type}</span></td>
                    <td className="truncate" style={{ maxWidth: 250 }}>{entry.narration || '—'}</td>
                    <td>
                      <span className={`badge badge-${entry.status.toLowerCase()}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="text-right amount debit">{formatCurrency(entry.totalDebit)}</td>
                    <td className="text-right amount credit">{formatCurrency(entry.totalCredit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <div className="empty-state-title">No entries yet</div>
            <div className="empty-state-desc">Create your first journal entry to get started</div>
            <button className="btn btn-primary mt-4" onClick={() => navigate('/journals/new')}>
              Create Journal Entry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
