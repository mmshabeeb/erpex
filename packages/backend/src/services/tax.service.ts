// ============================================================
// ERPEX — Taxation Service
// Tax configuration and reporting
// ============================================================

import prisma from '../lib/prisma.js';
import { createAuditLog } from '../middleware/auditLogger.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ICreateTaxConfigPayload, ITaxReportEntry } from '@erpex/shared';

// ─── List Tax Configurations ────────────────────────────────

export async function listTaxConfigs(companyId: string) {
  return prisma.taxConfig.findMany({
    where: { companyId },
    include: {
      account: { select: { id: true, code: true, name: true } },
    },
    orderBy: [{ taxType: 'asc' }, { rate: 'asc' }],
  });
}

// ─── Create Tax Configuration ───────────────────────────────

export async function createTaxConfig(companyId: string, data: ICreateTaxConfigPayload) {
  // Validate the tax account exists
  const account = await prisma.account.findFirst({ where: { id: data.accountId, companyId } });
  if (!account) throw new AppError('Tax account not found', 404);

  const config = await prisma.taxConfig.create({
    data: {
      companyId,
      name: data.name,
      taxType: data.taxType as any,
      rate: data.rate,
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
      accountId: data.accountId,
    },
    include: {
      account: { select: { id: true, code: true, name: true } },
    },
  });

  await createAuditLog({
    companyId,
    entityType: 'TaxConfig',
    entityId: config.id,
    action: 'CREATED',
    newValue: config,
  });

  return config;
}

// ─── Update Tax Configuration ───────────────────────────────

export async function updateTaxConfig(
  companyId: string,
  id: string,
  data: { name?: string; rate?: number; effectiveTo?: string; isActive?: boolean }
) {
  const existing = await prisma.taxConfig.findFirst({ where: { id, companyId } });
  if (!existing) throw new AppError('Tax configuration not found', 404);

  const updated = await prisma.taxConfig.update({
    where: { id },
    data: {
      name: data.name,
      rate: data.rate,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
      isActive: data.isActive,
    },
    include: {
      account: { select: { id: true, code: true, name: true } },
    },
  });

  await createAuditLog({
    companyId,
    entityType: 'TaxConfig',
    entityId: id,
    action: 'UPDATED',
    oldValue: existing,
    newValue: updated,
  });

  return updated;
}

// ─── Tax Summary Report ─────────────────────────────────────

export async function getTaxReport(companyId: string, startDate: string, endDate: string) {
  const taxConfigs = await prisma.taxConfig.findMany({
    where: { companyId },
    include: { account: { select: { id: true, code: true, name: true } } },
  });

  const report: ITaxReportEntry[] = [];

  for (const config of taxConfigs) {
    // Get all journal items linked to this tax config in the period
    const taxItems = await prisma.journalItem.findMany({
      where: {
        taxConfigId: config.id,
        journalEntry: {
          companyId,
          status: 'POSTED',
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
      include: {
        journalEntry: { select: { type: true } },
      },
    });

    let taxCollected = 0; // Tax on sales
    let taxPaid = 0;      // Tax on purchases (ITC)

    taxItems.forEach(item => {
      const amount = Number(item.debit) + Number(item.credit);
      if (item.journalEntry.type === 'SALES') {
        taxCollected += Number(item.credit);
      } else if (item.journalEntry.type === 'PURCHASE') {
        taxPaid += Number(item.debit);
      } else {
        // Generic: credit = collected, debit = paid
        taxCollected += Number(item.credit);
        taxPaid += Number(item.debit);
      }
    });

    const rate = Number(config.rate);
    const grossAmount = rate > 0 ? (taxCollected / rate) * 100 : 0;
    const taxableValue = grossAmount;

    report.push({
      taxConfig: {
        id: config.id,
        name: config.name,
        taxType: config.taxType as any,
        rate,
        effectiveFrom: config.effectiveFrom.toISOString(),
        effectiveTo: config.effectiveTo?.toISOString() || null,
        accountId: config.accountId,
        account: config.account as any,
        isActive: config.isActive,
        createdAt: config.createdAt.toISOString(),
      },
      grossAmount,
      taxableValue,
      taxCollected,
      taxPaid,
      netPayable: taxCollected - taxPaid,
    });
  }

  return report;
}
