import { entriesWithType } from '#src/utils/typings.js';
import type { SpringParams } from './spring-schema.js';
import { defaultSpringParams, springParamsSchema } from './spring-schema.js';

export function resetUrlParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('stiffness');
  url.searchParams.delete('damping');
  url.searchParams.delete('mass');
  window.history.replaceState({}, '', url.toString());
}

// Update URL parameters
export function updateUrlParams(params: Partial<SpringParams>): void {
  const url = new URL(window.location.href);
  for (const [key, value] of entriesWithType(params)) {
    if (value === undefined || !Number.isFinite(value) || value <= 0) continue;
    // Compare at the same precision used in the URL, including batch writes.
    const rounded = Number(value.toFixed(2));
    const formatted = String(rounded === 0 ? value : rounded);
    if (formatted === String(defaultSpringParams[key])) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, formatted);
    }
  }

  // Update URL without refreshing the page
  window.history.replaceState({}, '', url.toString());
}

// Get parameters from URL without default values
export function getSpringParamsFromUrl(url: URL): Partial<SpringParams> {
  const params: Partial<SpringParams> = {};

  // Validate and update each parameter individually
  const stiffnessResult = springParamsSchema.shape.stiffness.safeParse(url.searchParams.get('stiffness'));
  if (stiffnessResult.success) {
    params.stiffness = stiffnessResult.data;
  }

  const dampingResult = springParamsSchema.shape.damping.safeParse(url.searchParams.get('damping'));
  if (dampingResult.success) {
    params.damping = dampingResult.data;
  }

  const massResult = springParamsSchema.shape.mass.safeParse(url.searchParams.get('mass'));
  if (massResult.success) {
    params.mass = massResult.data;
  }

  return params;
}

// Get parameters from URL with default values
export function getSpringParamsFromUrlWithDefaultValues(url: URL): SpringParams {
  const urlParams = getSpringParamsFromUrl(url);
  return { ...structuredClone(defaultSpringParams), ...urlParams };
}
