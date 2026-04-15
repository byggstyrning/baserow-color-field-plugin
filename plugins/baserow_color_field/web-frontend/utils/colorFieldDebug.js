/**
 * Color field debug helpers (grid + row modal).
 *
 * Opt-in console lines. Enable: localStorage.setItem('baserowColorDebug', '1')
 * Disable: localStorage.removeItem('baserowColorDebug')
 */
const STORAGE_KEY = 'baserowColorDebug'

export function isColorFieldDebugEnabled() {
  if (typeof window === 'undefined') {
    return false
  }
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * @param {'ColorPickerPopup' | 'GridViewFieldColor' | 'RowEditFieldColor'} surface
 * @param {string} event
 * @param {Record<string, unknown>} data
 */
export function colorFieldDebug(surface, event, data = {}) {
  if (!isColorFieldDebugEnabled()) {
    return
  }
  const line = {
    t: Date.now(),
    surface,
    event,
    ...data,
  }
  console.debug(`[baserow-color] ${JSON.stringify(line)}`)
}
