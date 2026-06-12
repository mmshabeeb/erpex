export declare enum AccountType {
    ASSET = "ASSET",
    LIABILITY = "LIABILITY",
    EQUITY = "EQUITY",
    REVENUE = "REVENUE",
    EXPENSE = "EXPENSE"
}
export declare enum VoucherType {
    JOURNAL = "JOURNAL",
    CONTRA = "CONTRA",
    PAYMENT = "PAYMENT",
    RECEIPT = "RECEIPT",
    SALES = "SALES",
    PURCHASE = "PURCHASE"
}
export declare enum VoucherStatus {
    DRAFT = "DRAFT",
    POSTED = "POSTED"
}
export declare enum TaxType {
    GST = "GST",
    VAT = "VAT",
    SALES_TAX = "SALES_TAX",
    CUSTOM = "CUSTOM"
}
export declare enum ItemType {
    PRODUCT = "PRODUCT",
    SERVICE = "SERVICE",
    DIGITAL = "DIGITAL"
}
export declare enum ContactType {
    CUSTOMER = "CUSTOMER",
    VENDOR = "VENDOR",
    BOTH = "BOTH"
}
export declare enum EstimateStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    ACCEPTED = "ACCEPTED",
    DECLINED = "DECLINED",
    INVOICED = "INVOICED"
}
export declare enum SalesOrderStatus {
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    FULFILLED = "FULFILLED",
    CANCELLED = "CANCELLED"
}
export declare enum InvoiceStatus {
    DRAFT = "DRAFT",
    SENT = "SENT",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE",
    VOID = "VOID"
}
export declare enum PurchaseOrderStatus {
    DRAFT = "DRAFT",
    ISSUED = "ISSUED",
    PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
    RECEIVED = "RECEIVED",
    CANCELLED = "CANCELLED"
}
export declare enum BillStatus {
    DRAFT = "DRAFT",
    RECEIVED = "RECEIVED",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
    OVERDUE = "OVERDUE"
}
export declare enum ProjectStatus {
    ACTIVE = "ACTIVE",
    COMPLETED = "COMPLETED",
    ON_HOLD = "ON_HOLD",
    CANCELLED = "CANCELLED"
}
export declare enum ProjectBillingMethod {
    FIXED = "FIXED",
    PROJECT_HOURLY = "PROJECT_HOURLY",
    TASK_HOURLY = "TASK_HOURLY"
}
export declare enum TimesheetApproval {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    BANK_TRANSFER = "BANK_TRANSFER",
    CHEQUE = "CHEQUE",
    CREDIT_CARD = "CREDIT_CARD",
    UPI = "UPI",
    CARD = "CARD"
}
export declare enum InventoryMovementType {
    IN = "IN",
    OUT = "OUT",
    ADJUST = "ADJUST"
}
export declare enum RecurringInterval {
    WEEK = "WEEK",
    MONTH = "MONTH",
    YEAR = "YEAR"
}
export declare const ACCOUNT_TYPE_LABELS: Record<AccountType, string>;
export declare const ACCOUNT_TYPE_COLORS: Record<AccountType, string>;
export declare const VOUCHER_TYPE_PREFIX: Record<VoucherType, string>;
export declare const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string>;
export declare const BILL_STATUS_COLORS: Record<BillStatus, string>;
export declare const ESTIMATE_STATUS_COLORS: Record<EstimateStatus, string>;
export declare const ITEM_TYPE_LABELS: Record<ItemType, string>;
export declare const CONTACT_TYPE_LABELS: Record<ContactType, string>;
/** Document prefix for auto-numbering */
export declare const DOCUMENT_PREFIX: {
    readonly ESTIMATE: "EST";
    readonly SALES_ORDER: "SO";
    readonly INVOICE: "INV";
    readonly CREDIT_NOTE: "CN";
    readonly PURCHASE_ORDER: "PO";
    readonly BILL: "BILL";
    readonly VENDOR_CREDIT: "VC";
    readonly PAYMENT_RECEIVED: "PR";
    readonly PAYMENT_MADE: "PM";
    readonly EXPENSE: "EXP";
    readonly PROJECT: "PRJ";
};
/** Default base currency */
export declare const BASE_CURRENCY = "INR";
/** Normal balance directions for account types */
export declare const NORMAL_BALANCE: Record<AccountType, 'DEBIT' | 'CREDIT'>;
//# sourceMappingURL=index.d.ts.map