import { intlLocale, t, tn } from '@/i18n'
import type { MetricFormat } from '@/lib/types'

const NBSP = ' '

// Ручное форматирование вместо Intl: разделители не зависят от версии ICU
// на сервере и в браузере, поэтому не будет расхождений при гидрации.
const isEnglish = () => intlLocale().startsWith('en')

/** Десятичный знак: запятая для русского и узбекского, точка для английского */
export const decimalSign = () => (isEnglish() ? '.' : ',')

function groupThousands(value: number) {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, isEnglish() ? ',' : NBSP)
}

function toFixedRu(value: number, digits = 1) {
  const fixed = value.toFixed(digits).replace(/\.0+$/, '')
  return fixed.replace('.', decimalSign())
}

/** Сумма в сумах: «76 755 000 сум», «76,755,000 UZS» */
export function formatMoney(value: number) {
  return `${groupThousands(value)}${NBSP}${t('сум')}`
}

/** Короткая запись числа: «9,9 млрд», «76,8 млн», «450 тыс» */
export function formatCompactNumber(value: number) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${toFixedRu(value / 1_000_000_000)}${NBSP}${t('млрд')}`
  if (abs >= 1_000_000) return `${toFixedRu(value / 1_000_000)}${NBSP}${t('млн')}`
  if (abs >= 1_000) return `${toFixedRu(value / 1_000, 0)}${NBSP}${t('тыс')}`
  return groupThousands(value)
}

export function formatCompactMoney(value: number) {
  return `${formatCompactNumber(value)}${NBSP}${t('сум')}`
}

export function formatPercent(value: number, digits = 1) {
  return `${toFixedRu(value, digits)}%`
}

export function formatNumber(value: number) {
  return groupThousands(value)
}

export function formatMetric(value: number, format: MetricFormat) {
  switch (format) {
    case 'currency':
      return formatCompactMoney(value)
    case 'percent':
      return formatPercent(value)
    default:
      return formatNumber(value)
  }
}

export function formatDelta(value: number) {
  return `${toFixedRu(Math.abs(value))}%`
}

/** Склонение по числу: plural(3, ['заявка', 'заявки', 'заявок']) → «заявки» (с учетом языка) */
export const plural = tn
