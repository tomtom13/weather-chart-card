// Weather values have already been converted by HASS into the entity's reported
// units. Only convert when a target or alternative sensor uses a different unit.
export const PRESSURE_UNITS = ['hPa', 'kPa', 'mbar', 'inHg', 'mmHg'];
const HPA = { hPa: 1, kPa: 10, mbar: 1, inHg: 33.8638866667, mmHg: 1.33322387415 };
const METRES = { m: 1, km: 1000, mi: 1609.344, ft: 0.3048 };
const number = value => value === undefined || value === null || value === '' || !Number.isFinite(Number(value)) ? undefined : Number(value);
export { number as numericValue };

export function convertTemperature(value, from, to) {
  const n = number(value);
  if (n === undefined || from === to) return n;
  const celsius = from === '°C' ? n : from === '°F' ? (n - 32) * 5 / 9 : from === 'K' ? n - 273.15 : undefined;
  if (celsius === undefined) return undefined;
  const converted = to === '°C' ? celsius : to === '°F' ? celsius * 9 / 5 + 32 : to === 'K' ? celsius + 273.15 : undefined;
  return converted === undefined ? undefined : Number(converted.toFixed(2));
}

export function convertPressure(value, from, to) {
  const n = number(value);
  if (n === undefined || !HPA[from] || !HPA[to]) return undefined;
  const converted = n * HPA[from] / HPA[to];
  if (to === 'inHg') return converted.toFixed(2);
  if (to === 'hPa' || to === 'mmHg') return Math.round(converted);
  return Number(converted.toFixed(2));
}

export function convertVisibility(value, from, to) {
  const n = number(value);
  if (n === undefined || from === to) return n;
  if (!METRES[from] || !METRES[to]) return undefined;
  return Number((n * METRES[from] / METRES[to]).toFixed(2));
}
