/**
 * The backend serializes Python Decimal fields (price, total_amount,
 * unit_price, subtotal, revenue, average_order_value, ...) as JSON
 * strings - e.g. "3.50", not 3.5 - to preserve precision. This is the one
 * place that turns those strings into numbers, so no feature has to think
 * about it directly or risk a raw parseFloat() on a value that might
 * already be a number in a mocked/test context.
 */
export function parseDecimal(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
