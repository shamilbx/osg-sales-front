export interface PhoneCountry {
  code: string
  flag: string
  /** Название на русском, переводится через t() в интерфейсе */
  name: string
  /** Сколько цифр в номере без кода страны */
  digits: number
  format: (digits: string) => string
}

const group = (digits: string, sizes: number[]) => {
  const parts: string[] = []
  let position = 0
  for (const size of sizes) {
    if (position >= digits.length) break
    parts.push(digits.slice(position, position + size))
    position += size
  }
  return parts.join(' ')
}

// «(916) 482-17-05», как у клиентов из демо-данных
const russian = (digits: string) => {
  const area = digits.slice(0, 3)
  const rest = [digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)]
  let text = area.length === 3 ? `(${area})` : area ? `(${area}` : ''
  if (rest[0]) text += ` ${rest[0]}`
  if (rest[1]) text += `-${rest[1]}`
  if (rest[2]) text += `-${rest[2]}`
  return text
}

export const phoneCountries: PhoneCountry[] = [
  {
    code: '+998',
    flag: '🇺🇿',
    name: 'Узбекистан',
    digits: 9,
    format: (d) => group(d, [2, 3, 2, 2]),
  },
  { code: '+7', flag: '🇷🇺', name: 'Россия', digits: 10, format: russian },
  { code: '+992', flag: '🇹🇯', name: 'Таджикистан', digits: 9, format: (d) => group(d, [2, 3, 4]) },
  { code: '+996', flag: '🇰🇬', name: 'Киргизия', digits: 9, format: (d) => group(d, [3, 3, 3]) },
  { code: '+993', flag: '🇹🇲', name: 'Туркменистан', digits: 8, format: (d) => group(d, [2, 6]) },
  { code: '+90', flag: '🇹🇷', name: 'Турция', digits: 10, format: (d) => group(d, [3, 3, 2, 2]) },
  { code: '+971', flag: '🇦🇪', name: 'ОАЭ', digits: 9, format: (d) => group(d, [2, 3, 4]) },
]

export const defaultPhoneCountry = phoneCountries[0]!

export const findPhoneCountry = (code: string) =>
  phoneCountries.find((country) => country.code === code) ?? defaultPhoneCountry

/** Полный номер: «+998 90 123 45 67», пусто, если цифр ещё нет */
export function composePhone(code: string, localDigits: string) {
  const country = findPhoneCountry(code)
  const digits = localDigits.replace(/\D/g, '').slice(0, country.digits)
  return digits ? `${country.code} ${country.format(digits)}` : ''
}

/** Разбирает сохранённый номер на код страны и цифры: «+7 (916) 482-17-05» → +7 и 9164821705 */
export function parsePhone(value: string) {
  const compact = value.replace(/[^\d+]/g, '')
  const country = [...phoneCountries]
    .sort((a, b) => b.code.length - a.code.length)
    .find((item) => compact.startsWith(item.code))
  if (!country) return { code: defaultPhoneCountry.code, digits: compact.replace(/\D/g, '') }
  return { code: country.code, digits: compact.slice(country.code.length) }
}

/** Номер для показа: «+79628710425» → «+7 (962) 871-04-25»; незнакомый формат остаётся как есть */
export function formatPhone(value: string) {
  const compact = value.replace(/[^\d+]/g, '')
  const country = phoneCountries.find((item) => compact.startsWith(item.code))
  if (!country) return value
  const digits = compact.slice(country.code.length)
  return digits.length === country.digits ? `${country.code} ${country.format(digits)}` : value
}

/** Номер заполнен целиком */
export const isPhoneComplete = (code: string, localDigits: string) =>
  localDigits.replace(/\D/g, '').length === findPhoneCountry(code).digits
