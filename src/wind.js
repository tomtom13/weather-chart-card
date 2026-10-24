// Weather/forecast values use the weather entity's reported unit; alternate
// sensors can supply their own unit_of_measurement. Convert before labelling.
export const WIND_SPEED_UNITS = ['m/s', 'km/h', 'mph', 'kn', 'ft/s', 'Bft', 'Beaufort'];
const METRES_PER_SECOND = { 'm/s': 1, 'km/h': 1 / 3.6, mph: 0.44704, kn: 1852 / 3600, 'ft/s': 0.3048 };
const beaufort = unit => unit === 'Bft' || unit === 'Beaufort';

export function convertWindSpeed(value, from, to) {
  if (value === undefined || value === null || value === '') return undefined;
  const speed = Number(value);
  if (!Number.isFinite(speed) || speed < 0) return undefined;
  if (from === to || (beaufort(from) && beaufort(to))) return Math.round(speed);
  // Same Beaufort formulas as Home Assistant's SpeedConverter.
  const metres = beaufort(from) ? 0.836 * Math.pow(speed, 1.5) : speed * METRES_PER_SECOND[from];
  if (!Number.isFinite(metres)) return undefined;
  if (beaufort(to)) return Math.round(Math.pow(metres / 0.836, 2 / 3));
  const converted = metres / METRES_PER_SECOND[to];
  return Number.isFinite(converted) ? Math.round(converted) : undefined;
}
