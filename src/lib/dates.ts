import { intlLocale, locale, t } from '@/i18n'

// В части сборок браузеров нет названий месяцев и дней для узбекского («M09»), поэтому они свои
const uzMonthsShort = [
  'yan',
  'fev',
  'mar',
  'apr',
  'may',
  'iyn',
  'iyl',
  'avg',
  'sen',
  'okt',
  'noy',
  'dek',
]
const uzMonthsLong = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
]
const uzWeekdays = [
  'yakshanba',
  'dushanba',
  'seshanba',
  'chorshanba',
  'payshanba',
  'juma',
  'shanba',
]

const part = (type: Intl.DateTimeFormatPartTypes, value: string): Intl.DateTimeFormatPart => ({
  type,
  value,
})

/** Дата узбекского формата «8 noyabr 2026»; время и прочее отдаем штатному Intl */
function uzParts(options: Intl.DateTimeFormatOptions, date: Date): Intl.DateTimeFormatPart[] {
  if (options.weekday) return [part('weekday', uzWeekdays[date.getDay()]!)]
  const months = options.month === 'long' ? uzMonthsLong : uzMonthsShort
  const parts = [part('day', String(date.getDate()))]
  if (options.month) parts.push(part('literal', ' '), part('month', months[date.getMonth()]!))
  if (options.year) parts.push(part('literal', ' '), part('year', String(date.getFullYear())))
  return parts
}

interface DateFormatter {
  format(date: Date): string
  formatToParts(date: Date): Intl.DateTimeFormatPart[]
}

const cache = new Map<string, Intl.DateTimeFormat>()

/** Форматтер дат для текущего языка; создается один раз на пару «язык + параметры» */
export function dtf(options: Intl.DateTimeFormatOptions): DateFormatter {
  if (locale().value === 'uz' && (options.weekday || options.month)) {
    return {
      format: (date) =>
        uzParts(options, date)
          .map((item) => item.value)
          .join(''),
      formatToParts: (date) => uzParts(options, date),
    }
  }
  const key = `${intlLocale()}:${JSON.stringify(options)}`
  let format = cache.get(key)
  if (!format) {
    format = new Intl.DateTimeFormat(intlLocale(), options)
    cache.set(key, format)
  }
  return format
}

/** ISO-дата (YYYY-MM-DD) в читаемый вид: «8 нояб. 2026» или «8 ноября 2026» */
export function formatIsoDate(iso: string, month: 'short' | 'long' = 'short') {
  return dtf({ day: 'numeric', month, year: 'numeric' })
    .format(new Date(`${iso}T00:00:00`))
    .replace(/\s*г\.$/, '')
}

// Даты поездки хранятся по-русски, как в остальных заявках («12–22 дек»); в интерфейсе их переводит localizeDates
const ruMonths = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
]

/** «14–24 ноя» или «20 ноя – 4 дек» по дате вылета и числу ночей */
export function tripDates(departure: string, nights: number) {
  const start = new Date(`${departure}T00:00:00`)
  const end = new Date(start)
  end.setDate(end.getDate() + nights)
  const startMonth = ruMonths[start.getMonth()]!
  const endMonth = ruMonths[end.getMonth()]!
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()}–${end.getDate()} ${endMonth}`
    : `${start.getDate()} ${startMonth} – ${end.getDate()} ${endMonth}`
}

/** Дата и время события: «Сегодня, 14:32», «Вчера, 09:05» или «8 нояб., 14:32» */
export function formatDateTime(iso: string) {
  const date = new Date(iso)
  const time = dtf({ hour: '2-digit', minute: '2-digit' }).format(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
  if (same(date, today)) return `${t('Сегодня')}, ${time}`
  if (same(date, yesterday)) return `${t('Вчера')}, ${time}`
  return `${dtf({ day: 'numeric', month: 'short' }).format(date)}, ${time}`
}
