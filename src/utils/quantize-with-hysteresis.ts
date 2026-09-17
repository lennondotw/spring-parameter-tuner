/** Keep a 10%-of-step dead band on each side of the rounding boundary. */
export function quantizeWithHysteresis(raw: number, previous: number, decimals: number, min: number, max: number) {
  if (raw <= min) return min;
  if (raw >= max) return max;
  const quantum = 10 ** -decimals;
  const threshold = quantum * 0.6;
  const tolerance = Number.EPSILON * Math.max(1, Math.abs(raw), Math.abs(previous)) * 8;
  if (Math.abs(raw - previous) <= threshold + tolerance) return previous;
  return Math.min(max, Math.max(min, Number(raw.toFixed(decimals))));
}
