// ============================================================
// ERPEX — Voucher Number Generator
// ============================================================

import prisma from '../lib/prisma.js';
import { VOUCHER_TYPE_PREFIX } from '@erpex/shared';

/**
 * Generates the next sequential voucher number for a given type.
 * Format: {PREFIX}-{YYYY}-{NNNN}
 * Example: JV-2026-0001, PV-2026-0042
 */
export async function generateVoucherNo(companyId: string, type: string): Promise<string> {
  const prefix = (VOUCHER_TYPE_PREFIX as any)[type] || 'XX';
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-%`;

  // Find the latest voucher number for this type and year
  const latest = await prisma.journalEntry.findFirst({
    where: {
      companyId,
      voucherNo: { startsWith: `${prefix}-${year}-` },
    },
    orderBy: { voucherNo: 'desc' },
    select: { voucherNo: true },
  });

  let nextNum = 1;
  if (latest) {
    const parts = latest.voucherNo.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
}
