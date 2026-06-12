// ============================================================
// ERPEX — Account Service
// Business logic for Chart of Accounts
// ============================================================

import prisma from '../lib/prisma.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ICreateAccountPayload, IUpdateAccountPayload, ILedgerEntry, ILedgerResponse } from '@erpex/shared';

// ─── List All Accounts ──────────────────────────────────────

export async function listAccounts(companyId: string) {
  return prisma.account.findMany({
    where: { companyId },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
    include: { parent: { select: { id: true, code: true, name: true } } },
  });
}

// ─── Get Account Tree (Hierarchical) ────────────────────────

export async function getAccountTree(companyId: string) {
  const accounts = await prisma.account.findMany({
    where: { companyId },
    orderBy: [{ type: 'asc' }, { code: 'asc' }],
  });

  // Build tree structure
  const map = new Map<string, any>();
  const roots: any[] = [];

  accounts.forEach(a => {
    map.set(a.id, { ...a, children: [] });
  });

  accounts.forEach(a => {
    const node = map.get(a.id);
    if (a.parentId && map.has(a.parentId)) {
      map.get(a.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ─── Get Single Account ─────────────────────────────────────

export async function getAccount(companyId: string, id: string) {
  const account = await prisma.account.findFirst({
    where: { id, companyId },
    include: {
      parent: { select: { id: true, code: true, name: true } },
      children: { select: { id: true, code: true, name: true, type: true }, orderBy: { code: 'asc' } },
    },
  });
  if (!account) throw new AppError('Account not found', 404);
  return account;
}

// ─── Create Account ─────────────────────────────────────────

export async function createAccount(companyId: string, data: ICreateAccountPayload) {
  // Check for duplicate code
  const existing = await prisma.account.findFirst({ where: { code: data.code, companyId } });
  if (existing) throw new AppError(`Account code "${data.code}" already exists`, 409);

  // Validate parent exists and type matches
  if (data.parentId) {
    const parent = await prisma.account.findFirst({ where: { id: data.parentId, companyId } });
    if (!parent) throw new AppError('Parent account not found', 404);
    if (parent.type !== data.type) {
      throw new AppError('Child account must have the same type as parent', 400);
    }
  }

  const account = await prisma.account.create({
    data: {
      companyId,
      code: data.code,
      name: data.name,
      type: data.type,
      parentId: data.parentId || null,
      isCashOrBank: data.isCashOrBank || false,
      description: data.description || null,
    },
  });

  await createAuditLog({
    companyId,
    entityType: 'Account',
    entityId: account.id,
    action: 'CREATED',
    newValue: account,
  });

  return account;
}

// ─── Update Account ─────────────────────────────────────────

export async function updateAccount(companyId: string, id: string, data: IUpdateAccountPayload) {
  const existing = await prisma.account.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Account not found', 404);

  // Cannot change type for accounts with journal items
  const account = await prisma.account.update({
    where: { id },
    data: {
      name: data.name,
      parentId: data.parentId,
      isActive: data.isActive,
      isCashOrBank: data.isCashOrBank,
      description: data.description,
    },
  });

  await createAuditLog({
    companyId,
    entityType: 'Account',
    entityId: account.id,
    action: 'UPDATED',
    oldValue: existing,
    newValue: account,
  });

  return account;
}

// ─── Account Ledger View with Running Balance ───────────────

export async function getAccountLedger(
  companyId: string,
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<ILedgerResponse> {
  const account = await prisma.account.findFirst({ where: { id: accountId, companyId } });
  if (!account) throw new AppError('Account not found', 404);

  const dateFilter: any = {};
  if (startDate) dateFilter.gte = new Date(startDate);
  if (endDate) dateFilter.lte = new Date(endDate);

  // Get opening balance (all entries before start date)
  let openingBalance = 0;
  if (startDate) {
    const openingItems = await prisma.journalItem.findMany({
      where: {
        accountId,
        journalEntry: {
          companyId,
          status: 'POSTED',
          date: { lt: new Date(startDate) },
        },
      },
      select: { debit: true, credit: true },
    });
    openingItems.forEach(item => {
      openingBalance += Number(item.debit) - Number(item.credit);
    });
  }

  // Get ledger entries
  const items = await prisma.journalItem.findMany({
    where: {
      accountId,
      journalEntry: {
        companyId,
        status: 'POSTED',
        ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      },
    },
    include: {
      journalEntry: {
        select: { id: true, voucherNo: true, date: true, narration: true },
      },
    },
    orderBy: { journalEntry: { date: 'asc' } },
  });

  let runningBalance = openingBalance;
  let totalDebit = 0;
  let totalCredit = 0;

  const entries: ILedgerEntry[] = items.map(item => {
    const debit = Number(item.debit);
    const credit = Number(item.credit);
    totalDebit += debit;
    totalCredit += credit;
    runningBalance += debit - credit;

    return {
      date: item.journalEntry.date.toISOString(),
      voucherNo: item.journalEntry.voucherNo,
      journalEntryId: item.journalEntry.id,
      narration: item.narration || item.journalEntry.narration,
      debit,
      credit,
      runningBalance,
    };
  });

  return {
    account: account as any,
    entries,
    openingBalance,
    closingBalance: runningBalance,
    totalDebit,
    totalCredit,
  };
}

// ─── Get Cash & Bank Accounts Only ──────────────────────────

export async function getCashBankAccounts(companyId: string) {
  return prisma.account.findMany({
    where: { companyId, isCashOrBank: true, isActive: true },
    orderBy: { code: 'asc' },
  });
}
