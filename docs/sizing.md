# Signed size adjustments

Use `size_offsets` in card YAML, or open **Sizes** in the visual card configurator. Each item is an independent signed **CSS-pixel offset**, not a replacement size or typographic-point value.

- Omitted items and `0` preserve the existing size. `+2` adds two pixels; `-2` subtracts two.
- Existing settings such as `current_temp_size`, `time_size`, `day_date_size`, `icons_size` and `forecast.labels_font_size` remain the relevant baselines. Inherited text and titles retain their theme baseline.
- Final sizes cannot fall below 1 px. Values must be finite numbers; signed numeric YAML strings are accepted. Unknown keys are rejected rather than silently ignored.
- A forecast role applies to every matching point. The wind-number offset does not change wind units or icons.
- Chart temperature/precipitation and tooltip-value offsets size complete labels, including any unit symbols or probability text in those labels. They do not resize individual characters separately.
- These are size controls, not chart-height or automatic-fit controls. Large adjustments can require more room.

## Example

```yaml
type: custom:weather-chart-card
entity: weather.home
size_offsets:
  current_temperature: +2
  current_temperature_unit: -1
  forecast_wind_speed: +3
```

The normal 11 px forecast wind-speed number becomes 14 px with `forecast_wind_speed: +3`; its 9 px unit remains unchanged. Configure each card independently.

## Visual configurator

Open **Sizes**, expand a group, enter signed adjustments in the number boxes and save through the normal HASS dashboard editor. Every YAML name below has a matching GUI control. Editing one group preserves offsets in the other groups.

## Complete size inventory

### Current conditions

| YAML key under `size_offsets` | Displayed role |
|---|---|
| `title` | Card title |
| `current_icon` | Current weather icon |
| `current_temperature` | Current temperature number |
| `current_temperature_unit` | Current temperature unit |
| `current_condition` | Current condition text |
| `feels_like_label` | Feels-like label |
| `feels_like_value` | Feels-like number |
| `feels_like_unit` | Feels-like unit |
| `description` | Weather description |
| `current_time` | Clock |
| `current_day` | Day of week |
| `current_date` | Date |

### Attributes

| YAML key under `size_offsets` | Displayed role |
|---|---|
| `humidity_value` | Humidity number |
| `humidity_unit` | Humidity unit |
| `humidity_icon` | Humidity icon |
| `pressure_value` | Pressure number |
| `pressure_unit` | Pressure unit |
| `pressure_icon` | Pressure icon |
| `wind_direction_value` | Wind direction text |
| `wind_direction_icon` | Wind direction icon |
| `wind_speed_value` | Current wind-speed number |
| `wind_speed_unit` | Current wind-speed unit |
| `wind_speed_icon` | Current wind-speed icon |
| `wind_gust_value` | Wind-gust number |
| `wind_gust_unit` | Wind-gust unit |
| `wind_gust_icon` | Wind-gust icon |
| `dew_point_value` | Dew-point number |
| `dew_point_unit` | Dew-point unit |
| `dew_point_icon` | Dew-point icon |
| `visibility_value` | Visibility number |
| `visibility_unit` | Visibility unit |
| `visibility_icon` | Visibility icon |
| `sunrise_time` | Sunrise time |
| `sunrise_icon` | Sunrise icon |
| `sunset_time` | Sunset time |
| `sunset_icon` | Sunset icon |
| `uv_label` | UV label |
| `uv_value` | UV number |
| `uv_icon` | UV icon |

### Forecast

| YAML key under `size_offsets` | Displayed role |
|---|---|
| `forecast_labels` | Forecast day/hour labels |
| `forecast_temperature_high` | Forecast high-temperature labels |
| `forecast_temperature_low` | Forecast low-temperature labels |
| `forecast_precipitation` | Forecast precipitation labels |
| `forecast_condition_icon` | Forecast condition icons |
| `forecast_wind_speed` | Forecast wind-speed number |
| `forecast_wind_unit` | Forecast wind-speed unit |
| `forecast_wind_icon` | Forecast wind-direction icons |
| `tooltip_title` | Chart tooltip title |
| `tooltip_body` | Chart tooltip values |

### Other text

| YAML key under `size_offsets` | Displayed role |
|---|---|
| `updated_text` | Last-updated text |
| `updated_number` | Last-updated number |
| `error_text` | Missing-weather message |
