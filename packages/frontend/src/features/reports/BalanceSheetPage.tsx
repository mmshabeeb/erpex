// ============================================================
// ERPEX — Balance Sheet
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/client';
import { formatCurrency, toInputDate } from '../../utils/formatters';
import { HiOutlineCheck, HiOutlineX, HiOutlineDownload } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { exportBalanceSheet } from '../../utils/reportExporter';
import { useAuth } from '../auth/AuthProvider';

export default function BalanceSheetPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(toInputDate());

  useEffect(() => { loadReport(); }, [asOfDate]);

  async function loadReport() {
    try {
      setLoading(true);
      const res = await reportsApi.balanceSheet(asOfDate);
      setData(res.data);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  function renderSection(section: any) {
    if (!section || !section.accounts) return null;
    return (
      <div className="report-section">
        <div className="report-section-title">{section.label}</div>
        {section.accounts.map((acct: any) => (
          <div key={acct.accountId} className="flex justify-between items-center"
            style={{ padding: 'var(--space-2) var(--space-4)', cursor: 'pointer', borderRadius: 'var(--radius-sm)' }}
            onClick={() => navigate(`/accounts/${acct.accountId}/ledger`)}>
            <span className="text-sm">
              <span className="font-mono text-muted" style={{ marginRight: 8 }}>{acct.accountCode}</span>
              {acct.accountName}
            </span>
            <span className="font-mono text-sm">{formatCurrency(acct.amount)}</span>
          </div>
        ))}
        <div className="report-total-row mt-2">
          <span>Total {section.label}</span>
          <span className="font-mono font-bold">{formatCurrency(section.total)}</span>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Balance Sheet</h1>
        <div className="flex items-center gap-3">
          {data && (
            <div className={`report-balanced ${data.isBalanced ? 'is-balanced' : 'not-balanced'}`}>
              {data.isBalanced ? <><HiOutlineCheck /> Assets = Liabilities + Equity</> : <><HiOutlineX /> Not Balanced!</>}
            </div>
          )}
          {data && (
            <div className="flex gap-2" style={{ marginLeft: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => exportBalanceSheet(user?.company?.name || 'ERPEX Company', `As of ${asOfDate}`, data, 'xlsx')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiOutlineDownload /> Excel
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportBalanceSheet(user?.company?.name || 'ERPEX Company', `As of ${asOfDate}`, data, 'csv')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiOutlineDownload /> CSV
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportBalanceSheet(user?.company?.name || 'ERPEX Company', `As of ${asOfDate}`, data, 'pdf')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiOutlineDownload /> PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <label className="text-sm text-muted">As of:</label>
        <input type="date" className="form-input" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
      </div>

      {data && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          {/* Left: Assets */}
          <div className="glass-card">
            <div className="report-header" style={{ textAlign: 'left', borderBottom: 'none', marginBottom: 'var(--space-2)', paddingBottom: 0 }}>
              <div className="report-title" style={{ color: 'var(--color-asset)' }}>Assets</div>
            </div>

            {renderSection(data.currentAssets)}
            {renderSection(data.nonCurrentAssets)}

            <div className="report-grand-total" style={{ marginTop: 'var(--space-4)', background: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.2)' }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--font-size-md)' }}>Total Assets</span>
              <span className="font-mono font-bold" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-asset)' }}>
                {formatCurrency(data.totalAssets)}
              </span>
            </div>
          </div>

          {/* Right: Liabilities + Equity */}
          <div className="glass-card">
            <div className="report-header" style={{ textAlign: 'left', borderBottom: 'none', marginBottom: 'var(--space-2)', paddingBottom: 0 }}>
              <div className="report-title" style={{ color: 'var(--color-liability)' }}>Liabilities & Equity</div>
            </div>

            {renderSection(data.currentLiabilities)}
            {renderSection(data.nonCurrentLiabilities)}

            <div className="report-total-row" style={{ margin: 'var(--space-4) 0', background: 'rgba(251,146,60,0.08)' }}>
              <span className="font-bold">Total Liabilities</span>
              <span className="font-mono font-bold">{formatCurrency(data.totalLiabilities)}</span>
            </div>

            {renderSection(data.equity)}

            {data.retainedEarnings !== 0 && (
              <div className="flex justify-between items-center" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                <span className="text-sm" style={{ fontStyle: 'italic' }}>Current Period Retained Earnings (from P&L)</span>
                <span className="font-mono text-sm font-bold" style={{ color: data.retainedEarnings >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {formatCurrency(data.retainedEarnings)}
                </span>
              </div>
            )}

            <div className="report-total-row" style={{ margin: 'var(--space-2) 0', background: 'rgba(167,139,250,0.08)' }}>
              <span className="font-bold">Total Equity</span>
              <span className="font-mono font-bold">{formatCurrency(data.totalEquity)}</span>
            </div>

            <div className="report-grand-total" style={{ marginTop: 'var(--space-4)', background: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.2)' }}>
              <span style={{ fontWeight: 800, fontSize: 'var(--font-size-md)' }}>Total Liabilities + Equity</span>
              <span className="font-mono font-bold" style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-liability)' }}>
                {formatCurrency(data.totalLiabilitiesAndEquity)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
