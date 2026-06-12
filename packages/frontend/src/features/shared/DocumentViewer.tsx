// ============================================================
// ERPEX — Document Viewer Component
// Professional print-ready document template with
// View / Download (PDF) / Print actions
// ============================================================

import { useState, useRef, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────

export interface DocumentLine {
  description: string;
  qty: number;
  rate: number;
  amount: number;
  taxAmount?: number;
  hsnCode?: string;
  sacCode?: string;
  itemName?: string;
}

export interface DocumentData {
  /** Document type label (INVOICE, BILL, ESTIMATE, etc.) */
  type: 'INVOICE' | 'BILL' | 'ESTIMATE' | 'PURCHASE_ORDER' | 'CREDIT_NOTE' | 'DEBIT_NOTE' | 'EXPENSE' | 'JOURNAL_VOUCHER';
  /** Document number (INV-0001) */
  number: string;
  /** Document status */
  status: string;
  /** Document date */
  date: string;
  /** Due / expiry date (optional) */
  dueDate?: string;
  /** Company info */
  company?: {
    name: string;
    legalName?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
  };
  /** Customer / vendor info */
  contact?: {
    name: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    gstin?: string;
    pan?: string;
    phone?: string;
    email?: string;
  };
  /** Line items */
  lines: DocumentLine[];
  /** Subtotal */
  subtotal: number;
  /** Tax total */
  taxTotal: number;
  /** Discount */
  discount?: number;
  /** Grand total */
  total: number;
  /** Amount paid */
  amountPaid?: number;
  /** Amount due */
  amountDue?: number;
  /** Notes */
  notes?: string;
  /** Reference number */
  referenceNo?: string;
  /** Place of Supply (GST) */
  placeOfSupply?: string;
  /** Is Reverse Charge */
  isReverseCharge?: boolean;
  /** IRN Number */
  irnNumber?: string;
  /** For journal vouchers */
  journalItems?: Array<{
    accountCode: string;
    accountName: string;
    narration?: string;
    debit: number;
    credit: number;
  }>;
  totalDebit?: number;
  totalCredit?: number;
  narration?: string;
  /** For expenses */
  paymentMethod?: string;
  category?: string;
}

// ─── Utility ────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  INVOICE: 'Tax Invoice',
  BILL: 'Purchase Bill',
  ESTIMATE: 'Estimate / Quotation',
  PURCHASE_ORDER: 'Purchase Order',
  CREDIT_NOTE: 'Credit Note',
  DEBIT_NOTE: 'Debit Note',
  EXPENSE: 'Expense Voucher',
  JOURNAL_VOUCHER: 'Journal Voucher',
};

const TYPE_COLORS: Record<string, string> = {
  INVOICE: '#6366f1',
  BILL: '#f59e0b',
  ESTIMATE: '#06b6d4',
  PURCHASE_ORDER: '#8b5cf6',
  CREDIT_NOTE: '#ef4444',
  DEBIT_NOTE: '#10b981',
  EXPENSE: '#f97316',
  JOURNAL_VOUCHER: '#3b82f6',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convert(n: number): string {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + convert(paise) + ' Paise';
  return result + ' Only';
}

// ─── Document Template ──────────────────────────────────────

function DocumentTemplate({ data, printRef }: { data: DocumentData; printRef: React.RefObject<HTMLDivElement | null> }) {
  const accentColor = TYPE_COLORS[data.type] || '#6366f1';
  const isJournal = data.type === 'JOURNAL_VOUCHER';
  const isExpense = data.type === 'EXPENSE';

  return (
    <div ref={printRef} className="doc-print-area" id="document-print-area">
      {/* ── Document Header ── */}
      <div className="doc-header" style={{ borderBottom: `3px solid ${accentColor}` }}>
        <div className="doc-header-left">
          <div className="doc-company-logo" style={{ background: accentColor }}>
            {data.company?.name?.charAt(0) || 'E'}
          </div>
          <div>
            <div className="doc-company-name">{data.company?.name || 'Company Name'}</div>
            {data.company?.legalName && data.company.legalName !== data.company.name && (
              <div className="doc-company-legal">{data.company.legalName}</div>
            )}
            {data.company?.address && <div className="doc-company-detail">{data.company.address}</div>}
            {(data.company?.city || data.company?.state) && (
              <div className="doc-company-detail">
                {[data.company.city, data.company.state, data.company.pinCode].filter(Boolean).join(', ')}
              </div>
            )}
            {data.company?.gstin && <div className="doc-company-detail"><strong>GSTIN:</strong> {data.company.gstin}</div>}
            {data.company?.pan && <div className="doc-company-detail"><strong>PAN:</strong> {data.company.pan}</div>}
          </div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label" style={{ color: accentColor }}>{TYPE_LABELS[data.type]}</div>
          <div className="doc-number">{data.number}</div>
          <div className="doc-status-row">
            <span className="doc-status-badge" style={{
              background: accentColor + '18',
              color: accentColor,
              border: `1px solid ${accentColor}40`,
            }}>{data.status}</span>
          </div>
        </div>
      </div>

      {/* ── Bill To / Ship To + Date Info ── */}
      <div className="doc-meta-row">
        {!isJournal && !isExpense && data.contact && (
          <div className="doc-meta-block">
            <div className="doc-meta-label">
              {['BILL', 'PURCHASE_ORDER', 'DEBIT_NOTE'].includes(data.type) ? 'Vendor' : 'Bill To'}
            </div>
            <div className="doc-meta-name">{data.contact.name}</div>
            {data.contact.address && <div className="doc-meta-detail">{data.contact.address}</div>}
            {(data.contact.city || data.contact.state) && (
              <div className="doc-meta-detail">
                {[data.contact.city, data.contact.state, data.contact.pinCode].filter(Boolean).join(', ')}
              </div>
            )}
            {data.contact.gstin && <div className="doc-meta-detail"><strong>GSTIN:</strong> {data.contact.gstin}</div>}
            {data.contact.pan && <div className="doc-meta-detail"><strong>PAN:</strong> {data.contact.pan}</div>}
            {data.contact.phone && <div className="doc-meta-detail"><strong>Phone:</strong> {data.contact.phone}</div>}
          </div>
        )}

        <div className="doc-meta-block doc-meta-dates">
          <div className="doc-date-row">
            <span className="doc-date-label">Date:</span>
            <span className="doc-date-value">{fmtDate(data.date)}</span>
          </div>
          {data.dueDate && (
            <div className="doc-date-row">
              <span className="doc-date-label">
                {data.type === 'ESTIMATE' ? 'Valid Until:' :
                  data.type === 'PURCHASE_ORDER' ? 'Expected Delivery:' : 'Due Date:'}
              </span>
              <span className="doc-date-value">{fmtDate(data.dueDate)}</span>
            </div>
          )}
          {data.placeOfSupply && (
            <div className="doc-date-row">
              <span className="doc-date-label">Place of Supply:</span>
              <span className="doc-date-value">{data.placeOfSupply}</span>
            </div>
          )}
          {data.isReverseCharge && (
            <div className="doc-date-row">
              <span className="doc-date-label">Reverse Charge:</span>
              <span className="doc-date-value" style={{ color: '#ef4444' }}>Yes</span>
            </div>
          )}
          {data.referenceNo && (
            <div className="doc-date-row">
              <span className="doc-date-label">Reference:</span>
              <span className="doc-date-value">{data.referenceNo}</span>
            </div>
          )}
          {isExpense && data.paymentMethod && (
            <div className="doc-date-row">
              <span className="doc-date-label">Payment:</span>
              <span className="doc-date-value">{data.paymentMethod}</span>
            </div>
          )}
          {isExpense && data.category && (
            <div className="doc-date-row">
              <span className="doc-date-label">Category:</span>
              <span className="doc-date-value">{data.category}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Line Items Table ── */}
      {isJournal && data.journalItems ? (
        <table className="doc-table">
          <thead>
            <tr style={{ background: accentColor + '0d' }}>
              <th style={{ width: '5%', textAlign: 'center' }}>#</th>
              <th style={{ width: '12%' }}>Code</th>
              <th>Account Name</th>
              <th>Narration</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Debit (₹)</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Credit (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.journalItems.map((item, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>{i + 1}</td>
                <td className="doc-mono">{item.accountCode}</td>
                <td>{item.accountName}</td>
                <td className="doc-text-muted">{item.narration || '—'}</td>
                <td className="doc-amount">{item.debit > 0 ? fmt(item.debit) : ''}</td>
                <td className="doc-amount">{item.credit > 0 ? fmt(item.credit) : ''}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="doc-total-row">
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
              <td className="doc-amount doc-total-amount">{fmt(data.totalDebit || 0)}</td>
              <td className="doc-amount doc-total-amount">{fmt(data.totalCredit || 0)}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <table className="doc-table">
          <thead>
            <tr style={{ background: accentColor + '0d' }}>
              <th style={{ width: '5%', textAlign: 'center' }}>#</th>
              <th>Description</th>
              {data.lines.some(l => l.hsnCode || l.sacCode) && <th style={{ width: '10%' }}>HSN/SAC</th>}
              <th style={{ width: '8%', textAlign: 'right' }}>Qty</th>
              <th style={{ width: '14%', textAlign: 'right' }}>Rate (₹)</th>
              {data.taxTotal > 0 && <th style={{ width: '12%', textAlign: 'right' }}>Tax (₹)</th>}
              <th style={{ width: '15%', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line, i) => (
              <tr key={i}>
                <td style={{ textAlign: 'center', color: '#94a3b8' }}>{i + 1}</td>
                <td>
                  {line.itemName && <div style={{ fontWeight: 600 }}>{line.itemName}</div>}
                  <div style={line.itemName ? { fontSize: '0.85em', color: '#64748b' } : {}}>{line.description}</div>
                </td>
                {data.lines.some(l => l.hsnCode || l.sacCode) && (
                  <td className="doc-mono" style={{ fontSize: '0.85em' }}>{line.hsnCode || line.sacCode || '—'}</td>
                )}
                <td className="doc-amount">{line.qty}</td>
                <td className="doc-amount">{fmt(line.rate)}</td>
                {data.taxTotal > 0 && <td className="doc-amount">{fmt(line.taxAmount || 0)}</td>}
                <td className="doc-amount">{fmt(line.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── Totals Section ── */}
      {!isJournal && (
        <div className="doc-totals-wrapper">
          <div className="doc-totals-words">
            <div className="doc-meta-label">Amount in Words</div>
            <div className="doc-words-value">{numberToWords(data.total)}</div>
          </div>
          <div className="doc-totals-table">
            <div className="doc-totals-row">
              <span>Subtotal</span>
              <span className="doc-mono">{fmt(data.subtotal)}</span>
            </div>
            {data.taxTotal > 0 && (
              <div className="doc-totals-row">
                <span>Tax</span>
                <span className="doc-mono">{fmt(data.taxTotal)}</span>
              </div>
            )}
            {(data.discount || 0) > 0 && (
              <div className="doc-totals-row">
                <span>Discount</span>
                <span className="doc-mono" style={{ color: '#ef4444' }}>-{fmt(data.discount!)}</span>
              </div>
            )}
            <div className="doc-totals-row doc-totals-grand" style={{ borderColor: accentColor + '40' }}>
              <span>Total</span>
              <span className="doc-mono" style={{ color: accentColor }}>{fmt(data.total)}</span>
            </div>
            {data.amountPaid !== undefined && data.amountPaid > 0 && (
              <div className="doc-totals-row">
                <span>Paid</span>
                <span className="doc-mono" style={{ color: '#10b981' }}>{fmt(data.amountPaid)}</span>
              </div>
            )}
            {data.amountDue !== undefined && data.amountDue > 0 && (
              <div className="doc-totals-row doc-totals-due">
                <span>Balance Due</span>
                <span className="doc-mono" style={{ color: '#ef4444' }}>{fmt(data.amountDue)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Notes / Narration ── */}
      {(data.notes || data.narration) && (
        <div className="doc-notes">
          <div className="doc-meta-label">Notes</div>
          <div className="doc-notes-text">{data.notes || data.narration}</div>
        </div>
      )}

      {/* ── IRN (e-Invoice) ── */}
      {data.irnNumber && (
        <div className="doc-irn">
          <span className="doc-meta-label">IRN: </span>
          <span className="doc-mono" style={{ fontSize: '0.75em', wordBreak: 'break-all' }}>{data.irnNumber}</span>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="doc-footer" style={{ borderTop: `2px solid ${accentColor}20` }}>
        <div className="doc-footer-left">
          <div className="doc-footer-note">This is a computer-generated document. No signature is required.</div>
          <div className="doc-footer-powered">Powered by <strong>ERPEX</strong></div>
        </div>
        <div className="doc-footer-right">
          <div className="doc-footer-label">Authorized Signatory</div>
          <div className="doc-footer-sign-line" style={{ borderColor: accentColor + '40' }}></div>
          <div className="doc-footer-company">{data.company?.name || 'Company'}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Document Viewer Modal ──────────────────────────────────

interface DocumentViewerProps {
  data: DocumentData;
  open: boolean;
  onClose: () => void;
}

export default function DocumentViewer({ data, open, onClose }: DocumentViewerProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      // Use a hidden iframe approach to generate a clean PDF-like print
      const printContent = printRef.current;
      if (!printContent) return;

      const printWindow = window.open('', '_blank', 'width=800,height=1100');
      if (!printWindow) {
        alert('Pop-up blocked. Please allow pop-ups for this site to download documents.');
        return;
      }

      // Collect all stylesheets
      const styleSheets = Array.from(document.styleSheets);
      let cssText = '';
      for (const sheet of styleSheets) {
        try {
          const rules = Array.from(sheet.cssRules || []);
          cssText += rules.map(r => r.cssText).join('\n');
        } catch {
          // Cross-origin stylesheets — skip
        }
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${data.number} - ${TYPE_LABELS[data.type]}</title>
          <style>
            ${cssText}
            body { margin: 0; padding: 20px; background: white; }
            .doc-print-area { box-shadow: none !important; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          ${printContent.outerHTML}
          <script>
            setTimeout(function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }, 300);
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (e) {
      console.error('Download error:', e);
      alert('Failed to generate document. Please try Print instead.');
    }
    setDownloading(false);
  }, [data]);

  if (!open) return null;

  return (
    <div className="doc-viewer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="doc-viewer-container">
        {/* Toolbar */}
        <div className="doc-viewer-toolbar">
          <div className="doc-viewer-toolbar-left">
            <span className="doc-viewer-toolbar-title">{TYPE_LABELS[data.type]}</span>
            <span className="doc-viewer-toolbar-number">{data.number}</span>
          </div>
          <div className="doc-viewer-toolbar-actions">
            <button
              className="doc-viewer-btn"
              onClick={handlePrint}
              title="Print Document"
              id="btn-print-document"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </button>
            <button
              className="doc-viewer-btn"
              onClick={handleDownload}
              disabled={downloading}
              title="Download as PDF"
              id="btn-download-document"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {downloading ? 'Preparing...' : 'Download'}
            </button>
            <button
              className="doc-viewer-btn doc-viewer-btn-close"
              onClick={onClose}
              title="Close"
              id="btn-close-document-viewer"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Preview */}
        <div className="doc-viewer-scroll">
          <DocumentTemplate data={data} printRef={printRef} />
        </div>
      </div>
    </div>
  );
}

// ─── Quick Action Buttons (for table rows) ──────────────────

interface DocActionButtonsProps {
  onView: () => void;
  onPrint?: () => void;
}

export function DocActionButtons({ onView }: DocActionButtonsProps) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      <button
        className="btn btn-ghost doc-action-btn"
        onClick={(e) => { e.stopPropagation(); onView(); }}
        title="View Document"
        style={{ fontSize: '0.72rem', padding: '0.2rem 0.4rem' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
        </svg>
        View
      </button>
    </div>
  );
}
