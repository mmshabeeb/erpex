// ============================================================
// ERPEX — API Client
// Typed fetch wrappers for all backend endpoints
// ============================================================

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed: ${res.status}`);
  }
  return data;
}

function qs(params: Record<string, any>): string {
  const filtered = Object.entries(params).filter(([_, v]) => v !== undefined && v !== '' && v !== null);
  if (filtered.length === 0) return '';
  return '?' + new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
}

// ─── Accounts ───────────────────────────────────────────────

export const accountsApi = {
  list: () => request<any>('/accounts'),
  tree: () => request<any>('/accounts/tree'),
  cashBank: () => request<any>('/accounts/cash-bank'),
  get: (id: string) => request<any>(`/accounts/${id}`),
  ledger: (id: string, filters?: { startDate?: string; endDate?: string }) =>
    request<any>(`/accounts/${id}/ledger${qs(filters || {})}`),
  create: (data: any) => request<any>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Journals ───────────────────────────────────────────────

export const journalsApi = {
  list: (filters?: any) => request<any>(`/journals${qs(filters || {})}`),
  get: (id: string) => request<any>(`/journals/${id}`),
  create: (data: any) => request<any>('/journals', { method: 'POST', body: JSON.stringify(data) }),
  post: (id: string) => request<any>(`/journals/${id}/post`, { method: 'PATCH' }),
  rectify: (id: string, narration?: string) =>
    request<any>(`/journals/${id}/rectify`, { method: 'POST', body: JSON.stringify({ narration }) }),
};

// ─── Contra ─────────────────────────────────────────────────

export const contraApi = {
  list: (filters?: { startDate?: string; endDate?: string }) =>
    request<any>(`/contra${qs(filters || {})}`),
  create: (data: any) => request<any>('/contra', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Cash Book & Day Book ───────────────────────────────────

export const cashbookApi = {
  get: (filters?: any) => request<any>(`/cashbook${qs(filters || {})}`),
};

export const daybookApi = {
  get: (filters?: any) => request<any>(`/daybook${qs(filters || {})}`),
};

// ─── Banking ────────────────────────────────────────────────

export const bankingApi = {
  listStatements: (accountId?: string) =>
    request<any>(`/banking/statements${qs({ accountId })}`),
  uploadStatement: async (formData: FormData) => {
    const res = await fetch(`${API_BASE}/banking/statements/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  },
  reconciliation: (accountId: string, statementId?: string) =>
    request<any>(`/banking/reconciliation/${accountId}${qs({ statementId })}`),
  applyMatches: (matches: any[]) =>
    request<any>('/banking/reconciliation/match', { method: 'POST', body: JSON.stringify({ matches }) }),
  clearLines: (statementLineIds: string[]) =>
    request<any>('/banking/reconciliation/clear', { method: 'PATCH', body: JSON.stringify({ statementLineIds }) }),
};

// ─── Taxation ───────────────────────────────────────────────

export const taxApi = {
  listConfigs: () => request<any>('/tax/configs'),
  createConfig: (data: any) => request<any>('/tax/configs', { method: 'POST', body: JSON.stringify(data) }),
  updateConfig: (id: string, data: any) => request<any>(`/tax/configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  report: (startDate: string, endDate: string) =>
    request<any>(`/tax/report${qs({ startDate, endDate })}`),
};

// ─── Reports ────────────────────────────────────────────────

export const reportsApi = {
  trialBalance: (asOfDate?: string, startDate?: string) =>
    request<any>(`/reports/trial-balance${qs({ asOfDate, startDate })}`),
  profitLoss: (startDate: string, endDate: string) =>
    request<any>(`/reports/profit-loss${qs({ startDate, endDate })}`),
  balanceSheet: (asOfDate?: string) =>
    request<any>(`/reports/balance-sheet${qs({ asOfDate })}`),
};

// ─── Fiscal ─────────────────────────────────────────────────

export const fiscalApi = {
  listYears: () => request<any>('/fiscal/years'),
  createYear: (data: any) => request<any>('/fiscal/years', { method: 'POST', body: JSON.stringify(data) }),
  lockPeriod: (id: string) => request<any>(`/fiscal/periods/${id}/lock`, { method: 'PATCH' }),
  unlockPeriod: (id: string) => request<any>(`/fiscal/periods/${id}/unlock`, { method: 'PATCH' }),
  closeYear: (id: string) => request<any>(`/fiscal/years/${id}/close`, { method: 'POST' }),
};

// ─── Branches ───────────────────────────────────────────────

export const branchesApi = {
  list: () => request<any>('/branches'),
  get: (id: string) => request<any>(`/branches/${id}`),
  create: (data: any) => request<any>('/branches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Budgets ────────────────────────────────────────────────

export const budgetsApi = {
  list: (fiscalYearId?: string) => request<any>(`/budgets${qs({ fiscalYearId })}`),
  upsert: (data: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  bulkUpsert: (items: any[]) => request<any>('/budgets/bulk', { method: 'POST', body: JSON.stringify({ items }) }),
  variance: (fiscalYearId: string) => request<any>(`/budgets/variance/${fiscalYearId}`),
};

// ─── Contacts ───────────────────────────────────────────────

export const contactsApi = {
  list: (filters?: any) => request<any>(`/contacts${qs(filters || {})}`),
  get: (id: string) => request<any>(`/contacts/${id}`),
  statement: (id: string, filters?: any) => request<any>(`/contacts/${id}/statement${qs(filters || {})}`),
  create: (data: any) => request<any>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Items ──────────────────────────────────────────────────

export const itemsApi = {
  list: (filters?: any) => request<any>(`/items${qs(filters || {})}`),
  get: (id: string) => request<any>(`/items/${id}`),
  create: (data: any) => request<any>('/items', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  listGroups: () => request<any>('/items/groups'),
  createGroup: (data: any) => request<any>('/items/groups', { method: 'POST', body: JSON.stringify(data) }),
  listPriceLists: () => request<any>('/items/price-lists'),
  createPriceList: (data: any) => request<any>('/items/price-lists', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Inventory ──────────────────────────────────────────────

export const inventoryApi = {
  stockSummary: () => request<any>('/inventory/stock-summary'),
  lowStock: () => request<any>('/inventory/low-stock'),
  movements: (itemId: string) => request<any>(`/inventory/movements/${itemId}`),
  adjust: (data: any) => request<any>('/inventory/adjustment', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Estimates ──────────────────────────────────────────────

export const estimatesApi = {
  list: (filters?: any) => request<any>(`/estimates${qs(filters || {})}`),
  get: (id: string) => request<any>(`/estimates/${id}`),
  create: (data: any) => request<any>('/estimates', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => request<any>(`/estimates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  convertToInvoice: (id: string) => request<any>(`/estimates/${id}/convert-invoice`, { method: 'POST' }),
};

// ─── Invoices ───────────────────────────────────────────────

export const invoicesApi = {
  list: (filters?: any) => request<any>(`/invoices${qs(filters || {})}`),
  get: (id: string) => request<any>(`/invoices/${id}`),
  create: (data: any) => request<any>('/invoices', { method: 'POST', body: JSON.stringify(data) }),
  post: (id: string) => request<any>(`/invoices/${id}/post`, { method: 'POST' }),
  void: (id: string) => request<any>(`/invoices/${id}/void`, { method: 'POST' }),
  unpaid: (contactId: string) => request<any>(`/invoices/unpaid/${contactId}`),
};

// ─── Payments Received ──────────────────────────────────────

export const paymentsReceivedApi = {
  list: (filters?: any) => request<any>(`/payments-received${qs(filters || {})}`),
  create: (data: any) => request<any>('/payments-received', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Credit Notes ───────────────────────────────────────────

export const creditNotesApi = {
  list: (filters?: any) => request<any>(`/credit-notes${qs(filters || {})}`),
  create: (data: any) => request<any>('/credit-notes', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Purchase Orders ────────────────────────────────────────

export const purchaseOrdersApi = {
  list: (filters?: any) => request<any>(`/purchase-orders${qs(filters || {})}`),
  get: (id: string) => request<any>(`/purchase-orders/${id}`),
  create: (data: any) => request<any>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string) => request<any>(`/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  convertToBill: (id: string) => request<any>(`/purchase-orders/${id}/convert-bill`, { method: 'POST' }),
};

// ─── Bills ──────────────────────────────────────────────────

export const billsApi = {
  list: (filters?: any) => request<any>(`/bills${qs(filters || {})}`),
  get: (id: string) => request<any>(`/bills/${id}`),
  create: (data: any) => request<any>('/bills', { method: 'POST', body: JSON.stringify(data) }),
  post: (id: string) => request<any>(`/bills/${id}/post`, { method: 'POST' }),
  unpaid: (contactId: string) => request<any>(`/bills/unpaid/${contactId}`),
};

// ─── Expenses ───────────────────────────────────────────────

export const expensesApi = {
  list: (filters?: any) => request<any>(`/expenses${qs(filters || {})}`),
  create: (data: any) => request<any>('/expenses', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Payments Made ──────────────────────────────────────────

export const paymentsMadeApi = {
  list: (filters?: any) => request<any>(`/payments-made${qs(filters || {})}`),
  create: (data: any) => request<any>('/payments-made', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Vendor Credits ─────────────────────────────────────────

export const vendorCreditsApi = {
  list: (filters?: any) => request<any>(`/vendor-credits${qs(filters || {})}`),
  create: (data: any) => request<any>('/vendor-credits', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── Projects ───────────────────────────────────────────────

export const projectsApi = {
  list: (filters?: any) => request<any>(`/projects${qs(filters || {})}`),
  get: (id: string) => request<any>(`/projects/${id}`),
  create: (data: any) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addTask: (id: string, data: any) => request<any>(`/projects/${id}/tasks`, { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId: string, data: any) => request<any>(`/projects/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Timesheets ─────────────────────────────────────────────

export const timesheetsApi = {
  list: (filters?: any) => request<any>(`/timesheets${qs(filters || {})}`),
  create: (data: any) => request<any>('/timesheets', { method: 'POST', body: JSON.stringify(data) }),
  approve: (id: string) => request<any>(`/timesheets/${id}/approve`, { method: 'PATCH' }),
  reject: (id: string) => request<any>(`/timesheets/${id}/reject`, { method: 'PATCH' }),
};
