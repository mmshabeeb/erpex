// ============================================================
// ERPEX — Chart of Accounts Page
// Hierarchical tree view with CRUD
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountsApi } from '../../api/client';
import { formatCurrency, getAccountTypeBadge } from '../../utils/formatters';
import { ACCOUNT_TYPE_COLORS, AccountType } from '@erpex/shared';
import { HiOutlinePlus, HiOutlineChevronRight, HiOutlineSearch } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const navigate = useNavigate();
  const [tree, setTree] = useState<any[]>([]);
  const [flatList, setFlatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    code: '', name: '', type: 'ASSET' as string, parentId: '', isCashOrBank: false, description: '',
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [treeRes, listRes] = await Promise.all([
        accountsApi.tree(),
        accountsApi.list(),
      ]);
      setTree(treeRes.data);
      setFlatList(listRes.data);
      // Auto-expand first level
      const ids = new Set<string>();
      treeRes.data.forEach((n: any) => ids.add(n.id));
      setExpandedIds(ids);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await accountsApi.create({
        ...formData,
        parentId: formData.parentId || null,
      });
      toast.success('Account created successfully');
      setShowModal(false);
      setFormData({ code: '', name: '', type: 'ASSET', parentId: '', isCashOrBank: false, description: '' });
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function renderTreeNode(node: any, depth = 0) {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedIds.has(node.id);
    const typeColor = ACCOUNT_TYPE_COLORS[node.type as AccountType] || '#8b95a8';

    if (search) {
      const matchesSelf = node.name.toLowerCase().includes(search.toLowerCase()) ||
                          node.code.includes(search);
      const matchesChildren = hasChildren && node.children.some((c: any) =>
        c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search)
      );
      if (!matchesSelf && !matchesChildren) return null;
    }

    return (
      <div key={node.id}>
        <div
          className="account-tree-item"
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
          onClick={() => hasChildren ? toggleExpand(node.id) : navigate(`/accounts/${node.id}/ledger`)}
        >
          <span className={`toggle ${isExpanded ? 'expanded' : ''}`}>
            {hasChildren ? <HiOutlineChevronRight /> : <span style={{ width: 16 }} />}
          </span>
          <span className="code">{node.code}</span>
          <span className="name">{node.name}</span>
          <span className={getAccountTypeBadge(node.type)} style={{ fontSize: '0.65rem' }}>
            {node.type}
          </span>
          {node.isCashOrBank && (
            <span className="badge badge-open" style={{ fontSize: '0.6rem' }}>CASH/BANK</span>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/accounts/${node.id}/ledger`);
            }}
            style={{ marginLeft: 'auto', fontSize: '0.7rem' }}
          >
            Ledger →
          </button>
        </div>
        {hasChildren && isExpanded && (
          <div className="account-tree-children">
            {node.children.map((child: any) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>Chart of Accounts</h1>
          <p className="text-muted text-sm mt-2">{flatList.length} accounts across 5 categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus /> New Account
        </button>
      </div>

      {/* Search */}
      <div className="filter-bar">
        <HiOutlineSearch style={{ color: 'var(--color-text-muted)' }} />
        <input
          className="form-input"
          placeholder="Search accounts by name or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none' }}
        />
      </div>

      {/* Tree */}
      <div className="glass-card">
        <div className="account-tree">
          {tree.map(node => renderTreeNode(node))}
        </div>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Account</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Account Code *</label>
                    <input className="form-input" required value={formData.code}
                      onChange={e => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g., 11105" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Account Type *</label>
                    <select className="form-input form-select" value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}>
                      <option value="ASSET">Asset</option>
                      <option value="LIABILITY">Liability</option>
                      <option value="EQUITY">Equity</option>
                      <option value="REVENUE">Revenue</option>
                      <option value="EXPENSE">Expense</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Account Name *</label>
                  <input className="form-input" required value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., ICICI Bank A/c" />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Account</label>
                  <select className="form-input form-select" value={formData.parentId}
                    onChange={e => setFormData({ ...formData, parentId: e.target.value })}>
                    <option value="">— No Parent (Root Account) —</option>
                    {flatList
                      .filter(a => a.type === formData.type)
                      .map(a => (
                        <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                      ))
                    }
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={formData.isCashOrBank}
                      onChange={e => setFormData({ ...formData, isCashOrBank: e.target.checked })} />
                    This is a Cash or Bank account
                  </label>
                  <p className="form-help">Enable for accounts used in Contra transactions</p>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
