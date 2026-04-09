/**
 * FormRendererLoader
 * Scans DOM for [data-form-builder] placeholders and injects <form-renderer>.
 * Uses MutationObserver to handle dynamically added placeholders.
 */
export class FormRendererLoader {
  static init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => FormRendererLoader._scan())
    } else {
      FormRendererLoader._scan()
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue
          if (node.hasAttribute?.('data-form-builder')) {
            FormRendererLoader._inject(node)
          }
          node.querySelectorAll?.('[data-form-builder]').forEach(FormRendererLoader._inject)
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
  }

  static _scan() {
    document.querySelectorAll('[data-form-builder]').forEach(FormRendererLoader._inject)
  }

  static _inject(placeholder) {
    if (placeholder.dataset.fbInjected) return
    placeholder.dataset.fbInjected = '1'

    const el = document.createElement('form-renderer')
    const attrs = ['form-id', 'env', 'render-key', 'shadow-dom']
    for (const attr of attrs) {
      const val = placeholder.getAttribute(attr)
      if (val !== null) el.setAttribute(attr, val)
    }
    placeholder.appendChild(el)
  }
}

// Auto-init when used as IIFE/CDN script
FormRendererLoader.init()
