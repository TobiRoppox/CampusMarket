/**
 * Format a number as Philippine Peso currency.
 * @param {number|string} amount
 * @param {object} options
 * @returns {string}
 */
export function formatCurrency(amount, options = {}) {
  const {
    currency = "PHP",
    symbol = "₱",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  const num = Number(amount);
  if (isNaN(num)) return `${symbol}0.00`;

  const formatted = num.toLocaleString("en-PH", {
    minimumFractionDigits,
    maximumFractionDigits,
  });

  return `${symbol}${formatted}`;
}

/**
 * Shorthand: ₱1,234.56
 */
export const fmt = formatCurrency;

/**
 * Compact format for large numbers: ₱1.2K, ₱1.5M
 */
export function formatCompact(amount) {
  const num = Number(amount);
  if (isNaN(num)) return "₱0";
  if (num >= 1_000_000) return `₱${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `₱${(num / 1_000).toFixed(1)}K`;
  return `₱${num.toFixed(2)}`;
}

export default formatCurrency;
