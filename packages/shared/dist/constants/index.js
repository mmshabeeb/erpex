// ============================================================
// ERPEX — Shared Constants (Full ERP)
// Enums and constant values used across frontend and backend
// ============================================================
export var AccountType;
(function (AccountType) {
    AccountType["ASSET"] = "ASSET";
    AccountType["LIABILITY"] = "LIABILITY";
    AccountType["EQUITY"] = "EQUITY";
    AccountType["REVENUE"] = "REVENUE";
    AccountType["EXPENSE"] = "EXPENSE";
})(AccountType || (AccountType = {}));
export var VoucherType;
(function (VoucherType) {
    VoucherType["JOURNAL"] = "JOURNAL";
    VoucherType["CONTRA"] = "CONTRA";
    VoucherType["PAYMENT"] = "PAYMENT";
    VoucherType["RECEIPT"] = "RECEIPT";
    VoucherType["SALES"] = "SALES";
    VoucherType["PURCHASE"] = "PURCHASE";
})(VoucherType || (VoucherType = {}));
export var VoucherStatus;
(function (VoucherStatus) {
    VoucherStatus["DRAFT"] = "DRAFT";
    VoucherStatus["POSTED"] = "POSTED";
})(VoucherStatus || (VoucherStatus = {}));
export var TaxType;
(function (TaxType) {
    TaxType["GST"] = "GST";
    TaxType["VAT"] = "VAT";
    TaxType["SALES_TAX"] = "SALES_TAX";
    TaxType["CUSTOM"] = "CUSTOM";
})(TaxType || (TaxType = {}));
// ─── NEW: Item Types ────────────────────────────────────────
export var ItemType;
(function (ItemType) {
    ItemType["PRODUCT"] = "PRODUCT";
    ItemType["SERVICE"] = "SERVICE";
    ItemType["DIGITAL"] = "DIGITAL";
})(ItemType || (ItemType = {}));
// ─── NEW: Contact Types ─────────────────────────────────────
export var ContactType;
(function (ContactType) {
    ContactType["CUSTOMER"] = "CUSTOMER";
    ContactType["VENDOR"] = "VENDOR";
    ContactType["BOTH"] = "BOTH";
})(ContactType || (ContactType = {}));
// ─── NEW: Document Status Enums ─────────────────────────────
export var EstimateStatus;
(function (EstimateStatus) {
    EstimateStatus["DRAFT"] = "DRAFT";
    EstimateStatus["SENT"] = "SENT";
    EstimateStatus["ACCEPTED"] = "ACCEPTED";
    EstimateStatus["DECLINED"] = "DECLINED";
    EstimateStatus["INVOICED"] = "INVOICED";
})(EstimateStatus || (EstimateStatus = {}));
export var SalesOrderStatus;
(function (SalesOrderStatus) {
    SalesOrderStatus["DRAFT"] = "DRAFT";
    SalesOrderStatus["CONFIRMED"] = "CONFIRMED";
    SalesOrderStatus["FULFILLED"] = "FULFILLED";
    SalesOrderStatus["CANCELLED"] = "CANCELLED";
})(SalesOrderStatus || (SalesOrderStatus = {}));
export var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["SENT"] = "SENT";
    InvoiceStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
    InvoiceStatus["VOID"] = "VOID";
})(InvoiceStatus || (InvoiceStatus = {}));
export var PurchaseOrderStatus;
(function (PurchaseOrderStatus) {
    PurchaseOrderStatus["DRAFT"] = "DRAFT";
    PurchaseOrderStatus["ISSUED"] = "ISSUED";
    PurchaseOrderStatus["PARTIALLY_RECEIVED"] = "PARTIALLY_RECEIVED";
    PurchaseOrderStatus["RECEIVED"] = "RECEIVED";
    PurchaseOrderStatus["CANCELLED"] = "CANCELLED";
})(PurchaseOrderStatus || (PurchaseOrderStatus = {}));
export var BillStatus;
(function (BillStatus) {
    BillStatus["DRAFT"] = "DRAFT";
    BillStatus["RECEIVED"] = "RECEIVED";
    BillStatus["PARTIALLY_PAID"] = "PARTIALLY_PAID";
    BillStatus["PAID"] = "PAID";
    BillStatus["OVERDUE"] = "OVERDUE";
})(BillStatus || (BillStatus = {}));
export var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["ACTIVE"] = "ACTIVE";
    ProjectStatus["COMPLETED"] = "COMPLETED";
    ProjectStatus["ON_HOLD"] = "ON_HOLD";
    ProjectStatus["CANCELLED"] = "CANCELLED";
})(ProjectStatus || (ProjectStatus = {}));
export var ProjectBillingMethod;
(function (ProjectBillingMethod) {
    ProjectBillingMethod["FIXED"] = "FIXED";
    ProjectBillingMethod["PROJECT_HOURLY"] = "PROJECT_HOURLY";
    ProjectBillingMethod["TASK_HOURLY"] = "TASK_HOURLY";
})(ProjectBillingMethod || (ProjectBillingMethod = {}));
export var TimesheetApproval;
(function (TimesheetApproval) {
    TimesheetApproval["PENDING"] = "PENDING";
    TimesheetApproval["APPROVED"] = "APPROVED";
    TimesheetApproval["REJECTED"] = "REJECTED";
})(TimesheetApproval || (TimesheetApproval = {}));
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["BANK_TRANSFER"] = "BANK_TRANSFER";
    PaymentMethod["CHEQUE"] = "CHEQUE";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["UPI"] = "UPI";
    PaymentMethod["CARD"] = "CARD";
})(PaymentMethod || (PaymentMethod = {}));
export var InventoryMovementType;
(function (InventoryMovementType) {
    InventoryMovementType["IN"] = "IN";
    InventoryMovementType["OUT"] = "OUT";
    InventoryMovementType["ADJUST"] = "ADJUST";
})(InventoryMovementType || (InventoryMovementType = {}));
export var RecurringInterval;
(function (RecurringInterval) {
    RecurringInterval["WEEK"] = "WEEK";
    RecurringInterval["MONTH"] = "MONTH";
    RecurringInterval["YEAR"] = "YEAR";
})(RecurringInterval || (RecurringInterval = {}));
// ─── Labels ─────────────────────────────────────────────────
export const ACCOUNT_TYPE_LABELS = {
    [AccountType.ASSET]: 'Assets',
    [AccountType.LIABILITY]: 'Liabilities',
    [AccountType.EQUITY]: 'Equity',
    [AccountType.REVENUE]: 'Revenue',
    [AccountType.EXPENSE]: 'Expenses',
};
export const ACCOUNT_TYPE_COLORS = {
    [AccountType.ASSET]: '#60a5fa',
    [AccountType.LIABILITY]: '#fb923c',
    [AccountType.EQUITY]: '#a78bfa',
    [AccountType.REVENUE]: '#34d399',
    [AccountType.EXPENSE]: '#f87171',
};
export const VOUCHER_TYPE_PREFIX = {
    [VoucherType.JOURNAL]: 'JV',
    [VoucherType.CONTRA]: 'CT',
    [VoucherType.PAYMENT]: 'PV',
    [VoucherType.RECEIPT]: 'RV',
    [VoucherType.SALES]: 'SV',
    [VoucherType.PURCHASE]: 'PU',
};
export const INVOICE_STATUS_COLORS = {
    [InvoiceStatus.DRAFT]: '#94a3b8',
    [InvoiceStatus.SENT]: '#60a5fa',
    [InvoiceStatus.PARTIALLY_PAID]: '#fbbf24',
    [InvoiceStatus.PAID]: '#34d399',
    [InvoiceStatus.OVERDUE]: '#f87171',
    [InvoiceStatus.VOID]: '#6b7280',
};
export const BILL_STATUS_COLORS = {
    [BillStatus.DRAFT]: '#94a3b8',
    [BillStatus.RECEIVED]: '#60a5fa',
    [BillStatus.PARTIALLY_PAID]: '#fbbf24',
    [BillStatus.PAID]: '#34d399',
    [BillStatus.OVERDUE]: '#f87171',
};
export const ESTIMATE_STATUS_COLORS = {
    [EstimateStatus.DRAFT]: '#94a3b8',
    [EstimateStatus.SENT]: '#60a5fa',
    [EstimateStatus.ACCEPTED]: '#34d399',
    [EstimateStatus.DECLINED]: '#f87171',
    [EstimateStatus.INVOICED]: '#a78bfa',
};
export const ITEM_TYPE_LABELS = {
    [ItemType.PRODUCT]: 'Product',
    [ItemType.SERVICE]: 'Service',
    [ItemType.DIGITAL]: 'Digital',
};
export const CONTACT_TYPE_LABELS = {
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
};
/** Default base currency */
export const BASE_CURRENCY = 'INR';
/** Normal balance directions for account types */
export const NORMAL_BALANCE = {
    [AccountType.ASSET]: 'DEBIT',
    [AccountType.LIABILITY]: 'CREDIT',
    [AccountType.EQUITY]: 'CREDIT',
    [AccountType.REVENUE]: 'CREDIT',
    [AccountType.EXPENSE]: 'DEBIT',
};
//# sourceMappingURL=index.js.map