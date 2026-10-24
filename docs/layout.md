# Forecast units and spacing

The visual card configurator has a **Layout** page for these settings. They are also ordinary card YAML options. Wind speed conversion is selected under **Units**.

| YAML item | Default | Choices / meaning |
|---|---|---|
| `forecast.wind_unit_position` | `inline` | `inline`, `below`, `hidden`: wind-speed unit beside the number, under it, or omitted. |
| `forecast.precipitation_unit_position` | `inline` | `inline`, `below`, `hidden`: unit beside the precipitation number, under it, or omitted. Applies to mm/in and percentage units when shown. |
| `forecast.precipitation_border` | `true` | `false` removes the precipitation label's border and background only. Temperature-label styling is not changed. |
| `forecast.precipitation_border_color` | empty (bar color) | CSS outline color, e.g. `'#000000'`, independent of bar/text colors. Requires `precipitation_border: true`; blank inherits the precipitation bar color. |
| `padding_scale` | `0.7` | Non-negative spacing multiplier. The default gives 30% less padding/gap/margin; `1` restores original spacing and `0` removes adjustable spacing. |
| `forecast.grid_line_width` | `2` | Vertical day/hour separator thickness in CSS pixels (minimum 1). The default is 1 px thicker than the original. Set `1` to restore the original weight. Does not change temperature lines or precipitation outlines; also available under Layout. |
| `forecast.labels_bold` | `false` | Bold (`true`) or normal (`false`) forecast day/hour column labels. |
| `forecast.weekday_format` | `short` | Daily forecast weekday names: `short` (Mon) or `long` (Monday), in the configured locale. |
| `units.speed` | Weather entity unit | The unit for all wind values in this card: `m/s`, `km/h`, `mph`, `kn`, `ft/s`, `Bft`. Native `Beaufort` is also accepted. An empty value follows the weather entity. |

## Compact example

```yaml
type: custom:weather-chart-card
entity: weather.home
padding_scale: 0.7
units:
  speed: mph
size_offsets:
  forecast_wind_speed: +3
  forecast_wind_unit: +3
forecast:
  wind_unit_position: hidden
  labels_bold: false
  weekday_format: short
  precipitation_unit_position: hidden
  precipitation_border: false
```

Merge these items into the existing configuration; do not discard its other forecast settings. Configure daily and hourly card instances separately. A chosen unit applies everywhere within a card; one card's setting does not silently overwrite another card's configuration.

## Wind data, labels and sizing

Current speed, gusts and forecast speeds use one conversion path before receiving the selected unit label. Alternative current/gust sensors use their `unit_of_measurement` when available. The weather entity's reported unit is used for forecast data and as the fallback for alternative sensors without unit metadata. Conversion updates when the card configuration or entity unit changes. Beaufort conversion uses the same formulas as Home Assistant's SpeedConverter.

Unavailable/non-numeric forecast speeds show an em dash instead of a made-up zero. Unsupported explicit target units are rejected; unconvertible values are not relabelled as if conversion succeeded.

Unit positioning does not override font sizes. `size_offsets.forecast_wind_speed` controls only the number (normal 11 px); `size_offsets.forecast_wind_unit` controls only the unit (normal 9 px). With +3 on both, they are 14 px and 12 px, including when stacked. Hiding a unit hides its text, not the underlying data or conversion.

## Precipitation labels

Disabling the border removes the visible precipitation label box, not the precipitation bars or the temperature labels. Unit placement applies to the precipitation label and its supplementary probability label, if enabled. Hidden units do not remove the precipitation/probability numbers. Tooltip values retain unit context.

## What spacing scaling changes

The multiplier applies to the card's inner frame padding, native title padding, header/attribute gaps, icon and forecast-item margins, chart padding, label padding and tooltip spacing. Zero margins in a surrounding layout remain zero. It does **not** shrink font/icon sizes, chart height, border thickness, rounded frame corners, or unrelated dashboards' configuration. Use the independent [size offsets](sizing.md) for text and icon dimensions.

The default is 0.7, including when the YAML key is omitted and when opening the configurator. Existing cards without an explicit value inherit that compact spacing. Set `padding_scale: 1` to keep the original spacing. Changes are previewed and installed using the [normal HACS workflow](development.md).

## Forecast day/hour labels

The **Layout** configurator exposes bold/normal text and short/long weekday names. The independent **Sizes -> Forecast day/hour labels** adjustment is `size_offsets.forecast_labels`; `+2` changes the normal 12 px baseline to 14 px without changing temperature or wind labels. Weekday names use the locale's normal capitalization. Header clock/day formatting is separate.

Hourly column labels always reserve two lines. Hours have no minutes: `use_12hour_format: false` shows `13`, `14`, `15`; `true` shows plain `1`, `2`, `3`. In 12-hour mode, AM/PM appears in the upper row at the first point and whenever the half-day changes, including when the window starts after noon. Midnight shares that row with its date (for example `Oct 25 · AM`). In 24-hour mode the upper row carries only date boundaries. The plot and container retain their height across these transitions. This changes neither the header clock nor tooltip formatting.

Hourly dividers are positioned from every forecast column independently of label thinning. Skipping an hour label must not remove or shift its column boundary; temperature points, condition icons and wind entries retain one regularly spaced slot per forecast entry.

## Forecast availability

`forecast.number_of_forecasts` is a display maximum, not a request for the weather provider to generate more days. The card cannot display more forecast entries than its weather entity supplies. Increasing the value beyond the available feed length does not extend that feed.
