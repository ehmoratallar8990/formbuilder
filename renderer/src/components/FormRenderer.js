import { LitElement, html, css } from 'lit'

/**
 * <form-renderer> custom element.
 *
 * Attributes:
 *   form-id       {string}  Form slug
 *   env           {string}  Environment: development | staging | production
 *   render-key    {string}  Render access key
 *   shadow-dom    {boolean} Enable Shadow DOM encapsulation (default: false)
 *
 * Public API:
 *   getFormData()               → { [nodeId]: value }
 *   setFieldValue(nodeId, val)  → void
 *   submit()                    → void
 *   reset()                     → void
 */
export class FormRenderer extends LitElement {
  static properties = {
    formId: { type: String, attribute: 'form-id' },
    env: { type: String },
    renderKey: { type: String, attribute: 'render-key' },
    shadowDom: { type: Boolean, attribute: 'shadow-dom' },
    _formJson: { state: true },
    _loading: { state: true },
    _denied: { state: true },
    _denialReason: { state: true }
  }

  // Disable Shadow DOM by default — light DOM is the default
  createRenderRoot() {
    if (this.shadowDom) {
      return this.attachShadow({ mode: 'open' })
    }
    return this
  }

  constructor() {
    super()
    this.env = 'production'
    this.shadowDom = false
    this._loading = false
    this._denied = false
    this._denialReason = null
    this._formJson = null
    this._fieldValues = {}
  }

  connectedCallback() {
    super.connectedCallback()
    this._fetchForm()
  }

  async _fetchForm() {
    this._loading = true
    try {
      const url = `/api/render/form/${this.formId}?env=${this.env}&key=${this.renderKey}`
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' }
      })
      if (res.status === 403) {
        const body = await res.json()
        this._denied = true
        this._denialReason = body.reason
        this._dispatch('render-denied', { reason: body.reason, message: body.message })
        return
      }
      const data = await res.json()
      this._formJson = data.form_json
      this._dispatch('loaded', { revision: data.revision })
    } catch (err) {
      this._denied = true
      this._denialReason = 'network_error'
      this._dispatch('render-denied', { reason: 'network_error' })
    } finally {
      this._loading = false
    }
  }

  _dispatch(event, detail = {}) {
    window.dispatchEvent(new CustomEvent(`form-renderer:${event}`, {
      detail: { formId: this.formId, env: this.env, ...detail },
      bubbles: true
    }))
  }

  // --- Public API ---

  getFormData() {
    return { ...this._fieldValues }
  }

  setFieldValue(nodeId, value) {
    this._fieldValues = { ...this._fieldValues, [nodeId]: value }
    this.requestUpdate()
    this._dispatch('field-change', { nodeId, value })
  }

  submit() {
    // Implemented in Story 8.2 — placeholder
    this._dispatch('submit', { data: this.getFormData() })
  }

  reset() {
    this._fieldValues = {}
    this.requestUpdate()
  }

  // --- Render ---

  render() {
    if (this._loading) {
      return html`<div class="fb-form--loading" role="status" aria-label="Loading form"></div>`
    }
    if (this._denied) {
      return html`<slot name="denied"><div class="fb-form--error" role="alert"></div></slot>`
    }
    if (!this._formJson) {
      return html``
    }
    return html`<div class="fb-form--loaded"><slot></slot></div>`
  }
}

customElements.define('form-renderer', FormRenderer)
