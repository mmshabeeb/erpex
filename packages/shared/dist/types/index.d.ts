import { AccountType, VoucherType, VoucherStatus, TaxType, ItemType, ContactType, EstimateStatus, SalesOrderStatus, InvoiceStatus, PurchaseOrderStatus, BillStatus, ProjectStatus, ProjectBillingMethod, TimesheetApproval, PaymentMethod, InventoryMovementType } from '../constants/index.js';
export interface IBranch {
    id: string;
    name: string;
    code: string;
    address: string | null;
    phone: string | null;
    isActive: boolean;
    createdAt: string;
}
export interface ICreateBranchPayload {
    name: string;
    code: string;
    address?: string;
    phone?: string;
}
export interface IAccount {
    id: string;
    code: string;
    name: string;
    type: AccountType;
    parentId: string | null;
    parent?: IAccount | null;
    children?: IAccount[];
    isActive: boolean;
    isCashOrBank: boolean;
    description: string | null;
    branchId: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface IAccountTreeNode extends IAccount {
    children: IAccountTreeNode[];
    depth: number;
}
export interface ICreateAccountPayload {
    code: string;
    name: string;
    type: AccountType;
    parentId?: string | null;
    isCashOrBank?: boolean;
    description?: string;
    branchId?: string;
}
export interface IUpdateAccountPayload {
    name?: string;
    parentId?: string | null;
    isActive?: boolean;
    isCashOrBank?: boolean;
    description?: string;
}
export interface IJournalEntry {
    id: string;
    voucherNo: string;
    date: string;
    type: VoucherType;
    status: VoucherStatus;
    narration: string | null;
    currencyCode: string;
    exchangeRate: number;
    fiscalYearId: string | null;
    branchId: string | null;
    rectifiesId: string | null;
    createdBy: string | null;
    createdAt: string;
    items: IJournalItem[];
    totalDebit: number;
    totalCredit: number;
}
export interface IJournalItem {
    id: string;
    journalEntryId: string;
    accountId: string;
    account?: IAccount;
    debit: number;
    credit: number;
    narration: string | null;
    taxConfigId: string | null;
}
export interface ICreateJournalPayload {
    date: string;
    type: VoucherType;
    status?: VoucherStatus;
    narration?: string;
    currencyCode?: string;
    exchangeRate?: number;
    branchId?: string;
    items: ICreateJournalItemPayload[];
}
export interface ICreateJournalItemPayload {
    accountId: string;
    debit: number;
    credit: number;
    narration?: string;
    taxConfigId?: string;
}
export interface ICreateContraPayload {
    date: string;
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    narration?: string;
}
export interface ILedgerEntry {
    date: string;
    voucherNo: string;
    journalEntryId: string;
    narration: string | null;
    debit: number;
    credit: number;
    runningBalance: number;
}
export interface ILedgerResponse {
    account: IAccount;
    entries: ILedgerEntry[];
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
}
export interface IBudget {
    id: string;
    name: string;
    fiscalYearId: string;
    accountId: string;
    account?: IAccount;
    month: number;
    year: number;
    amount: number;
}
export interface ICreateBudgetPayload {
    name: string;
    fiscalYearId: string;
    accountId: string;
    month: number;
    year: number;
    amount: number;
}
export interface IBudgetVsActual {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    month: number;
    year: number;
    budgetAmount: number;
    actualAmount: number;
    variance: number;
    variancePercent: number;
}
export interface IItemGroup {
    id: string;
    name: string;
    description: string | null;
    parentId: string | null;
    children?: IItemGroup[];
}
export interface IItem {
    id: string;
    name: string;
    sku: string;
    type: ItemType;
    description: string | null;
    unit: string;
    barcode: string | null;
    groupId: string | null;
    group?: IItemGroup;
    purchasePrice: number;
    sellingPrice: number;
    taxConfigId: string | null;
    purchaseAccountId: string | null;
    salesAccountId: string | null;
    cogsAccountId: string | null;
    inventoryAccountId: string | null;
    reorderLevel: number;
    isActive: boolean;
    stockOnHand?: number;
    committedStock?: number;
    availableStock?: number;
}
export interface ICreateItemPayload {
    name: string;
    sku: string;
    type: ItemType;
    description?: string;
    unit?: string;
    barcode?: string;
    groupId?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    taxConfigId?: string;
    purchaseAccountId?: string;
    salesAccountId?: string;
    cogsAccountId?: string;
    inventoryAccountId?: string;
    reorderLevel?: number;
}
export interface IInventoryMovement {
    id: string;
    itemId: string;
    item?: IItem;
    date: string;
    type: InventoryMovementType;
    qty: number;
    unitCost: number;
    totalCost: number;
    reference: string | null;
    sourceType: string | null;
    sourceId: string | null;
    remainingQty: number;
}
export interface IStockSummary {
    itemId: string;
    itemName: string;
    sku: string;
    stockOnHand: number;
    committedStock: number;
    availableStock: number;
    avgCost: number;
    totalValue: number;
    reorderLevel: number;
    isLowStock: boolean;
}
export interface IPriceList {
    id: string;
    name: string;
    description: string | null;
    currencyCode: string;
    isPercentage: boolean;
    effectiveFrom: string | null;
    effectiveTo: string | null;
    isActive: boolean;
    items?: IPriceListItem[];
}
export interface IPriceListItem {
    id: string;
    priceListId: string;
    itemId: string;
    item?: IItem;
    rate: number;
    minQty: number;
}
export interface IContact {
    id: string;
    name: string;
    type: ContactType;
    email: string | null;
    phone: string | null;
    companyName: string | null;
    taxId: string | null;
    creditTermDays: number;
    creditLimit: number | null;
    priceListId: string | null;
    branchId: string | null;
    notes: string | null;
    isActive: boolean;
    addresses?: IContactAddress[];
    outstandingBalance?: number;
    overdueAmount?: number;
}
export interface IContactAddress {
    id: string;
    contactId: string;
    type: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postalCode: string | null;
    country: string;
}
export interface ICreateContactPayload {
    name: string;
    type: ContactType;
    email?: string;
    phone?: string;
    companyName?: string;
    taxId?: string;
    creditTermDays?: number;
    creditLimit?: number;
    priceListId?: string;
    branchId?: string;
    notes?: string;
    addresses?: Omit<IContactAddress, 'id' | 'contactId'>[];
}
export interface IDocumentLine {
    id?: string;
    itemId?: string;
    item?: IItem;
    description: string;
    qty: number;
    rate: number;
    taxConfigId?: string;
    taxAmount: number;
    amount: number;
    sortOrder?: number;
}
export interface IEstimate {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    date: string;
    expiryDate: string | null;
    status: EstimateStatus;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    notes: string | null;
    termsConditions: string | null;
    lines: IDocumentLine[];
}
export interface ICreateEstimatePayload {
    contactId: string;
    date: string;
    expiryDate?: string;
    notes?: string;
    termsConditions?: string;
    discount?: number;
    lines: Omit<IDocumentLine, 'id' | 'item'>[];
}
export interface ISalesOrder {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    estimateId: string | null;
    date: string;
    expectedShipDate: string | null;
    status: SalesOrderStatus;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    notes: string | null;
    lines: IDocumentLine[];
}
export interface ICreateSalesOrderPayload {
    contactId: string;
    estimateId?: string;
    date: string;
    expectedShipDate?: string;
    notes?: string;
    discount?: number;
    lines: Omit<IDocumentLine, 'id' | 'item'>[];
}
export interface IInvoice {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    salesOrderId: string | null;
    estimateId: string | null;
    branchId: string | null;
    date: string;
    dueDate: string;
    status: InvoiceStatus;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    notes: string | null;
    termsConditions: string | null;
    journalEntryId: string | null;
    lines: IDocumentLine[];
}
export interface ICreateInvoicePayload {
    contactId: string;
    salesOrderId?: string;
    estimateId?: string;
    branchId?: string;
    date: string;
    dueDate: string;
    notes?: string;
    termsConditions?: string;
    discount?: number;
    lines: Omit<IDocumentLine, 'id' | 'item'>[];
}
export interface IPaymentReceived {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNo: string | null;
    bankAccountId: string | null;
    notes: string | null;
    allocations: IPaymentAllocation[];
}
export interface IPaymentAllocation {
    id?: string;
    invoiceId: string;
    invoice?: IInvoice;
    amount: number;
}
export interface ICreatePaymentReceivedPayload {
    contactId: string;
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNo?: string;
    bankAccountId?: string;
    notes?: string;
    allocations: {
        invoiceId: string;
        amount: number;
    }[];
}
export interface ICreditNote {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    invoiceId: string | null;
    date: string;
    reason: string | null;
    subtotal: number;
    taxTotal: number;
    total: number;
    balanceRemaining: number;
    lines: IDocumentLine[];
}
export interface ICreateCreditNotePayload {
    contactId: string;
    invoiceId?: string;
    date: string;
    reason?: string;
    lines: Omit<IDocumentLine, 'id' | 'item'>[];
}
export interface IPurchaseOrder {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    date: string;
    expectedDelivery: string | null;
    status: PurchaseOrderStatus;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    notes: string | null;
    lines: IPurchaseOrderLine[];
}
export interface IPurchaseOrderLine extends IDocumentLine {
    receivedQty: number;
}
export interface ICreatePurchaseOrderPayload {
    contactId: string;
    date: string;
    expectedDelivery?: string;
    notes?: string;
    discount?: number;
    lines: Omit<IDocumentLine, 'id' | 'item'>[];
}
export interface IBill {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    purchaseOrderId: string | null;
    branchId: string | null;
    billNo: string | null;
    date: string;
    dueDate: string;
    status: BillStatus;
    subtotal: number;
    taxTotal: number;
    discount: number;
    total: number;
    amountPaid: number;
    amountDue: number;
    notes: string | null;
    lines: IDocumentLine[];
}
export interface ICreateBillPayload {
    contactId: string;
    purchaseOrderId?: string;
    branchId?: string;
    billNo?: string;
    date: string;
    dueDate: string;
    notes?: string;
    discount?: number;
    lines: Omit<IDocumentLine, 'id' | 'item'>[];
}
export interface IExpense {
    id: string;
    date: string;
    accountId: string;
    account?: IAccount;
    contactId: string | null;
    contact?: IContact;
    amount: number;
    taxAmount: number;
    paymentMethod: PaymentMethod;
    description: string;
    referenceNo: string | null;
    isBillable: boolean;
    billableContactId: string | null;
    isBilled: boolean;
    category: string | null;
    receiptUrl: string | null;
}
export interface ICreateExpensePayload {
    date: string;
    accountId: string;
    contactId?: string;
    amount: number;
    taxConfigId?: string;
    paymentMethod: PaymentMethod;
    description: string;
    referenceNo?: string;
    isBillable?: boolean;
    billableContactId?: string;
    category?: string;
}
export interface IPaymentMade {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNo: string | null;
    bankAccountId: string | null;
    notes: string | null;
    allocations: IPaymentMadeAllocation[];
}
export interface IPaymentMadeAllocation {
    id?: string;
    billId: string;
    bill?: IBill;
    amount: number;
}
export interface ICreatePaymentMadePayload {
    contactId: string;
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    referenceNo?: string;
    bankAccountId?: string;
    notes?: string;
    allocations: {
        billId: string;
        amount: number;
    }[];
}
export interface IVendorCredit {
    id: string;
    number: string;
    contactId: string;
    contact?: IContact;
    date: string;
    reason: string | null;
    subtotal: number;
    taxTotal: number;
    total: number;
    balanceRemaining: number;
    lines: IDocumentLine[];
}
export interface ICreateVendorCreditPayload {
    contactId: string;
    date: string;
    reason?: string;
    lines: Omit<IDocumentLine, 'id' | 'item'>[];
}
export interface IProject {
    id: string;
    name: string;
    contactId: string | null;
    contact?: IContact;
    branchId: string | null;
    billingMethod: ProjectBillingMethod;
    budget: number;
    costToDate: number;
    status: ProjectStatus;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
    tasks?: IProjectTask[];
    totalHours?: number;
    billableHours?: number;
    profitMargin?: number;
}
export interface IProjectTask {
    id: string;
    projectId: string;
    name: string;
    description: string | null;
    assignee: string | null;
    hourlyRate: number;
    budgetHours: number;
    loggedHours: number;
    status: string;
    sortOrder: number;
}
export interface ICreateProjectPayload {
    name: string;
    contactId?: string;
    branchId?: string;
    billingMethod?: ProjectBillingMethod;
    budget?: number;
    startDate?: string;
    endDate?: string;
    description?: string;
    tasks?: Omit<IProjectTask, 'id' | 'projectId' | 'loggedHours'>[];
}
export interface ITimesheet {
    id: string;
    projectId: string;
    project?: IProject;
    taskId: string | null;
    task?: IProjectTask;
    userId: string | null;
    date: string;
    hours: number;
    description: string | null;
    isBillable: boolean;
    approvalStatus: TimesheetApproval;
    hourlyRate: number;
    totalAmount: number;
}
export interface ICreateTimesheetPayload {
    projectId: string;
    taskId?: string;
    date: string;
    hours: number;
    description?: string;
    isBillable?: boolean;
    hourlyRate?: number;
}
export interface ICashBookEntry {
    date: string;
    voucherNo: string;
    journalEntryId: string;
    counterAccount: string;
    narration: string | null;
    receipt: number;
    payment: number;
    balance: number;
}
export interface IDayBookEntry {
    date: string;
    voucherNo: string;
    journalEntryId: string;
    type: VoucherType;
    status: VoucherStatus;
    narration: string | null;
    totalDebit: number;
    totalCredit: number;
    createdBy: string | null;
    items: IJournalItem[];
}
export interface IBankStatement {
    id: string;
    accountId: string;
    fileName: string;
    uploadedAt: string;
    periodStart: string;
    periodEnd: string;
    lines: IBankStatementLine[];
}
export interface IBankStatementLine {
    id: string;
    statementId: string;
    date: string;
    description: string;
    reference: string | null;
    debit: number;
    credit: number;
    balance: number | null;
    isReconciled: boolean;
    matchedItemId: string | null;
    reconciledAt: string | null;
}
export interface IReconciliationView {
    bankAccount: IAccount;
    systemEntries: ILedgerEntry[];
    statementLines: IBankStatementLine[];
    suggestedMatches: IReconciliationMatch[];
    summary: IReconciliationSummary;
}
export interface IReconciliationMatch {
    systemEntryId: string;
    statementLineId: string;
    confidence: number;
    matchReason: string;
}
export interface IReconciliationSummary {
    openingBalance: number;
    closingBalancePerBooks: number;
    closingBalancePerBank: number;
    totalMatched: number;
    unmatchedSystem: number;
    unmatchedBank: number;
}
export interface ITaxConfig {
    id: string;
    name: string;
    taxType: TaxType;
    rate: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    accountId: string;
    account?: IAccount;
    isActive: boolean;
    createdAt: string;
}
export interface ICreateTaxConfigPayload {
    name: string;
    taxType: TaxType;
    rate: number;
    effectiveFrom: string;
    effectiveTo?: string;
    accountId: string;
}
export interface ITaxReportEntry {
    taxConfig: ITaxConfig;
    grossAmount: number;
    taxableValue: number;
    taxCollected: number;
    taxPaid: number;
    netPayable: number;
}
export interface ITrialBalanceRow {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    openingBalance: number;
    debitMovement: number;
    creditMovement: number;
    closingBalance: number;
}
export interface ITrialBalance {
    asOfDate: string;
    rows: ITrialBalanceRow[];
    totalOpeningDebit: number;
    totalOpeningCredit: number;
    totalDebitMovement: number;
    totalCreditMovement: number;
    totalClosingDebit: number;
    totalClosingCredit: number;
    isBalanced: boolean;
}
export interface IProfitLossSection {
    label: string;
    accounts: IProfitLossRow[];
    total: number;
}
export interface IProfitLossRow {
    accountId: string;
    accountCode: string;
    accountName: string;
    amount: number;
    children?: IProfitLossRow[];
}
export interface IProfitLoss {
    periodStart: string;
    periodEnd: string;
    revenue: IProfitLossSection;
    costOfGoodsSold: IProfitLossSection;
    grossProfit: number;
    otherIncome: IProfitLossSection;
    operatingExpenses: IProfitLossSection;
    netProfit: number;
}
export interface IBalanceSheetSection {
    label: string;
    accounts: IBalanceSheetRow[];
    total: number;
}
export interface IBalanceSheetRow {
    accountId: string;
    accountCode: string;
    accountName: string;
    amount: number;
    children?: IBalanceSheetRow[];
}
export interface IBalanceSheet {
    asOfDate: string;
    currentAssets: IBalanceSheetSection;
    nonCurrentAssets: IBalanceSheetSection;
    totalAssets: number;
    currentLiabilities: IBalanceSheetSection;
    nonCurrentLiabilities: IBalanceSheetSection;
    totalLiabilities: number;
    equity: IBalanceSheetSection;
    retainedEarnings: number;
    totalEquity: number;
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
}
export interface IAgingBucket {
    contactId: string;
    contactName: string;
    current: number;
    days31to60: number;
    days61to90: number;
    over90: number;
    total: number;
}
export interface IAgingReport {
    type: 'receivable' | 'payable';
    asOfDate: string;
    buckets: IAgingBucket[];
    totals: {
        current: number;
        days31to60: number;
        days61to90: number;
        over90: number;
        total: number;
    };
}
export interface ICashFlowSection {
    label: string;
    items: {
        description: string;
        amount: number;
    }[];
    total: number;
}
export interface ICashFlowStatement {
    periodStart: string;
    periodEnd: string;
    operating: ICashFlowSection;
    investing: ICashFlowSection;
    financing: ICashFlowSection;
    netChange: number;
    openingCash: number;
    closingCash: number;
}
export interface IFiscalYear {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    createdAt: string;
    periods: IFiscalPeriod[];
}
export interface IFiscalPeriod {
    id: string;
    fiscalYearId: string;
    month: number;
    year: number;
    startDate: string;
    endDate: string;
    isLocked: boolean;
}
export interface ICreateFiscalYearPayload {
    name: string;
    startDate: string;
    endDate: string;
}
export interface ICurrencyRate {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    effectiveDate: string;
}
export interface IAuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: string;
    oldValue: unknown;
    newValue: unknown;
    userId: string | null;
    ipAddress: string | null;
    createdAt: string;
}
export interface INotification {
    id: string;
    userId: string | null;
    title: string;
    message: string;
    type: string;
    entityType: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: string;
}
export interface IApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}
export interface IApiListResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}
export interface IApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}
export interface IDateRangeFilter {
    startDate?: string;
    endDate?: string;
}
export interface IJournalFilter extends IDateRangeFilter {
    type?: VoucherType;
    status?: VoucherStatus;
    search?: string;
    page?: number;
    pageSize?: number;
}
export interface ICashBookFilter extends IDateRangeFilter {
    voucherType?: VoucherType;
}
export interface IDayBookFilter extends IDateRangeFilter {
    voucherType?: VoucherType;
    createdBy?: string;
    status?: VoucherStatus;
}
export interface IPaginationFilter {
    page?: number;
    pageSize?: number;
    search?: string;
}
export interface IContactFilter extends IPaginationFilter {
    type?: ContactType;
}
export interface IInvoiceFilter extends IPaginationFilter, IDateRangeFilter {
    contactId?: string;
    status?: InvoiceStatus;
}
export interface IBillFilter extends IPaginationFilter, IDateRangeFilter {
    contactId?: string;
    status?: BillStatus;
}
export interface IItemFilter extends IPaginationFilter {
    type?: ItemType;
    groupId?: string;
}
//# sourceMappingURL=index.d.ts.map