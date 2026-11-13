export const UZBEKISTAN = 'Узбекистан'

/** Загранпаспорт Узбекистана: серия из двух латинских букв и 7 цифр — «AA 1234567» */
export function formatUzPassport(raw: string) {
  let series = ''
  let digits = ''
  for (const char of raw.toUpperCase()) {
    if (series.length < 2 && digits === '' && /[A-Z]/.test(char)) series += char
    else if (series.length === 2 && digits.length < 7 && /\d/.test(char)) digits += char
  }
  return digits ? `${series} ${digits}` : series
}

export const isValidUzPassport = (value: string) => /^[A-Z]{2} \d{7}$/.test(value)
