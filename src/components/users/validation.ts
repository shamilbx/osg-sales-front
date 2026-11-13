import { t } from '@/i18n'

// Те же правила, что на сервере: ошибки показываются сразу у поля, не дожидаясь ответа

export function usernameError(value: string) {
  const v = value.trim()
  if (!v) return t('Введите логин')
  if (!/^[A-Za-z0-9._-]{3,50}$/.test(v)) return t('От 3 до 50 символов: латиница, цифры и . _ -')
  return ''
}

export function emailError(value: string) {
  const v = value.trim()
  if (!v) return t('Введите email')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return t('Невалидный email')
  return ''
}

export function fullNameError(value: string) {
  const length = [...value.trim()].length
  return length > 0 && (length < 2 || length > 100) ? t('Имя должно быть от 2 до 100 символов') : ''
}

/** Пустой телефон допустим; иначе — узбекский номер целиком */
export function phoneError(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  return /^998\d{9}$/.test(digits) ? '' : t('Введите номер полностью: +998 и 9 цифр')
}

export function passwordError(value: string, required: boolean) {
  if (!value) return required ? t('Введите пароль') : ''
  if (value.length < 8) return t('Пароль должен быть не менее 8 символов')
  if (value.length > 72) return t('Пароль должен быть не длиннее 72 символов')
  if (!/^[\x21-\x7e]+$/.test(value) || !/[A-Za-z]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return t('Латиница, цифры и символы; хотя бы одна буква и один символ')
  }
  return ''
}
