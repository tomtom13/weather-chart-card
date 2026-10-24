// Native editor field inventory. Defaults mirror the renderer's public contract.
import locale from './locale.js';
import { WIND_SPEED_UNITS } from './wind.js';
import { PRESSURE_UNITS } from './measurements.js';
const field = (name, label, selector, defaultValue, required = false) => ({ name, label, selector, defaultValue, required });
const bool = (name, label, value) => field(name, label, { boolean: {} }, value);
const text = (name, label, value = '') => field(name, label, { text: {} }, value);
const number = (name, label, value, min = 1, max) => field(name, label, { number: { mode: 'box', min, step: 1, ...(max === undefined ? {} : { max }) } }, value);
const select = (name, label, options, value) => field(name, label, { select: { mode: 'dropdown', options: options.map(option => typeof option === 'string' ? { value: option, label: option } : option) } }, value);
const positions = [{ value: 'inline', label: 'Beside number' }, { value: 'below', label: 'Below number' }, { value: 'hidden', label: 'Hidden' }];
const languageNames = new Intl.DisplayNames(['en'], { type: 'language' });

export const MAIN_FIELDS = [
  field('entity', 'Weather entity', { entity: { domain: 'weather' } }, undefined, true),
  text('title', 'Title'),
  select('locale', 'Language', [{ value: 'auto', label: 'HASS default' }, ...Object.keys(locale).map(value => ({ value, label: languageNames.of(value) }))], 'auto'),
  bool('show_main', 'Show weather summary', true),
  bool('show_temperature', 'Show temperature', true),
  bool('show_current_condition', 'Show condition text', true),
  bool('show_attributes', 'Show weather attributes', true),
  select('attributes_position', 'Attributes position', [{ value: 'row', label: 'Separate row' }, { value: 'center', label: 'Header — centre' }, { value: 'left', label: 'Header — left' }], 'row'),
  bool('show_humidity', 'Show humidity', true),
  bool('show_pressure', 'Show pressure', true),
  bool('show_wind_direction', 'Show wind direction', true),
  bool('show_wind_speed', 'Show current wind speed', true),
  bool('show_sun', 'Show sunrise and sunset', true),
  bool('show_feels_like', 'Show feels-like temperature', false),
  bool('show_dew_point', 'Show dew point', false),
  bool('show_wind_gust_speed', 'Show wind gust speed', false),
  bool('show_visibility', 'Show visibility', false),
  bool('show_description', 'Show weather description', false),
  bool('show_last_changed', 'Show last-changed time', false),
  bool('show_time', 'Show clock', false),
  bool('show_time_seconds', 'Show clock seconds', false),
  bool('show_day', 'Show current weekday', false),
  bool('show_date', 'Show current date', false),
  bool('use_12hour_format', 'Use 12-hour clock', false),
  bool('autoscroll', 'Scroll past forecast points automatically', false),
  bool('animated_icons', 'Use animated weather icons', false),
  select('icon_style', 'Animated icon set', ['style1', 'style2'], 'style1'),
  text('icons', 'Custom SVG icon base URL'),
  number('icons_size', 'Animated/custom forecast icon baseline (px)', 25),
  number('current_temp_size', 'Current temperature baseline (px)', 28),
  number('time_size', 'Clock baseline (px)', 26),
  number('day_date_size', 'Current day/date baseline (px)', 15),
];

export const FORECAST_FIELDS = [
  select('type', 'Forecast type', [{ value: 'daily', label: 'Daily' }, { value: 'hourly', label: 'Hourly' }], 'daily'),
  select('style', 'Chart style', [{ value: 'style1', label: 'Style 1 — boxed values' }, { value: 'style2', label: 'Style 2 — plain values' }], 'style1'),
  select('precipitation_type', 'Precipitation data', [{ value: 'rainfall', label: 'Amount' }, { value: 'probability', label: 'Probability' }], 'rainfall'),
  bool('show_probability', 'Also show precipitation probability', false),
  bool('condition_icons', 'Show forecast condition icons', true),
  bool('show_wind_forecast', 'Show forecast wind indicators', true),
  bool('round_temp', 'Round forecast temperatures', false),
  bool('disable_animation', 'Disable chart animation', false),
  number('number_of_forecasts', 'Forecast points (0 = automatic)', 0, 0),
  number('chart_height', 'Chart height (px)', 180),
  number('labels_font_size', 'Temperature/precipitation label baseline (px)', 11),
  number('precip_bar_size', 'Precipitation bar width (%)', 100, 0, 100),
  text('temperature1_color', 'High-temperature line color', 'rgba(255, 152, 0, 1.0)'),
  text('temperature2_color', 'Low-temperature line color', 'rgba(68, 115, 158, 1.0)'),
  text('precipitation_color', 'Precipitation bar color', 'rgba(132, 209, 253, 1.0)'),
  text('chart_datetime_color', 'Day/hour label color (blank = theme)'),
  text('chart_text_color', 'Value label color (blank = default, auto = theme)'),
];

export const UNIT_FIELDS = [
  select('speed', 'Wind unit (current, gusts and forecasts)', [{ value: 'auto', label: 'Weather entity' }, ...WIND_SPEED_UNITS.filter(value => value !== 'Beaufort')], 'auto'),
  select('pressure', 'Pressure unit', [{ value: 'auto', label: 'Weather entity' }, ...PRESSURE_UNITS], 'hPa'),
  select('visibility', 'Visibility unit', [{ value: 'auto', label: 'Weather entity' }, 'km', 'mi'], 'auto'),
];

export const LAYOUT_FIELDS = [
  select('wind_unit_position', 'Forecast wind unit position', positions, 'inline'),
  select('precipitation_unit_position', 'Precipitation unit position', positions, 'inline'),
  bool('precipitation_border', 'Box around precipitation labels', true),
  text('precipitation_border_color', 'Precipitation outline color (blank = bar color)'),
  bool('labels_bold', 'Bold forecast day/hour labels', false),
  select('weekday_format', 'Daily forecast weekday names', [{ value: 'short', label: 'Short (Mon)' }, { value: 'long', label: 'Long (Monday)' }], 'short'),
  field('padding_scale', 'Spacing scale (0.70 = 30% less)', { number: { mode: 'box', min: 0, step: 0.01 } }, 0.7),
];

export const ALTERNATE_FIELDS = [
  ['temp', 'Alternative temperature sensor'], ['feels_like', 'Alternative feels-like sensor'],
  ['description', 'Alternative description sensor'], ['press', 'Alternative pressure sensor'],
  ['humid', 'Alternative humidity sensor'], ['uv', 'Alternative UV sensor'],
  ['winddir', 'Alternative wind-bearing sensor (degrees)'], ['windspeed', 'Alternative wind-speed sensor'],
  ['dew_point', 'Alternative dew-point sensor'], ['wind_gust_speed', 'Alternative gust sensor'],
  ['visibility', 'Alternative visibility sensor'],
].map(([name, label]) => field(name, label, { entity: { domain: 'sensor' } }, undefined));
