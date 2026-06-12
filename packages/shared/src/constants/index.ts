// ============================================================
// ERPEX — Shared Constants (Full ERP)
// Enums and constant values used across frontend and backend
// ============================================================

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum VoucherType {
  JOURNAL = 'JOURNAL',
  CONTRA = 'CONTRA',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
}

export enum VoucherStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
}

export enum TaxType {
  GST = 'GST',
  VAT = 'VAT',
  SALES_TAX = 'SALES_TAX',
  CUSTOM = 'CUSTOM',
}

// ─── NEW: Item Types ────────────────────────────────────────

export enum ItemType {
  PRODUCT = 'PRODUCT',
  SERVICE = 'SERVICE',
  DIGITAL = 'DIGITAL',
}

// ─── NEW: Contact Types ─────────────────────────────────────

export enum ContactType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  BOTH = 'BOTH',
}

// ─── NEW: Document Status Enums ─────────────────────────────

export enum EstimateStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  INVOICED = 'INVOICED',
}

export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  VOID = 'VOID',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum BillStatus {
  DRAFT = 'DRAFT',
  RECEIVED = 'RECEIVED',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum ProjectBillingMethod {
  FIXED = 'FIXED',
  PROJECT_HOURLY = 'PROJECT_HOURLY',
  TASK_HOURLY = 'TASK_HOURLY',
}

export enum TimesheetApproval {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CREDIT_CARD = 'CREDIT_CARD',
  UPI = 'UPI',
  CARD = 'CARD',
}

export enum InventoryMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUST = 'ADJUST',
}

export enum RecurringInterval {
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

// ─── Labels ─────────────────────────────────────────────────

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  [AccountType.ASSET]: 'Assets',
  [AccountType.LIABILITY]: 'Liabilities',
  [AccountType.EQUITY]: 'Equity',
  [AccountType.REVENUE]: 'Revenue',
  [AccountType.EXPENSE]: 'Expenses',
};

export const ACCOUNT_TYPE_COLORS: Record<AccountType, string> = {
  [AccountType.ASSET]: '#60a5fa',
  [AccountType.LIABILITY]: '#fb923c',
  [AccountType.EQUITY]: '#a78bfa',
  [AccountType.REVENUE]: '#34d399',
  [AccountType.EXPENSE]: '#f87171',
};

export const VOUCHER_TYPE_PREFIX: Record<VoucherType, string> = {
  [VoucherType.JOURNAL]: 'JV',
  [VoucherType.CONTRA]: 'CT',
  [VoucherType.PAYMENT]: 'PV',
  [VoucherType.RECEIPT]: 'RV',
  [VoucherType.SALES]: 'SV',
  [VoucherType.PURCHASE]: 'PU',
};

export const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.DRAFT]: '#94a3b8',
  [InvoiceStatus.SENT]: '#60a5fa',
  [InvoiceStatus.PARTIALLY_PAID]: '#fbbf24',
  [InvoiceStatus.PAID]: '#34d399',
  [InvoiceStatus.OVERDUE]: '#f87171',
  [InvoiceStatus.VOID]: '#6b7280',
};

export const BILL_STATUS_COLORS: Record<BillStatus, string> = {
  [BillStatus.DRAFT]: '#94a3b8',
  [BillStatus.RECEIVED]: '#60a5fa',
  [BillStatus.PARTIALLY_PAID]: '#fbbf24',
  [BillStatus.PAID]: '#34d399',
  [BillStatus.OVERDUE]: '#f87171',
};

export const ESTIMATE_STATUS_COLORS: Record<EstimateStatus, string> = {
  [EstimateStatus.DRAFT]: '#94a3b8',
  [EstimateStatus.SENT]: '#60a5fa',
  [EstimateStatus.ACCEPTED]: '#34d399',
  [EstimateStatus.DECLINED]: '#f87171',
  [EstimateStatus.INVOICED]: '#a78bfa',
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  [ItemType.PRODUCT]: 'Product',
  [ItemType.SERVICE]: 'Service',
  [ItemType.DIGITAL]: 'Digital',
};

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  [ContactType.CUSTOMER]: 'Customer',
  [ContactType.VENDOR]: 'Vendor',
  [ContactType.BOTH]: 'Customer & Vendor',
};

/** Document prefix for auto-numbering */
export const DOCUMENT_PREFIX = {
  ESTIMATE: 'EST',
  SALES_ORDER: 'SO',
  INVOICE: 'INV',
  CREDIT_NOTE: 'CN',
  PURCHASE_ORDER: 'PO',
  BILL: 'BILL',
  VENDOR_CREDIT: 'VC',
  PAYMENT_RECEIVED: 'PR',
  PAYMENT_MADE: 'PM',
  EXPENSE: 'EXP',
  PROJECT: 'PRJ',
} as const;

/** Default base currency */
export const BASE_CURRENCY = 'INR';

/** Normal balance directions for account types */
export const NORMAL_BALANCE: Record<AccountType, 'DEBIT' | 'CREDIT'> = {
  [AccountType.ASSET]: 'DEBIT',
  [AccountType.LIABILITY]: 'CREDIT',
  [AccountType.EQUITY]: 'CREDIT',
  [AccountType.REVENUE]: 'CREDIT',
  [AccountType.EXPENSE]: 'DEBIT',
};
