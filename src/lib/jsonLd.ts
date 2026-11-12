/**
 * Safely serializes structured data into JSON-LD script strings.
 * Prevents XSS / script breakout by escaping `<` characters.
 */
export function safeJsonLdStringify(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
