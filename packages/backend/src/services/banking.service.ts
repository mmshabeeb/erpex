// ============================================================
// ERPEX — Banking & Reconciliation Service
// Business logic for bank statements and reconciliation (scoped)
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';
import type { IReconciliationMatch, IReconciliationSummary } from '@erpex/shared';

// ─── Upload & Parse Bank Statement ──────────────────────────

export interface ParsedStatementLine {
  date: string;
  description: string;
  reference?: string;
  debit: number;
  credit: number;
  balance?: number;
}

export async function createBankStatement(
  companyId: string,
  accountId: string,
  fileName: string,
  periodStart: string,
  periodEnd: string,
  lines: ParsedStatementLine[]
) {
  // Validate bank account exists and belongs to the company
  const account = await prisma.account.findFirst({
    where: { id: accountId, companyId },
  });
  if (!account) throw new AppError('Account not found', 404);
  if (!account.isCashOrBank) throw new AppError('Account is not a bank account', 400);

  const statement = await prisma.bankStatement.create({
    data: {
      companyId,
      accountId,
      fileName,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      lines: {
        create: lines.map(line => ({
          date: new Date(line.date),
          description: line.description,
          reference: line.reference || null,
          debit: line.debit,
          credit: line.credit,
          balance: line.balance ?? null,
        })),
      },
    },
    include: { lines: { orderBy: { date: 'asc' } } },
  });

  return statement;
}

// ─── Get Reconciliation View ────────────────────────────────

export async function getReconciliationView(companyId: string, accountId: string, statementId?: string) {
  const account = await prisma.account.findFirst({
    where: { id: accountId, companyId },
  });
  if (!account) throw new AppError('Account not found', 404);

  // Get the latest bank statement or specific one (scoped to company)
  const statement = statementId
    ? await prisma.bankStatement.findFirst({
        where: { id: statementId, companyId },
        include: { lines: { orderBy: { date: 'asc' } } },
      })
    : await prisma.bankStatement.findFirst({
        where: { accountId, companyId },
        orderBy: { uploadedAt: 'desc' },
        include: { lines: { orderBy: { date: 'asc' } } },
      });

  if (!statement) throw new AppError('No bank statement found for this account', 404);

  // Get system ledger entries for this account in the statement period (scoped to company)
  const systemItems = await prisma.journalItem.findMany({
    where: {
      accountId,
      journalEntry: {
        companyId,
        status: 'POSTED',
        date: {
          gte: statement.periodStart,
          lte: statement.periodEnd,
        },
      },
    },
    include: {
      journalEntry: {
        select: { id: true, voucherNo: true, date: true, narration: true },
      },
    },
    orderBy: { journalEntry: { date: 'asc' } },
  });

  // Auto-suggest matches
  const suggestedMatches = autoMatchTransactions(systemItems, statement.lines);

  // Calculate summary
  const totalMatched = statement.lines.filter(l => l.isReconciled).length;
  const unmatchedBank = statement.lines.filter(l => !l.isReconciled).length;
  const reconciledSystemIds = new Set(
    statement.lines.filter(l => l.matchedItemId).map(l => l.matchedItemId)
  );
  const unmatchedSystem = systemItems.filter(i => !reconciledSystemIds.has(i.id)).length;

  const summary: IReconciliationSummary = {
    openingBalance: 0,
    closingBalancePerBooks: systemItems.reduce((s, i) => s + Number(i.debit) - Number(i.credit), 0),
    closingBalancePerBank: statement.lines.length > 0
      ? Number(statement.lines[statement.lines.length - 1].balance || 0)
      : 0,
    totalMatched,
    unmatchedSystem,
    unmatchedBank,
  };

  return {
    bankAccount: account,
    statement,
    systemEntries: systemItems.map(item => ({
      id: item.id,
      date: item.journalEntry.date.toISOString(),
      voucherNo: item.journalEntry.voucherNo,
      journalEntryId: item.journalEntry.id,
      narration: item.journalEntry.narration,
      debit: Number(item.debit),
      credit: Number(item.credit),
    })),
    statementLines: statement.lines,
    suggestedMatches,
    summary,
  };
}

// ─── Auto-Match Algorithm ───────────────────────────────────

function autoMatchTransactions(
  systemItems: any[],
  bankLines: any[]
) {
  const matches: IReconciliationMatch[] = [];
  const matchedSystemIds = new Set<string>();
  const matchedBankIds = new Set<string>();

  for (const bankLine of bankLines) {
    if (bankLine.isReconciled) continue;

    for (const sysItem of systemItems) {
      if (matchedSystemIds.has(sysItem.id)) continue;

      const sysAmount = Number(sysItem.debit) - Number(sysItem.credit);
      const bankAmount = Number(bankLine.debit) - Number(bankLine.credit);

      // Check amount match (exact)
      const amountMatch = Math.abs(Math.abs(sysAmount) - Math.abs(bankAmount)) < 0.01;
      if (!amountMatch) continue;

      // Check date proximity (within 3 days)
      const sysDate = new Date(sysItem.journalEntry.date).getTime();
      const bankDate = new Date(bankLine.date).getTime();
      const daysDiff = Math.abs(sysDate - bankDate) / (1000 * 60 * 60 * 24);
      const dateMatch = daysDiff <= 3;

      // Check reference match (fuzzy)
      let referenceMatch = false;
      if (bankLine.reference && sysItem.journalEntry.narration) {
        referenceMatch = bankLine.reference.toLowerCase().includes(
          sysItem.journalEntry.narration.toLowerCase().slice(0, 10)
        ) || sysItem.journalEntry.narration.toLowerCase().includes(
          bankLine.reference.toLowerCase()
        );
      }

      if (amountMatch && (dateMatch || referenceMatch)) {
        let confidence = 0.5; // Base for amount match
        if (dateMatch) confidence += 0.3;
        if (referenceMatch) confidence += 0.2;

        matches.push({
          systemEntryId: sysItem.id,
          statementLineId: bankLine.id,
          confidence,
          matchReason: [
            'Amount matched',
            dateMatch ? `Date within ${Math.round(daysDiff)} day(s)` : null,
            referenceMatch ? 'Reference matched' : null,
          ].filter(Boolean).join(', '),
        });

        matchedSystemIds.add(sysItem.id);
        matchedBankIds.add(bankLine.id);
        break; // One match per bank line
      }
    }
  }

  return matches.sort((a, b) => b.confidence - a.confidence);
}

// ─── Apply Matches ──────────────────────────────────────────

export async function applyMatches(
  matches: Array<{ systemEntryId: string; statementLineId: string }>
) {
  const results = [];
  for (const match of matches) {
    const updated = await prisma.bankStatementLine.update({
      where: { id: match.statementLineId },
      data: {
        isReconciled: true,
        matchedItemId: match.systemEntryId,
        reconciledAt: new Date(),
      },
    });
    results.push(updated);
  }
  return results;
}

// ─── Manual Clear ───────────────────────────────────────────

export async function clearStatementLines(lineIds: string[]) {
  return prisma.bankStatementLine.updateMany({
    where: { id: { in: lineIds } },
    data: {
      isReconciled: true,
      reconciledAt: new Date(),
    },
  });
}

// ─── List Bank Statements ───────────────────────────────────

export async function listBankStatements(companyId: string, accountId?: string) {
  return prisma.bankStatement.findMany({
    where: {
      companyId,
      ...(accountId ? { accountId } : {}),
    },
    include: {
      lines: { select: { id: true, isReconciled: true } },
    },
    orderBy: { uploadedAt: 'desc' },
  });
}
