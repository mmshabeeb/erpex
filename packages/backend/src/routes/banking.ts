// ============================================================
// ERPEX — Banking & Reconciliation Routes
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import * as bankingService from '../services/banking.service.js';
import { AppError } from '../middleware/errorHandler.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const bankingRoutes = Router();

// GET /api/banking/statements — List bank statements
bankingRoutes.get('/statements', async (req, res, next) => {
  try {
    const statements = await bankingService.listBankStatements(req.query.accountId as string);
    res.json({ success: true, data: statements });
  } catch (err) { next(err); }
});

// POST /api/banking/statements/upload — Upload bank statement (CSV/XLSX)
bankingRoutes.post('/statements/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const { accountId, periodStart, periodEnd } = req.body;
    if (!accountId || !periodStart || !periodEnd) {
      throw new AppError('accountId, periodStart, and periodEnd are required', 400);
    }

    // Parse the file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) throw new AppError('File contains no data', 400);

    // Map columns (flexible column mapping)
    const lines: bankingService.ParsedStatementLine[] = rows.map(row => {
      const date = row['Date'] || row['date'] || row['Transaction Date'] || row['Txn Date'] || '';
      const desc = row['Description'] || row['description'] || row['Narration'] || row['narration'] || row['Particulars'] || '';
      const ref = row['Reference'] || row['reference'] || row['Cheque No'] || row['Ref No'] || '';
      const debit = parseFloat(row['Debit'] || row['debit'] || row['Withdrawal'] || 0) || 0;
      const credit = parseFloat(row['Credit'] || row['credit'] || row['Deposit'] || 0) || 0;
      const balance = parseFloat(row['Balance'] || row['balance'] || row['Closing Balance'] || '') || undefined;

      return { date: String(date), description: String(desc), reference: String(ref || ''), debit, credit, balance };
    }).filter(l => l.date && l.description);

    const statement = await bankingService.createBankStatement(
      accountId, req.file.originalname, periodStart, periodEnd, lines
    );

    res.status(201).json({ success: true, data: statement });
  } catch (err) { next(err); }
});

// GET /api/banking/reconciliation/:accountId — Get reconciliation view
bankingRoutes.get('/reconciliation/:accountId', async (req, res, next) => {
  try {
    const view = await bankingService.getReconciliationView(
      req.params.accountId,
      req.query.statementId as string
    );
    res.json({ success: true, data: view });
  } catch (err) { next(err); }
});

// POST /api/banking/reconciliation/match — Apply auto/manual matches
bankingRoutes.post('/reconciliation/match', async (req, res, next) => {
  try {
    const { matches } = req.body;
    if (!matches || !Array.isArray(matches)) throw new AppError('matches array required', 400);
    const results = await bankingService.applyMatches(matches);
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// PATCH /api/banking/reconciliation/clear — Manually clear items
bankingRoutes.patch('/reconciliation/clear', async (req, res, next) => {
  try {
    const { statementLineIds } = req.body;
    if (!statementLineIds || !Array.isArray(statementLineIds)) {
      throw new AppError('statementLineIds array required', 400);
    }
    const result = await bankingService.clearStatementLines(statementLineIds);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});
