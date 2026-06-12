// ============================================================
// ERPEX — Database Seed Script
// Pre-populates COA, Tax Configs, Fiscal Year, Sample Data
// ============================================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding ERPEX database...\n');

  // ─── 1. Chart of Accounts ──────────────────────────────────

  console.log('📊 Creating Chart of Accounts...');

  // Top-level parent accounts
  const assets = await prisma.account.create({
    data: { code: '10000', name: 'Assets', type: 'ASSET', description: 'All asset accounts' },
  });
  const liabilities = await prisma.account.create({
    data: { code: '20000', name: 'Liabilities', type: 'LIABILITY', description: 'All liability accounts' },
  });
  const equity = await prisma.account.create({
    data: { code: '30000', name: 'Equity', type: 'EQUITY', description: 'Owner equity accounts' },
  });
  const revenue = await prisma.account.create({
    data: { code: '40000', name: 'Revenue', type: 'REVENUE', description: 'All revenue accounts' },
  });
  const expenses = await prisma.account.create({
    data: { code: '50000', name: 'Expenses', type: 'EXPENSE', description: 'All expense accounts' },
  });

  // ── Assets ────
  const currentAssets = await prisma.account.create({
    data: { code: '11000', name: 'Current Assets', type: 'ASSET', parentId: assets.id },
  });
  const cashBank = await prisma.account.create({
    data: { code: '11100', name: 'Cash & Bank', type: 'ASSET', parentId: currentAssets.id },
  });
  const cashInHand = await prisma.account.create({
    data: { code: '11101', name: 'Cash in Hand', type: 'ASSET', parentId: cashBank.id, isCashOrBank: true },
  });
  const pettyCash = await prisma.account.create({
    data: { code: '11102', name: 'Petty Cash', type: 'ASSET', parentId: cashBank.id, isCashOrBank: true },
  });
  const hdfcBank = await prisma.account.create({
    data: { code: '11103', name: 'HDFC Bank A/c', type: 'ASSET', parentId: cashBank.id, isCashOrBank: true },
  });
  const sbiBank = await prisma.account.create({
    data: { code: '11104', name: 'SBI Bank A/c', type: 'ASSET', parentId: cashBank.id, isCashOrBank: true },
  });
  const receivables = await prisma.account.create({
    data: { code: '11200', name: 'Accounts Receivable', type: 'ASSET', parentId: currentAssets.id },
  });
  const inventory = await prisma.account.create({
    data: { code: '11300', name: 'Inventory', type: 'ASSET', parentId: currentAssets.id },
  });
  const prepaid = await prisma.account.create({
    data: { code: '11400', name: 'Prepaid Expenses', type: 'ASSET', parentId: currentAssets.id },
  });

  const nonCurrentAssets = await prisma.account.create({
    data: { code: '12000', name: 'Non-Current Assets', type: 'ASSET', parentId: assets.id },
  });
  const furniture = await prisma.account.create({
    data: { code: '12100', name: 'Furniture & Fixtures', type: 'ASSET', parentId: nonCurrentAssets.id },
  });
  const equipment = await prisma.account.create({
    data: { code: '12200', name: 'Office Equipment', type: 'ASSET', parentId: nonCurrentAssets.id },
  });
  const vehicles = await prisma.account.create({
    data: { code: '12300', name: 'Vehicles', type: 'ASSET', parentId: nonCurrentAssets.id },
  });

  // ── Liabilities ────
  const currentLiab = await prisma.account.create({
    data: { code: '21000', name: 'Current Liabilities', type: 'LIABILITY', parentId: liabilities.id },
  });
  const payables = await prisma.account.create({
    data: { code: '21100', name: 'Accounts Payable', type: 'LIABILITY', parentId: currentLiab.id },
  });
  const salariesPayable = await prisma.account.create({
    data: { code: '21200', name: 'Salaries Payable', type: 'LIABILITY', parentId: currentLiab.id },
  });
  const gstPayable = await prisma.account.create({
    data: { code: '21300', name: 'GST Payable (Output)', type: 'LIABILITY', parentId: currentLiab.id },
  });
  const tdsPayable = await prisma.account.create({
    data: { code: '21400', name: 'TDS Payable', type: 'LIABILITY', parentId: currentLiab.id },
  });

  const nonCurrentLiab = await prisma.account.create({
    data: { code: '22000', name: 'Non-Current Liabilities', type: 'LIABILITY', parentId: liabilities.id },
  });
  const longTermLoan = await prisma.account.create({
    data: { code: '22100', name: 'Long-term Bank Loan', type: 'LIABILITY', parentId: nonCurrentLiab.id },
  });

  // ── Equity ────
  const ownersCapital = await prisma.account.create({
    data: { code: '31000', name: "Owner's Capital", type: 'EQUITY', parentId: equity.id },
  });
  const retainedEarnings = await prisma.account.create({
    data: { code: '32000', name: 'Retained Earnings', type: 'EQUITY', parentId: equity.id },
  });
  const drawings = await prisma.account.create({
    data: { code: '33000', name: 'Drawings', type: 'EQUITY', parentId: equity.id },
  });

  // ── Revenue ────
  const salesRevenue = await prisma.account.create({
    data: { code: '41000', name: 'Sales Revenue', type: 'REVENUE', parentId: revenue.id },
  });
  const serviceIncome = await prisma.account.create({
    data: { code: '42000', name: 'Service Income', type: 'REVENUE', parentId: revenue.id },
  });
  const otherIncome = await prisma.account.create({
    data: { code: '43000', name: 'Other Income', type: 'REVENUE', parentId: revenue.id },
  });
  const interestIncome = await prisma.account.create({
    data: { code: '43100', name: 'Interest Income', type: 'REVENUE', parentId: otherIncome.id },
  });

  // ── Expenses ────
  const cogs = await prisma.account.create({
    data: { code: '51000', name: 'Cost of Goods Sold (COGS)', type: 'EXPENSE', parentId: expenses.id },
  });
  const salaries = await prisma.account.create({
    data: { code: '52000', name: 'Salaries & Wages', type: 'EXPENSE', parentId: expenses.id },
  });
  const rent = await prisma.account.create({
    data: { code: '53000', name: 'Rent Expense', type: 'EXPENSE', parentId: expenses.id },
  });
  const utilities = await prisma.account.create({
    data: { code: '54000', name: 'Utilities', type: 'EXPENSE', parentId: expenses.id },
  });
  const officeSupplies = await prisma.account.create({
    data: { code: '55000', name: 'Office Supplies', type: 'EXPENSE', parentId: expenses.id },
  });
  const depreciation = await prisma.account.create({
    data: { code: '56000', name: 'Depreciation', type: 'EXPENSE', parentId: expenses.id },
  });
  const bankCharges = await prisma.account.create({
    data: { code: '57000', name: 'Bank Charges', type: 'EXPENSE', parentId: expenses.id },
  });
  const travelExp = await prisma.account.create({
    data: { code: '58000', name: 'Travel & Conveyance', type: 'EXPENSE', parentId: expenses.id },
  });

  // Input Tax Credit account (Asset)
  const gstInput = await prisma.account.create({
    data: { code: '11500', name: 'GST Receivable (Input Tax Credit)', type: 'ASSET', parentId: currentAssets.id },
  });

  console.log('  ✅ Created 40+ accounts\n');

  // ─── 2. Tax Configurations ────────────────────────────────

  console.log('💰 Creating Tax Configurations...');

  const gst5 = await prisma.taxConfig.create({
    data: { name: 'GST 5%', taxType: 'GST', rate: 5.0, effectiveFrom: new Date('2025-04-01'), accountId: gstPayable.id },
  });
  const gst12 = await prisma.taxConfig.create({
    data: { name: 'GST 12%', taxType: 'GST', rate: 12.0, effectiveFrom: new Date('2025-04-01'), accountId: gstPayable.id },
  });
  const gst18 = await prisma.taxConfig.create({
    data: { name: 'GST 18%', taxType: 'GST', rate: 18.0, effectiveFrom: new Date('2025-04-01'), accountId: gstPayable.id },
  });
  const gst28 = await prisma.taxConfig.create({
    data: { name: 'GST 28%', taxType: 'GST', rate: 28.0, effectiveFrom: new Date('2025-04-01'), accountId: gstPayable.id },
  });

  console.log('  ✅ Created GST 5%, 12%, 18%, 28%\n');

  // ─── 3. Fiscal Year ───────────────────────────────────────

  console.log('📅 Creating Fiscal Year FY 2025-26...');

  const fy2526 = await prisma.fiscalYear.create({
    data: {
      name: 'FY 2025-26',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      periods: {
        create: Array.from({ length: 12 }, (_, i) => {
          const month = ((i + 3) % 12) + 1; // April=4 to March=3
          const year = month >= 4 ? 2025 : 2026;
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0); // Last day of month
          return { month, year, startDate, endDate };
        }),
      },
    },
  });

  console.log('  ✅ Created FY 2025-26 with 12 monthly periods\n');

  // ─── 4. Sample Journal Entries ────────────────────────────

  console.log('📝 Creating sample journal entries...');

  // 1. Owner invests capital
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'RV-2025-0001',
      date: new Date('2025-04-01'),
      type: 'RECEIPT',
      status: 'POSTED',
      narration: 'Owner capital investment',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: hdfcBank.id, debit: 500000, credit: 0, narration: 'Capital deposited in HDFC' },
          { accountId: ownersCapital.id, debit: 0, credit: 500000, narration: 'Owner capital contribution' },
        ],
      },
    },
  });

  // 2. Office rent payment
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'PV-2025-0001',
      date: new Date('2025-04-05'),
      type: 'PAYMENT',
      status: 'POSTED',
      narration: 'Office rent for April 2025',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: rent.id, debit: 25000, credit: 0 },
          { accountId: hdfcBank.id, debit: 0, credit: 25000 },
        ],
      },
    },
  });

  // 3. Purchase of inventory
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'PU-2025-0001',
      date: new Date('2025-04-10'),
      type: 'PURCHASE',
      status: 'POSTED',
      narration: 'Purchase of raw materials',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: inventory.id, debit: 100000, credit: 0 },
          { accountId: gstInput.id, debit: 18000, credit: 0, taxConfigId: gst18.id },
          { accountId: payables.id, debit: 0, credit: 118000 },
        ],
      },
    },
  });

  // 4. Sales revenue
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'SV-2025-0001',
      date: new Date('2025-04-15'),
      type: 'SALES',
      status: 'POSTED',
      narration: 'Sale of finished goods to ABC Corp',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: receivables.id, debit: 236000, credit: 0 },
          { accountId: salesRevenue.id, debit: 0, credit: 200000 },
          { accountId: gstPayable.id, debit: 0, credit: 36000, taxConfigId: gst18.id },
        ],
      },
    },
  });

  // 5. COGS entry
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'JV-2025-0001',
      date: new Date('2025-04-15'),
      type: 'JOURNAL',
      status: 'POSTED',
      narration: 'Cost of goods sold for April sales',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: cogs.id, debit: 80000, credit: 0 },
          { accountId: inventory.id, debit: 0, credit: 80000 },
        ],
      },
    },
  });

  // 6. Salary payment
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'PV-2025-0002',
      date: new Date('2025-04-30'),
      type: 'PAYMENT',
      status: 'POSTED',
      narration: 'Staff salaries for April 2025',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: salaries.id, debit: 75000, credit: 0 },
          { accountId: hdfcBank.id, debit: 0, credit: 75000 },
        ],
      },
    },
  });

  // 7. Contra: Cash withdrawal from bank
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'CT-2025-0001',
      date: new Date('2025-04-20'),
      type: 'CONTRA',
      status: 'POSTED',
      narration: 'Cash withdrawn from HDFC for petty expenses',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: cashInHand.id, debit: 10000, credit: 0 },
          { accountId: hdfcBank.id, debit: 0, credit: 10000 },
        ],
      },
    },
  });

  // 8. Payment from petty cash
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'PV-2025-0003',
      date: new Date('2025-04-22'),
      type: 'PAYMENT',
      status: 'POSTED',
      narration: 'Office supplies purchased from petty cash',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: officeSupplies.id, debit: 3500, credit: 0 },
          { accountId: cashInHand.id, debit: 0, credit: 3500 },
        ],
      },
    },
  });

  // 9. Receipt from customer
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'RV-2025-0002',
      date: new Date('2025-05-10'),
      type: 'RECEIPT',
      status: 'POSTED',
      narration: 'Payment received from ABC Corp',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: hdfcBank.id, debit: 236000, credit: 0 },
          { accountId: receivables.id, debit: 0, credit: 236000 },
        ],
      },
    },
  });

  // 10. Draft entry (not yet posted)
  await prisma.journalEntry.create({
    data: {
      voucherNo: 'JV-2025-0002',
      date: new Date('2025-05-15'),
      type: 'JOURNAL',
      status: 'DRAFT',
      narration: 'Depreciation entry for Q1 (pending review)',
      fiscalYearId: fy2526.id,
      items: {
        create: [
          { accountId: depreciation.id, debit: 12500, credit: 0 },
          { accountId: furniture.id, debit: 0, credit: 5000 },
          { accountId: equipment.id, debit: 0, credit: 5000 },
          { accountId: vehicles.id, debit: 0, credit: 2500 },
        ],
      },
    },
  });

  console.log('  ✅ Created 10 sample journal entries\n');

  console.log('🎉 Database seeded successfully!');
  console.log('   ├── 40+ Chart of Accounts');
  console.log('   ├── 4 GST Tax Configurations');
  console.log('   ├── 1 Fiscal Year (FY 2025-26) with 12 periods');
  console.log('   └── 10 Sample Journal Entries');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
