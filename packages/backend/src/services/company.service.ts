// ============================================================
// ERPEX — Company Service
// Company creation with full auto-provisioning
// COA, GST Ledgers, Tax Configs, Fiscal Year, Sample Data
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── India State Codes ──────────────────────────────────────

const INDIA_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands', '36': 'Telangana',
  '37': 'Andhra Pradesh', '38': 'Ladakh',
};

// ─── GSTIN Validation ───────────────────────────────────────

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

function validateGSTIN(gstin: string): { valid: boolean; stateCode?: string; pan?: string; error?: string } {
  if (!GSTIN_REGEX.test(gstin)) {
    return { valid: false, error: 'Invalid GSTIN format. Must match pattern: 2-digit state + 10-char PAN + entity + Z + check' };
  }
  const stateCode = gstin.substring(0, 2);
  if (!INDIA_STATES[stateCode]) {
    return { valid: false, error: `Invalid state code: ${stateCode}` };
  }
  const pan = gstin.substring(2, 12);
  return { valid: true, stateCode, pan };
}

// ─── Slug Generator ─────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}

// ─── Create Company (Full Provisioning) ─────────────────────

interface CreateCompanyInput {
  name: string;
  legalName?: string;
  industry?: string;
  registrationNo?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
  pan?: string;
  gstin?: string;
  currency?: string;
  currencySymbol?: string;
  numberFormat?: string;
  fiscalYearStart?: number;
  phone?: string;
  email?: string;
  website?: string;
  annualTurnover?: number;
  // Admin user for this company
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
  // Plan
  planId?: string;
}

async function createCompany(input: CreateCompanyInput) {
  // 1. Validate GSTIN if India
  let stateCode: string | undefined = undefined;
  if (input.country === 'India' && input.gstin) {
    const gstinResult = validateGSTIN(input.gstin);
    if (!gstinResult.valid) {
      throw new Error(gstinResult.error!);
    }
    stateCode = gstinResult.stateCode;
    // Auto-set PAN from GSTIN if not provided
    if (!input.pan) input.pan = gstinResult.pan;
  }

  // 2. Generate unique slug
  let slug = generateSlug(input.name);
  const existingSlug = await prisma.company.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  // 3. Set defaults for India
  const isIndia = input.country === 'India';
  const currency = input.currency || (isIndia ? 'INR' : 'USD');
  const currencySymbol = input.currencySymbol || (isIndia ? '₹' : '$');
  const numberFormat = input.numberFormat || (isIndia ? 'INDIAN' : 'INTERNATIONAL');
  const fiscalYearStart = input.fiscalYearStart || (isIndia ? 4 : 1); // April for India

  // 4. Create company record
  const company = await prisma.company.create({
    data: {
      name: input.name,
      legalName: input.legalName || input.name,
      slug,
      industry: input.industry,
      registrationNo: input.registrationNo,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      pan: input.pan,
      gstin: input.gstin,
      stateCode,
      currency,
      currencySymbol,
      numberFormat,
      fiscalYearStart,
      phone: input.phone,
      email: input.email,
      website: input.website,
      annualTurnover: input.annualTurnover,
    },
  });

  // 5. Create admin user
  const adminPassword = input.adminPassword || generateRandomPassword();
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: input.adminName,
      email: input.adminEmail,
      passwordHash,
      role: 'OWNER',
    },
  });

  // 6. Create default branch
  await prisma.branch.create({
    data: {
      companyId: company.id,
      name: 'Head Office',
      code: 'HO',
      address: [input.addressLine1, input.city, input.state].filter(Boolean).join(', '),
      gstin: input.gstin,
      stateCode,
    },
  });

  // 7. Provision Chart of Accounts
  const accountIds = await provisionChartOfAccounts(company.id, isIndia);

  // 8. Create Tax Configs (GST for India)
  if (isIndia) {
    await provisionGSTTaxConfigs(company.id, accountIds);
    await provisionTDSSections(company.id);
    await provisionGSTConfig(company.id, accountIds);
  }

  // 9. Create Fiscal Year
  await provisionFiscalYear(company.id, fiscalYearStart);

  // 10. Create sample journal entries
  await provisionSampleData(company.id, accountIds);

  // 11. Assign subscription plan
  if (input.planId) {
    await prisma.companySubscription.create({
      data: {
        companyId: company.id,
        planId: input.planId,
        startDate: new Date(),
      },
    });
  }

  return {
    company,
    admin: {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      password: adminPassword, // Return plaintext for display only
      role: adminUser.role,
    },
    slug: company.slug,
  };
}

// ─── Chart of Accounts Provisioning ─────────────────────────

async function provisionChartOfAccounts(companyId: string, isIndia: boolean) {
  const ids: Record<string, string> = {};

  // Helper to create account and track its ID
  async function createAcct(code: string, name: string, type: string, parentKey?: string, opts?: { isCashOrBank?: boolean; isSystem?: boolean }) {
    const acc = await prisma.account.create({
      data: {
        companyId,
        code,
        name,
        type,
        parentId: parentKey ? ids[parentKey] : undefined,
        isCashOrBank: opts?.isCashOrBank || false,
        isSystemAccount: opts?.isSystem || false,
      },
    });
    ids[code] = acc.id;
    return acc;
  }

  // ── Top-level parents
  await createAcct('10000', 'Assets', 'ASSET');
  await createAcct('20000', 'Liabilities', 'LIABILITY');
  await createAcct('30000', 'Equity', 'EQUITY');
  await createAcct('40000', 'Revenue', 'REVENUE');
  await createAcct('50000', 'Expenses', 'EXPENSE');

  // ── Assets
  await createAcct('11000', 'Current Assets', 'ASSET', '10000');
  await createAcct('11100', 'Cash & Bank', 'ASSET', '11000');
  await createAcct('11101', 'Cash in Hand', 'ASSET', '11100', { isCashOrBank: true });
  await createAcct('11102', 'Petty Cash', 'ASSET', '11100', { isCashOrBank: true });
  await createAcct('11103', 'Primary Bank Account', 'ASSET', '11100', { isCashOrBank: true });
  await createAcct('11104', 'Secondary Bank Account', 'ASSET', '11100', { isCashOrBank: true });
  await createAcct('11200', 'Accounts Receivable', 'ASSET', '11000', { isSystem: true });
  await createAcct('11300', 'Inventory', 'ASSET', '11000', { isSystem: true });
  await createAcct('11400', 'Prepaid Expenses', 'ASSET', '11000');

  // Input Tax Credit (India GST)
  if (isIndia) {
    await createAcct('11500', 'Input Tax Credits', 'ASSET', '11000');
    await createAcct('11501', 'Input CGST Receivable', 'ASSET', '11500', { isSystem: true });
    await createAcct('11502', 'Input SGST Receivable', 'ASSET', '11500', { isSystem: true });
    await createAcct('11503', 'Input IGST Receivable', 'ASSET', '11500', { isSystem: true });
    await createAcct('11504', 'Input RCM Credit', 'ASSET', '11500', { isSystem: true });
  } else {
    await createAcct('11500', 'Tax Receivable (Input)', 'ASSET', '11000');
  }

  await createAcct('12000', 'Non-Current Assets', 'ASSET', '10000');
  await createAcct('12100', 'Furniture & Fixtures', 'ASSET', '12000');
  await createAcct('12200', 'Office Equipment', 'ASSET', '12000');
  await createAcct('12300', 'Vehicles', 'ASSET', '12000');
  await createAcct('12400', 'Accumulated Depreciation', 'ASSET', '12000');

  // ── Liabilities
  await createAcct('21000', 'Current Liabilities', 'LIABILITY', '20000');
  await createAcct('21100', 'Accounts Payable', 'LIABILITY', '21000', { isSystem: true });
  await createAcct('21200', 'Salaries Payable', 'LIABILITY', '21000');
  await createAcct('21400', 'TDS Payable', 'LIABILITY', '21000');

  // Duties & Taxes (India GST)
  if (isIndia) {
    await createAcct('21300', 'Duties & Taxes', 'LIABILITY', '21000');
    await createAcct('21301', 'Output CGST Payable', 'LIABILITY', '21300', { isSystem: true });
    await createAcct('21302', 'Output SGST Payable', 'LIABILITY', '21300', { isSystem: true });
    await createAcct('21303', 'Output IGST Payable', 'LIABILITY', '21300', { isSystem: true });
    await createAcct('21304', 'RCM Liability Clearing', 'LIABILITY', '21300', { isSystem: true });
  } else {
    await createAcct('21300', 'Tax Payable (Output)', 'LIABILITY', '21000');
  }

  await createAcct('22000', 'Non-Current Liabilities', 'LIABILITY', '20000');
  await createAcct('22100', 'Long-term Bank Loan', 'LIABILITY', '22000');

  // ── Equity
  await createAcct('31000', "Owner's Capital", 'EQUITY', '30000');
  await createAcct('32000', 'Retained Earnings', 'EQUITY', '30000', { isSystem: true });
  await createAcct('33000', 'Drawings', 'EQUITY', '30000');

  // ── Revenue
  await createAcct('41000', 'Sales Revenue', 'REVENUE', '40000', { isSystem: true });
  await createAcct('42000', 'Service Income', 'REVENUE', '40000');
  await createAcct('43000', 'Other Income', 'REVENUE', '40000');
  await createAcct('43100', 'Interest Income', 'REVENUE', '43000');
  await createAcct('44000', 'Discount Received', 'REVENUE', '40000');

  // ── Expenses
  await createAcct('51000', 'Cost of Goods Sold (COGS)', 'EXPENSE', '50000', { isSystem: true });
  await createAcct('52000', 'Salaries & Wages', 'EXPENSE', '50000');
  await createAcct('53000', 'Rent Expense', 'EXPENSE', '50000');
  await createAcct('54000', 'Utilities', 'EXPENSE', '50000');
  await createAcct('55000', 'Office Supplies', 'EXPENSE', '50000');
  await createAcct('56000', 'Depreciation', 'EXPENSE', '50000');
  await createAcct('57000', 'Bank Charges', 'EXPENSE', '50000');
  await createAcct('58000', 'Travel & Conveyance', 'EXPENSE', '50000');
  await createAcct('59000', 'Discount Given', 'EXPENSE', '50000');
  await createAcct('59100', 'Professional Fees', 'EXPENSE', '50000');
  await createAcct('59200', 'Insurance', 'EXPENSE', '50000');

  return ids;
}

// ─── GST Tax Config Provisioning (India) ────────────────────

async function provisionGSTTaxConfigs(companyId: string, accountIds: Record<string, string>) {
  const gstOutputAccountId = accountIds['21301'] || accountIds['21300']; // CGST Payable or generic

  const rates = [
    { name: 'GST 5%', rate: 5 },
    { name: 'GST 12%', rate: 12 },
    { name: 'GST 18%', rate: 18 },
    { name: 'GST 28%', rate: 28 },
    { name: 'GST Exempt (0%)', rate: 0 },
  ];

  for (const r of rates) {
    await prisma.taxConfig.create({
      data: {
        companyId,
        name: r.name,
        taxType: 'GST',
        rate: r.rate,
        effectiveFrom: new Date('2017-07-01'),
        accountId: gstOutputAccountId,
      },
    });
  }
}

// ─── GST Config (Account Mapping) ───────────────────────────

async function provisionGSTConfig(companyId: string, accountIds: Record<string, string>) {
  await prisma.gSTConfig.create({
    data: {
      companyId,
      outputCGSTAccountId: accountIds['21301'],
      outputSGSTAccountId: accountIds['21302'],
      outputIGSTAccountId: accountIds['21303'],
      inputCGSTAccountId: accountIds['11501'],
      inputSGSTAccountId: accountIds['11502'],
      inputIGSTAccountId: accountIds['11503'],
      rcmLiabilityAccountId: accountIds['21304'],
      rcmCreditAccountId: accountIds['11504'],
    },
  });
}

// ─── TDS Sections Provisioning ──────────────────────────────

async function provisionTDSSections(companyId: string) {
  const sections = [
    { section: '194C', description: 'Payment to Contractor', rate: 1, threshold: 30000 },
    { section: '194J', description: 'Professional/Technical Fees', rate: 10, threshold: 30000 },
    { section: '194H', description: 'Commission/Brokerage', rate: 5, threshold: 15000 },
    { section: '194I(a)', description: 'Rent - Plant/Machinery', rate: 2, threshold: 240000 },
    { section: '194I(b)', description: 'Rent - Land/Building', rate: 10, threshold: 240000 },
    { section: '194A', description: 'Interest (Other than Securities)', rate: 10, threshold: 40000 },
    { section: '194D', description: 'Insurance Commission', rate: 5, threshold: 15000 },
  ];

  for (const s of sections) {
    await prisma.tDSSection.create({
      data: { companyId, ...s },
    });
  }
}

// ─── Fiscal Year Provisioning ───────────────────────────────

async function provisionFiscalYear(companyId: string, startMonth: number) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Determine fiscal year boundaries
  let fyStartYear = currentMonth >= startMonth ? currentYear : currentYear - 1;
  let fyEndYear = fyStartYear + 1;

  if (startMonth === 1) {
    // Calendar year: Jan-Dec
    fyStartYear = currentYear;
    fyEndYear = currentYear;
  }

  const startDate = new Date(fyStartYear, startMonth - 1, 1);
  const endDate = new Date(startMonth === 1 ? fyEndYear : fyEndYear, startMonth === 1 ? 11 : startMonth - 2, 0);
  // Get last day properly
  const lastDay = new Date(fyEndYear, startMonth - 1, 0);

  const fyName = startMonth === 1 ? `FY ${fyStartYear}` : `FY ${fyStartYear}-${String(fyEndYear).slice(-2)}`;

  const fiscalYear = await prisma.fiscalYear.create({
    data: {
      companyId,
      name: fyName,
      startDate,
      endDate: lastDay,
      periods: {
        create: Array.from({ length: 12 }, (_, i) => {
          const month = ((i + startMonth - 1) % 12) + 1;
          const year = month >= startMonth ? fyStartYear : fyEndYear;
          const periodStart = new Date(year, month - 1, 1);
          const periodEnd = new Date(year, month, 0);
          return { month, year, startDate: periodStart, endDate: periodEnd };
        }),
      },
    },
  });

  return fiscalYear;
}

// ─── Sample Data Provisioning ───────────────────────────────

async function provisionSampleData(companyId: string, accountIds: Record<string, string>) {
  const fy = await prisma.fiscalYear.findFirst({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  if (!fy) return;

  const entries = [
    {
      voucherNo: 'RV-0001',
      date: new Date(fy.startDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      type: 'RECEIPT',
      narration: 'Owner capital investment',
      items: [
        { accountId: accountIds['11103'], debit: 500000, credit: 0 },
        { accountId: accountIds['31000'], debit: 0, credit: 500000 },
      ],
    },
    {
      voucherNo: 'PV-0001',
      date: new Date(fy.startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
      type: 'PAYMENT',
      narration: 'Office rent payment',
      items: [
        { accountId: accountIds['53000'], debit: 25000, credit: 0 },
        { accountId: accountIds['11103'], debit: 0, credit: 25000 },
      ],
    },
    {
      voucherNo: 'SV-0001',
      date: new Date(fy.startDate.getTime() + 15 * 24 * 60 * 60 * 1000),
      type: 'SALES',
      narration: 'Sale of goods',
      items: [
        { accountId: accountIds['11200'], debit: 236000, credit: 0 },
        { accountId: accountIds['41000'], debit: 0, credit: 200000 },
        { accountId: accountIds['21301'] || accountIds['21300'], debit: 0, credit: 36000 },
      ],
    },
    {
      voucherNo: 'PV-0002',
      date: new Date(fy.startDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      type: 'PAYMENT',
      narration: 'Staff salaries',
      items: [
        { accountId: accountIds['52000'], debit: 75000, credit: 0 },
        { accountId: accountIds['11103'], debit: 0, credit: 75000 },
      ],
    },
  ];

  for (const entry of entries) {
    await prisma.journalEntry.create({
      data: {
        companyId,
        voucherNo: entry.voucherNo,
        date: entry.date,
        type: entry.type,
        status: 'POSTED',
        narration: entry.narration,
        fiscalYearId: fy.id,
        items: { create: entry.items },
      },
    });
  }
}

// ─── CRUD Operations ────────────────────────────────────────

async function listCompanies() {
  return prisma.company.findMany({
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { users: true, branches: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function getCompany(id: string) {
  return prisma.company.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { plan: true }, orderBy: { createdAt: 'desc' }, take: 1 },
      users: { select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true, createdAt: true } },
      branches: true,
      _count: { select: { accounts: true, invoices: true, bills: true, contacts: true, items: true } },
    },
  });
}

async function updateCompany(id: string, data: any) {
  return prisma.company.update({ where: { id }, data });
}

async function toggleCompanyStatus(id: string) {
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) throw new Error('Company not found');
  return prisma.company.update({
    where: { id },
    data: { isActive: !company.isActive },
  });
}

// ─── Helper ─────────────────────────────────────────────────

function generateRandomPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export const companyService = {
  createCompany,
  listCompanies,
  getCompany,
  updateCompany,
  toggleCompanyStatus,
  validateGSTIN,
  INDIA_STATES,
};
