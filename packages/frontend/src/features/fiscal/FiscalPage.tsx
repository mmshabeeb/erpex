// ============================================================
// ERPEX — Fiscal Year Management Page
// ============================================================

import { useState, useEffect } from 'react';
import { fiscalApi } from '../../api/client';
import { formatDate, toInputDate } from '../../utils/formatters';
import { HiOutlinePlus, HiOutlineLockClosed, HiOutlineLockOpen } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function FiscalPage() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fiscalApi.listYears();
      setYears(res.data || []);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fiscalApi.createYear(form);
      toast.success('Fiscal year created');
      setShowModal(false);
      setForm({ name: '', startDate: '', endDate: '' });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleToggleLock(periodId: string, isLocked: boolean) {
    try {
      if (isLocked) await fiscalApi.unlockPeriod(periodId);
      else await fiscalApi.lockPeriod(periodId);
      toast.success(`Period ${isLocked ? 'unlocked' : 'locked'}`);
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleCloseYear(yearId: string) {
    if (!confirm('Are you sure you want to close this fiscal year? All periods will be locked.')) return;
    try {
      await fiscalApi.closeYear(yearId);
      toast.success('Fiscal year closed');
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Fiscal Year Management</h1>
          <p className="text-muted text-sm mt-2">Manage accounting periods and year-end closing</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Fiscal Year
        </button>
      </div>

      {years.map((fy: any) => (
        <div key={fy.id} className="glass-card mb-6">
          <div className="glass-card-header">
            <div>
              <div className="glass-card-title">{fy.name}</div>
              <div className="glass-card-subtitle">
                {formatDate(fy.startDate)} — {formatDate(fy.endDate)}
              </div>
            </div>
            <div className="flex gap-3">
              <span className={`badge ${fy.isClosed ? 'badge-locked' : 'badge-open'}`}>
                {fy.isClosed ? 'CLOSED' : 'OPEN'}
              </span>
              {!fy.isClosed && (
                <button className="btn btn-danger btn-sm" onClick={() => handleCloseYear(fy.id)}>
                  Close Year
                </button>
              )}
            </div>
          </div>

          {/* Monthly Periods */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
            {(fy.periods || []).map((period: any) => (
              <div key={period.id}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${period.isLocked ? 'rgba(239,68,68,0.2)' : 'var(--color-border)'}`,
                  background: period.isLocked ? 'var(--color-danger-bg)' : 'var(--color-bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: fy.isClosed ? 'default' : 'pointer',
                }}
                onClick={() => !fy.isClosed && handleToggleLock(period.id, period.isLocked)}
              >
                <div>
                  <div className="font-bold text-sm">{monthNames[period.month]} {period.year}</div>
                </div>
                <div style={{ fontSize: '1rem', color: period.isLocked ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {period.isLocked ? <HiOutlineLockClosed /> : <HiOutlineLockOpen />}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {years.length === 0 && (
        <div className="glass-card empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No Fiscal Years</div>
          <div className="empty-state-desc">Create your first fiscal year to start tracking accounting periods</div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Fiscal Year</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., FY 2026-27" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input type="date" className="form-input" required value={form.startDate}
                      onChange={e => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input type="date" className="form-input" required value={form.endDate}
                      onChange={e => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <p className="form-help">Monthly periods will be auto-generated based on the date range.</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Fiscal Year</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
