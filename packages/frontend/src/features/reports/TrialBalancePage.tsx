// ============================================================
// ERPEX — Trial Balance Report
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportsApi } from '../../api/client';
import { formatCurrency, toInputDate } from '../../utils/formatters';
import { HiOutlineDownload, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { exportTrialBalance } from '../../utils/reportExporter';
import { useAuth } from '../auth/AuthProvider';

export default function TrialBalancePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(toInputDate());
  const [startDate, setStartDate] = useState('2025-04-01');

  useEffect(() => { loadReport(); }, [asOfDate, startDate]);

  async function loadReport() {
    try {
      setLoading(true);
      const res = await reportsApi.trialBalance(asOfDate, startDate || undefined);
      setData(res.data);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Trial Balance</h1>
        <div className="flex items-center gap-3">
          {data && (
            <div className={`report-balanced ${data.isBalanced ? 'is-balanced' : 'not-balanced'}`}>
              {data.isBalanced ? <><HiOutlineCheck /> Balanced</> : <><HiOutlineX /> Not Balanced</>}
            </div>
          )}
          {data && (
            <div className="flex gap-2" style={{ marginLeft: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => exportTrialBalance(user?.company?.name || 'ERPEX Company', `From ${startDate} As of ${asOfDate}`, data, 'xlsx')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiOutlineDownload /> Excel
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportTrialBalance(user?.company?.name || 'ERPEX Company', `From ${startDate} As of ${asOfDate}`, data, 'csv')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiOutlineDownload /> CSV
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => exportTrialBalance(user?.company?.name || 'ERPEX Company', `From ${startDate} As of ${asOfDate}`, data, 'pdf')} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HiOutlineDownload /> PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="filter-bar">
        <label className="text-sm text-muted">Period Start:</label>
        <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
        <label className="text-sm text-muted">As of:</label>
        <input type="date" className="form-input" value={asOfDate} onChange={e => setAsOfDate(e.target.value)} />
      </div>

      {data && (
        <div className="glass-card">
          <div className="report-header">
            <div className="report-company">ERPEX Financial Engine</div>
            <div className="report-title">Trial Balance</div>
            <div className="report-subtitle">
              {startDate && `From ${new Date(startDate).toLocaleDateString('en-IN')} `}
              As of {new Date(asOfDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th><th>Account Name</th><th>Type</th>
                  <th className="text-right">Opening</th>
                  <th className="text-right">Debit</th><th className="text-right">Credit</th>
                  <th className="text-right">Closing</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row: any) => (
                  <tr key={row.accountId} className="clickable-row" onClick={() => navigate(`/accounts/${row.accountId}/ledger`)}>
                    <td className="font-mono text-sm">{row.accountCode}</td>
                    <td>{row.accountName}</td>
                    <td><span className={`badge badge-${row.accountType.toLowerCase()}`} style={{ fontSize: '0.6rem' }}>{row.accountType}</span></td>
                    <td className="text-right font-mono text-sm">{formatCurrency(row.openingBalance)}</td>
                    <td className="text-right amount debit">{row.debitMovement > 0 ? formatCurrency(row.debitMovement) : ''}</td>
                    <td className="text-right amount credit">{row.creditMovement > 0 ? formatCurrency(row.creditMovement) : ''}</td>
                    <td className="text-right font-mono font-bold">{formatCurrency(row.closingBalance)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={3} className="font-bold">Totals</td>
                  <td className="text-right font-mono"></td>
                  <td className="text-right amount debit font-bold">{formatCurrency(data.totalDebitMovement)}</td>
                  <td className="text-right amount credit font-bold">{formatCurrency(data.totalCreditMovement)}</td>
                  <td className="text-right font-mono font-bold"></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="report-grand-total">
            <span>Closing Balance Verification</span>
            <span>
              <span style={{ color: 'var(--color-debit)', marginRight: 16 }}>Dr: {formatCurrency(data.totalClosingDebit)}</span>
              <span style={{ color: 'var(--color-credit)' }}>Cr: {formatCurrency(data.totalClosingCredit)}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
