import { normalizeSpring } from '#src/utils/spring-physics.js';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getSpringParamsFromUrl,
  getSpringParamsFromUrlWithDefaultValues,
  updateUrlParams,
} from './spring-url-params.js';

describe('spring-url-params', () => {
  describe('getSpringParamsFromUrl', () => {
    it('parses valid parameters from URL', () => {
      const url = new URL('https://example.com?stiffness=200&damping=30&mass=2');
      const result = getSpringParamsFromUrl(url);

      expect(result).toEqual({ stiffness: 200, damping: 30, mass: 2 });
    });

    it('returns empty object for invalid parameters', () => {
      const url = new URL('https://example.com?stiffness=invalid&damping=-1');
      const result = getSpringParamsFromUrl(url);

      expect(result).toEqual({});
    });

    it('returns partial result for mixed valid/invalid', () => {
      const url = new URL('https://example.com?stiffness=300&damping=invalid');
      const result = getSpringParamsFromUrl(url);

      expect(result).toEqual({ stiffness: 300 });
    });
  });

  describe('getSpringParamsFromUrlWithDefaultValues', () => {
    it('merges URL params with defaults', () => {
      const url = new URL('https://example.com?stiffness=200');
      const result = getSpringParamsFromUrlWithDefaultValues(url);

      expect(result.stiffness).toBe(200);
      expect(result.damping).toBe(40); // default
      expect(result.mass).toBe(1); // default
    });

    it('returns all defaults when no params', () => {
      const url = new URL('https://example.com');
      const result = getSpringParamsFromUrlWithDefaultValues(url);

      expect(result).toEqual({ stiffness: 400, damping: 40, mass: 1 });
    });
  });
});

describe('updateUrlParams', () => {
  const originalUrl = window.location.href;
  afterEach(() => window.history.replaceState({}, '', originalUrl));

  it('removes defaults even when the existing URL already contains the same value', () => {
    window.history.replaceState({}, '', '/?stiffness=400&damping=80&mass=2&other=keep#curve');
    updateUrlParams({ stiffness: 400, mass: 1 });
    expect(window.location.search).toBe('?damping=80&other=keep');
    expect(window.location.hash).toBe('#curve');
    updateUrlParams({ damping: 40.001 });
    expect(window.location.search).toBe('?other=keep');
  });

  it('preserves small positive values instead of serializing an invalid zero', () => {
    updateUrlParams({ stiffness: 0.001, damping: 0.0001, mass: 0.002 });
    expect(getSpringParamsFromUrl(new URL(window.location.href))).toEqual({
      stiffness: 0.001,
      damping: 0.0001,
      mass: 0.002,
    });
  });

  it('omits defaults produced by Normalize and round-trips remaining values', () => {
    window.history.replaceState({}, '', '/?stiffness=800&damping=160&mass=2');
    const normalized = normalizeSpring(800, 160, 2);
    updateUrlParams(normalized);
    expect(window.location.search).toBe('?damping=80');
    expect(getSpringParamsFromUrlWithDefaultValues(new URL(window.location.href))).toEqual(normalized);
    updateUrlParams(normalizeSpring(800, 80, 2));
    expect(window.location.search).toBe('');
  });
});
