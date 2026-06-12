// ============================================================
// ERPEX — Banking & Reconciliation Page
// ============================================================

import { useState, useEffect } from 'react';
import { accountsApi, bankingApi } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { HiOutlineUpload, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function BankingPage() {
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [statements, setStatements] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [recon, setRecon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    loadBankAccounts();
  }, []);

  async function loadBankAccounts() {
    try {
      const res = await accountsApi.cashBank();
      const banks = (res.data || []).filter((a: any) => a.name.toLowerCase().includes('bank'));
      setBankAccounts(banks);
      if (banks.length > 0) setSelectedAccount(banks[0].id);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function loadReconciliation() {
    if (!selectedAccount) return;
    try {
      const res = await bankingApi.reconciliation(selectedAccount);
      setRecon(res.data);
    } catch { setRecon(null); }
  }

  useEffect(() => { if (selectedAccount) loadReconciliation(); }, [selectedAccount]);

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await bankingApi.uploadStatement(formData);
      toast.success('Bank statement uploaded successfully');
      setShowUpload(false);
      loadReconciliation();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleAutoMatch() {
    if (!recon?.suggestedMatches?.length) return;
    try {
      await bankingApi.applyMatches(recon.suggestedMatches.map((m: any) => ({
        systemEntryId: m.systemEntryId,
        statementLineId: m.statementLineId,
      })));
      toast.success(`${recon.suggestedMatches.length} matches applied`);
      loadReconciliation();
    } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Banking & Reconciliation</h1>
          <p className="text-muted text-sm mt-2">Upload bank statements and reconcile transactions</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={() => setShowUpload(true)}>
            <HiOutlineUpload /> Upload Statement
          </button>
        </div>
      </div>

      {/* Bank Account Selector */}
      <div className="filter-bar">
        <label className="text-sm text-muted">Bank Account:</label>
        <select className="form-input form-select" value={selectedAccount}
          onChange={e => setSelectedAccount(e.target.value)}>
          {bankAccounts.map((a: any) => (
            <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
          ))}
        </select>
        {recon?.suggestedMatches?.length > 0 && (
          <button className="btn btn-success btn-sm ml-auto" onClick={handleAutoMatch}>
            <HiOutlineCheck /> Auto-Match ({recon.suggestedMatches.length})
          </button>
        )}
      </div>

      {/* Reconciliation Summary */}
      {recon && (
        <>
          <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #6366f1, #818cf8)' } as any}>
              <div className="kpi-label">Books Balance</div>
              <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>{formatCurrency(recon.summary?.closingBalancePerBooks || 0)}</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #34d399, #10b981)' } as any}>
              <div className="kpi-label">Bank Balance</div>
              <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>{formatCurrency(recon.summary?.closingBalancePerBank || 0)}</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #f59e0b, #fbbf24)' } as any}>
              <div className="kpi-label">Unmatched (System)</div>
              <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>{recon.summary?.unmatchedSystem || 0}</div>
            </div>
            <div className="kpi-card" style={{ '--kpi-accent': 'linear-gradient(135deg, #fb923c, #f97316)' } as any}>
              <div className="kpi-label">Unmatched (Bank)</div>
              <div className="kpi-value" style={{ fontSize: 'var(--font-size-lg)' }}>{recon.summary?.unmatchedBank || 0}</div>
            </div>
          </div>

          {/* Side-by-side Reconciliation */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="glass-card">
              <div className="glass-card-title mb-4">System Ledger Entries</div>
              <div className="data-table-wrapper" style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Voucher</th><th className="text-right">Dr</th><th className="text-right">Cr</th></tr></thead>
                  <tbody>
                    {(recon.systemEntries || []).map((e: any) => (
                      <tr key={e.id}>
                        <td className="text-sm">{formatDate(e.date)}</td>
                        <td className="font-mono text-xs">{e.voucherNo}</td>
                        <td className="text-right text-sm amount debit">{e.debit > 0 ? formatCurrency(e.debit) : ''}</td>
                        <td className="text-right text-sm amount credit">{e.credit > 0 ? formatCurrency(e.credit) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-card">
              <div className="glass-card-title mb-4">Bank Statement Lines</div>
              <div className="data-table-wrapper" style={{ maxHeight: 400, overflowY: 'auto' }}>
                <table className="data-table">
                  <thead><tr><th>Date</th><th>Description</th><th className="text-right">Dr</th><th className="text-right">Cr</th><th>Status</th></tr></thead>
                  <tbody>
                    {(recon.statementLines || []).map((l: any) => (
                      <tr key={l.id}>
                        <td className="text-sm">{formatDate(l.date)}</td>
                        <td className="text-sm truncate" style={{ maxWidth: 120 }}>{l.description}</td>
                        <td className="text-right text-sm amount debit">{Number(l.debit) > 0 ? formatCurrency(Number(l.debit)) : ''}</td>
                        <td className="text-right text-sm amount credit">{Number(l.credit) > 0 ? formatCurrency(Number(l.credit)) : ''}</td>
                        <td>{l.isReconciled ? <span className="badge badge-posted">Matched</span> : <span className="badge badge-draft">Pending</span>}</td>
                      </tr>
                    ))}
                    {(!recon.statementLines || recon.statementLines.length === 0) && (
                      <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 'var(--space-6)' }}>No statement uploaded yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {!recon && (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">🏦</div>
          <div className="empty-state-title">No Bank Statements</div>
          <div className="empty-state-desc">Upload a bank statement to begin reconciliation</div>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Upload Bank Statement</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowUpload(false)}>✕</button>
            </div>
            <form onSubmit={handleUpload}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Bank Account *</label>
                  <select className="form-input form-select" name="accountId" required defaultValue={selectedAccount}>
                    {bankAccounts.map((a: any) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Period Start *</label>
                    <input type="date" className="form-input" name="periodStart" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Period End *</label>
                    <input type="date" className="form-input" name="periodEnd" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Statement File (CSV/XLSX) *</label>
                  <input type="file" className="form-input" name="file" required accept=".csv,.xlsx,.xls" />
                  <p className="form-help">Expected columns: Date, Description, Debit, Credit, Reference (optional), Balance (optional)</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><HiOutlineUpload /> Upload & Parse</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
