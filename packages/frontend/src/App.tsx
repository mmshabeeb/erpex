// ============================================================
// ERPEX — App Component with Auth + Super Admin + ERP Routing
// ============================================================

import { useState } from 'react';
import { Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import {
  HiOutlineHome, HiOutlineCollection, HiOutlineBookOpen,
  HiOutlineSwitchHorizontal, HiOutlineCash, HiOutlineCalendar,
  HiOutlineDocumentReport, HiOutlineCog,
  HiOutlineScale, HiOutlineTrendingUp,
  HiOutlineCreditCard, HiOutlineReceiptTax, HiOutlineUserGroup,
  HiOutlineCube, HiOutlineClipboardCheck, HiOutlineDocumentText,
  HiOutlineShoppingCart, HiOutlineTruck,
  HiOutlineBriefcase, HiOutlineReply,
  HiOutlineChevronDown, HiOutlineChevronRight,
  HiOutlineLogout,
} from 'react-icons/hi';

// Auth
import { AuthProvider, useAuth, ProtectedRoute } from './features/auth/AuthProvider';
import LoginPage from './features/auth/LoginPage';

// Super Admin
import SuperAdminLayout from './features/superadmin/SuperAdminLayout';
import SuperAdminDashboard from './features/superadmin/SuperAdminDashboard';
import CompaniesPage from './features/superadmin/CompaniesPage';
import CompanyDetailPage from './features/superadmin/CompanyDetailPage';
import PlansPage from './features/superadmin/PlansPage';

// Core Accounting
import Dashboard from './features/dashboard/Dashboard';
import AccountsPage from './features/accounts/AccountsPage';
import AccountLedger from './features/accounts/AccountLedger';
import JournalsPage from './features/journals/JournalsPage';
import JournalForm from './features/journals/JournalForm';
import JournalView from './features/journals/JournalView';
import ContraPage from './features/contra/ContraPage';
import CashBookPage from './features/cashbook/CashBookPage';
import DayBookPage from './features/daybook/DayBookPage';
import BankingPage from './features/banking/BankingPage';
import TaxationPage from './features/taxation/TaxationPage';
import TrialBalancePage from './features/reports/TrialBalancePage';
import ProfitLossPage from './features/reports/ProfitLossPage';
import BalanceSheetPage from './features/reports/BalanceSheetPage';
import FiscalPage from './features/fiscal/FiscalPage';

// New Modules
import ContactsPage from './features/contacts/ContactsPage';
import ItemsPage from './features/items/ItemsPage';
import EstimatesPage from './features/sales/EstimatesPage';
import InvoicesPage from './features/sales/InvoicesPage';
import PurchaseOrdersPage from './features/purchases/PurchaseOrdersPage';
import BillsPage from './features/purchases/BillsPage';
import ExpensesPage from './features/purchases/ExpensesPage';
import ProjectsPage from './features/projects/ProjectsPage';
import SalesReturnsPage from './features/sales/SalesReturnsPage';
import PurchaseReturnsPage from './features/purchases/PurchaseReturnsPage';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  collapsible?: boolean;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: <HiOutlineHome /> },
      { path: '/contacts', label: 'Contacts', icon: <HiOutlineUserGroup /> },
    ],
  },
  {
    title: 'Items & Inventory',
    items: [
      { path: '/items', label: 'Items & Stock', icon: <HiOutlineCube /> },
    ],
  },
  {
    title: 'Sales',
    collapsible: true,
    items: [
      { path: '/estimates', label: 'Estimates', icon: <HiOutlineClipboardCheck /> },
      { path: '/invoices', label: 'Invoices', icon: <HiOutlineDocumentText /> },
      { path: '/sales-returns', label: 'Sales Returns', icon: <HiOutlineReply /> },
    ],
  },
  {
    title: 'Purchases',
    collapsible: true,
    items: [
      { path: '/purchase-orders', label: 'Purchase Orders', icon: <HiOutlineShoppingCart /> },
      { path: '/bills', label: 'Bills', icon: <HiOutlineTruck /> },
      { path: '/expenses', label: 'Expenses', icon: <HiOutlineCash /> },
      { path: '/purchase-returns', label: 'Purchase Returns', icon: <HiOutlineReply /> },
    ],
  },
  {
    title: 'Projects',
    items: [
      { path: '/projects', label: 'Projects & Time', icon: <HiOutlineBriefcase /> },
    ],
  },
  {
    title: 'Accounting',
    collapsible: true,
    items: [
      { path: '/accounts', label: 'Chart of Accounts', icon: <HiOutlineCollection /> },
      { path: '/journals', label: 'Journal Vouchers', icon: <HiOutlineBookOpen /> },
      { path: '/contra', label: 'Contra Entries', icon: <HiOutlineSwitchHorizontal /> },
    ],
  },
  {
    title: 'Daily Books',
    collapsible: true,
    items: [
      { path: '/cashbook', label: 'Cash Book', icon: <HiOutlineCash /> },
      { path: '/daybook', label: 'Day Book', icon: <HiOutlineCalendar /> },
      { path: '/banking', label: 'Banking & Recon', icon: <HiOutlineCreditCard /> },
    ],
  },
  {
    title: 'Reports',
    collapsible: true,
    items: [
      { path: '/reports/trial-balance', label: 'Trial Balance', icon: <HiOutlineScale /> },
      { path: '/reports/profit-loss', label: 'Profit & Loss', icon: <HiOutlineTrendingUp /> },
      { path: '/reports/balance-sheet', label: 'Balance Sheet', icon: <HiOutlineDocumentReport /> },
    ],
  },
  {
    title: 'Settings',
    collapsible: true,
    items: [
      { path: '/taxation', label: 'Tax Configuration', icon: <HiOutlineReceiptTax /> },
      { path: '/fiscal', label: 'Fiscal Years', icon: <HiOutlineCog /> },
    ],
  },
];

function SidebarSection({ section }: { section: NavSection }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const isActiveSection = section.items.some(i => location.pathname === i.path || location.pathname.startsWith(i.path + '/'));

  return (
    <div className="sidebar-section">
      <div
        className="sidebar-section-title"
        style={{ cursor: section.collapsible ? 'pointer' : 'default', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        onClick={() => section.collapsible && setCollapsed(!collapsed)}
      >
        <span>{section.title}</span>
        {section.collapsible && (
          <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>
            {collapsed ? <HiOutlineChevronRight /> : <HiOutlineChevronDown />}
          </span>
        )}
      </div>
      {(!section.collapsible || !collapsed || isActiveSection) && section.items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/'}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
        >
          <span className="sidebar-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

// ─── Company ERP Layout ──────────────────────────────────────

function ERPLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar" id="main-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-logo">E</div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">ERPEX</span>
            <span className="sidebar-brand-sub">
              {user?.company?.name || 'Business Suite'}
            </span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navSections.map((section) => (
            <SidebarSection key={section.title} section={section} />
          ))}
        </nav>

        {/* User profile at bottom */}
        <div style={{
          padding: 'var(--space-4)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        }}>
          <div style={{
            width: 32, height: 32,
            background: 'var(--color-accent-gradient)',
            borderRadius: 'var(--radius-full)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 'var(--font-size-sm)', fontWeight: 600,
              color: 'var(--color-text-primary)', whiteSpace: 'nowrap',
              overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.name || 'User'}
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {user?.role || 'user'}
            </div>
          </div>
          <button onClick={logout} className="btn btn-ghost btn-icon" title="Logout" style={{ flexShrink: 0 }}>
            <HiOutlineLogout />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-content page-enter" key={location.pathname}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/estimates" element={<EstimatesPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/sales-returns" element={<SalesReturnsPage />} />
            <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/purchase-returns" element={<PurchaseReturnsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/accounts/:id/ledger" element={<AccountLedger />} />
            <Route path="/journals" element={<JournalsPage />} />
            <Route path="/journals/new" element={<JournalForm />} />
            <Route path="/journals/:id" element={<JournalView />} />
            <Route path="/contra" element={<ContraPage />} />
            <Route path="/cashbook" element={<CashBookPage />} />
            <Route path="/daybook" element={<DayBookPage />} />
            <Route path="/banking" element={<BankingPage />} />
            <Route path="/reports/trial-balance" element={<TrialBalancePage />} />
            <Route path="/reports/profit-loss" element={<ProfitLossPage />} />
            <Route path="/reports/balance-sheet" element={<BalanceSheetPage />} />
            <Route path="/taxation" element={<TaxationPage />} />
            <Route path="/fiscal" element={<FiscalPage />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

// ─── Root App with Auth ──────────────────────────────────────

function AppRoutes() {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--color-bg-primary)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Login — public route */}
      <Route path="/login" element={
        isAuthenticated ? <Navigate to={isSuperAdmin ? '/super-admin' : '/'} /> : <LoginPage />
      } />

      {/* Super Admin Portal — requires super admin auth */}
      <Route path="/super-admin" element={
        <ProtectedRoute requireSuperAdmin>
          <SuperAdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<SuperAdminDashboard />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="companies/:id" element={<CompanyDetailPage />} />
        <Route path="plans" element={<PlansPage />} />
      </Route>

      {/* Company ERP — requires user auth */}
      <Route path="/*" element={
        <ProtectedRoute>
          <ERPLayout />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
