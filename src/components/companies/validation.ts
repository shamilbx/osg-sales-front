import { t } from '@/i18n'

// Те же правила, что на сервере: ошибки видны сразу у поля, не дожидаясь ответа

export function companyNameError(value: string) {
  const length = [...value.trim().replace(/\s+/g, ' ')].length
  if (length === 0) return t('Введите название клиента')
  if (length < 2 || length > 255) return t('Название: от 2 до 255 символов')
  return ''
}

/** ИНН необязателен; если указан — от 9 до 14 цифр */
export function taxIdError(value: string) {
  const v = value.replace(/\s/g, '')
  return v && !/^\d{9,14}$/.test(v) ? t('ИНН: от 9 до 14 цифр') : ''
}

/** Сайт необязателен; если указан — адрес с доменом вида site.uz */
export function websiteError(value: string) {
  const v = value.trim()
  if (!v) return ''
  const host = v
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, '')
    .split(/[/?#]/)[0]!
    .replace(/:\d+$/, '')
    .replace(/^www\./, '')
  return /^([\p{L}\p{N}]([\p{L}\p{N}-]*[\p{L}\p{N}])?\.)+\p{L}{2,}$/u.test(host)
    ? ''
    : t('Введите адрес сайта, например example.uz')
}

export function socialError(value: string) {
  const v = value.trim()
  if (!v) return ''
  return /\s/.test(v) || v.length > 255 ? t('Ссылка без пробелов, до 255 символов') : ''
}

export function contactNameError(value: string) {
  const length = [...value.trim().replace(/\s+/g, ' ')].length
  return length < 2 || length > 100 ? t('Имя должно быть от 2 до 100 символов') : ''
}

/** Телефон необязателен; если указан — от 9 до 15 цифр */
export function contactPhoneError(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return digits.length >= 9 && digits.length <= 15 ? '' : t('Введите номер полностью')
}

export function contactEmailError(value: string) {
  const v = value.trim()
  return v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? t('Невалидный email') : ''
}

/** Telegram необязателен; если указан — ник из 5–32 латинских букв, цифр и _ либо ссылка t.me */
export function telegramError(value: string) {
  const v = value
    .trim()
    .replace(/^(https?:\/\/)?t\.me\//, '')
    .replace(/^@/, '')
  return v && !/^[A-Za-z0-9_]{5,32}$/.test(v) ? t('Ник: 5–32 латинских буквы, цифры и _') : ''
}

/** Нужен хотя бы один способ связи */
export function contactChannelError(phone: string, email: string, telegram: string) {
  return phone.replace(/\D/g, '') || email.trim() || telegram.trim()
    ? ''
    : t('Укажите телефон, email или telegram')
}
