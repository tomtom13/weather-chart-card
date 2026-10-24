import locale from './locale.js';
import { normaliseSizeOffsets } from './size-options.js';
import { convertWindSpeed, WIND_SPEED_UNITS } from './wind.js';
import { convertTemperature, convertPressure, convertVisibility, numericValue, PRESSURE_UNITS } from './measurements.js';
import {
  cardinalDirectionsIcon,
  weatherIcons,
  weatherIconsDay,
  weatherIconsNight,
  WeatherEntityFeature
} from './const.js';
import {LitElement, html} from 'lit';
import './weather-chart-card-editor.js';
import { property } from 'lit/decorators.js';
import {Chart, registerables} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

class WeatherChartCard extends LitElement {

static getConfigElement() {
  return document.createElement("weather-chart-card-editor");
}

static getStubConfig(hass, unusedEntities, allEntities) {
  let entity = unusedEntities.find((eid) => eid.split(".")[0] === "weather");
  if (!entity) {
    entity = allEntities.find((eid) => eid.split(".")[0] === "weather");
  }
  return {
    entity,
    padding_scale: 0.7,
    show_main: true,
    show_temperature: true,
    show_current_condition: true,
    show_attributes: true,
    attributes_position: 'row',
    use_12hour_format: false,
    show_time: false,
    show_time_seconds: false,
    show_day: false,
    show_date: false,
    show_humidity: true,
    show_pressure: true,
    show_wind_direction: true,
    show_wind_speed: true,
    show_sun: true,
    show_feels_like: false,
    show_dew_point: false,
    show_wind_gust_speed: false,
    show_visibility: false,
    show_last_changed: false,
    use_12hour_format: false,
    icons_size: 25,
    animated_icons: false,
    icon_style: 'style1',
    autoscroll: false,
    forecast: {
      precipitation_type: 'rainfall',
      show_probability: false,
      labels_font_size: '11',
      precip_bar_size: '100',
      style: 'style1',
      show_wind_forecast: true,
      condition_icons: true,
      round_temp: false,
      type: 'daily',
      number_of_forecasts: '0', 
      disable_animation: false, 
    },
  };
}

  static get properties() {
    return {
      _hass: {},
      config: {},
      language: {},
      sun: {type: Object},
      weather: {type: Object},
      temperature: {type: Object},
      humidity: {type: Object},
      pressure: {type: Object},
      windSpeed: {type: Object},
      windDirection: {type: Number},
      forecastChart: {type: Object},
      forecastItems: {type: Number},
      forecasts: { type: Array }
    };
  }

setConfig(config) {
  const cardConfig = {
    icons_size: 25,
    animated_icons: false,
    icon_style: 'style1',
    current_temp_size: 28,
    time_size: 26,
    day_date_size: 15,
    show_feels_like: false,
    show_dew_point: false,
    show_wind_gust_speed: false,
    show_visibility: false,
    show_last_changed: false,
    show_description: false,
    attributes_position: 'row',
    use_12hour_format: false,
    ...config,
    padding_scale: config.padding_scale === undefined ? 0.7 : Number(config.padding_scale),
    forecast: {
      labels_bold: false,
      weekday_format: 'short',
      grid_line_width: 2,
      wind_unit_position: 'inline',
      precipitation_unit_position: 'inline',
      precipitation_border: true,
      precipitation_border_color: '',
      precipitation_type: 'rainfall',
      show_probability: false,
      labels_font_size: 11,
      chart_height: 180,
      precip_bar_size: 100,
      style: 'style1',
      temperature1_color: 'rgba(255, 152, 0, 1.0)',
      temperature2_color: 'rgba(68, 115, 158, 1.0)',
      precipitation_color: 'rgba(132, 209, 253, 1.0)',
      condition_icons: true,
      show_wind_forecast: true,
      round_temp: false,
      type: 'daily',
      number_of_forecasts: '0',
      '12hourformat': false,
      ...config.forecast,
    },
    units: {
      pressure: 'hPa',
      ...config.units,
    }
  };

  cardConfig.size_offsets = normaliseSizeOffsets(config.size_offsets);
  cardConfig.units.speed = config.speed ? config.speed : cardConfig.units.speed;
  if ((config.padding_scale !== undefined && (!['number', 'string'].includes(typeof config.padding_scale) || String(config.padding_scale).trim() === '')) ||
      !Number.isFinite(cardConfig.padding_scale) || cardConfig.padding_scale < 0) {
    throw new Error('padding_scale must be a non-negative number');
  }
  const gridWidth = cardConfig.forecast.grid_line_width;
  if (!['number', 'string'].includes(typeof gridWidth) || String(gridWidth).trim() === '' || !Number.isFinite(Number(gridWidth)) || Number(gridWidth) < 1) {
    throw new Error('forecast.grid_line_width must be a finite number of at least 1 px');
  }
  cardConfig.forecast.grid_line_width = Number(gridWidth);
  if (typeof cardConfig.forecast.precipitation_border !== 'boolean') {
    throw new Error('forecast.precipitation_border must be true or false');
  }
  if (typeof cardConfig.forecast.labels_bold !== 'boolean') {
    throw new Error('forecast.labels_bold must be true or false');
  }
  if (!['short', 'long'].includes(cardConfig.forecast.weekday_format)) {
    throw new Error('forecast.weekday_format must be short or long');
  }
  for (const key of ['wind_unit_position', 'precipitation_unit_position']) {
    if (!['inline', 'below', 'hidden'].includes(cardConfig.forecast[key])) {
      throw new Error(`forecast.${key} must be inline, below or hidden`);
    }
  }
  if (cardConfig.units.speed && !WIND_SPEED_UNITS.includes(cardConfig.units.speed)) {
    throw new Error(`Unsupported wind-speed unit: ${cardConfig.units.speed}`);
  }
  if (cardConfig.units.pressure && !PRESSURE_UNITS.includes(cardConfig.units.pressure)) throw new Error(`Unsupported pressure unit: ${cardConfig.units.pressure}`);
  if (cardConfig.units.visibility && !['km', 'mi'].includes(cardConfig.units.visibility)) throw new Error('units.visibility must be km or mi');
  if (cardConfig.locale) {
    try { Intl.getCanonicalLocales(cardConfig.locale); }
    catch (error) { throw new Error(`Invalid locale: ${cardConfig.locale}`); }
  }

  this.baseIconPath = new URL(cardConfig.icon_style === 'style2' ? './icons2/' : './icons/', import.meta.url).href;

  this.config = cardConfig;
  if (!config.entity) {
    throw new Error('Please, define entity in the card config');
  }
  if (this._hass) this.hass = this._hass;
}

set hass(hass) {
  this._hass = hass;
  this.language = this.config.locale || hass.selectedLanguage || hass.language;
  this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
  this.weather = this.config.entity in hass.states ? hass.states[this.config.entity] : null;
  this.unitSpeed = this.config.units.speed ? this.config.units.speed : this.weather && this.weather.attributes.wind_speed_unit;
  this.unitPressure = this.config.units.pressure ? this.config.units.pressure : this.weather && this.weather.attributes.pressure_unit;
  this.unitVisibility = this.config.units.visibility || (this.weather && this.weather.attributes.visibility_unit) || hass.config.unit_system.length;


  if (this.weather) {
    const temperatureUnit = this.getUnit('temperature');
    this.temperature = convertTemperature(this.sensorValue(this.config.temp, this.weather.attributes.temperature), this.sensorUnit(this.config.temp, temperatureUnit), temperatureUnit);
    this.humidity = numericValue(this.sensorValue(this.config.humid, this.weather.attributes.humidity));
    this.pressure = this.sensorValue(this.config.press, this.weather.attributes.pressure);
    this.uv_index = numericValue(this.sensorValue(this.config.uv, this.weather.attributes.uv_index));
    this.windSpeed = this.sensorValue(this.config.windspeed, this.weather.attributes.wind_speed);
    this.dew_point = convertTemperature(this.sensorValue(this.config.dew_point, this.weather.attributes.dew_point), this.sensorUnit(this.config.dew_point, temperatureUnit), temperatureUnit);
    this.wind_gust_speed = this.sensorValue(this.config.wind_gust_speed, this.weather.attributes.wind_gust_speed);
    const visibilitySource = this.weather.attributes.visibility_unit || hass.config.unit_system.length;
    this.visibility = convertVisibility(this.sensorValue(this.config.visibility, this.weather.attributes.visibility), this.sensorUnit(this.config.visibility, visibilitySource), this.unitVisibility);

    this.windDirection = this.config.winddir ? numericValue(this.sensorValue(this.config.winddir)) : this.weather.attributes.wind_bearing;

    this.feels_like = convertTemperature(this.sensorValue(this.config.feels_like, this.weather.attributes.apparent_temperature), this.sensorUnit(this.config.feels_like, temperatureUnit), temperatureUnit);
    this.description = this.sensorValue(this.config.description, this.weather.attributes.description);
  }

  if (this.isConnected) this.subscribeForecastEvents();
}

subscribeForecastEvents() {
  if (!this.isConnected || !this._hass || !this.config) return;
  if (!this.weather) {
    this.stopForecastSubscription();
    return;
  }
  const forecastType = this.config.forecast.type || 'daily';
  const isHourly = forecastType === 'hourly';
  const feature = isHourly ? WeatherEntityFeature.FORECAST_HOURLY : WeatherEntityFeature.FORECAST_DAILY;
  const supported = this.supportsFeature(feature);
  const key = `${this.config.entity}:${forecastType}`;
  const connection = this._hass.connection;
  if (this._forecastKey === key && this._forecastConnection === connection &&
      ((supported && this.forecastSubscriber) || (!supported && this._forecastUnsupported))) return;
  this.stopForecastSubscription();
  this._forecastKey = key;
  this._forecastConnection = connection;
  if (!supported) {
    this._forecastUnsupported = true;
    console.warn(`Weather entity "${this.config.entity}" does not support ${forecastType} forecasts.`);
    return;
  }
  const generation = this._forecastGeneration;
  const callback = (event) => {
    if (!this.isConnected || generation !== this._forecastGeneration) return;
    this.forecasts = Array.isArray(event.forecast) ? event.forecast : [];
    this.requestUpdate();
    this.updateComplete.then(() => {
      if (this.isConnected && generation === this._forecastGeneration) this.measureCard();
    }).catch(error => console.error('Weather Chart Card: forecast render failed', error));
  };
  try {
    this.forecastSubscriber = Promise.resolve(connection.subscribeMessage(callback, {
      type: 'weather/subscribe_forecast', forecast_type: forecastType, entity_id: this.config.entity,
    }));
    this.forecastSubscriber.catch(error => {
      if (generation === this._forecastGeneration) {
        this.forecastSubscriber = null;
        this._forecastKey = null;
        console.error('Weather Chart Card: forecast subscription failed', error);
      }
    });
  } catch (error) {
    this.forecastSubscriber = null;
    this._forecastKey = null;
    console.error('Weather Chart Card: forecast subscription failed', error);
  }
}

stopForecastSubscription() {
  this._forecastGeneration += 1;
  const subscription = this.forecastSubscriber;
  this.forecastSubscriber = null;
  this._forecastKey = null;
  this._forecastConnection = null;
  this._forecastUnsupported = false;
  if (subscription) Promise.resolve(subscription).then(unsubscribe => {
    if (typeof unsubscribe === 'function') return unsubscribe();
  }).catch(error => console.warn('Weather Chart Card: forecast cleanup failed', error));
  this.forecasts = [];
  if (this.forecastChart) this.forecastChart.destroy();
  this.forecastChart = null;
}

  supportsFeature(feature) {
    return (this.weather.attributes.supported_features & feature) !== 0;
  }

  constructor() {
    super();
    this.resizeObserver = null;
    this.resizeTimeout = null;
    this.clockInterval = null;
    this.forecastSubscriber = null;
    this.autoscrollTimeout = null;
    this._forecastGeneration = 0;
    this._forecastKey = null;
    this._forecastConnection = null;
    this._forecastUnsupported = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this.delayedAttachResizeObserver();
    if (this._hass && this.config) this.subscribeForecastEvents();
    if (this.config && this.config.autoscroll) this.autoscroll();
    this.requestUpdate();
  }

  delayedAttachResizeObserver() {
    if (this.resizeTimeout !== null) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      this.resizeTimeout = null;
      if (this.isConnected) this.attachResizeObserver();
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.resizeTimeout !== null) clearTimeout(this.resizeTimeout);
    this.resizeTimeout = null;
    this.detachResizeObserver();
    this.stopForecastSubscription();
    this.cancelAutoscroll();
    if (this.clockInterval !== null) clearInterval(this.clockInterval);
    this.clockInterval = null;
  }

  attachResizeObserver() {
    this.detachResizeObserver();
    const card = this.shadowRoot && this.shadowRoot.querySelector('ha-card');
    if (!card || !this.isConnected) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.measureCard();
    });
    this.resizeObserver.observe(card);
  }

  detachResizeObserver() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

measureCard() {
  const card = this.shadowRoot.querySelector('ha-card');
  let fontSize = Math.max(...['forecast_labels', 'forecast_temperature_high', 'forecast_temperature_low', 'forecast_precipitation']
    .map(key => this.size(key, this.config.forecast.labels_font_size)));
  const numberOfForecasts = this.config.forecast.number_of_forecasts || 0;

  if (!card) {
    return;
  }

  this.forecastItems = numberOfForecasts > 0 ? Math.floor(Number(numberOfForecasts)) : Math.max(1, Math.round(card.offsetWidth / (fontSize * 6)));
  this.drawChart();
}

ll(str) {
  const selectedLocale = this.config.locale || this.language || 'en';

  const dictionary = locale[selectedLocale] || locale[selectedLocale.split('-')[0]] || locale.en;
  return dictionary[str] === undefined ? locale.en[str] : dictionary[str];
}

  getCardSize() {
    return 4;
  }

  getUnit(unit) {
    if (unit === 'temperature' && this.weather && this.weather.attributes.temperature_unit) return this.weather.attributes.temperature_unit;
    return this._hass.config.unit_system[unit] || '';
  }

  getWeatherIcon(condition, sun) {
    if (!weatherIconsDay[condition]) return 'mdi:help-circle-outline';
    if (this.config.animated_icons === true) {
      const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
      return `${this.baseIconPath}${iconName}.svg`;
    } else if (this.config.icons) {
      const iconName = sun === 'below_horizon' ? weatherIconsNight[condition] : weatherIconsDay[condition];
      return `${this.config.icons}${iconName}.svg`;
    }
    return weatherIcons[condition];
  }

getWindDirIcon(deg) {
  if (typeof deg === 'number') {
    return cardinalDirectionsIcon[parseInt((deg + 22.5) / 45.0)];
  } else {
    var i = 9;
    switch (deg) {
      case "N":
        i = 0;
        break;
      case "NNE":
      case "NE":
        i = 1;
        break;
      case "ENE":
      case "E":
        i = 2;
        break;
      case "ESE":
      case "SE":
        i = 3;
        break;
      case "SSE":
      case "S":
        i = 4;
        break;
      case "SSW":
      case "SW":
        i = 5;
        break;
      case "WSW":
      case "W":
        i = 6;
        break;
      case "NW":
      case "NNW":
        i = 7;
        break;
      case "WNW":
        i = 8;
        break;
      default:
        i = 9;
        break;
    }
    return cardinalDirectionsIcon[i];
  }
}

getWindDir(deg) {
  if (typeof deg === 'number') {
    return this.ll('cardinalDirections')[parseInt((deg + 11.25) / 22.5)];
  } else {
    return deg;
  }
}

async firstUpdated(changedProperties) {
  super.firstUpdated(changedProperties);
  if (!this.config || !this.isConnected) return;
  this.attachResizeObserver();
  this.measureCard();
  await new Promise(resolve => setTimeout(resolve, 0));
  this.drawChart();

  if (this.config.autoscroll) {
    this.autoscroll();
  }
}


async updated(changedProperties) {
  await this.updateComplete;
  if (!this.isConnected || !this.config) return;

  if (changedProperties.has('config')) {
    this.subscribeForecastEvents();
    this.measureCard();
  }

  if (changedProperties.has('weather')) {
    this.updateChart();
  }
  if (!this.resizeObserver) this.attachResizeObserver();
  this.syncClock();
  if (this.config.autoscroll && this.weather) this.autoscroll();
  else this.cancelAutoscroll();
}

autoscroll() {
  if (!this.isConnected || !this.config || !this.config.autoscroll || !this.weather) return;
  if (this.autoscrollTimeout) {
    // Autscroll already set, nothing to do
    return;
  }

  const updateChartOncePerHour = () => {
    const now = new Date();
    const nextHour = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours()+1,
    );
    this.autoscrollTimeout = setTimeout(() => {
      this.autoscrollTimeout = null;
      if (!this.isConnected || !this.config.autoscroll) return;
      this.updateChart();
      this.requestUpdate();
      updateChartOncePerHour();
    }, nextHour - now);
  };

  updateChartOncePerHour();
}

cancelAutoscroll() {
  if (this.autoscrollTimeout) {
    clearTimeout(this.autoscrollTimeout);
  }
  this.autoscrollTimeout = null;
}

drawChart({ config, language, weather, forecastItems } = this) {
  if (!this.forecasts || !this.forecasts.length) {
    return [];
  }

  const chartCanvas = this.renderRoot && this.renderRoot.querySelector('#forecastChart');
  if (!chartCanvas) {
    console.error('Canvas element not found:', this.renderRoot);
    return;
  }

  if (this.forecastChart) {
    this.forecastChart.destroy();
  }
  var tempUnit = this.getUnit('temperature');
  var lengthUnit = this._hass.config.unit_system.length;
  if (config.forecast.precipitation_type === 'probability') {
    var precipUnit = '%';
  } else {
    var precipUnit = lengthUnit === 'km' ? this.ll('units')['mm'] : this.ll('units')['in'];
  }
  const data = this.computeForecastData();

  var style = getComputedStyle(document.body);
  var backgroundColor = style.getPropertyValue('--card-background-color');
  var textColor = style.getPropertyValue('--primary-text-color');
  var dividerColor = style.getPropertyValue('--divider-color');
  const canvas = this.renderRoot.querySelector('#forecastChart');
  if (!canvas) {
    requestAnimationFrame(() => this.drawChart());
    return;
  }

  const ctx = canvas.getContext('2d');

  let precipMax;

  if (config.forecast.precipitation_type === 'probability') {
    precipMax = 100;
  } else {
    if (config.forecast.type === 'hourly') {
      precipMax = lengthUnit === 'km' ? 4 : 1;
    } else {
      precipMax = lengthUnit === 'km' ? 20 : 1;
    }
  }

  Chart.defaults.color = textColor;
  Chart.defaults.scale.grid.color = dividerColor;
  Chart.defaults.elements.line.fill = false;
  Chart.defaults.elements.line.tension = 0.3;
  Chart.defaults.elements.line.borderWidth = 1.5;
  Chart.defaults.elements.point.radius = 2;
  Chart.defaults.elements.point.hitRadius = 10;

  var datasets = [
    {
      label: this.ll('tempHi'),
      type: 'line',
      data: data.tempHigh,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature1_color,
      backgroundColor: config.forecast.temperature1_color,
      datalabels: { font: { size: this.size('forecast_temperature_high', config.forecast.labels_font_size), lineHeight: 0.7 } },
    },
    {
      label: this.ll('tempLo'),
      type: 'line',
      data: data.tempLow,
      yAxisID: 'TempAxis',
      borderColor: config.forecast.temperature2_color,
      backgroundColor: config.forecast.temperature2_color,
      datalabels: { font: { size: this.size('forecast_temperature_low', config.forecast.labels_font_size), lineHeight: 0.7 } },
    },
    {
      label: this.ll('precip'),
      type: 'bar',
      data: data.precip,
      yAxisID: 'PrecipAxis',
      borderColor: config.forecast.precipitation_color,
      backgroundColor: config.forecast.precipitation_color,
      barPercentage: config.forecast.precip_bar_size / 100,
      categoryPercentage: 1.0,
      datalabels: {
        font: { size: this.size('forecast_precipitation', config.forecast.labels_font_size), lineHeight: 0.7 },
        borderWidth: config.forecast.precipitation_border === false ? 0 : 1.5,
        borderColor: config.forecast.precipitation_border_color || config.forecast.precipitation_color,
        backgroundColor: config.forecast.precipitation_border === false ? 'transparent' : backgroundColor,
        display: function (context) {
          return context.dataset.data[context.dataIndex] > 0 ? 'true' : false;
        },
      formatter: function (value, context) {
        const precipitationType = config.forecast.precipitation_type;

        const rainfall = context.dataset.data[context.dataIndex];
        const probability = data.forecast[context.dataIndex].precipitation_probability;

        const amount = rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1);
        const position = config.forecast.precipitation_unit_position;
        const withUnit = (number, unit, separator = ' ') => position === 'hidden' ? `${number}`
          : position === 'below' ? `${number}\n${unit}` : `${number}${separator}${unit}`;
        let formattedValue = withUnit(amount, precipUnit);
        if (precipitationType === 'rainfall' && probability !== undefined && probability !== null && config.forecast.show_probability) {
          formattedValue += `\n\n${withUnit(Math.round(probability), '%', '')}`;
        }

        return formattedValue;
      },
        textAlign: 'center',
        textBaseline: 'middle',
        align: 'top',
        anchor: 'start',
        offset: this.space(-10),
      },
    },
  ];

  const chart_text_color = (config.forecast.chart_text_color === 'auto') ? textColor : config.forecast.chart_text_color;

  if (config.forecast.style === 'style2') {
    datasets[0].datalabels = {
      display: function (context) {
        return 'true';
      },
      formatter: function (value, context) {
        return context.dataset.data[context.dataIndex] + '°';
      },
      align: 'top',
      anchor: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: chart_text_color || config.forecast.temperature1_color,
      font: {
        size: this.size('forecast_temperature_high', parseInt(config.forecast.labels_font_size) + 1),
        lineHeight: 0.7,
      },
    };

    datasets[1].datalabels = {
      display: function (context) {
        return 'true';
      },
      formatter: function (value, context) {
        return context.dataset.data[context.dataIndex] + '°';
      },
      align: 'bottom',
      anchor: 'center',
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: chart_text_color || config.forecast.temperature2_color,
      font: {
        size: this.size('forecast_temperature_low', parseInt(config.forecast.labels_font_size) + 1),
        lineHeight: 0.7,
      },
    };
  }

  this.forecastChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.dateTime,
      datasets: datasets,
    },
    options: {
      maintainAspectRatio: false,
      animation: config.forecast.disable_animation === true ? { duration: 0 } : {},
      layout: {
        padding: {
          bottom: this.space(10),
        },
      },
      scales: {
        x: {
          position: 'top',
          afterBuildTicks: axis => {
            if (config.forecast.type !== 'hourly') return;
            axis.ticks.forEach((tick, index) => {
              const date = new Date(axis.getLabelForValue(tick.value));
              const previous = index > 0 ? new Date(axis.getLabelForValue(axis.ticks[index - 1].value)) : null;
              tick.major = !previous || index === axis.ticks.length - 1 || date.toDateString() !== previous.toDateString() ||
                (config.use_12hour_format === true && (date.getHours() >= 12) !== (previous.getHours() >= 12));
            });
          },
          border: {
            width: 0,
          },
          grid: {
            drawTicks: false,
            color: dividerColor,
            lineWidth: config.forecast.grid_line_width,
          },
          ticks: {
              major: { enabled: config.forecast.type === 'hourly' },
              maxRotation: 0,
              font: { size: this.size('forecast_labels', Chart.defaults.font.size), weight: config.forecast.labels_bold ? 'bold' : 'normal' },
              color: config.forecast.chart_datetime_color || textColor,
              padding: this.space(config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 4 : 10),
              callback: function (value, index, values) {
                  var datetime = this.getLabelForValue(value);
                  var dateObj = new Date(datetime);
        
                  if (config.forecast.type !== 'hourly') {
                      return dateObj.toLocaleString(language, { weekday: config.forecast.weekday_format });
                  }

                  const use12Hour = config.use_12hour_format === true;
                  const hour = new Intl.DateTimeFormat(language, {
                      hour: 'numeric', hourCycle: use12Hour ? 'h12' : 'h23',
                  }).formatToParts(dateObj).find(part => part.type === 'hour').value;
                  const previous = index > 0 ? new Date(this.getLabelForValue(values[index - 1].value)) : null;
                  const isPM = dateObj.getHours() >= 12;
                  const periodChanged = !previous || isPM !== (previous.getHours() >= 12) || dateObj.toDateString() !== previous.toDateString();
                  const showDate = (dateObj.getHours() === 0 && dateObj.getMinutes() === 0) ||
                      (previous && dateObj.toDateString() !== previous.toDateString());
                  const date = showDate ? dateObj.toLocaleDateString(language, { day: 'numeric', month: 'short' }) : '';
                  const period = use12Hour && periodChanged ? (isPM ? 'PM' : 'AM') : '';
                  // Always reserve the same two rows. Share the upper row instead
                  // of repeating minutes or AM/PM on every hourly tick.
                  return [[date, period].filter(Boolean).join(' · '), hour];
              },
          },
          reverse: document.dir === 'rtl' ? true : false,
        },
        TempAxis: {
          position: 'left',
          beginAtZero: false,
          suggestedMin: Math.min(...data.tempHigh, ...data.tempLow) - 5,
          suggestedMax: Math.max(...data.tempHigh, ...data.tempLow) + 3,
          grid: {
            display: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
        PrecipAxis: {
          position: 'right',
          suggestedMax: precipMax,
          grid: {
            display: false,
            drawTicks: false,
          },
          ticks: {
            display: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        datalabels: {
          backgroundColor: backgroundColor,
          borderColor: context => context.dataset.backgroundColor,
          borderRadius: 0,
          borderWidth: 1.5,
          padding: this.space(config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 3 : 4),
          color: chart_text_color || textColor,
          font: {
            size: config.forecast.labels_font_size,
            lineHeight: 0.7,
          },
          formatter: function (value, context) {
            return context.dataset.data[context.dataIndex] + '°';
          },
        },
        tooltip: {
          titleFont: { size: this.size('tooltip_title', Chart.defaults.font.size) },
          bodyFont: { size: this.size('tooltip_body', Chart.defaults.font.size) },
          caretSize: 0,
          caretPadding: this.space(15),
          callbacks: {
            title: function (TooltipItem) {
              var datetime = TooltipItem[0].label;
              return new Date(datetime).toLocaleDateString(language, {
                month: 'short',
                day: 'numeric',
                weekday: 'short',
                hour: 'numeric',
                minute: 'numeric',
                hour12: config.use_12hour_format,
              });
            },
    label: function (context) {
      var label = context.dataset.label;
      var value = context.formattedValue;
      var probability = data.forecast[context.dataIndex].precipitation_probability;
      var unit = context.datasetIndex === 2 ? precipUnit : tempUnit;

      if (config.forecast.precipitation_type === 'rainfall' && context.datasetIndex === 2 && config.forecast.show_probability && probability !== undefined && probability !== null) {
        return label + ': ' + value + ' ' + precipUnit + ' / ' + Math.round(probability) + '%';
      } else {
        return label + ': ' + value + ' ' + unit;
      }
            },
          },
        },
      },
    },
  });
}

selectedForecasts() {
  let forecast = Array.isArray(this.forecasts) ? this.forecasts : [];
  if (this.config.autoscroll) {
    const cutoff = (this.config.forecast.type === 'hourly' ? 1 : 24) * 60 * 60 * 1000;
    const now = Date.now();
    forecast = forecast.filter(item => Number.isFinite(Date.parse(item.datetime)) && now - Date.parse(item.datetime) <= cutoff);
  }
  return forecast.slice(0, Math.max(0, Number(this.forecastItems) || 0));
}

computeForecastData({ config } = this) {
  var forecast = this.selectedForecasts();
  var roundTemp = config.forecast.round_temp == true;
  var dateTime = [];
  var tempHigh = [];
  var tempLow = [];
  var precip = [];

  for (var i = 0; i < forecast.length; i++) {
    var d = forecast[i];

    dateTime.push(d.datetime);
    tempHigh.push(d.temperature);
    if (typeof d.templow !== 'undefined') {
      tempLow.push(d.templow);
    }

    if (roundTemp) {
      tempHigh[i] = Math.round(tempHigh[i]);
      if (typeof d.templow !== 'undefined') {
        tempLow[i] = Math.round(tempLow[i]);
      }
    }
    if (config.forecast.precipitation_type === 'probability') {
      precip.push(d.precipitation_probability);
    } else {
      precip.push(d.precipitation);
    }
  }

  return {
    forecast,
    dateTime,
    tempHigh,
    tempLow,
    precip,
  }
}

updateChart({ forecasts, forecastChart } = this) {
  if (!forecasts || !forecasts.length) {
    return [];
  }

  const data = this.computeForecastData();

  if (forecastChart) {
    forecastChart.data.labels = data.dateTime;
    forecastChart.data.datasets[0].data = data.tempHigh;
    forecastChart.data.datasets[1].data = data.tempLow;
    forecastChart.data.datasets[2].data = data.precip;
    forecastChart.update();
  }
}

  space(pixels) {
    return pixels * this.config.padding_scale;
  }

  windSourceUnit(entity) {
    return this.sensorUnit(entity, this.weather.attributes.wind_speed_unit);
  }

  sensorValue(entity, fallback) {
    const sensor = entity && this._hass.states[entity];
    return entity ? sensor && sensor.state : fallback;
  }

  sensorUnit(entity, fallback) {
    const sensor = entity && this._hass.states[entity];
    return (sensor && sensor.attributes.unit_of_measurement) || fallback;
  }

  windUnit() {
    return this.ll('units')[this.unitSpeed] || this.unitSpeed || '';
  }

  cardStyle() {
    const styles = [this.titleStyle()];
    if (this.config.padding_scale !== 1) {
      const theme = getComputedStyle(this);
      for (const [key, fallback] of [['--ha-space-4', '16px'], ['--ha-space-5', '20px'], ['--ha-space-6', '24px']]) {
        styles.push(`${key}: calc(${theme.getPropertyValue(key) || fallback} * ${this.config.padding_scale})`);
      }
    }
    return styles.filter(Boolean).join(';');
  }

  offset(key) {
    return this.config.size_offsets[key] || 0;
  }

  size(key, base) {
    return Math.max(1, Number(base) + this.offset(key));
  }

  sizedText(key, value, base) {
    const fontSize = base === undefined
      ? `max(1px, calc(1em + ${this.offset(key)}px))`
      : `${this.size(key, base)}px`;
    return html`<span data-size=${key} style="font-size: ${fontSize}">${value}</span>`;
  }

  sizedIcon(key, icon) {
    return html`<ha-icon data-size=${key} icon=${icon} style="--mdc-icon-size: ${this.size(key, 24)}px"></ha-icon>`;
  }

  titleStyle() {
    if (!this.offset('title')) return '';
    const base = getComputedStyle(this).getPropertyValue('--ha-card-header-font-size') || '24px';
    return `--ha-card-header-font-size: max(1px, calc(${base} + ${this.offset('title')}px))`;
  }

  get attributesInHeader() {
    return this.config.show_main !== false && this.config.show_attributes !== false &&
      ['center', 'left'].includes(this.config.attributes_position);
  }

  render({config, _hass, weather} = this) {
    if (!config || !_hass) {
      return html``;
    }
    if (!weather || !weather.attributes) {
      return html`
        <style>
          .card {
            padding-top: ${config.title ? 0 : this.space(16)}px;
            padding-right: ${this.space(16)}px;
            padding-bottom: ${this.space(16)}px;
            padding-left: ${this.space(16)}px;
          }
        </style>
        <ha-card header="${config.title}" style=${this.cardStyle()}>
          <div class="card">
            ${this.sizedText('error_text', 'Please, check your weather entity')}
          </div>
        </ha-card>
      `;
    }
    return html`
      <style>
        ha-icon {
          color: var(--paper-item-icon-color);
        }
        img {
          width: ${this.size('forecast_condition_icon', config.icons_size)}px;
          height: ${this.size('forecast_condition_icon', config.icons_size)}px;
        }
        .card {
          padding-top: ${config.title ? 0 : this.space(16)}px;
          padding-right: ${this.space(16)}px;
          padding-bottom: ${this.space(config.show_last_changed === true ? 2 : 16)}px;
          padding-left: ${this.space(16)}px;
        }
        .main {
          display: flex;
          align-items: center;
          font-size: ${this.size('current_temperature', config.current_temp_size)}px;
          margin-bottom: ${this.space(10)}px;
        }
        .main ha-icon {
          --mdc-icon-size: ${this.size('current_icon', 50)}px;
          margin-right: ${this.space(14)}px;
          margin-inline-start: initial;
          margin-inline-end: ${this.space(14)}px;
        }
        .main img {
          width: ${this.size('current_icon', config.icons_size * 2)}px;
          height: ${this.size('current_icon', config.icons_size * 2)}px;
          margin-right: ${this.space(14)}px;
          margin-inline-start: initial;
          margin-inline-end: ${this.space(14)}px;
        }
        .main div {
          line-height: 0.9;
        }
        .main span {
          font-size: 18px;
          color: var(--secondary-text-color);
        }
        .attributes {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: ${this.space(6)}px;
      	  font-weight: 300;
          direction: ltr;
        }
        .header--center,
        .header--left {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          column-gap: ${this.space(16)}px;
          align-items: center;
          margin-bottom: ${this.space(10)}px;
        }
        .header--center .main,
        .header--left .main {
          margin-bottom: 0;
          min-width: 0;
        }
        .header--center > .attributes,
        .header--left > .attributes {
          grid-column: 2;
          justify-content: center;
          flex-wrap: wrap;
          gap: ${this.space(16)}px;
          min-width: 0;
          margin-bottom: 0;
        }
        .header--left > .attributes {
          justify-content: flex-start;
        }
        .header--center > .attributes > div,
        .header--left > .attributes > div {
          max-width: 100%;
          overflow-wrap: anywhere;
        }
        .header--center > .current-time,
        .header--left > .current-time {
          grid-column: 3;
          position: static;
          justify-self: end;
          line-height: 0.9;
          white-space: nowrap;
        }
        .chart-container {
          position: relative;
          height: ${config.forecast.chart_height}px;
          width: 100%;
          direction: ltr;
        }
        .conditions {
          display: flex;
          justify-content: space-around;
          align-items: center;
          margin: 0px ${this.space(5)}px 0px ${this.space(5)}px;
      	  cursor: pointer;
        }
        .forecast-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: ${this.space(1)}px;
        }
        .forecast-item ha-icon {
          --mdc-icon-size: ${this.size('forecast_condition_icon', 24)}px;
        }
        .wind-details {
          display: flex;
          justify-content: space-around;
          align-items: center;
          font-weight: 300;
        }
        .wind-detail {
          display: flex;
          align-items: center;
          margin: ${this.space(1)}px;
        }
        .wind-values {
          display: flex;
          align-items: center;
        }
        .wind-values--below {
          flex-direction: column;
        }
        .wind-detail--below {
          align-items: flex-start;
        }
        .wind-values--below .wind-speed,
        .wind-values--below .wind-unit {
          margin: 0;
        }
        .wind-detail ha-icon {
          --mdc-icon-size: ${this.size('forecast_wind_icon', 15)}px;
          margin-right: ${this.space(1)}px;
          margin-inline-start: initial;
          margin-inline-end: ${this.space(1)}px;
        }
        .wind-icon {
          margin-right: ${this.space(1)}px;
          margin-inline-start: initial;
          margin-inline-end: ${this.space(1)}px;
          position: relative;
	        bottom: 1px;
        }
        .wind-speed {
          font-size: ${this.size('forecast_wind_speed', 11)}px;
          margin-right: ${this.space(1)}px;
          margin-inline-start: initial;
          margin-inline-end: ${this.space(1)}px;
        }
        .wind-unit {
          font-size: ${this.size('forecast_wind_unit', 9)}px;
          margin-left: ${this.space(1)}px;
          margin-inline-start: ${this.space(1)}px;
          margin-inline-end: initial;
        }
        .current-time {
          position: absolute;
          top: ${this.space(20)}px;
          right: ${this.space(16)}px;
          inset-inline-start: initial;
          inset-inline-end: ${this.space(16)}px;
          font-size: ${this.size('current_time', config.time_size)}px;
        }
        .date-text {
          font-size: ${config.day_date_size}px;
          color: var(--secondary-text-color);
        }
        .main .feels-like {
          font-size: 13px;
          margin-top: ${this.space(5)}px;
          font-weight: 400;
        }
        .main .description {
	  font-style: italic;
          font-size: 13px;
          margin-top: ${this.space(5)}px;
          font-weight: 400;
        }
        .updated {
          font-size: 13px;
          align-items: right;
          font-weight: 300;
          margin-bottom: ${this.space(1)}px;
        }
      </style>

      <ha-card header="${config.title}" style=${this.cardStyle()}>
        <div class="card">
          ${this.renderMain()}
          ${this.attributesInHeader ? '' : this.renderAttributes()}
          <div class="chart-container">
            <canvas id="forecastChart"></canvas>
          </div>
          ${this.renderForecastConditionIcons()}
          ${this.renderWind()}
          ${this.renderLastUpdated()}
        </div>
      </ha-card>
    `;
  }

syncClock() {
  const enabled = this.isConnected && this.config && this.config.show_main !== false &&
    this.config.show_time && this.shadowRoot.querySelector('#digital-clock');
  if (!enabled) {
    if (this.clockInterval !== null) clearInterval(this.clockInterval);
    this.clockInterval = null;
    return;
  }
  this.updateClock();
  if (this.clockInterval === null) this.clockInterval = setInterval(() => this.updateClock(), 1000);
}

updateClock() {
  const header = this.shadowRoot && this.shadowRoot.querySelector('.header');
  if (!header || !this.config) return;
  const date = new Date();
  const clock = header.querySelector('#digital-clock');
  if (clock) clock.textContent = date.toLocaleTimeString(this.language, {
    hour12: this.config.use_12hour_format, hour: 'numeric', minute: 'numeric',
    second: this.config.show_time_seconds === true ? 'numeric' : undefined,
  });
  const day = header.querySelector('.date-text.day');
  if (day) day.textContent = date.toLocaleString(this.language, { weekday: 'long' }).toUpperCase();
  const dateElement = header.querySelector('.date-text.date');
  if (dateElement) dateElement.textContent = date.toLocaleDateString(this.language, { month: 'long', day: 'numeric' });
}

renderMain({ config, sun, weather, temperature, feels_like, description } = this) {
  if (config.show_main === false)
    return html``;

  const showTime = config.show_time;
  const showDay = config.show_day;
  const showDate = config.show_date;
  const showFeelsLike = config.show_feels_like;
  const showDescription = config.show_description;
  const showCurrentCondition = config.show_current_condition !== false;
  const showTemperature = config.show_temperature !== false;


  let roundedTemperature = parseFloat(temperature);
  if (!isNaN(roundedTemperature) && roundedTemperature % 1 !== 0) {
    roundedTemperature = Math.round(roundedTemperature * 10) / 10;
  }

  let roundedFeelsLike = parseFloat(feels_like);
  if (!isNaN(roundedFeelsLike) && roundedFeelsLike % 1 !== 0) {
    roundedFeelsLike = Math.round(roundedFeelsLike * 10) / 10;
  }

  const iconHtml = (config.animated_icons || config.icons) && weatherIconsDay[weather.state]
    ? html`<img data-size="current_icon" src="${this.getWeatherIcon(weather.state, sun && sun.state)}" alt="">`
    : html`<ha-icon data-size="current_icon" icon="${this.getWeatherIcon(weather.state, sun && sun.state)}"></ha-icon>`;

  const clockHtml = showTime ? html`
    <div class="current-time">
      <div id="digital-clock" data-size="current_time"></div>
      ${showDay ? html`<div class="date-text day" data-size="current_day" style="font-size: ${this.size('current_day', config.day_date_size)}px"></div>` : ''}
      ${showDay && showDate ? html` ` : ''}
      ${showDate ? html`<div class="date-text date" data-size="current_date" style="font-size: ${this.size('current_date', config.day_date_size)}px"></div>` : ''}
    </div>
  ` : '';

  return html`
    <div class="header ${this.attributesInHeader ? `header--${config.attributes_position}` : ''}">
    <div class="main">
      ${iconHtml}
      <div>
        <div>
          ${showTemperature ? html`${this.sizedText('current_temperature', Number.isFinite(roundedTemperature) ? roundedTemperature : '—', config.current_temp_size)}${this.sizedText('current_temperature_unit', this.getUnit('temperature'), 18)}` : ''}
          ${showFeelsLike && Number.isFinite(roundedFeelsLike) ? html`
            <div class="feels-like">
              ${this.sizedText('feels_like_label', this.ll('feelsLike'), 13)}
              ${this.sizedText('feels_like_value', roundedFeelsLike, 13)}${this.sizedText('feels_like_unit', this.getUnit('temperature'), 13)}
            </div>
          ` : ''}
          ${showCurrentCondition ? html`
            <div class="current-condition">
              ${this.sizedText('current_condition', this.ll(weather.state) || weather.state, 18)}
            </div>
          ` : ''}
          ${showDescription ? html`
            <div class="description">
              ${this.sizedText('description', description, 13)}
            </div>
          ` : ''}
        </div>
        ${this.attributesInHeader ? '' : clockHtml}
      </div>
    </div>
    ${this.attributesInHeader ? this.renderAttributes() : ''}
    ${this.attributesInHeader ? clockHtml : ''}
    </div>
  `;
}

renderAttributes({ config, humidity, pressure, windSpeed, windDirection, sun, language, uv_index, dew_point, wind_gust_speed, visibility } = this) {
  const dWindSpeed = convertWindSpeed(windSpeed, this.windSourceUnit(config.windspeed), this.unitSpeed);
  const dWindGust = convertWindSpeed(wind_gust_speed, this.windSourceUnit(config.wind_gust_speed), this.unitSpeed);
  const pressureSource = this.weather.attributes.pressure_unit || this._hass.config.unit_system.pressure;
  const dPressure = convertPressure(pressure, this.sensorUnit(config.press, pressureSource), this.unitPressure);

  if (config.show_attributes == false)
    return html``;

  const showHumidity = config.show_humidity !== false;
  const showPressure = config.show_pressure !== false;
  const showWindDirection = config.show_wind_direction !== false;
  const showWindSpeed = config.show_wind_speed !== false;
  const showSun = config.show_sun !== false;
  const showDewpoint = config.show_dew_point == true;
  const showWindgustspeed = config.show_wind_gust_speed == true;
  const showVisibility = config.show_visibility == true;

return html`
    <div class="attributes">
      ${((showHumidity && humidity !== undefined) || (showPressure && dPressure !== undefined) || (showDewpoint && dew_point !== undefined) || (showVisibility && visibility !== undefined)) ? html`
        <div>
          ${showHumidity && humidity !== undefined ? html`
            ${this.sizedIcon('humidity_icon', 'hass:water-percent')} ${this.sizedText('humidity_value', humidity)} ${this.sizedText('humidity_unit', '%')}<br>
          ` : ''}
          ${showPressure && dPressure !== undefined ? html`
            ${this.sizedIcon('pressure_icon', 'hass:gauge')} ${this.sizedText('pressure_value', dPressure)} ${this.sizedText('pressure_unit', this.ll('units')[this.unitPressure] || this.unitPressure)} <br>
          ` : ''}
          ${showDewpoint && dew_point !== undefined ? html`
            ${this.sizedIcon('dew_point_icon', 'hass:thermometer-water')} ${this.sizedText('dew_point_value', dew_point)} ${this.sizedText('dew_point_unit', this.getUnit('temperature'))} <br>
          ` : ''}
          ${showVisibility && visibility !== undefined ? html`
            ${this.sizedIcon('visibility_icon', 'hass:eye')} ${this.sizedText('visibility_value', visibility)} ${this.sizedText('visibility_unit', this.unitVisibility)}
          ` : ''}
        </div>
      ` : ''}
      ${((showSun && sun !== undefined) || (typeof uv_index !== 'undefined' && uv_index !== undefined)) ? html`
        <div>
          ${typeof uv_index !== 'undefined' && uv_index !== undefined ? html`
            <div>
              ${this.sizedIcon('uv_icon', 'hass:white-balance-sunny')} ${this.sizedText('uv_label', 'UV:')} ${this.sizedText('uv_value', Math.round(uv_index * 10) / 10)}
            </div>
          ` : ''}
          ${showSun && sun !== undefined ? html`
            <div>
              ${this.renderSun({ sun, language })}
            </div>
          ` : ''}
        </div>
      ` : ''}
      ${((showWindDirection && windDirection !== undefined) || (showWindSpeed && dWindSpeed !== undefined) || (showWindgustspeed && dWindGust !== undefined)) ? html`
        <div>
          ${showWindDirection && windDirection !== undefined ? html`
            ${this.sizedIcon('wind_direction_icon', `hass:${this.getWindDirIcon(windDirection)}`)} ${this.sizedText('wind_direction_value', this.getWindDir(windDirection))} <br>
          ` : ''}
          ${showWindSpeed && dWindSpeed !== undefined ? html`
            ${this.sizedIcon('wind_speed_icon', 'hass:weather-windy')}
            ${this.sizedText('wind_speed_value', dWindSpeed)} ${this.sizedText('wind_speed_unit', this.windUnit())} <br>
          ` : ''}
          ${showWindgustspeed && dWindGust !== undefined ? html`
            ${this.sizedIcon('wind_gust_icon', 'hass:weather-windy-variant')}
            ${this.sizedText('wind_gust_value', dWindGust)} ${this.sizedText('wind_gust_unit', this.windUnit())}
          ` : ''}
        </div>
      ` : ''}
    </div>
`;
}

renderSun({ sun, language, config } = this) {
  if (sun == undefined) {
    return html``;
  }

const use12HourFormat = this.config.use_12hour_format;
const timeOptions = {
    hour12: use12HourFormat,
    hour: 'numeric',
    minute: 'numeric'
};

  return html`
    ${this.sizedIcon('sunrise_icon', 'mdi:weather-sunset-up')}
      ${this.sizedText('sunrise_time', new Date(sun.attributes.next_rising).toLocaleTimeString(language, timeOptions))}<br>
    ${this.sizedIcon('sunset_icon', 'mdi:weather-sunset-down')}
      ${this.sizedText('sunset_time', new Date(sun.attributes.next_setting).toLocaleTimeString(language, timeOptions))}
  `;
}

renderForecastConditionIcons({ config, sun } = this) {
  const forecast = this.selectedForecasts();

  if (config.forecast.condition_icons === false) {
    return html``;
  }

  return html`
    <div class="conditions" @click="${(e) => this.showMoreInfo(config.entity)}">
      ${forecast.map((item) => {
        const forecastTime = new Date(item.datetime);
        const sunriseTime = sun && sun.attributes.next_rising ? new Date(sun.attributes.next_rising) : null;
        const sunsetTime = sun && sun.attributes.next_setting ? new Date(sun.attributes.next_setting) : null;
        let isDayTime = item.condition !== 'clear-night';
        if (config.forecast.type !== 'daily' && sunriseTime && sunsetTime &&
            Number.isFinite(sunriseTime.getTime()) && Number.isFinite(sunsetTime.getTime())) {
          const adjustedSunriseTime = new Date(forecastTime);
          adjustedSunriseTime.setHours(sunriseTime.getHours(), sunriseTime.getMinutes(), sunriseTime.getSeconds());
          const adjustedSunsetTime = new Date(forecastTime);
          adjustedSunsetTime.setHours(sunsetTime.getHours(), sunsetTime.getMinutes(), sunsetTime.getSeconds());
          isDayTime = forecastTime >= adjustedSunriseTime && forecastTime <= adjustedSunsetTime;
        }

        const weatherIcons = isDayTime ? weatherIconsDay : weatherIconsNight;
        const condition = item.condition;

        let iconHtml;

        if ((config.animated_icons || config.icons) && weatherIcons[condition]) {
          const iconSrc = config.animated_icons ?
            `${this.baseIconPath}${weatherIcons[condition]}.svg` :
            `${this.config.icons}${weatherIcons[condition]}.svg`;
          iconHtml = html`<img class="icon" data-size="forecast_condition_icon" src="${iconSrc}" alt="">`;
        } else {
          iconHtml = html`<ha-icon data-size="forecast_condition_icon" icon="${this.getWeatherIcon(condition, sun && sun.state)}"></ha-icon>`;
        }

        return html`
          <div class="forecast-item">
            ${iconHtml}
          </div>
        `;
      })}
    </div>
  `;
}

renderWind({ config } = this) {
  const showWindForecast = config.forecast.show_wind_forecast !== false;

  if (!showWindForecast) {
    return html``;
  }

  const forecast = this.selectedForecasts();

  return html`
    <div class="wind-details">
      ${showWindForecast ? html`
        ${forecast.map((item) => {
          const dWindSpeed = convertWindSpeed(item.wind_speed, this.weather.attributes.wind_speed_unit, this.unitSpeed);

          return html`
            <div class="wind-detail wind-detail--${config.forecast.wind_unit_position}">
              <ha-icon class="wind-icon" data-size="forecast_wind_icon" icon="hass:${this.getWindDirIcon(item.wind_bearing)}"></ha-icon>
              <div class="wind-values wind-values--${config.forecast.wind_unit_position}">
                <span class="wind-speed" data-size="forecast_wind_speed">${dWindSpeed === undefined ? '—' : dWindSpeed}</span>
                ${config.forecast.wind_unit_position === 'hidden' ? '' : html`<span class="wind-unit" data-size="forecast_wind_unit">${this.windUnit()}</span>`}
              </div>
            </div>
          `;
        })}
      ` : ''}
    </div>
  `;
}

renderLastUpdated() {
  const lastUpdatedString = this.weather.last_changed;
  const lastUpdatedTimestamp = new Date(lastUpdatedString).getTime();
  const currentTimestamp = Date.now();
  const timeDifference = currentTimestamp - lastUpdatedTimestamp;

  const minutesAgo = Math.floor(timeDifference / (1000 * 60));
  const hoursAgo = Math.floor(minutesAgo / 60);

  const locale = this.language;

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  const showLastUpdated = this.config.show_last_changed == true;

  if (!showLastUpdated) {
    return html``;
  }

  return html`
    <div class="updated">
      <div>
        ${formatter.formatToParts(hoursAgo > 0 ? -hoursAgo : -minutesAgo, hoursAgo > 0 ? 'hour' : 'minute')
          .map(part => this.sizedText(part.type === 'literal' ? 'updated_text' : 'updated_number', part.value, 13))}
      </div>
    </div>
  `;
}

  _fire(type, detail, options) {
    const node = this.shadowRoot;
    options = options || {};
    detail = (detail === null || detail === undefined) ? {} : detail;
    const event = new Event(type, {
      bubbles: options.bubbles === undefined ? true : options.bubbles,
      cancelable: Boolean(options.cancelable),
      composed: options.composed === undefined ? true : options.composed
    });
    event.detail = detail;
    node.dispatchEvent(event);
    return event;
  }

  showMoreInfo(entity) {
    this._fire('hass-more-info', { entityId: entity });
  }
}

customElements.define('weather-chart-card', WeatherChartCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "weather-chart-card",
  name: "Weather Chart Card",
  description: "A custom weather card with chart.",
  preview: true,
  documentationURL: "https://github.com/tomtom13/weather-chart-card",
});
