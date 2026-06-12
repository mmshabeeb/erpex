// ============================================================
// ERPEX — Shared Zod Validation Schemas
// Runtime validation for API payloads
// ============================================================

import { z } from 'zod';
import { AccountType, VoucherType, VoucherStatus, TaxType } from '../constants/index.js';

// ─── Account Schemas ────────────────────────────────────────

export const createAccountSchema = z.object({
  code: z.string().min(1, 'Account code is required').max(20),
  name: z.string().min(1, 'Account name is required').max(200),
  type: z.nativeEnum(AccountType),
  parentId: z.string().uuid().nullable().optional(),
  isCashOrBank: z.boolean().optional().default(false),
  description: z.string().max(500).optional(),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  isCashOrBank: z.boolean().optional(),
  description: z.string().max(500).optional(),
});

// ─── Journal Item Schema ────────────────────────────────────

export const journalItemSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  debit: z.number().min(0, 'Debit must be non-negative').default(0),
  credit: z.number().min(0, 'Credit must be non-negative').default(0),
  narration: z.string().max(500).optional(),
  taxConfigId: z.string().uuid().optional(),
}).refine(
  (data) => !(data.debit > 0 && data.credit > 0),
  { message: 'A line cannot have both debit and credit amounts' }
).refine(
  (data) => data.debit > 0 || data.credit > 0,
  { message: 'Either debit or credit must be greater than zero' }
);

// ─── Journal Entry Schema ───────────────────────────────────

export const createJournalSchema = z.object({
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  type: z.nativeEnum(VoucherType),
  status: z.nativeEnum(VoucherStatus).optional().default(VoucherStatus.DRAFT),
  narration: z.string().max(1000).optional(),
  currencyCode: z.string().length(3).optional().default('INR'),
  exchangeRate: z.number().positive().optional().default(1),
  items: z.array(journalItemSchema).min(2, 'At least 2 line items required'),
}).refine(
  (data) => {
    const totalDebit = data.items.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = data.items.reduce((sum, item) => sum + (item.credit || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01;
  },
  { message: 'Total debits must equal total credits (double-entry rule)' }
);

// ─── Contra Schema ──────────────────────────────────────────

export const createContraSchema = z.object({
  date: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  fromAccountId: z.string().uuid('Invalid source account'),
  toAccountId: z.string().uuid('Invalid destination account'),
  amount: z.number().positive('Amount must be positive'),
  narration: z.string().max(500).optional(),
}).refine(
  (data) => data.fromAccountId !== data.toAccountId,
  { message: 'Source and destination accounts must be different' }
);

// ─── Tax Config Schema ──────────────────────────────────────

export const createTaxConfigSchema = z.object({
  name: z.string().min(1, 'Tax name is required').max(100),
  taxType: z.nativeEnum(TaxType),
  rate: z.number().min(0).max(100),
  effectiveFrom: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  effectiveTo: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date').optional(),
  accountId: z.string().uuid('Invalid tax account'),
});

export const updateTaxConfigSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  rate: z.number().min(0).max(100).optional(),
  effectiveTo: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date').optional(),
  isActive: z.boolean().optional(),
});

// ─── Fiscal Year Schema ─────────────────────────────────────

export const createFiscalYearSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  { message: 'Start date must be before end date' }
);

// ─── Report Filters ─────────────────────────────────────────

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const journalFilterSchema = dateRangeSchema.extend({
  type: z.nativeEnum(VoucherType).optional(),
  status: z.nativeEnum(VoucherStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ─── Bank Statement Upload ──────────────────────────────────

export const bankStatementUploadSchema = z.object({
  accountId: z.string().uuid('Invalid bank account'),
  periodStart: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  periodEnd: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
});

export const reconcileMatchSchema = z.object({
  matches: z.array(z.object({
    systemEntryId: z.string().uuid(),
    statementLineId: z.string().uuid(),
  })).min(1, 'At least one match required'),
});

export const reconcileClearSchema = z.object({
  statementLineIds: z.array(z.string().uuid()).min(1),
  bankChargeAmount: z.number().min(0).optional(),
  bankChargeAccountId: z.string().uuid().optional(),
});
