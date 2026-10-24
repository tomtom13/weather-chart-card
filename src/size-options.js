// One inventory shared by YAML validation and the visual configurator.
export const SIZE_GROUPS = [
  ['Current conditions', [
    ['title', 'Card title'],
    ['current_icon', 'Current weather icon'],
    ['current_temperature', 'Current temperature number'],
    ['current_temperature_unit', 'Current temperature unit'],
    ['current_condition', 'Current condition text'],
    ['feels_like_label', 'Feels-like label'],
    ['feels_like_value', 'Feels-like number'],
    ['feels_like_unit', 'Feels-like unit'],
    ['description', 'Weather description'],
    ['current_time', 'Clock'],
    ['current_day', 'Day of week'],
    ['current_date', 'Date'],
  ]],
  ['Attributes', [
    ['humidity_value', 'Humidity number'], ['humidity_unit', 'Humidity unit'], ['humidity_icon', 'Humidity icon'],
    ['pressure_value', 'Pressure number'], ['pressure_unit', 'Pressure unit'], ['pressure_icon', 'Pressure icon'],
    ['wind_direction_value', 'Wind direction text'], ['wind_direction_icon', 'Wind direction icon'],
    ['wind_speed_value', 'Current wind-speed number'], ['wind_speed_unit', 'Current wind-speed unit'], ['wind_speed_icon', 'Current wind-speed icon'],
    ['wind_gust_value', 'Wind-gust number'], ['wind_gust_unit', 'Wind-gust unit'], ['wind_gust_icon', 'Wind-gust icon'],
    ['dew_point_value', 'Dew-point number'], ['dew_point_unit', 'Dew-point unit'], ['dew_point_icon', 'Dew-point icon'],
    ['visibility_value', 'Visibility number'], ['visibility_unit', 'Visibility unit'], ['visibility_icon', 'Visibility icon'],
    ['sunrise_time', 'Sunrise time'], ['sunrise_icon', 'Sunrise icon'],
    ['sunset_time', 'Sunset time'], ['sunset_icon', 'Sunset icon'],
    ['uv_label', 'UV label'], ['uv_value', 'UV number'], ['uv_icon', 'UV icon'],
  ]],
  ['Forecast', [
    ['forecast_labels', 'Forecast day/hour labels'],
    ['forecast_temperature_high', 'Forecast high-temperature labels'],
    ['forecast_temperature_low', 'Forecast low-temperature labels'],
    ['forecast_precipitation', 'Forecast precipitation labels'],
    ['forecast_condition_icon', 'Forecast condition icons'],
    ['forecast_wind_speed', 'Forecast wind-speed number'],
    ['forecast_wind_unit', 'Forecast wind-speed unit'],
    ['forecast_wind_icon', 'Forecast wind-direction icons'],
    ['tooltip_title', 'Chart tooltip title'], ['tooltip_body', 'Chart tooltip values'],
  ]],
  ['Other text', [
    ['updated_text', 'Last-updated text'], ['updated_number', 'Last-updated number'],
    ['error_text', 'Missing-weather message'],
  ]],
].map(([title, fields]) => ({ title, fields: fields.map(([key, label]) => ({ key, label })) }));

const SIZE_KEYS = new Set(SIZE_GROUPS.flatMap(group => group.fields.map(field => field.key)));

export function normaliseSizeOffsets(value) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('size_offsets must be a mapping of size names to signed pixel offsets');
  }
  return Object.fromEntries(Object.entries(value).map(([key, offset]) => {
    if (!SIZE_KEYS.has(key)) throw new Error(`Unknown size_offsets item: ${key}`);
    if (!['number', 'string'].includes(typeof offset) || String(offset).trim() === '' || !Number.isFinite(Number(offset))) {
      throw new Error(`size_offsets.${key} must be a finite signed number`);
    }
    return [key, Number(offset)];
  }));
}
