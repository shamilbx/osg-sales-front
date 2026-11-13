import { computed, ref } from 'vue'
import {
  ApiError,
  clearToken,
  readToken,
  request,
  saveToken,
  setUnauthorizedHandler,
} from '@/api/http'
import { t } from '@/i18n'

export type Role = 'superadmin' | 'director' | 'manager' | 'accountant'

export interface AuthUser {
  id: number
  username: string
  email: string
  role: Role
  full_name: string
  phone: string
  lang: string
  status: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export const roleLabels: Record<Role, string> = {
  get superadmin() {
    return t('Суперадмин')
  },
  get director() {
    return t('Руководитель')
  },
  get manager() {
    return t('Менеджер')
  },
  get accountant() {
    return t('Бухгалтер')
  },
}

// Общее состояние на всё приложение
const token = ref(readToken())
const user = ref<AuthUser | null>(null)

function reset() {
  clearToken()
  token.value = null
  user.value = null
}

// Сервер отклонил токен (истёк, пользователь заблокирован): выходим
setUnauthorizedHandler(reset)

export function useAuth() {
  async function login(username: string, password: string, remember: boolean) {
    const data = await request<{ token: string; user: AuthUser }>('/login', {
      method: 'POST',
      body: { username: username.trim(), password },
      auth: false,
    })
    saveToken(data.token, remember)
    token.value = data.token
    user.value = data.user
  }

  function logout() {
    reset()
  }

  /** Профиль изменился (сохранили свои данные): шапка и меню сразу видят новое */
  function setUser(updated: AuthUser) {
    user.value = updated
  }

  /** Подтягивает профиль по сохранённому токену; при отказе сервера сессия сбрасывается */
  async function restore() {
    if (!token.value || user.value) return
    try {
      user.value = (await request<{ user: AuthUser }>('/api/profile')).user
    } catch (error) {
      // Нет связи с сервером — оставляем сессию как есть, профиль подтянется позже
      if (!(error instanceof ApiError) || error.status === 401) return
    }
  }

  return {
    isAuthenticated: computed(() => Boolean(token.value)),
    user: computed(() => user.value),
    login,
    logout,
    restore,
    setUser,
  }
}
