// ============================================================
// ERPEX — Journal Entry Form
// Multi-line debit/credit with real-time balance validation
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi, journalsApi } from '../../api/client';
import { formatCurrency, toInputDate } from '../../utils/formatters';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineArrowLeft } from 'react-icons/hi';
import toast from 'react-hot-toast';

interface LineItem {
  accountId: string;
  debit: string;
  credit: string;
  narration: string;
}

export default function JournalForm() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    date: toInputDate(),
    type: 'JOURNAL',
    narration: '',
  });

  const [lines, setLines] = useState<LineItem[]>([
    { accountId: '', debit: '', credit: '', narration: '' },
    { accountId: '', debit: '', credit: '', narration: '' },
  ]);

  useEffect(() => {
    accountsApi.list().then(res => setAccounts(res.data || [])).catch(() => {});
  }, []);

  const totalDebit = useMemo(() =>
    lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0), [lines]);

  const totalCredit = useMemo(() =>
    lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0), [lines]);

  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.01;

  function updateLine(idx: number, field: keyof LineItem, value: string) {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };

    // Auto-clear opposite column
    if (field === 'debit' && parseFloat(value) > 0) {
      updated[idx].credit = '';
    } else if (field === 'credit' && parseFloat(value) > 0) {
      updated[idx].debit = '';
    }

    setLines(updated);
  }

  function addLine() {
    setLines([...lines, { accountId: '', debit: '', credit: '', narration: '' }]);
  }

  function removeLine(idx: number) {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  }

  async function handleSubmit(status: 'DRAFT' | 'POSTED') {
    if (!isBalanced) {
      toast.error('Total debits must equal total credits!');
      return;
    }

    const invalidLines = lines.filter(l => !l.accountId || (!parseFloat(l.debit) && !parseFloat(l.credit)));
    if (invalidLines.length > 0) {
      toast.error('All lines must have an account and either a debit or credit amount');
      return;
    }

    setLoading(true);
    try {
      await journalsApi.create({
        date: form.date,
        type: form.type,
        status,
        narration: form.narration,
        items: lines.map(l => ({
          accountId: l.accountId,
          debit: parseFloat(l.debit) || 0,
          credit: parseFloat(l.credit) || 0,
          narration: l.narration,
        })),
      });
      toast.success(`Journal entry ${status === 'POSTED' ? 'posted' : 'saved as draft'} successfully`);
      navigate('/journals');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button className="btn btn-ghost mb-4" onClick={() => navigate('/journals')}>
        <HiOutlineArrowLeft /> Back to Journals
      </button>

      <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, marginBottom: 'var(--space-6)' }}>
        New Journal Entry
      </h1>

      <div className="glass-card">
        {/* Header Fields */}
        <div className="form-row mb-6">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Voucher Type *</label>
            <select className="form-input form-select" value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="JOURNAL">General Journal (JV)</option>
              <option value="PAYMENT">Payment Voucher (PV)</option>
              <option value="RECEIPT">Receipt Voucher (RV)</option>
              <option value="SALES">Sales Voucher (SV)</option>
              <option value="PURCHASE">Purchase Voucher (PU)</option>
            </select>
          </div>
        </div>
        <div className="form-group mb-6">
          <label className="form-label">Narration</label>
          <textarea className="form-input" value={form.narration}
            onChange={e => setForm({ ...form, narration: e.target.value })}
            placeholder="Description of the transaction..." rows={2} />
        </div>

        {/* Line Items */}
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Account *</th>
                <th style={{ width: '20%' }} className="text-right">Debit (₹)</th>
                <th style={{ width: '20%' }} className="text-right">Credit (₹)</th>
                <th style={{ width: '20%' }}>Line Narration</th>
                <th style={{ width: '5%' }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td>
                    <select className="form-input form-select" value={line.accountId}
                      onChange={e => updateLine(idx, 'accountId', e.target.value)}>
                      <option value="">Select account...</option>
                      {accounts.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input type="number" className="form-input text-right" placeholder="0.00"
                      value={line.debit} onChange={e => updateLine(idx, 'debit', e.target.value)}
                      min="0" step="0.01"
                      style={{ fontFamily: 'var(--font-mono)', color: line.debit ? 'var(--color-debit)' : undefined }} />
                  </td>
                  <td>
                    <input type="number" className="form-input text-right" placeholder="0.00"
                      value={line.credit} onChange={e => updateLine(idx, 'credit', e.target.value)}
                      min="0" step="0.01"
                      style={{ fontFamily: 'var(--font-mono)', color: line.credit ? 'var(--color-credit)' : undefined }} />
                  </td>
                  <td>
                    <input className="form-input" placeholder="Optional" value={line.narration}
                      onChange={e => updateLine(idx, 'narration', e.target.value)} />
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeLine(idx)}
                      disabled={lines.length <= 2}>
                      <HiOutlineTrash />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="total-row">
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={addLine}>
                    <HiOutlinePlus /> Add Line
                  </button>
                </td>
                <td className="text-right amount debit font-bold">{formatCurrency(totalDebit)}</td>
                <td className="text-right amount credit font-bold">{formatCurrency(totalCredit)}</td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Balance Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-4)', padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-md)', background: isBalanced ? 'var(--color-success-bg)' : 'var(--color-danger-bg)', border: `1px solid ${isBalanced ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
          <span style={{ fontWeight: 600, color: isBalanced ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {isBalanced ? '✓ Balanced — Debits equal Credits' : `✗ Unbalanced — Difference: ${formatCurrency(Math.abs(difference))}`}
          </span>
          <span className="font-mono text-sm">
            Dr: {formatCurrency(totalDebit)} | Cr: {formatCurrency(totalCredit)}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <button className="btn btn-secondary" onClick={() => handleSubmit('DRAFT')} disabled={loading || !isBalanced}>
            Save as Draft
          </button>
          <button className="btn btn-primary" onClick={() => handleSubmit('POSTED')} disabled={loading || !isBalanced}>
            {loading ? 'Saving...' : 'Post Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
