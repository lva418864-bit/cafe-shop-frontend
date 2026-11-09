import { describe, it, expect } from 'vitest';
import { buildLoginUrl, sanitizeNextPath } from '../safeNextPath';

describe('safeNextPath helper', () => {
  it('accepts valid internal relative paths starting with a single slash', () => {
    expect(sanitizeNextPath('/checkout')).toBe('/checkout');
    expect(sanitizeNextPath('/products/42')).toBe('/products/42');
    expect(sanitizeNextPath('/orders?page=2')).toBe('/orders?page=2');
  });

  it('rejects open-redirect vectors and falls back to /', () => {
    expect(sanitizeNextPath('//evil.com')).toBe('/');
    expect(sanitizeNextPath('https://evil.com')).toBe('/');
    expect(sanitizeNextPath('http://evil.com/login')).toBe('/');
    expect(sanitizeNextPath('javascript:alert(1)')).toBe('/');
    expect(sanitizeNextPath('/javascript:alert(1)')).toBe('/');
    expect(sanitizeNextPath('\\evil')).toBe('/');
    expect(sanitizeNextPath('/\\evil.com')).toBe('/');
    expect(sanitizeNextPath('/%2fevil.com')).toBe('/');
    expect(sanitizeNextPath('/%5cevil.com')).toBe('/');
    expect(sanitizeNextPath('')).toBe('/');
    expect(sanitizeNextPath(null)).toBe('/');
    expect(sanitizeNextPath(undefined)).toBe('/');
  });

  it('builds safe login URLs with encoded next parameter', () => {
    expect(buildLoginUrl('/checkout')).toBe('/login?next=%2Fcheckout');
    expect(buildLoginUrl('/products/15')).toBe('/login?next=%2Fproducts%2F15');
    expect(buildLoginUrl('//evil.com')).toBe('/login');
    expect(buildLoginUrl('https://evil.com')).toBe('/login');
  });
});
