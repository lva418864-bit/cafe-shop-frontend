/**
 * Backend timestamps are naive ISO datetimes (no timezone suffix, straight
 * from Python's datetime.now()) - treated here as local time as-is, not
 * assumed to be UTC.
 */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
}

/** report_service's start_date/end_date query params expect plain YYYY-MM-DD. */
export function toApiDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}
