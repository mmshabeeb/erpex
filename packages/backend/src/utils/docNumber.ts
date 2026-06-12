// ============================================================
// ERPEX — Document Number Generator
// Auto-incrementing number sequences for all document types
// ============================================================

import prisma from '../lib/prisma.js';
import { DOCUMENT_PREFIX } from '@erpex/shared';

type DocType = keyof typeof DOCUMENT_PREFIX;

/**
 * Generates the next sequential document number for any document type.
 * Format: {PREFIX}-{YYYY}-{NNNN}
 * Example: INV-2026-0001, PO-2026-0042
 */
export async function generateDocNumber(
  type: DocType,
  model: string
): Promise<string> {
  const prefix = DOCUMENT_PREFIX[type];
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;

  // Query the model's latest number
  let latestNumber: string | null = null;

  switch (model) {
    case 'estimate':
      latestNumber = (await prisma.estimate.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'salesOrder':
      latestNumber = (await prisma.salesOrder.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'invoice':
      latestNumber = (await prisma.invoice.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'creditNote':
      latestNumber = (await prisma.creditNote.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'purchaseOrder':
      latestNumber = (await prisma.purchaseOrder.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'bill':
      latestNumber = (await prisma.bill.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'vendorCredit':
      latestNumber = (await prisma.vendorCredit.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'paymentReceived':
      latestNumber = (await prisma.paymentReceived.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
    case 'paymentMade':
      latestNumber = (await prisma.paymentMade.findFirst({
        where: { number: { startsWith: pattern } },
        orderBy: { number: 'desc' },
        select: { number: true },
      }))?.number ?? null;
      break;
  }

  let nextNum = 1;
  if (latestNumber) {
    const parts = latestNumber.split('-');
    const lastNum = parseInt(parts[parts.length - 1], 10);
    nextNum = lastNum + 1;
  }

  return `${prefix}-${year}-${String(nextNum).padStart(4, '0')}`;
}
