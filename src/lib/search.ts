/** Нижний регистр и «ё» как «е»: «Ёлкин» находится по «елкин» */
const normalize = (value: string) => value.toLowerCase().replaceAll('ё', 'е')

const MIN_PHONE_DIGITS = 3

/**
 * Поиск как на сервере: без учёта регистра и «ё», каждое слово запроса ищется отдельно
 * («шамиль бах» найдёт «Бахшиллаев Шамиль»), а цифры сверяются с телефонами без пробелов и плюса.
 * Запрос, похожий на телефон, не делится на слова
 */
export function matchesSearch(
  query: string,
  texts: (string | undefined | null)[],
  phones: (string | undefined | null)[] = [],
) {
  const needle = normalize(query.trim())
  if (!needle) return true

  const phoneLike =
    /^[\d\s+()-]+$/.test(needle) && needle.replace(/\D/g, '').length >= MIN_PHONE_DIGITS
  const tokens = phoneLike ? [needle] : needle.split(/\s+/)
  const haystack = texts.filter((text): text is string => Boolean(text)).map(normalize)
  const phoneDigits = phones
    .filter((phone): phone is string => Boolean(phone))
    .map((phone) => phone.replace(/\D/g, ''))

  return tokens.every((token) => {
    const digits = token.replace(/\D/g, '')
    return (
      haystack.some((text) => text.includes(token)) ||
      (digits.length >= MIN_PHONE_DIGITS && phoneDigits.some((phone) => phone.includes(digits)))
    )
  })
}
