/**
 * ValidationEngine
 * Pure validation runner. No side effects. No DOM access.
 * Shared between CMS previewer and Lit renderer.
 *
 * @param {Array}  validations  - node.validations[]
 * @param {*}      value        - current field value
 * @param {Object} config       - node config (for context-aware rules)
 * @param {string} locale       - locale string e.g. 'en', 'es'
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validate(validations = [], value, config = {}, locale = 'en') {
  const errors = []

  for (const rule of validations) {
    const error = runRule(rule, value, config, locale)
    if (error) errors.push(error)
  }

  return { valid: errors.length === 0, errors }
}

function getMessage(rule, defaultMsg, locale) {
  return rule.i18n?.[locale] ?? rule.i18n?.en ?? defaultMsg
}

function runRule(rule, value, config, locale) {
  const v = value

  switch (rule.type) {
    case 'required': {
      const empty = v === null || v === undefined || String(v).trim() === '' ||
        (Array.isArray(v) && v.length === 0)
      if (empty) return getMessage(rule, 'This field is required', locale)
      break
    }
    case 'min_length': {
      if (v && String(v).length < rule.value) {
        return getMessage(rule, `Minimum ${rule.value} characters required`, locale)
      }
      break
    }
    case 'max_length': {
      if (v && String(v).length > rule.value) {
        return getMessage(rule, `Maximum ${rule.value} characters allowed`, locale)
      }
      break
    }
    case 'regex': {
      if (v && !new RegExp(rule.pattern).test(String(v))) {
        return getMessage(rule, 'Invalid format', locale)
      }
      break
    }
    case 'email': {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (v && !emailRe.test(String(v))) {
        return getMessage(rule, 'Invalid email address', locale)
      }
      break
    }
    case 'min_value': {
      if (v !== null && v !== undefined && Number(v) < rule.value) {
        return getMessage(rule, `Minimum value is ${rule.value}`, locale)
      }
      break
    }
    case 'max_value': {
      if (v !== null && v !== undefined && Number(v) > rule.value) {
        return getMessage(rule, `Maximum value is ${rule.value}`, locale)
      }
      break
    }
    case 'min_checked': {
      const checked = Array.isArray(v) ? v.length : 0
      if (checked < rule.value) {
        return getMessage(rule, `Select at least ${rule.value} option(s)`, locale)
      }
      break
    }
    case 'max_checked': {
      const checked = Array.isArray(v) ? v.length : 0
      if (checked > rule.value) {
        return getMessage(rule, `Select at most ${rule.value} option(s)`, locale)
      }
      break
    }
    case 'file_size': {
      // value expected as File object or { size }
      if (v && v.size && v.size > rule.value * 1024 * 1024) {
        return getMessage(rule, `File size must not exceed ${rule.value}MB`, locale)
      }
      break
    }
    case 'file_type': {
      if (v && v.name) {
        const ext = '.' + v.name.split('.').pop().toLowerCase()
        if (Array.isArray(rule.extensions) && !rule.extensions.includes(ext)) {
          return getMessage(rule, `Allowed file types: ${rule.extensions.join(', ')}`, locale)
        }
      }
      break
    }
  }

  return null
}
