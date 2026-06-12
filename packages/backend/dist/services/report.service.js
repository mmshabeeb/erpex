// ============================================================
// ERPEX — Financial Reports Service
// Trial Balance, Profit & Loss, Balance Sheet
// ============================================================
import prisma from '../lib/prisma.js';
// ─── Trial Balance ──────────────────────────────────────────
export async function getTrialBalance(asOfDate, startDate) {
    const endDate = new Date(asOfDate);
    const periodStart = startDate ? new Date(startDate) : null;
    const accounts = await prisma.account.findMany({
        where: { isActive: true },
        orderBy: [{ type: 'asc' }, { code: 'asc' }],
    });
    const rows = [];
    let totalOpeningDebit = 0, totalOpeningCredit = 0;
    let totalDebitMovement = 0, totalCreditMovement = 0;
    let totalClosingDebit = 0, totalClosingCredit = 0;
    for (const account of accounts) {
        // Opening balance: all posted entries before period start
        let openingBalance = 0;
        if (periodStart) {
            const openingItems = await prisma.journalItem.findMany({
                where: {
                    accountId: account.id,
                    journalEntry: { status: 'POSTED', date: { lt: periodStart } },
                },
                select: { debit: true, credit: true },
            });
            openingItems.forEach(i => {
                openingBalance += Number(i.debit) - Number(i.credit);
            });
        }
        // Period movements
        const movementWhere = {
            accountId: account.id,
            journalEntry: { status: 'POSTED', date: { lte: endDate } },
        };
        if (periodStart) {
            movementWhere.journalEntry.date = { gte: periodStart, lte: endDate };
        }
        const movements = await prisma.journalItem.findMany({
            where: movementWhere,
            select: { debit: true, credit: true },
        });
        const debitMovement = movements.reduce((s, i) => s + Number(i.debit), 0);
        const creditMovement = movements.reduce((s, i) => s + Number(i.credit), 0);
        const closingBalance = openingBalance + debitMovement - creditMovement;
        // Skip zero-balance accounts
        if (openingBalance === 0 && debitMovement === 0 && creditMovement === 0)
            continue;
        rows.push({
            accountId: account.id,
            accountCode: account.code,
            accountName: account.name,
            accountType: account.type,
            openingBalance,
            debitMovement,
            creditMovement,
            closingBalance,
        });
        // Accumulate totals
        if (openingBalance >= 0)
            totalOpeningDebit += openingBalance;
        else
            totalOpeningCredit += Math.abs(openingBalance);
        totalDebitMovement += debitMovement;
        totalCreditMovement += creditMovement;
        if (closingBalance >= 0)
            totalClosingDebit += closingBalance;
        else
            totalClosingCredit += Math.abs(closingBalance);
    }
    return {
        asOfDate,
        rows,
        totalOpeningDebit,
        totalOpeningCredit,
        totalDebitMovement,
        totalCreditMovement,
        totalClosingDebit,
        totalClosingCredit,
        isBalanced: Math.abs(totalClosingDebit - totalClosingCredit) < 0.01,
    };
}
// ─── Profit & Loss ──────────────────────────────────────────
export async function getProfitLoss(periodStart, periodEnd) {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    async function getAccountBalances(type) {
        const accounts = await prisma.account.findMany({
            where: { type: type, isActive: true },
            orderBy: { code: 'asc' },
        });
        const results = [];
        for (const acct of accounts) {
            const items = await prisma.journalItem.findMany({
                where: {
                    accountId: acct.id,
                    journalEntry: {
                        status: 'POSTED',
                        date: { gte: start, lte: end },
                    },
                },
                select: { debit: true, credit: true },
            });
            const netAmount = items.reduce((s, i) => {
                if (type === 'REVENUE')
                    return s + Number(i.credit) - Number(i.debit);
                return s + Number(i.debit) - Number(i.credit);
            }, 0);
            if (Math.abs(netAmount) >= 0.01) {
                results.push({
                    accountId: acct.id,
                    accountCode: acct.code,
                    accountName: acct.name,
                    amount: netAmount,
                });
            }
        }
        return results;
    }
    const revenueAccounts = await getAccountBalances('REVENUE');
    const expenseAccounts = await getAccountBalances('EXPENSE');
    // Separate COGS from operating expenses (accounts with "cost" or "cogs" in name)
    const cogsAccounts = expenseAccounts.filter(a => a.accountName.toLowerCase().includes('cost of goods') ||
        a.accountName.toLowerCase().includes('cogs'));
    const otherExpenses = expenseAccounts.filter(a => !cogsAccounts.some(c => c.accountId === a.accountId));
    // Separate other income from main revenue
    const otherIncomeAccounts = revenueAccounts.filter(a => a.accountName.toLowerCase().includes('other income') ||
        a.accountName.toLowerCase().includes('miscellaneous'));
    const mainRevenue = revenueAccounts.filter(a => !otherIncomeAccounts.some(o => o.accountId === a.accountId));
    const revTotal = mainRevenue.reduce((s, a) => s + a.amount, 0);
    const cogsTotal = cogsAccounts.reduce((s, a) => s + a.amount, 0);
    const otherIncomeTotal = otherIncomeAccounts.reduce((s, a) => s + a.amount, 0);
    const expTotal = otherExpenses.reduce((s, a) => s + a.amount, 0);
    const grossProfit = revTotal - cogsTotal;
    const netProfit = grossProfit + otherIncomeTotal - expTotal;
    return {
        periodStart,
        periodEnd,
        revenue: { label: 'Revenue', accounts: mainRevenue, total: revTotal },
        costOfGoodsSold: { label: 'Cost of Goods Sold', accounts: cogsAccounts, total: cogsTotal },
        grossProfit,
        otherIncome: { label: 'Other Income', accounts: otherIncomeAccounts, total: otherIncomeTotal },
        operatingExpenses: { label: 'Operating Expenses', accounts: otherExpenses, total: expTotal },
        netProfit,
    };
}
// ─── Balance Sheet ──────────────────────────────────────────
export async function getBalanceSheet(asOfDate) {
    const endDate = new Date(asOfDate);
    async function getAccountBalances(type) {
        const accounts = await prisma.account.findMany({
            where: { type: type, isActive: true },
            orderBy: { code: 'asc' },
        });
        const results = [];
        for (const acct of accounts) {
            const items = await prisma.journalItem.findMany({
                where: {
                    accountId: acct.id,
                    journalEntry: {
                        status: 'POSTED',
                        date: { lte: endDate },
                    },
                },
                select: { debit: true, credit: true },
            });
            let balance = items.reduce((s, i) => s + Number(i.debit) - Number(i.credit), 0);
            // For liability and equity, natural balance is credit (negative in our system)
            if (type === 'LIABILITY' || type === 'EQUITY')
                balance = -balance;
            if (Math.abs(balance) >= 0.01) {
                results.push({
                    accountId: acct.id,
                    accountCode: acct.code,
                    accountName: acct.name,
                    amount: balance,
                });
            }
        }
        return results;
    }
    const assetAccounts = await getAccountBalances('ASSET');
    const liabilityAccounts = await getAccountBalances('LIABILITY');
    const equityAccounts = await getAccountBalances('EQUITY');
    // Split current vs non-current (accounts with "current", "short-term" = current)
    const isCurrent = (name) => name.toLowerCase().includes('current') ||
        name.toLowerCase().includes('short-term') ||
        name.toLowerCase().includes('receivable') ||
        name.toLowerCase().includes('payable') ||
        name.toLowerCase().includes('cash') ||
        name.toLowerCase().includes('bank') ||
        name.toLowerCase().includes('inventory');
    const currentAssets = assetAccounts.filter(a => isCurrent(a.accountName));
    const nonCurrentAssets = assetAccounts.filter(a => !isCurrent(a.accountName));
    const currentLiabilities = liabilityAccounts.filter(a => isCurrent(a.accountName));
    const nonCurrentLiabilities = liabilityAccounts.filter(a => !isCurrent(a.accountName));
    const totalCurrentAssets = currentAssets.reduce((s, a) => s + a.amount, 0);
    const totalNonCurrentAssets = nonCurrentAssets.reduce((s, a) => s + a.amount, 0);
    const totalAssets = totalCurrentAssets + totalNonCurrentAssets;
    const totalCurrentLiabilities = currentLiabilities.reduce((s, a) => s + a.amount, 0);
    const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((s, a) => s + a.amount, 0);
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities;
    const totalEquityAccounts = equityAccounts.reduce((s, a) => s + a.amount, 0);
    // Get retained earnings from P&L (current period net profit)
    // For balance sheet, we need ALL revenue/expense up to asOfDate
    const revenueItems = await prisma.journalItem.findMany({
        where: {
            account: { type: 'REVENUE' },
            journalEntry: { status: 'POSTED', date: { lte: endDate } },
        },
        select: { debit: true, credit: true },
    });
    const expenseItems = await prisma.journalItem.findMany({
        where: {
            account: { type: 'EXPENSE' },
            journalEntry: { status: 'POSTED', date: { lte: endDate } },
        },
        select: { debit: true, credit: true },
    });
    const totalRevenue = revenueItems.reduce((s, i) => s + Number(i.credit) - Number(i.debit), 0);
    const totalExpenses = expenseItems.reduce((s, i) => s + Number(i.debit) - Number(i.credit), 0);
    const retainedEarnings = totalRevenue - totalExpenses;
    const totalEquity = totalEquityAccounts + retainedEarnings;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    return {
        asOfDate,
        currentAssets: { label: 'Current Assets', accounts: currentAssets, total: totalCurrentAssets },
        nonCurrentAssets: { label: 'Non-Current Assets', accounts: nonCurrentAssets, total: totalNonCurrentAssets },
        totalAssets,
        currentLiabilities: { label: 'Current Liabilities', accounts: currentLiabilities, total: totalCurrentLiabilities },
        nonCurrentLiabilities: { label: 'Non-Current Liabilities', accounts: nonCurrentLiabilities, total: totalNonCurrentLiabilities },
        totalLiabilities,
        equity: { label: 'Equity', accounts: equityAccounts, total: totalEquityAccounts },
        retainedEarnings,
        totalEquity,
        totalLiabilitiesAndEquity,
        isBalanced: Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
}
//# sourceMappingURL=report.service.js.map