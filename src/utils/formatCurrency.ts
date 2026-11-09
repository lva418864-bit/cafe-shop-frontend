import { parseDecimal } from '@/lib/decimal';

export function formatCurrency(value: string | number, currency = 'USD'): string {
  const numericValue = parseDecimal(value);
  if (currency.toUpperCase() === 'KHR') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(numericValue))} ៛`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    numericValue,
  );
}
