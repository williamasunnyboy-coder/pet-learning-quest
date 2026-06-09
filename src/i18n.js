/**
 * 轻量 i18n —— 无外部依赖
 *
 * 用法：
 *   import { t, setLocale } from './i18n'
 *   t('hello')                          // 简单 key
 *   t('welcome', { name: '小明' })       // 含参
 *
 * 默认中文。需要英文 / 繁中时，在 locales 里加映射即可，组件无需改动。
 */
import zhCN from './locales/zh-CN'

const locales = {
  'zh-CN': zhCN,
  // 'en-US': enUS,
  // 'zh-TW': zhTW,
}

let current = 'zh-CN'
const subscribers = new Set()

export function setLocale(locale) {
  if (!locales[locale]) return
  current = locale
  subscribers.forEach(fn => fn())
}

export function getLocale() {
  return current
}

export function getAvailableLocales() {
  return Object.keys(locales)
}

export function t(key, params) {
  const dict = locales[current] || zhCN
  const raw  = dict[key] ?? key
  if (!params) return raw
  return raw.replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '')
}

// React hook 友好（强制重渲染）
import { useEffect, useState } from 'react'
export function useT() {
  const [, setN] = useState(0)
  useEffect(() => {
    const fn = () => setN(n => n + 1)
    subscribers.add(fn)
    return () => subscribers.delete(fn)
  }, [])
  return { t, locale: current, setLocale }
}
