// ============================================================
// ERPEX — Formatting Utilities
// ============================================================

/**
 * Format number as currency (INR by default)
 */
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with commas (Indian numbering)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date for input fields (YYYY-MM-DD)
 */
export function toInputDate(date?: string | Date): string {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

/**
 * Get account type badge class
 */
export function getAccountTypeBadge(type: string): string {
  return `badge badge-${type.toLowerCase()}`;
}

/**
 * Get status badge class
 */
export function getStatusBadge(status: string): string {
  return `badge badge-${status.toLowerCase()}`;
}
