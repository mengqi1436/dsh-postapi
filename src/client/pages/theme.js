// theme.js — 主题/语言本地草稿（host face 未定义 settings 存储，暂走 localStorage）
const THEME_KEY = 'postapi.settings.theme'
const LOCALE_KEY = 'postapi.settings.locale'

export function readTheme() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) || 'light' : 'light'
  } catch {
    return 'light'
  }
}
export function saveTheme(value) {
  try { localStorage.setItem(THEME_KEY, value) } catch { /* 忽略隐私模式 */ }
}
export function readLocale() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_KEY) || 'zh-CN' : 'zh-CN'
  } catch {
    return 'zh-CN'
  }
}
export function saveLocale(value) {
  try { localStorage.setItem(LOCALE_KEY, value) } catch { /* 忽略隐私模式 */ }
}
export function applyTheme(el) {
  if (el) el.setAttribute('data-theme', readTheme())
}
