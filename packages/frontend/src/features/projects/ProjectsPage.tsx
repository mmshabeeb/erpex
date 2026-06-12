// ============================================================
// ERPEX — Projects Page with Create Project + Log Timesheet
// ============================================================

import { useState, useEffect } from 'react';
import { projectsApi, timesheetsApi, contactsApi } from '../../api/client';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#34d399', COMPLETED: '#60a5fa', ON_HOLD: '#fbbf24', CANCELLED: '#6b7280',
  TODO: '#94a3b8', IN_PROGRESS: '#60a5fa', DONE: '#34d399',
  PENDING: '#fbbf24', APPROVED: '#34d399', REJECTED: '#f87171',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [timesheets, setTimesheets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'projects' | 'timesheets'>('projects');
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showTsForm, setShowTsForm] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [projectForm, setProjectForm] = useState({ name: '', contactId: '', billingMethod: 'PROJECT_HOURLY', budget: 0, status: 'ACTIVE', startDate: '', endDate: '', description: '' });
  const [tsForm, setTsForm] = useState({ projectId: '', taskId: '', date: new Date().toISOString().slice(0, 10), hours: 0, description: '', isBillable: true });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadProjects(); loadTimesheets(); }, []);

  async function loadProjects() {
    setLoading(true);
    try { const res = await projectsApi.list({}); setProjects(res.data); setTotal(res.total); } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadTimesheets() {
    try { const res = await timesheetsApi.list({}); setTimesheets(res.data); } catch (e) { console.error(e); }
  }

  async function openProjectForm() {
    setShowProjectForm(true);
    try { const c = await contactsApi.list({}); setContacts(c.data); } catch (e) { console.error(e); }
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectForm.name) return alert('Enter a project name');
    setSubmitting(true);
    try {
      await projectsApi.create({ ...projectForm, budget: Number(projectForm.budget), startDate: projectForm.startDate || undefined, endDate: projectForm.endDate || undefined });
      setShowProjectForm(false);
      setProjectForm({ name: '', contactId: '', billingMethod: 'PROJECT_HOURLY', budget: 0, status: 'ACTIVE', startDate: '', endDate: '', description: '' });
      loadProjects();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  async function handleLogTime(e: React.FormEvent) {
    e.preventDefault();
    if (!tsForm.projectId || !tsForm.hours) return alert('Select a project and enter hours');
    setSubmitting(true);
    try {
      await timesheetsApi.create({ ...tsForm, hours: Number(tsForm.hours), taskId: tsForm.taskId || undefined });
      setShowTsForm(false);
      setTsForm({ projectId: '', taskId: '', date: new Date().toISOString().slice(0, 10), hours: 0, description: '', isBillable: true });
      loadTimesheets(); loadProjects();
    } catch (e: any) { alert(e.message); }
    setSubmitting(false);
  }

  async function handleApprove(id: string) {
    try { await timesheetsApi.approve(id); loadTimesheets(); } catch (e: any) { alert(e.message); }
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalHours = projects.reduce((s, p) => s + (p.totalHours || 0), 0);
  const selectedProject = projects.find(p => p.id === tsForm.projectId);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects & Time Tracking</h1>
          <p className="page-subtitle">Project management, tasks, and timesheet tracking</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setShowTsForm(true)} id="btn-log-time" style={{ border: '1px solid var(--border-subtle)' }}>⏱ Log Time</button>
          <button className="btn btn-primary" onClick={openProjectForm} id="btn-create-project">+ Create Project</button>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="kpi-card"><span className="kpi-label">Active Projects</span><span className="kpi-value">{projects.filter(p => p.status === 'ACTIVE').length}</span></div>
        <div className="kpi-card"><span className="kpi-label">Total Budget</span><span className="kpi-value" style={{fontSize:'1.3rem'}}>{fmt(totalBudget)}</span></div>
        <div className="kpi-card"><span className="kpi-label">Hours Logged</span><span className="kpi-value">{totalHours}h</span></div>
        <div className="kpi-card"><span className="kpi-label">Pending Approvals</span><span className="kpi-value" style={{color:'var(--color-amber)'}}>{timesheets.filter(t => t.approvalStatus === 'PENDING').length}</span></div>
      </div>

      {/* Create Project Form */}
      {showProjectForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Create New Project</h3>
            <button className="btn btn-ghost" onClick={() => setShowProjectForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleCreateProject} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div><label className="form-label">Project Name *</label><input className="form-input" required value={projectForm.name} onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="form-label">Client</label><select className="form-input" value={projectForm.contactId} onChange={e => setProjectForm(p => ({ ...p, contactId: e.target.value }))}><option value="">Select client...</option>{contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="form-label">Billing Method</label><select className="form-input" value={projectForm.billingMethod} onChange={e => setProjectForm(p => ({ ...p, billingMethod: e.target.value }))}><option value="FIXED">Fixed Price</option><option value="PROJECT_HOURLY">Hourly</option><option value="TASK_HOURLY">Task Hourly</option><option value="NON_BILLABLE">Non-Billable</option></select></div>
            <div><label className="form-label">Budget (₹)</label><input className="form-input" type="number" value={projectForm.budget || ''} onChange={e => setProjectForm(p => ({ ...p, budget: Number(e.target.value) }))} /></div>
            <div><label className="form-label">Start Date</label><input className="form-input" type="date" value={projectForm.startDate} onChange={e => setProjectForm(p => ({ ...p, startDate: e.target.value }))} /></div>
            <div><label className="form-label">End Date</label><input className="form-input" type="date" value={projectForm.endDate} onChange={e => setProjectForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label className="form-label">Description</label><input className="form-input" placeholder="Project description" value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowProjectForm(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Project'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Log Timesheet Form */}
      {showTsForm && (
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Log Timesheet Entry</h3>
            <button className="btn btn-ghost" onClick={() => setShowTsForm(false)}>✕ Close</button>
          </div>
          <form onSubmit={handleLogTime} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            <div><label className="form-label">Project *</label><select className="form-input" required value={tsForm.projectId} onChange={e => setTsForm(p => ({ ...p, projectId: e.target.value, taskId: '' }))}><option value="">Select project...</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="form-label">Task</label><select className="form-input" value={tsForm.taskId} onChange={e => setTsForm(p => ({ ...p, taskId: e.target.value }))}><option value="">No task</option>{selectedProject?.tasks?.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
            <div><label className="form-label">Date</label><input className="form-input" type="date" value={tsForm.date} onChange={e => setTsForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div><label className="form-label">Hours *</label><input className="form-input" type="number" required min="0.25" step="0.25" value={tsForm.hours || ''} onChange={e => setTsForm(p => ({ ...p, hours: Number(e.target.value) }))} /></div>
            <div><label className="form-label">Description</label><input className="form-input" placeholder="What did you work on?" value={tsForm.description} onChange={e => setTsForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.5rem' }}>
              <input type="checkbox" id="ts-billable" checked={tsForm.isBillable} onChange={e => setTsForm(p => ({ ...p, isBillable: e.target.checked }))} />
              <label htmlFor="ts-billable" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Billable</label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
              <button className="btn btn-ghost" type="button" onClick={() => setShowTsForm(false)}>Cancel</button>
              <button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Logging...' : 'Log Time'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '0.75rem 1rem', display: 'flex', gap: '0.5rem' }}>
        {(['projects', 'timesheets'] as const).map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>
            {t === 'projects' ? '📁 Projects' : '⏱️ Timesheets'}
          </button>
        ))}
      </div>

      {tab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? <div className="card" style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>Loading...</div> :
          projects.length === 0 ? <div className="card" style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>No projects yet. Create one to get started.</div> :
          projects.map(proj => (
            <div key={proj.id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.05rem' }}>{proj.name}</h3>
                    <span className="status-badge" style={{ background: (STATUS_COLORS[proj.status] || '#94a3b8') + '22', color: STATUS_COLORS[proj.status], border: `1px solid ${STATUS_COLORS[proj.status]}44` }}>{proj.status}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {proj.contact?.name} • {proj.billingMethod.replace('_', ' ')} • Budget: {fmt(proj.budget)}
                    {proj.startDate && ` • ${fmtDate(proj.startDate)} – ${proj.endDate ? fmtDate(proj.endDate) : 'Ongoing'}`}
                  </p>
                </div>
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{proj.totalHours || 0}h</div>
                  <div style={{ fontSize: '0.75rem', color: proj.profitMargin > 20 ? 'var(--color-emerald)' : 'var(--color-amber)' }}>
                    {proj.profitMargin > 0 ? `${proj.profitMargin}% margin` : '—'}
                  </div>
                </div>
              </div>

              <button className="btn btn-ghost" style={{fontSize:'0.8rem',padding:'0.25rem 0.5rem',marginBottom:'0.5rem'}} onClick={() => setExpandedProject(expandedProject === proj.id ? null : proj.id)}>
                {expandedProject === proj.id ? '▼ Hide Tasks' : '▶ Show Tasks'} ({proj.tasks?.length || 0})
              </button>

              {expandedProject === proj.id && proj.tasks && (
                <table className="data-table" style={{ marginTop: '0.5rem' }}>
                  <thead>
                    <tr><th>Task</th><th>Assignee</th><th>Rate</th><th>Budget</th><th>Logged</th><th>Progress</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {proj.tasks.map((task: any) => {
                      const progress = task.budgetHours > 0 ? Math.min(100, (task.loggedHours / task.budgetHours) * 100) : 0;
                      return (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 500 }}>{task.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{task.assignee || '—'}</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{fmt(task.hourlyRate)}/hr</td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>{task.budgetHours}h</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{task.loggedHours}h</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${progress}%`, borderRadius: 3, background: progress > 90 ? 'var(--color-rose)' : 'var(--color-blue)', transition: 'width 0.3s' }} />
                              </div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 35 }}>{Math.round(progress)}%</span>
                            </div>
                          </td>
                          <td><span className="status-badge" style={{ background: (STATUS_COLORS[task.status] || '#94a3b8') + '22', color: STATUS_COLORS[task.status], border: `1px solid ${STATUS_COLORS[task.status]}44`, fontSize: '0.7rem' }}>{task.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'timesheets' && (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Project</th><th>Task</th><th>Description</th><th style={{textAlign:'right'}}>Hours</th><th style={{textAlign:'right'}}>Amount</th><th>Billable</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {timesheets.length === 0 ? <tr><td colSpan={9} style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>No timesheet entries</td></tr> :
              timesheets.map(ts => (
                <tr key={ts.id}>
                  <td style={{ fontSize: '0.85rem' }}>{fmtDate(ts.date)}</td>
                  <td style={{ fontWeight: 500 }}>{ts.project?.name}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{ts.task?.name || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{ts.description || '—'}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{ts.hours}h</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{fmt(ts.totalAmount)}</td>
                  <td>{ts.isBillable ? '✅' : '—'}</td>
                  <td><span className="status-badge" style={{ background: (STATUS_COLORS[ts.approvalStatus] || '#94a3b8') + '22', color: STATUS_COLORS[ts.approvalStatus], border: `1px solid ${STATUS_COLORS[ts.approvalStatus]}44`, fontSize: '0.7rem' }}>{ts.approvalStatus}</span></td>
                  <td>
                    {ts.approvalStatus === 'PENDING' && <button className="btn btn-ghost" style={{fontSize:'0.7rem',padding:'0.2rem 0.4rem',color:'var(--color-emerald)'}} onClick={() => handleApprove(ts.id)}>Approve</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
