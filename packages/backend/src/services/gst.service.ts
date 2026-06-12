// ============================================================
// ERPEX — GST Service (India Localization)
// ============================================================

import prisma from '../lib/prisma.js';
import { AppError } from '../middleware/errorHandler.js';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const INDIA_STATES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands', '36': 'Telangana',
  '37': 'Andhra Pradesh', '38': 'Ladakh',
};

export function validateGSTIN(gstin: string) {
  if (!GSTIN_REGEX.test(gstin)) {
    return { valid: false, error: 'Invalid GSTIN format' };
  }
  const stateCode = gstin.substring(0, 2);
  if (!INDIA_STATES[stateCode]) {
    return { valid: false, error: `Invalid state code: ${stateCode}` };
  }
  const pan = gstin.substring(2, 12);
  return { valid: true, stateCode, pan };
}

export interface GSTSplit {
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  isInterState: boolean;
}

/**
 * Resolves GST components (CGST/SGST vs IGST) based on place of supply.
 */
export function resolveGSTComponents(
  companyStateCode: string,
  placeOfSupplyStateCode: string,
  taxRate: number,
  lineAmount: number
): GSTSplit {
  const isInterState = companyStateCode !== placeOfSupplyStateCode;
  if (isInterState) {
    const igstAmount = Number((lineAmount * (taxRate / 100)).toFixed(2));
    return {
      cgstRate: 0,
      sgstRate: 0,
      igstRate: taxRate,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount,
      isInterState,
    };
  } else {
    const halfRate = taxRate / 2;
    const cgstAmount = Number((lineAmount * (halfRate / 100)).toFixed(2));
    const sgstAmount = Number((lineAmount * (halfRate / 100)).toFixed(2));
    return {
      cgstRate: halfRate,
      sgstRate: halfRate,
      igstRate: 0,
      cgstAmount,
      sgstAmount,
      igstAmount: 0,
      isInterState,
    };
  }
}

/**
 * Generates GSTR-1 Data for the specified company and period.
 */
export async function generateGSTR1Data(companyId: string, periodFrom: Date, periodTo: Date) {
  const invoices = await prisma.invoice.findMany({
    where: {
      companyId,
      status: 'SENT',
      date: { gte: periodFrom, lte: periodTo },
    },
    include: {
      contact: true,
      lines: {
        include: {
          item: true,
        },
      },
    },
  });

  const b2b: any[] = [];
  const b2cs: any[] = [];
  const hsnSummaryMap = new Map<string, { qty: number; value: number; taxableValue: number; cgst: number; sgst: number; igst: number }>();

  for (const inv of invoices) {
    const isB2B = !!inv.contact?.gstin;
    const placeOfSupply = inv.placeOfSupply || inv.contact?.stateCode || '07';

    if (isB2B) {
      b2b.push({
        recipientGstin: inv.contact.gstin,
        invoiceNumber: inv.number,
        invoiceDate: inv.date.toISOString().split('T')[0],
        invoiceValue: inv.total,
        placeOfSupply,
        reverseCharge: inv.isReverseCharge ? 'Y' : 'N',
        invoiceType: 'Regular',
        taxableValue: inv.subtotal,
        cgst: inv.lines.reduce((s, l) => s + l.cgstAmount, 0),
        sgst: inv.lines.reduce((s, l) => s + l.sgstAmount, 0),
        igst: inv.lines.reduce((s, l) => s + l.igstAmount, 0),
      });
    } else {
      b2cs.push({
        placeOfSupply,
        invoiceNumber: inv.number,
        invoiceDate: inv.date.toISOString().split('T')[0],
        invoiceValue: inv.total,
        taxableValue: inv.subtotal,
        cgst: inv.lines.reduce((s, l) => s + l.cgstAmount, 0),
        sgst: inv.lines.reduce((s, l) => s + l.sgstAmount, 0),
        igst: inv.lines.reduce((s, l) => s + l.igstAmount, 0),
      });
    }

    // HSN Summary aggregation
    for (const line of inv.lines) {
      const hsn = line.hsnSac || line.item?.hsnCode || line.item?.sacCode || 'NA';
      let summary = hsnSummaryMap.get(hsn);
      if (!summary) {
        summary = { qty: 0, value: 0, taxableValue: 0, cgst: 0, sgst: 0, igst: 0 };
        hsnSummaryMap.set(hsn, summary);
      }
      summary.qty += line.qty;
      summary.taxableValue += line.amount;
      summary.value += line.amount + line.taxAmount;
      summary.cgst += line.cgstAmount;
      summary.sgst += line.sgstAmount;
      summary.igst += line.igstAmount;
    }
  }

  const hsnSummaryList = Array.from(hsnSummaryMap.entries()).map(([hsn, sum]) => ({
    hsnSac: hsn,
    qty: sum.qty,
    value: Number(sum.value.toFixed(2)),
    taxableValue: Number(sum.taxableValue.toFixed(2)),
    cgst: Number(sum.cgst.toFixed(2)),
    sgst: Number(sum.sgst.toFixed(2)),
    igst: Number(sum.igst.toFixed(2)),
  }));

  return {
    b2b,
    b2cs,
    hsnSummary: hsnSummaryList,
  };
}
