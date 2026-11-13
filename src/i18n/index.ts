import { useLocalStorage } from '@vueuse/core'
import { en, enPlurals } from '@/i18n/en'
import { uz, uzPlurals } from '@/i18n/uz'

export type Locale = 'ru' | 'en' | 'uz'

export const localeOptions: {
  code: Locale
  label: string
  short: string
  badge: string
  intl: string
}[] = [
  { code: 'ru', label: 'Русский', short: 'Ру', badge: 'РУ', intl: 'ru-RU' },
  { code: 'uz', label: 'Oʻzbekcha', short: 'Uz', badge: 'Oʻz', intl: 'uz-UZ' },
  { code: 'en', label: 'English', short: 'En', badge: 'EN', intl: 'en-GB' },
]

// Исходный текст интерфейса написан по-русски и служит ключом: для русского он выводится как есть,
// для остальных языков ищется перевод, а если его нет, показывается исходный текст.
const catalogs: Record<Exclude<Locale, 'ru'>, Record<string, string>> = { en, uz }
const pluralCatalogs: Record<Exclude<Locale, 'ru'>, Record<string, [string, string]>> = {
  en: enPlurals,
  uz: uzPlurals,
}

let stored: ReturnType<typeof useLocalStorage<Locale>> | undefined
const store = () => (stored ??= useLocalStorage<Locale>('ambassador:locale', 'ru'))

export const locale = () => store()

/** Строки без перевода; в режиме разработки доступны в window.__missingI18n */
const missing = new Set<string>()
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as unknown as { __missingI18n: Set<string> }).__missingI18n = missing
}

function interpolate(template: string, params?: Record<string, string | number>) {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`))
}

/** Перевод строки; читает текущий язык, поэтому в шаблонах и computed обновляется сам */
export function t(text: string, params?: Record<string, string | number>) {
  const current = store().value
  if (current === 'ru') return interpolate(text, params)

  const translated = catalogs[current][text]
  if (translated === undefined && /[А-Яа-яЁё]/.test(text)) missing.add(text)
  return interpolate(translated ?? text, params)
}

function russianPlural(count: number, forms: [string, string, string]) {
  const mod100 = Math.abs(count) % 100
  const mod10 = mod100 % 10
  if (mod100 > 10 && mod100 < 20) return forms[2]
  if (mod10 === 1) return forms[0]
  return mod10 >= 2 && mod10 <= 4 ? forms[1] : forms[2]
}

/** Склонение по числу. Для русского берется одна из трех форм, для en и uz пара «один / много» из каталога */
export function tn(count: number, forms: [string, string, string]) {
  const current = store().value
  if (current !== 'ru') {
    const pair = pluralCatalogs[current][forms[0]]
    if (pair) return Math.abs(count) === 1 ? pair[0] : pair[1]
    missing.add(forms[0])
  }
  return russianPlural(count, forms)
}

/** Язык для Intl: форматы дат и чисел */
export function intlLocale() {
  return localeOptions.find((option) => option.code === store().value)?.intl ?? 'ru-RU'
}

export function setLocale(code: Locale) {
  store().value = code
  document.documentElement.lang = code
}

export function useI18n() {
  return { t, tn, locale: store(), setLocale, intlLocale }
}

const monthsShort: Record<string, { en: string; uz: string }> = {
  янв: { en: 'Jan', uz: 'yan' },
  фев: { en: 'Feb', uz: 'fev' },
  мар: { en: 'Mar', uz: 'mar' },
  апр: { en: 'Apr', uz: 'apr' },
  май: { en: 'May', uz: 'may' },
  июн: { en: 'Jun', uz: 'iyn' },
  июл: { en: 'Jul', uz: 'iyl' },
  авг: { en: 'Aug', uz: 'avg' },
  сен: { en: 'Sep', uz: 'sen' },
  окт: { en: 'Oct', uz: 'okt' },
  ноя: { en: 'Nov', uz: 'noy' },
  дек: { en: 'Dec', uz: 'dek' },
}
const monthsLong: Record<string, { en: string; uz: string }> = {
  январь: { en: 'January', uz: 'Yanvar' },
  февраль: { en: 'February', uz: 'Fevral' },
  март: { en: 'March', uz: 'Mart' },
  апрель: { en: 'April', uz: 'Aprel' },
  май: { en: 'May', uz: 'May' },
  июнь: { en: 'June', uz: 'Iyun' },
  июль: { en: 'July', uz: 'Iyul' },
  август: { en: 'August', uz: 'Avgust' },
  сентябрь: { en: 'September', uz: 'Sentabr' },
  октябрь: { en: 'October', uz: 'Oktabr' },
  ноябрь: { en: 'November', uz: 'Noyabr' },
  декабрь: { en: 'December', uz: 'Dekabr' },
}

/** Названия месяцев в коротком тексте дат из демо-данных: «14–24 ноя», «Май 2027» */
export function localizeDates(text: string) {
  const current = store().value
  if (current === 'ru') return text
  return text.replace(/[А-Яа-яЁё]+/g, (word) => {
    const key = word.toLowerCase()
    const entry = monthsShort[key] ?? monthsLong[key]
    return entry ? entry[current] : t(word)
  })
}
