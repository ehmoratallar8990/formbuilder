/**
 * Form Builder Renderer
 * Public API entry point.
 *
 * CDN usage:
 *   <script src="form-renderer.iife.js"></script>
 *   <div data-form-builder form-id="..." env="production" render-key="..."></div>
 *
 * NPM/ESM usage:
 *   import '@formbuilder/renderer'
 *   // <form-renderer> custom element registered automatically
 */

export { FormRenderer } from './components/FormRenderer.js'
export { FormRendererLoader } from './loader.js'
