import locale from './locale.js';
import { normaliseSizeOffsets } from './size-options.js';
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
    show_main: true,
    show_temperature: true,
    show_current_condition: true,
    show_attributes: true,
    attributes_position: 'row',
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
    ...config,
    forecast: {
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

  this.baseIconPath = cardConfig.icon_style === 'style2' ?
    'https://cdn.jsdelivr.net/gh/mlamberts78/weather-chart-card/dist/icons2/':
    'https://cdn.jsdelivr.net/gh/mlamberts78/weather-chart-card/dist/icons/' ;

  this.config = cardConfig;
  if (!config.entity) {
    throw new Error('Please, define entity in the card config');
  }
}

set hass(hass) {
  this._hass = hass;
  this.language = this.config.locale || hass.selectedLanguage || hass.language;
  this.sun = 'sun.sun' in hass.states ? hass.states['sun.sun'] : null;
  this.unitSpeed = this.config.units.speed ? this.config.units.speed : this.weather && this.weather.attributes.wind_speed_unit;
  this.unitPressure = this.config.units.pressure ? this.config.units.pressure : this.weather && this.weather.attributes.pressure_unit;
  this.unitVisibility = this.config.units.visibility ? this.config.units.visibility : this.weather && this.weather.attributes.visibility_unit;
  this.weather = this.config.entity in hass.states
    ? hass.states[this.config.entity]
    : null;

  if (this.weather) {
    this.temperature = this.config.temp ? hass.states[this.config.temp].state : this.weather.attributes.temperature;
    this.humidity = this.config.humid ? hass.states[this.config.humid].state : this.weather.attributes.humidity;
    this.pressure = this.config.press ? hass.states[this.config.press].state : this.weather.attributes.pressure;
    this.uv_index = this.config.uv ? hass.states[this.config.uv].state : this.weather.attributes.uv_index;
    this.windSpeed = this.config.windspeed ? hass.states[this.config.windspeed].state : this.weather.attributes.wind_speed;
    this.dew_point = this.config.dew_point ? hass.states[this.config.dew_point].state : this.weather.attributes.dew_point;
    this.wind_gust_speed = this.config.wind_gust_speed ? hass.states[this.config.wind_gust_speed].state : this.weather.attributes.wind_gust_speed;
    this.visibility = this.config.visibility ? hass.states[this.config.visibility].state : this.weather.attributes.visibility;

    if (this.config.winddir && hass.states[this.config.winddir] && hass.states[this.config.winddir].state !== undefined) {
      this.windDirection = parseFloat(hass.states[this.config.winddir].state);
    } else {
      this.windDirection = this.weather.attributes.wind_bearing;
    }

    this.feels_like = this.config.feels_like && hass.states[this.config.feels_like] ? hass.states[this.config.feels_like].state : this.weather.attributes.apparent_temperature;
    this.description = this.config.description && hass.states[this.config.description] ? hass.states[this.config.description].state : this.weather.attributes.description;
  }

  if (this.weather && !this.forecastSubscriber) {
    this.subscribeForecastEvents();
  }
}

subscribeForecastEvents() {
  const forecastType = this.config.forecast.type || 'daily';
  const isHourly = forecastType === 'hourly';

  const feature = isHourly ? WeatherEntityFeature.FORECAST_HOURLY : WeatherEntityFeature.FORECAST_DAILY;
  if (!this.supportsFeature(feature)) {
    console.error(`Weather entity "${this.config.entity}" does not support ${isHourly ? 'hourly' : 'daily'} forecasts.`);
    return;
  }

  const callback = (event) => {
    this.forecasts = event.forecast;
    this.requestUpdate();
    this.drawChart();
  };

  this.forecastSubscriber = this._hass.connection.subscribeMessage(callback, {
    type: "weather/subscribe_forecast",
    forecast_type: isHourly ? 'hourly' : 'daily',
    entity_id: this.config.entity,
  });
}

  supportsFeature(feature) {
    return (this.weather.attributes.supported_features & feature) !== 0;
  }

  constructor() {
    super();
    this.resizeObserver = null;
    this.resizeInitialized = false;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.resizeInitialized) {
      this.delayedAttachResizeObserver();
    }
  }

  delayedAttachResizeObserver() {
    setTimeout(() => {
      this.attachResizeObserver();
      this.resizeInitialized = true;
    }, 0);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.detachResizeObserver();
    if (this.forecastSubscriber) {
      this.forecastSubscriber.then((unsub) => unsub());
    }
  }

  attachResizeObserver() {
    this.resizeObserver = new ResizeObserver(() => {
      this.measureCard();
    });
    const card = this.shadowRoot.querySelector('ha-card');
    if (card) {
      this.resizeObserver.observe(card);
    }
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

  this.forecastItems = numberOfForecasts > 0 ? numberOfForecasts : Math.round(card.offsetWidth / (fontSize * 6));
  this.drawChart();
}

ll(str) {
  const selectedLocale = this.config.locale || this.language || 'en';

  if (locale[selectedLocale] === undefined) {
    return locale.en[str];
  }

  return locale[selectedLocale][str];
}

  getCardSize() {
    return 4;
  }

  getUnit(unit) {
    return this._hass.config.unit_system[unit] || '';
  }

  getWeatherIcon(condition, sun) {
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

calculateBeaufortScale(windSpeed) {
  const unitConversion = {
    'km/h': 1,
    'm/s': 3.6,
    'mph': 1.60934,
  };

  if (!this.weather || !this.weather.attributes.wind_speed_unit) {
    throw new Error('wind_speed_unit not available in weather attributes.');
  }

  const wind_speed_unit = this.weather.attributes.wind_speed_unit;
  const conversionFactor = unitConversion[wind_speed_unit];

  if (typeof conversionFactor !== 'number') {
    throw new Error(`Unknown wind_speed_unit: ${wind_speed_unit}`);
  }

  const windSpeedInKmPerHour = windSpeed * conversionFactor;

  if (windSpeedInKmPerHour < 1) return 0;
  else if (windSpeedInKmPerHour < 6) return 1;
  else if (windSpeedInKmPerHour < 12) return 2;
  else if (windSpeedInKmPerHour < 20) return 3;
  else if (windSpeedInKmPerHour < 29) return 4;
  else if (windSpeedInKmPerHour < 39) return 5;
  else if (windSpeedInKmPerHour < 50) return 6;
  else if (windSpeedInKmPerHour < 62) return 7;
  else if (windSpeedInKmPerHour < 75) return 8;
  else if (windSpeedInKmPerHour < 89) return 9;
  else if (windSpeedInKmPerHour < 103) return 10;
  else if (windSpeedInKmPerHour < 118) return 11;
  else return 12;
}

async firstUpdated(changedProperties) {
  super.firstUpdated(changedProperties);
  this.measureCard();
  await new Promise(resolve => setTimeout(resolve, 0));
  this.drawChart();

  if (this.config.autoscroll) {
    this.autoscroll();
  }
}


async updated(changedProperties) {
  await this.updateComplete;

  if (changedProperties.has('config')) {
    const oldConfig = changedProperties.get('config');

    const entityChanged = oldConfig && this.config.entity !== oldConfig.entity;
    const forecastTypeChanged = oldConfig && this.config.forecast.type !== oldConfig.forecast.type;
    const autoscrollChanged = oldConfig && this.config.autoscroll !== oldConfig.autoscroll;

    if (entityChanged || forecastTypeChanged) {
      if (this.forecastSubscriber && typeof this.forecastSubscriber === 'function') {
        this.forecastSubscriber();
      }

      this.subscribeForecastEvents();
    }

    if (this.forecasts && this.forecasts.length) {
      this.drawChart();
    }

    if (autoscrollChanged) {
      if (!this.config.autoscroll) {
        this.autoscroll();
      } else {
        this.cancelAutoscroll();
      }
    }
  }

  if (changedProperties.has('weather')) {
    this.updateChart();
  }
}

autoscroll() {
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
      this.updateChart();
      drawChartOncePerHour();
    }, nextHour - now);
  };

  updateChartOncePerHour();
}

cancelAutoscroll() {
  if (this.autoscrollTimeout) {
    clearTimeout(this.autoscrollTimeout);
  }
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
  var tempUnit = this._hass.config.unit_system.temperature;
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
        display: function (context) {
          return context.dataset.data[context.dataIndex] > 0 ? 'true' : false;
        },
      formatter: function (value, context) {
        const precipitationType = config.forecast.precipitation_type;

        const rainfall = context.dataset.data[context.dataIndex];
        const probability = data.forecast[context.dataIndex].precipitation_probability;

        let formattedValue;
        if (precipitationType === 'rainfall') {
          if (probability !== undefined && probability !== null && config.forecast.show_probability) {
	    formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)} ${precipUnit}\n${Math.round(probability)}%`;
          } else {
            formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)} ${precipUnit}`;
          }
        } else {
          formattedValue = `${rainfall > 9 ? Math.round(rainfall) : rainfall.toFixed(1)} ${precipUnit}`;
        }

        formattedValue = formattedValue.replace('\n', '\n\n');

        return formattedValue;
      },
        textAlign: 'center',
        textBaseline: 'middle',
        align: 'top',
        anchor: 'start',
        offset: -10,
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
          bottom: 10,
        },
      },
      scales: {
        x: {
          position: 'top',
          border: {
            width: 0,
          },
          grid: {
            drawTicks: false,
            color: dividerColor,
          },
          ticks: {
              maxRotation: 0,
              font: { size: this.size('forecast_labels', Chart.defaults.font.size) },
              color: config.forecast.chart_datetime_color || textColor,
              padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 4 : 10,
              callback: function (value, index, values) {
                  var datetime = this.getLabelForValue(value);
                  var dateObj = new Date(datetime);
        
                  var timeFormatOptions = {
                      hour12: config.use_12hour_format,
                      hour: 'numeric',
                      ...(config.use_12hour_format ? {} : { minute: 'numeric' }),
                  };

                  var time = dateObj.toLocaleTimeString(language, timeFormatOptions);

                  if (dateObj.getHours() === 0 && dateObj.getMinutes() === 0 && config.forecast.type === 'hourly') {
                      var dateFormatOptions = {
                          day: 'numeric',
                          month: 'short',
                      };
                      var date = dateObj.toLocaleDateString(language, dateFormatOptions);
                      time = time.replace('a.m.', 'AM').replace('p.m.', 'PM');
                      return [date, time];
                  }

                  if (config.forecast.type !== 'hourly') {
                      var weekday = dateObj.toLocaleString(language, { weekday: 'short' }).toUpperCase();
                      return weekday;
                  }

                  time = time.replace('a.m.', 'AM').replace('p.m.', 'PM');
                  return time;
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
          padding: config.forecast.precipitation_type === 'rainfall' && config.forecast.show_probability && config.forecast.type !== 'hourly' ? 3 : 4,
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
          caretPadding: 15,
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

computeForecastData({ config, forecastItems } = this) {
  var forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];
  var roundTemp = config.forecast.round_temp == true;
  var dateTime = [];
  var tempHigh = [];
  var tempLow = [];
  var precip = [];

  for (var i = 0; i < forecast.length; i++) {
    var d = forecast[i];
    if (config.autoscroll) {
      const cutoff = (config.forecast.type === 'hourly' ? 1 : 24) * 60 * 60 * 1000;
      if (new Date() - new Date(d.datetime) > cutoff) {
        continue;
      }
    }
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
            padding-top: ${config.title? '0px' : '16px'};
            padding-right: 16px;
            padding-bottom: 16px;
            padding-left: 16px;
          }
        </style>
        <ha-card header="${config.title}" style=${this.titleStyle()}>
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
          padding-top: ${config.title ? '0px' : '16px'};
          padding-right: 16px;
          padding-bottom: ${config.show_last_changed === true ? '2px' : '16px'};
          padding-left: 16px;
        }
        .main {
          display: flex;
          align-items: center;
          font-size: ${this.size('current_temperature', config.current_temp_size)}px;
          margin-bottom: 10px;
        }
        .main ha-icon {
          --mdc-icon-size: ${this.size('current_icon', 50)}px;
          margin-right: 14px;
          margin-inline-start: initial;
          margin-inline-end: 14px;
        }
        .main img {
          width: ${this.size('current_icon', config.icons_size * 2)}px;
          height: ${this.size('current_icon', config.icons_size * 2)}px;
          margin-right: 14px;
          margin-inline-start: initial;
          margin-inline-end: 14px;
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
          margin-bottom: 6px;
      	  font-weight: 300;
          direction: ltr;
        }
        .header--center,
        .header--left {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          column-gap: 16px;
          align-items: center;
          margin-bottom: 10px;
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
          gap: 16px;
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
          margin: 0px 5px 0px 5px;
      	  cursor: pointer;
        }
        .forecast-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin: 1px;
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
          margin: 1px;
        }
        .wind-detail ha-icon {
          --mdc-icon-size: ${this.size('forecast_wind_icon', 15)}px;
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
        }
        .wind-icon {
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
          position: relative;
	        bottom: 1px;
        }
        .wind-speed {
          font-size: ${this.size('forecast_wind_speed', 11)}px;
          margin-right: 1px;
          margin-inline-start: initial;
          margin-inline-end: 1px;
        }
        .wind-unit {
          font-size: ${this.size('forecast_wind_unit', 9)}px;
          margin-left: 1px;
          margin-inline-start: 1px;
          margin-inline-end: initial;
        }
        .current-time {
          position: absolute;
          top: 20px;
          right: 16px;
          inset-inline-start: initial;
          inset-inline-end: 16px;
          font-size: ${this.size('current_time', config.time_size)}px;
        }
        .date-text {
          font-size: ${config.day_date_size}px;
          color: var(--secondary-text-color);
        }
        .main .feels-like {
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
        }
        .main .description {
	  font-style: italic;
          font-size: 13px;
          margin-top: 5px;
          font-weight: 400;
        }
        .updated {
          font-size: 13px;
          align-items: right;
          font-weight: 300;
          margin-bottom: 1px;
        }
      </style>

      <ha-card header="${config.title}" style=${this.titleStyle()}>
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

renderMain({ config, sun, weather, temperature, feels_like, description } = this) {
  if (config.show_main === false)
    return html``;

  const use12HourFormat = config.use_12hour_format;
  const showTime = config.show_time;
  const showDay = config.show_day;
  const showDate = config.show_date;
  const showFeelsLike = config.show_feels_like;
  const showDescription = config.show_description;
  const showCurrentCondition = config.show_current_condition !== false;
  const showTemperature = config.show_temperature !== false;
  const showSeconds = config.show_time_seconds === true;

  let roundedTemperature = parseFloat(temperature);
  if (!isNaN(roundedTemperature) && roundedTemperature % 1 !== 0) {
    roundedTemperature = Math.round(roundedTemperature * 10) / 10;
  }

  let roundedFeelsLike = parseFloat(feels_like);
  if (!isNaN(roundedFeelsLike) && roundedFeelsLike % 1 !== 0) {
    roundedFeelsLike = Math.round(roundedFeelsLike * 10) / 10;
  }

  const iconHtml = config.animated_icons || config.icons
    ? html`<img data-size="current_icon" src="${this.getWeatherIcon(weather.state, sun.state)}" alt="">`
    : html`<ha-icon data-size="current_icon" icon="${this.getWeatherIcon(weather.state, sun.state)}"></ha-icon>`;

  const updateClock = () => {
    const currentDate = new Date();
    const timeOptions = {
      hour12: use12HourFormat,
      hour: 'numeric',
      minute: 'numeric',
      second: showSeconds ? 'numeric' : undefined
    };
    const currentTime = currentDate.toLocaleTimeString(this.language, timeOptions);
    const currentDayOfWeek = currentDate.toLocaleString(this.language, { weekday: 'long' }).toUpperCase();
    const currentDateFormatted = currentDate.toLocaleDateString(this.language, { month: 'long', day: 'numeric' });

    const mainDiv = this.shadowRoot.querySelector('.header');
    if (mainDiv) {
      const clockElement = mainDiv.querySelector('#digital-clock');
      if (clockElement) {
        clockElement.textContent = currentTime;
      }
      if (showDay) {
        const dayElement = mainDiv.querySelector('.date-text.day');
        if (dayElement) {
          dayElement.textContent = currentDayOfWeek;
        }
      }
      if (showDate) {
        const dateElement = mainDiv.querySelector('.date-text.date');
        if (dateElement) {
          dateElement.textContent = currentDateFormatted;
        }
      }
    }
  };

  updateClock();

  if (showTime) {
    setInterval(updateClock, 1000);
  }

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
          ${showTemperature ? html`${this.sizedText('current_temperature', roundedTemperature, config.current_temp_size)}${this.sizedText('current_temperature_unit', this.getUnit('temperature'), 18)}` : ''}
          ${showFeelsLike && roundedFeelsLike ? html`
            <div class="feels-like">
              ${this.sizedText('feels_like_label', this.ll('feelsLike'), 13)}
              ${this.sizedText('feels_like_value', roundedFeelsLike, 13)}${this.sizedText('feels_like_unit', this.getUnit('temperature'), 13)}
            </div>
          ` : ''}
          ${showCurrentCondition ? html`
            <div class="current-condition">
              ${this.sizedText('current_condition', this.ll(weather.state), 18)}
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
  let dWindSpeed = windSpeed;
  let dPressure = pressure;

  if (this.unitSpeed !== this.weather.attributes.wind_speed_unit) {
    if (this.unitSpeed === 'm/s') {
      if (this.weather.attributes.wind_speed_unit === 'km/h') {
        dWindSpeed = Math.round(windSpeed * 1000 / 3600);
      } else if (this.weather.attributes.wind_speed_unit === 'mph') {
        dWindSpeed = Math.round(windSpeed * 0.44704);
      }
    } else if (this.unitSpeed === 'km/h') {
      if (this.weather.attributes.wind_speed_unit === 'm/s') {
        dWindSpeed = Math.round(windSpeed * 3.6);
      } else if (this.weather.attributes.wind_speed_unit === 'mph') {
        dWindSpeed = Math.round(windSpeed * 1.60934);
      }
    } else if (this.unitSpeed === 'mph') {
      if (this.weather.attributes.wind_speed_unit === 'm/s') {
        dWindSpeed = Math.round(windSpeed / 0.44704);
      } else if (this.weather.attributes.wind_speed_unit === 'km/h') {
        dWindSpeed = Math.round(windSpeed / 1.60934);
      }
    } else if (this.unitSpeed === 'Bft') {
      dWindSpeed = this.calculateBeaufortScale(windSpeed);
    }
  } else {
    dWindSpeed = Math.round(dWindSpeed);
  }

  if (this.unitPressure !== this.weather.attributes.pressure_unit) {
    if (this.unitPressure === 'mmHg') {
      if (this.weather.attributes.pressure_unit === 'hPa') {
        dPressure = Math.round(pressure * 0.75006);
      } else if (this.weather.attributes.pressure_unit === 'inHg') {
        dPressure = Math.round(pressure * 25.4);
      }
    } else if (this.unitPressure === 'hPa') {
      if (this.weather.attributes.pressure_unit === 'mmHg') {
        dPressure = Math.round(pressure / 0.75006);
      } else if (this.weather.attributes.pressure_unit === 'inHg') {
        dPressure = Math.round(pressure * 33.8639);
      }
    } else if (this.unitPressure === 'inHg') {
      if (this.weather.attributes.pressure_unit === 'mmHg') {
        dPressure = pressure / 25.4;
      } else if (this.weather.attributes.pressure_unit === 'hPa') {
        dPressure = pressure / 33.8639;
      }
      dPressure = dPressure.toFixed(2);
    }
  } else {
    if (this.unitPressure === 'hPa' || this.unitPressure === 'mmHg') {
      dPressure = Math.round(dPressure);
    }
  }

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
            ${this.sizedIcon('pressure_icon', 'hass:gauge')} ${this.sizedText('pressure_value', dPressure)} ${this.sizedText('pressure_unit', this.ll('units')[this.unitPressure])} <br>
          ` : ''}
          ${showDewpoint && dew_point !== undefined ? html`
            ${this.sizedIcon('dew_point_icon', 'hass:thermometer-water')} ${this.sizedText('dew_point_value', dew_point)} ${this.sizedText('dew_point_unit', this.weather.attributes.temperature_unit)} <br>
          ` : ''}
          ${showVisibility && visibility !== undefined ? html`
            ${this.sizedIcon('visibility_icon', 'hass:eye')} ${this.sizedText('visibility_value', visibility)} ${this.sizedText('visibility_unit', this.weather.attributes.visibility_unit)}
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
      ${((showWindDirection && windDirection !== undefined) || (showWindSpeed && dWindSpeed !== undefined)) ? html`
        <div>
          ${showWindDirection && windDirection !== undefined ? html`
            ${this.sizedIcon('wind_direction_icon', `hass:${this.getWindDirIcon(windDirection)}`)} ${this.sizedText('wind_direction_value', this.getWindDir(windDirection))} <br>
          ` : ''}
          ${showWindSpeed && dWindSpeed !== undefined ? html`
            ${this.sizedIcon('wind_speed_icon', 'hass:weather-windy')}
            ${this.sizedText('wind_speed_value', dWindSpeed)} ${this.sizedText('wind_speed_unit', this.ll('units')[this.unitSpeed])} <br>
          ` : ''}
          ${showWindgustspeed && wind_gust_speed !== undefined ? html`
            ${this.sizedIcon('wind_gust_icon', 'hass:weather-windy-variant')}
            ${this.sizedText('wind_gust_value', wind_gust_speed)} ${this.sizedText('wind_gust_unit', this.ll('units')[this.unitSpeed])}
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

renderForecastConditionIcons({ config, forecastItems, sun } = this) {
  const forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];

  if (config.forecast.condition_icons === false) {
    return html``;
  }

  return html`
    <div class="conditions" @click="${(e) => this.showMoreInfo(config.entity)}">
      ${forecast.map((item) => {
        const forecastTime = new Date(item.datetime);
        const sunriseTime = new Date(sun.attributes.next_rising);
        const sunsetTime = new Date(sun.attributes.next_setting);

        // Adjust sunrise and sunset times to match the date of forecastTime
        const adjustedSunriseTime = new Date(forecastTime);
        adjustedSunriseTime.setHours(sunriseTime.getHours());
        adjustedSunriseTime.setMinutes(sunriseTime.getMinutes());
        adjustedSunriseTime.setSeconds(sunriseTime.getSeconds());

        const adjustedSunsetTime = new Date(forecastTime);
        adjustedSunsetTime.setHours(sunsetTime.getHours());
        adjustedSunsetTime.setMinutes(sunsetTime.getMinutes());
        adjustedSunsetTime.setSeconds(sunsetTime.getSeconds());

        let isDayTime;

        if (config.forecast.type === 'daily') {
          // For daily forecast, assume it's day time
          isDayTime = true;
        } else {
          // For other forecast types, determine based on sunrise and sunset times
          isDayTime = forecastTime >= adjustedSunriseTime && forecastTime <= adjustedSunsetTime;
        }

        const weatherIcons = isDayTime ? weatherIconsDay : weatherIconsNight;
        const condition = item.condition;

        let iconHtml;

        if (config.animated_icons || config.icons) {
          const iconSrc = config.animated_icons ?
            `${this.baseIconPath}${weatherIcons[condition]}.svg` :
            `${this.config.icons}${weatherIcons[condition]}.svg`;
          iconHtml = html`<img class="icon" data-size="forecast_condition_icon" src="${iconSrc}" alt="">`;
        } else {
          iconHtml = html`<ha-icon data-size="forecast_condition_icon" icon="${this.getWeatherIcon(condition, sun.state)}"></ha-icon>`;
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

renderWind({ config, weather, windSpeed, windDirection, forecastItems } = this) {
  const showWindForecast = config.forecast.show_wind_forecast !== false;

  if (!showWindForecast) {
    return html``;
  }

  const forecast = this.forecasts ? this.forecasts.slice(0, forecastItems) : [];

  return html`
    <div class="wind-details">
      ${showWindForecast ? html`
        ${forecast.map((item) => {
          let dWindSpeed = item.wind_speed;

          if (this.unitSpeed !== this.weather.attributes.wind_speed_unit) {
            if (this.unitSpeed === 'm/s') {
              if (this.weather.attributes.wind_speed_unit === 'km/h') {
                dWindSpeed = Math.round(item.wind_speed * 1000 / 3600);
              } else if (this.weather.attributes.wind_speed_unit === 'mph') {
                dWindSpeed = Math.round(item.wind_speed * 0.44704);
              }
            } else if (this.unitSpeed === 'km/h') {
              if (this.weather.attributes.wind_speed_unit === 'm/s') {
                dWindSpeed = Math.round(item.wind_speed * 3.6);
              } else if (this.weather.attributes.wind_speed_unit === 'mph') {
                dWindSpeed = Math.round(item.wind_speed * 1.60934);
              }
            } else if (this.unitSpeed === 'mph') {
              if (this.weather.attributes.wind_speed_unit === 'm/s') {
                dWindSpeed = Math.round(item.wind_speed / 0.44704);
              } else if (this.weather.attributes.wind_speed_unit === 'km/h') {
                dWindSpeed = Math.round(item.wind_speed / 1.60934);
              }
            } else if (this.unitSpeed === 'Bft') {
              dWindSpeed = this.calculateBeaufortScale(item.wind_speed);
            }
          } else {
            dWindSpeed = Math.round(dWindSpeed);
          }

          return html`
            <div class="wind-detail">
              <ha-icon class="wind-icon" data-size="forecast_wind_icon" icon="hass:${this.getWindDirIcon(item.wind_bearing)}"></ha-icon>
              <span class="wind-speed" data-size="forecast_wind_speed">${dWindSpeed}</span>
              <span class="wind-unit" data-size="forecast_wind_unit">${this.ll('units')[this.unitSpeed]}</span>
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
  documentationURL: "https://github.com/mlamberts78/weather-chart-card",
});
