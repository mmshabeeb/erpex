// ============================================================
// ERPEX — Profit & Loss Statement
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/client';
import { formatCurrency, toInputDate } from '../../utils/formatters';
import toast from 'react-hot-toast';
import { HiOutlineDownload } from 'react-icons/hi';
import { exportProfitLoss } from '../../utils/reportExporter';
import { useAuth } from '../auth/AuthProvider';

export default function ProfitLossPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('2025-04-01');
  const [endDate, setEndDate] = useState(toInputDate());

  useEffect(() => { loadReport(); }, [startDate, endDate]);

  async function loadReport() {
    try {
      setLoading(true);
      const res = await reportsApi.profitLoss(startDate, endDate);
      setData(res.data);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  function renderSection(section: any, label: string) {
    if (!section || !section.accounts) return null;
    return (
      <div className="report-section">
        <div className="report-section-title">{label}</div>
        {section.accounts.map((acct: any) => (
          <div key={acct.accountId} className="flex justify-between items-center" style={{ padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
            onClick={() => navigate(`/accounts/${acct.accountId}/ledger`)}>
            <span className="text-sm">
              <span className="font-mono text-muted" style={{ marginRight: 8 }}>{acct.accountCode}</span>
              {acct.accountName}
            </span>
            <span className="font-mono text-sm font-bold">{formatCurrency(acct.amount)}</span>
          </div>
        ))}
        <div className="report-total-row mt-2">
          <span>Total {label}</span>
          <span className="font-mono">{formatCurrency(section.total)}</span>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Profit & Loss Statement</h1>
        {data && (
          <div className="flex gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => exportProfitLoss(user?.company?.name || 'ERPEX Company', `From ${startDate} to ${endDate}`, data, 'xlsx')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <HiOutlineDownload /> Excel
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => exportProfitLoss(user?.company?.name || 'ERPEX Company', `From ${startDate} to ${endDate}`, data, 'csv')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <HiOutlineDownload /> CSV
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => exportProfitLoss(user?.company?.name || 'ERPEX Company', `From ${startDate} to ${endDate}`, data, 'pdf')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <HiOutlineDownload /> PDF
            </button>
          </div>
        )}
      </div>

      <div className="filter-bar">
        <label className="text-sm text-muted">From:</label>
        <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label className="text-sm text-muted">To:</label>
        <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
      </div>

      {data && (
        <div className="glass-card">
          <div className="report-header">
            <div className="report-company">ERPEX Financial Engine</div>
            <div className="report-title">Profit & Loss Account</div>
            <div className="report-subtitle">
              For the period {new Date(startDate).toLocaleDateString('en-IN')} to {new Date(endDate).toLocaleDateString('en-IN')}
            </div>
          </div>

          {renderSection(data.revenue, 'Revenue')}
          {renderSection(data.costOfGoodsSold, 'Cost of Goods Sold')}

          <div className="report-grand-total" style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)', margin: 'var(--space-4) 0' }}>
            <span style={{ fontWeight: 700 }}>Gross Profit</span>
            <span className="font-mono" style={{ color: data.grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {formatCurrency(data.grossProfit)}
            </span>
          </div>

          {renderSection(data.otherIncome, 'Other Income')}
          {renderSection(data.operatingExpenses, 'Operating Expenses')}

          <div className="report-grand-total" style={{ marginTop: 'var(--space-6)' }}>
            <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800 }}>Net Profit</span>
            <span className="font-mono" style={{
              fontSize: 'var(--font-size-xl)',
              color: data.netProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
            }}>
              {formatCurrency(data.netProfit)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
