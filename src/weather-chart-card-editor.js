import { LitElement, html } from 'lit';
import { SIZE_GROUPS, normaliseSizeOffsets } from './size-options.js';
import { MAIN_FIELDS, FORECAST_FIELDS, UNIT_FIELDS, LAYOUT_FIELDS, ALTERNATE_FIELDS } from './editor-options.js';

const PAGES = [['card', 'Main'], ['forecast', 'Forecast'], ['layout', 'Layout'], ['units', 'Units'], ['sizes', 'Sizes'], ['alternate', 'Alternate entities']];

class WeatherChartCardEditor extends LitElement {
  static get properties() {
    return { _config: { type: Object }, currentPage: { type: String }, hass: { type: Object } };
  }

  constructor() {
    super();
    this.currentPage = 'card';
  }

  setConfig(config) {
    if (!config || typeof config !== 'object') throw new Error('Invalid card configuration');
    this._config = config;
  }

  get config() { return this._config; }

  configChanged(config) {
    this._config = config;
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }

  showPage(page) { this.currentPage = page; }

  _data(fields, source) {
    return Object.fromEntries(fields.map(field => {
      let value = source[field.name];
      if (value === undefined || value === null) value = field.defaultValue;
      if (field.selector.number && value !== undefined && value !== '') value = Number(value);
      if (field.selector.select && value === '' && field.selector.select.options.some(option => option.value === 'auto')) value = 'auto';
      if (field.name === 'speed' && value === 'Beaufort') value = 'Bft';
      return [field.name, value];
    }));
  }

  _sectionChanged(event, fields, scope) {
    const config = { ...this._config };
    const target = scope ? { ...config[scope] } : config;
    const data = event.detail.value;
    for (const field of fields) {
      if (!Object.prototype.hasOwnProperty.call(data, field.name)) continue;
      const value = data[field.name];
      if (scope === 'units' && value === 'auto') target[field.name] = '';
      else if (value === undefined || value === null || value === '' || (field.name === 'locale' && value === 'auto')) delete target[field.name];
      else target[field.name] = field.selector.number ? Number(value) : value;
    }
    if (scope) config[scope] = target;
    // A GUI unit choice replaces, rather than conflicts with, the legacy alias.
    if (scope === 'units') delete config.speed;
    this.configChanged(config);
  }

  _layoutChanged(event) {
    const data = event.detail.value;
    const forecast = { ...this._config.forecast };
    for (const field of LAYOUT_FIELDS) {
      if (field.name !== 'padding_scale') forecast[field.name] = data[field.name] === undefined ? field.defaultValue : data[field.name];
    }
    this.configChanged({ ...this._config, forecast, padding_scale: data.padding_scale === undefined ? 0.7 : Number(data.padding_scale) });
  }

  _sizeOffsetsChanged(event) {
    const values = Object.fromEntries(Object.entries(event.detail.value).map(([key, value]) => [key, value === undefined || value === null || value === '' ? 0 : Number(value)]));
    if (Object.values(values).some(value => !Number.isFinite(value))) return;
    this.configChanged({ ...this._config, size_offsets: normaliseSizeOffsets({ ...this._config.size_offsets, ...values }) });
  }

  _schema(fields) {
    return fields.map(({ name, label, selector, required }) => ({ name, label, selector, required }));
  }

  _form(fields, id, scope) {
    let source = scope ? this._config[scope] || {} : this._config;
    if (scope === 'units' && source.speed === undefined && this._config.speed) source = { ...source, speed: this._config.speed };
    return html`<ha-form
      data-editor-section=${id}
      .hass=${this.hass}
      .data=${this._data(fields, source)}
      .schema=${this._schema(fields)}
      .computeLabel=${schema => schema.label || schema.name}
      @value-changed=${event => this._sectionChanged(event, fields, scope)}
    ></ha-form>`;
  }

  render() {
    if (!this._config) return html``;
    const forecast = this._config.forecast || {};
    return html`
      <style>
        :host { display: block; }
        .tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .tabs .active { outline: 2px solid var(--primary-color); border-radius: 8px; }
        .page { display: none; }
        .page.active { display: block; }
        details { margin: 12px 0; }
        summary { cursor: pointer; font-weight: 500; padding: 8px 0; }
        p { color: var(--secondary-text-color); line-height: 1.5; }
      </style>
      <nav class="tabs" aria-label="Weather card configuration">
        ${PAGES.map(([id, title]) => html`<ha-button class=${this.currentPage === id ? 'active' : ''} aria-pressed=${this.currentPage === id ? 'true' : 'false'} @click=${() => this.showPage(id)}>${title}</ha-button>`)}
      </nav>
      <div class="page ${this.currentPage === 'card' ? 'active' : ''}">
        <p>Choose the weather entity and current conditions to display. Optional attributes appear only when the entity or an alternate sensor provides them.</p>
        ${this._form(MAIN_FIELDS, 'card')}
      </div>
      <div class="page ${this.currentPage === 'forecast' ? 'active' : ''}">
        <p>The provider must supply the selected forecast type. The point count limits supplied data; it does not request additional days.</p>
        ${this._form(FORECAST_FIELDS, 'forecast', 'forecast')}
      </div>
      <div class="page ${this.currentPage === 'layout' ? 'active' : ''}">
        <p>Control unit placement, forecast label weight and spacing. Select the common wind unit under Units.</p>
        <ha-form
          data-detail-layout data-editor-section="layout"
          .hass=${this.hass}
          .data=${this._data(LAYOUT_FIELDS, { ...forecast, padding_scale: this._config.padding_scale })}
          .schema=${this._schema(LAYOUT_FIELDS)}
          .computeLabel=${schema => schema.label}
          @value-changed=${this._layoutChanged}
        ></ha-form>
      </div>
      <div class="page ${this.currentPage === 'units' ? 'active' : ''}">
        <p>Wind units apply to current speed, gusts and all forecast indicators. Temperature follows the weather entity's display unit.</p>
        ${this._form(UNIT_FIELDS, 'units', 'units')}
      </div>
      <div class="page ${this.currentPage === 'sizes' ? 'active' : ''}">
        <p>Signed CSS-pixel adjustments: 0 keeps the baseline, +2 adds 2 px, -2 subtracts 2 px. Final sizes have a 1 px floor. Existing absolute size settings remain the baseline.</p>
        ${SIZE_GROUPS.map(group => html`<details><summary>${group.title}</summary>
          <ha-form
            data-size-group=${group.title}
            .hass=${this.hass}
            .data=${Object.fromEntries(group.fields.map(field => [field.key, (this._config.size_offsets || {})[field.key] || 0]))}
            .schema=${group.fields.map(field => ({ name: field.key, label: `${field.label} (+/- px)`, selector: { number: { mode: 'box', step: 1 } } }))}
            .computeLabel=${schema => schema.label}
            @value-changed=${this._sizeOffsetsChanged}
          ></ha-form>
        </details>`)}
      </div>
      <div class="page ${this.currentPage === 'alternate' ? 'active' : ''}">
        <p>Clear a sensor to use weather-entity data. Unavailable configured sensors do not silently substitute a different reading. Supply numeric sensor states with unit metadata.</p>
        ${this._form(ALTERNATE_FIELDS, 'alternate')}
      </div>
    `;
  }
}
customElements.define('weather-chart-card-editor', WeatherChartCardEditor);
