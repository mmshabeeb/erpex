// ============================================================
// ERPEX — Financial Report Exporter Utility
// Provides high-quality download functions for Trial Balance,
// Profit & Loss, and Balance Sheet in Excel, CSV, and PDF formats.
// ============================================================

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './formatters';

// Helper to format currency for Excel/CSV (keeps it as a number or raw text without currency sign for calculations)
const formatVal = (val: any) => {
  if (typeof val === 'number') return Number(val.toFixed(2));
  return val || '';
};

// Helper to trigger CSV file download from data arrays using XLSX
function downloadXLSX(rows: any[][], fileName: string, sheetName: string, isCsv = false) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  if (isCsv) {
    XLSX.writeFile(wb, `${fileName}.csv`, { bookType: 'csv' });
  } else {
    // Apply styling hints if needed (auto-width etc)
    const maxCols = rows.reduce((max, r) => Math.max(max, r.length), 0);
    ws['!cols'] = Array(maxCols).fill({ wch: 18 });
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
}

// ─── Trial Balance Exporter ──────────────────────────────────

export function exportTrialBalance(
  companyName: string,
  dateInfo: string,
  data: any,
  format: 'xlsx' | 'csv' | 'pdf'
) {
  const fileName = `trial_balance_${dateInfo.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  
  // 1. Prepare data for Excel/CSV
  if (format === 'xlsx' || format === 'csv') {
    const rows: any[][] = [
      [companyName],
      ['Trial Balance'],
      [dateInfo],
      [],
      ['Account Code', 'Account Name', 'Account Type', 'Opening Balance', 'Debit Movement', 'Credit Movement', 'Closing Balance'],
    ];

    data.rows.forEach((row: any) => {
      rows.push([
        row.accountCode,
        row.accountName,
        row.accountType,
        formatVal(row.openingBalance),
        row.debitMovement > 0 ? formatVal(row.debitMovement) : 0,
        row.creditMovement > 0 ? formatVal(row.creditMovement) : 0,
        formatVal(row.closingBalance)
      ]);
    });

    // Totals row
    rows.push([
      'Totals',
      '',
      '',
      '',
      formatVal(data.totalDebitMovement),
      formatVal(data.totalCreditMovement),
      ''
    ]);

    rows.push([]);
    rows.push(['Closing Balance Verification']);
    rows.push([`Total Closing Debit (Dr):`, formatVal(data.totalClosingDebit)]);
    rows.push([`Total Closing Credit (Cr):`, formatVal(data.totalClosingCredit)]);
    rows.push([`Status:`, data.isBalanced ? 'Balanced' : 'Not Balanced']);

    downloadXLSX(rows, fileName, 'Trial Balance', format === 'csv');
  } 
  
  // 2. Prepare PDF
  else if (format === 'pdf') {
    const doc = new jsPDF() as any;
    
    // Header
    doc.setFontSize(18);
    doc.text(companyName, 14, 15);
    doc.setFontSize(13);
    doc.text('Trial Balance', 14, 22);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(dateInfo, 14, 28);
    
    // Status Badge
    doc.setFillColor(data.isBalanced ? 209 : 254, data.isBalanced ? 250 : 226, data.isBalanced ? 229 : 226); // green or red background
    doc.rect(160, 15, 36, 8, 'F');
    doc.setTextColor(data.isBalanced ? 6 : 220, data.isBalanced ? 95 : 38, data.isBalanced ? 70 : 38);
    doc.setFontSize(9);
    doc.text(data.isBalanced ? 'BALANCED' : 'UNBALANCED', 166, 20.5);

    // Table
    const tableHeaders = [['Code', 'Account Name', 'Type', 'Opening', 'Debit', 'Credit', 'Closing']];
    const tableRows = data.rows.map((row: any) => [
      row.accountCode,
      row.accountName,
      row.accountType,
      formatCurrency(row.openingBalance),
      row.debitMovement > 0 ? formatCurrency(row.debitMovement) : '',
      row.creditMovement > 0 ? formatCurrency(row.creditMovement) : '',
      formatCurrency(row.closingBalance)
    ]);

    // Add totals row
    tableRows.push([
      'Totals',
      '',
      '',
      '',
      formatCurrency(data.totalDebitMovement),
      formatCurrency(data.totalCreditMovement),
      ''
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: 34,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] }, // Indigo
      footStyles: { fontStyle: 'bold' },
      styles: { fontSize: 8 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    
    // Footer Verification Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, finalY, 182, 14, 'F');
    doc.setTextColor(50);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Closing Balance Verification:', 18, finalY + 9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Debit (Dr): ${formatCurrency(data.totalClosingDebit)}`, 85, finalY + 9);
    doc.text(`Credit (Cr): ${formatCurrency(data.totalClosingCredit)}`, 140, finalY + 9);

    doc.save(`${fileName}.pdf`);
  }
}

// ─── Profit & Loss Exporter ──────────────────────────────────

export function exportProfitLoss(
  companyName: string,
  dateInfo: string,
  data: any,
  format: 'xlsx' | 'csv' | 'pdf'
) {
  const fileName = `profit_loss_${dateInfo.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const addSectionRows = (rows: any[][], section: any, label: string) => {
    if (!section || !section.accounts) return;
    rows.push([label]);
    section.accounts.forEach((acct: any) => {
      rows.push([acct.accountCode, acct.accountName, formatVal(acct.amount)]);
    });
    rows.push([`Total ${label}`, '', formatVal(section.total)]);
    rows.push([]);
  };

  // 1. Prepare data for Excel/CSV
  if (format === 'xlsx' || format === 'csv') {
    const rows: any[][] = [
      [companyName],
      ['Profit & Loss Statement'],
      [dateInfo],
      [],
    ];

    addSectionRows(rows, data.revenue, 'Revenue');
    addSectionRows(rows, data.costOfGoodsSold, 'Cost of Goods Sold');
    
    rows.push(['Gross Profit', '', formatVal(data.grossProfit)]);
    rows.push([]);

    addSectionRows(rows, data.otherIncome, 'Other Income');
    addSectionRows(rows, data.operatingExpenses, 'Operating Expenses');

    rows.push(['Net Profit', '', formatVal(data.netProfit)]);

    downloadXLSX(rows, fileName, 'Profit & Loss', format === 'csv');
  } 
  
  // 2. Prepare PDF
  else if (format === 'pdf') {
    const doc = new jsPDF() as any;

    doc.setFontSize(18);
    doc.text(companyName, 14, 15);
    doc.setFontSize(13);
    doc.text('Profit & Loss Statement', 14, 22);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(dateInfo, 14, 28);

    const tableRows: any[] = [];
    const addSectionToPdf = (section: any, label: string) => {
      if (!section || !section.accounts) return;
      tableRows.push([{ content: label, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } }]);
      section.accounts.forEach((acct: any) => {
        tableRows.push([acct.accountCode, acct.accountName, formatCurrency(acct.amount)]);
      });
      tableRows.push([
        { content: `Total ${label}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: formatCurrency(section.total), styles: { fontStyle: 'bold', halign: 'right' } }
      ]);
    };

    addSectionToPdf(data.revenue, 'Revenue');
    addSectionToPdf(data.costOfGoodsSold, 'Cost of Goods Sold');
    
    // Gross Profit
    tableRows.push([
      { content: 'Gross Profit', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [209, 250, 229] } },
      { content: formatCurrency(data.grossProfit), styles: { fontStyle: 'bold', halign: 'right', fillColor: [209, 250, 229] } }
    ]);

    addSectionToPdf(data.otherIncome, 'Other Income');
    addSectionToPdf(data.operatingExpenses, 'Operating Expenses');

    // Net Profit
    tableRows.push([
      { content: 'Net Profit', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [219, 234, 254], fontSize: 10 } },
      { content: formatCurrency(data.netProfit), styles: { fontStyle: 'bold', halign: 'right', fillColor: [219, 234, 254], fontSize: 10 } }
    ]);

    doc.autoTable({
      head: [['Code', 'Account Description', 'Amount']],
      body: tableRows,
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // Emerald / Greenish
      styles: { fontSize: 9 },
      columnStyles: {
        0: { width: 30 },
        2: { halign: 'right', width: 40 }
      }
    });

    doc.save(`${fileName}.pdf`);
  }
}

// ─── Balance Sheet Exporter ──────────────────────────────────

export function exportBalanceSheet(
  companyName: string,
  dateInfo: string,
  data: any,
  format: 'xlsx' | 'csv' | 'pdf'
) {
  const fileName = `balance_sheet_${dateInfo.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

  const addSectionRows = (rows: any[][], section: any) => {
    if (!section || !section.accounts) return;
    rows.push([section.label]);
    section.accounts.forEach((acct: any) => {
      rows.push([acct.accountCode, acct.accountName, formatVal(acct.amount)]);
    });
    rows.push([`Total ${section.label}`, '', formatVal(section.total)]);
    rows.push([]);
  };

  // 1. Prepare data for Excel/CSV
  if (format === 'xlsx' || format === 'csv') {
    const rows: any[][] = [
      [companyName],
      ['Balance Sheet'],
      [dateInfo],
      [],
      ['ASSETS'],
      [],
    ];

    addSectionRows(rows, data.currentAssets);
    addSectionRows(rows, data.nonCurrentAssets);
    rows.push(['TOTAL ASSETS', '', formatVal(data.totalAssets)]);
    rows.push([]);
    rows.push([]);

    rows.push(['LIABILITIES & EQUITY']);
    rows.push([]);
    addSectionRows(rows, data.currentLiabilities);
    addSectionRows(rows, data.nonCurrentLiabilities);
    rows.push(['Total Liabilities', '', formatVal(data.totalLiabilities)]);
    rows.push([]);

    addSectionRows(rows, data.equity);
    if (data.retainedEarnings !== 0) {
      rows.push(['', 'Retained Earnings (Current Period)', formatVal(data.retainedEarnings)]);
    }
    rows.push(['Total Equity', '', formatVal(data.totalEquity)]);
    rows.push([]);
    rows.push(['TOTAL LIABILITIES & EQUITY', '', formatVal(data.totalLiabilitiesAndEquity)]);

    downloadXLSX(rows, fileName, 'Balance Sheet', format === 'csv');
  } 
  
  // 2. Prepare PDF
  else if (format === 'pdf') {
    const doc = new jsPDF() as any;

    doc.setFontSize(18);
    doc.text(companyName, 14, 15);
    doc.setFontSize(13);
    doc.text('Balance Sheet', 14, 22);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(dateInfo, 14, 28);

    // Balanced Status Badge
    doc.setFillColor(data.isBalanced ? 209 : 254, data.isBalanced ? 250 : 226, data.isBalanced ? 229 : 226);
    doc.rect(140, 15, 56, 8, 'F');
    doc.setTextColor(data.isBalanced ? 6 : 220, data.isBalanced ? 95 : 38, data.isBalanced ? 70 : 38);
    doc.setFontSize(9);
    doc.text(data.isBalanced ? 'Balanced: A = L + E' : 'Unbalanced Balance Sheet', 143, 20.5);

    const tableRows: any[] = [];
    const addSectionToPdf = (section: any) => {
      if (!section || !section.accounts) return;
      tableRows.push([{ content: section.label, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [243, 244, 246] } }]);
      section.accounts.forEach((acct: any) => {
        tableRows.push([acct.accountCode, acct.accountName, formatCurrency(acct.amount)]);
      });
      tableRows.push([
        { content: `Total ${section.label}`, colSpan: 2, styles: { fontStyle: 'bold' } },
        { content: formatCurrency(section.total), styles: { fontStyle: 'bold', halign: 'right' } }
      ]);
    };

    // ASSETS
    tableRows.push([{ content: 'ASSETS', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [224, 242, 254], textColor: [3, 105, 161] } }]);
    addSectionToPdf(data.currentAssets);
    addSectionToPdf(data.nonCurrentAssets);
    tableRows.push([
      { content: 'TOTAL ASSETS', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [186, 230, 253], fontSize: 10 } },
      { content: formatCurrency(data.totalAssets), styles: { fontStyle: 'bold', halign: 'right', fillColor: [186, 230, 253], fontSize: 10 } }
    ]);

    // Spacer row
    tableRows.push([{ content: '', colSpan: 3, styles: { fillColor: [255, 255, 255], height: 5 } }]);

    // LIABILITIES & EQUITY
    tableRows.push([{ content: 'LIABILITIES & EQUITY', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [255, 237, 210] } }]); // soft orange
    tableRows.push([{ content: 'Liabilities', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [254, 243, 199] } }]);
    addSectionToPdf(data.currentLiabilities);
    addSectionToPdf(data.nonCurrentLiabilities);
    tableRows.push([
      { content: 'Total Liabilities', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [253, 230, 138] } },
      { content: formatCurrency(data.totalLiabilities), styles: { fontStyle: 'bold', halign: 'right', fillColor: [253, 230, 138] } }
    ]);

    tableRows.push([{ content: 'Equity', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [243, 232, 255] } }]);
    addSectionToPdf(data.equity);
    if (data.retainedEarnings !== 0) {
      tableRows.push([
        '',
        'Retained Earnings (Current Period)',
        formatCurrency(data.retainedEarnings)
      ]);
    }
    tableRows.push([
      { content: 'Total Equity', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [233, 213, 255] } },
      { content: formatCurrency(data.totalEquity), styles: { fontStyle: 'bold', halign: 'right', fillColor: [233, 213, 255] } }
    ]);

    // Grand Total Liabilities & Equity
    tableRows.push([
      { content: 'TOTAL LIABILITIES & EQUITY', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [253, 186, 116], fontSize: 10 } },
      { content: formatCurrency(data.totalLiabilitiesAndEquity), styles: { fontStyle: 'bold', halign: 'right', fillColor: [253, 186, 116], fontSize: 10 } }
    ]);

    doc.autoTable({
      head: [['Code', 'Account Description', 'Amount']],
      body: tableRows,
      startY: 34,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] }, // Orange/Liability style
      styles: { fontSize: 8.5 },
      columnStyles: {
        0: { width: 30 },
        2: { halign: 'right', width: 40 }
      }
    });

    doc.save(`${fileName}.pdf`);
  }
}
