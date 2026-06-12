// ============================================================
// ERPEX — Journal View (Read-only posted view)
// + Print/Download support
// ============================================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { journalsApi } from '../../api/client';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';
import DocumentViewer from '../shared/DocumentViewer';
import type { DocumentData } from '../shared/DocumentViewer';
import { useAuth } from '../auth/AuthProvider';

export default function JournalView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<DocumentData | null>(null);
  const { user } = useAuth();

  useEffect(() => { if (id) loadEntry(); }, [id]);

  async function loadEntry() {
    try {
      const res = await journalsApi.get(id!);
      setEntry(res.data);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handlePost() {
    try {
      await journalsApi.post(id!);
      toast.success('Journal entry posted successfully');
      loadEntry();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleRectify() {
    const narration = prompt('Enter narration for the rectification entry:');
    if (narration === null) return;
    try {
      const res = await journalsApi.rectify(id!, narration);
      toast.success(`Rectification entry ${res.data.voucherNo} created`);
      navigate(`/journals/${res.data.id}`);
    } catch (err: any) { toast.error(err.message); }
  }

  function handleViewPrint() {
    if (!entry) return;
    const docData: DocumentData = {
      type: 'JOURNAL_VOUCHER',
      number: entry.voucherNo,
      status: entry.status,
      date: entry.date,
      company: user?.company ? {
        name: user.company.name, legalName: user.company.legalName,
        address: user.company.address, city: user.company.city,
        state: user.company.state, pinCode: user.company.pinCode,
        gstin: user.company.gstin, pan: user.company.pan,
      } : undefined,
      lines: [],
      subtotal: 0,
      taxTotal: 0,
      total: 0,
      narration: entry.narration,
      journalItems: (entry.items || []).map((item: any) => ({
        accountCode: item.account?.code || '',
        accountName: item.account?.name || '',
        narration: item.narration,
        debit: Number(item.debit) || 0,
        credit: Number(item.credit) || 0,
      })),
      totalDebit: entry.totalDebit || 0,
      totalCredit: entry.totalCredit || 0,
    };
    setViewDoc(docData);
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!entry) return <div className="empty-state"><div className="empty-state-title">Journal not found</div></div>;

  return (
    <div>
      <button className="btn btn-ghost mb-4" onClick={() => navigate('/journals')}>
        <HiOutlineArrowLeft /> Back to Journals
      </button>

      <div className="glass-card">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
              <span className="font-mono" style={{ color: 'var(--color-accent-secondary)' }}>{entry.voucherNo}</span>
            </h1>
            <p className="text-muted text-sm mt-2">
              {formatDate(entry.date)} · {entry.type} · Created {formatDate(entry.createdAt)}
            </p>
          </div>
          <div className="flex gap-3">
            <span className={`badge badge-${entry.status.toLowerCase()}`} style={{ fontSize: 'var(--font-size-sm)', padding: '4px 12px' }}>
              {entry.status}
            </span>
            <button className="btn btn-ghost btn-sm" onClick={handleViewPrint} title="View / Print / Download"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </button>
            {entry.status === 'DRAFT' && (
              <button className="btn btn-success btn-sm" onClick={handlePost}>Post Entry</button>
            )}
            {entry.status === 'POSTED' && (
              <button className="btn btn-danger btn-sm" onClick={handleRectify}>Create Rectification</button>
            )}
          </div>
        </div>

        {/* Narration */}
        {entry.narration && (
          <div className="mb-6" style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
            <span className="text-sm text-muted">Narration: </span>
            <span className="text-sm">{entry.narration}</span>
          </div>
        )}

        {/* Rectification Link */}
        {entry.rectifies && (
          <div className="mb-4" style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.2)' }}>
            <span className="text-sm">Rectification of </span>
            <span className="font-mono" style={{ color: 'var(--color-accent-secondary)', cursor: 'pointer' }}
              onClick={() => navigate(`/journals/${entry.rectifies.id}`)}>
              {entry.rectifies.voucherNo}
            </span>
          </div>
        )}

        {entry.rectifiedBy && entry.rectifiedBy.length > 0 && (
          <div className="mb-4" style={{ padding: 'var(--space-2) var(--space-4)', background: 'var(--color-danger-bg)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="text-sm">Rectified by: </span>
            {entry.rectifiedBy.map((r: any) => (
              <span key={r.id} className="font-mono" style={{ color: 'var(--color-accent-secondary)', cursor: 'pointer', marginLeft: 4 }}
                onClick={() => navigate(`/journals/${r.id}`)}>
                {r.voucherNo}
              </span>
            ))}
          </div>
        )}

        {/* Line Items Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Account Code</th>
                <th>Account Name</th>
                <th>Narration</th>
                <th className="text-right">Debit (₹)</th>
                <th className="text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody>
              {entry.items.map((item: any) => (
                <tr key={item.id} className="clickable-row" onClick={() => navigate(`/accounts/${item.accountId}/ledger`)}>
                  <td className="font-mono text-sm">{item.account?.code}</td>
                  <td>{item.account?.name}</td>
                  <td className="text-muted text-sm">{item.narration || '—'}</td>
                  <td className="text-right amount debit">{Number(item.debit) > 0 ? formatCurrency(Number(item.debit)) : ''}</td>
                  <td className="text-right amount credit">{Number(item.credit) > 0 ? formatCurrency(Number(item.credit)) : ''}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={3} className="font-bold">Total</td>
                <td className="text-right amount debit font-bold">{formatCurrency(entry.totalDebit)}</td>
                <td className="text-right amount credit font-bold">{formatCurrency(entry.totalCredit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {viewDoc && <DocumentViewer data={viewDoc} open={true} onClose={() => setViewDoc(null)} />}
    </div>
  );
}
