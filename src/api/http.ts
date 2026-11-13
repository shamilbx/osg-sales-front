import { locale, t } from '@/i18n'

// Адрес бэкенда; для другого окружения задаётся в .env как VITE_API_URL
const BASE_URL = String(import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

const TOKEN_KEY = 'ambassador:token'

export class ApiError extends Error {
  readonly status: number
  /** Тело ответа целиком: у ошибок бывают дополнительные поля, например duplicate */
  readonly data: Record<string, unknown> | null

  constructor(message: string, status: number, data: Record<string, unknown> | null = null) {
    super(message)
    this.status = status
    this.data = data
  }
}

export function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function saveToken(token: string, remember: boolean) {
  try {
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  } catch {
    // Хранилище недоступно (приватный режим) — сессия живёт до перезагрузки
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    // ничего не делаем
  }
}

// Вызывается, когда сервер отклонил токен: useAuth сбрасывает сессию
let onUnauthorized: (() => void) | undefined
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | undefined>
  /** false — запрос без токена (вход) */
  auth?: boolean
}

// Ошибки сервера приходят уже переведёнными: язык берётся из Accept-Language
export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const url = new URL(BASE_URL + path)
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = { 'Accept-Language': locale().value }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = readToken()
  if (token && options.auth !== false) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new ApiError(t('Нет связи с сервером'), 0)
  }

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && options.auth !== false) onUnauthorized?.()
    throw new ApiError(data?.error ?? t('Ошибка сервера'), response.status, data)
  }
  return data as T
}
