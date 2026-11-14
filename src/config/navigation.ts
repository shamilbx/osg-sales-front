import { t } from '@/i18n'
import type { Component } from 'vue'
import {
  Building2,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  TrendingUp,
  UserPlus,
  UsersRound,
} from '@lucide/vue'
import type { Tone } from '@/lib/types'
import type { Role } from '@/composables/useAuth'

export interface NavItem {
  title: string
  to: string
  icon: Component
  badge?: number
  /** Кому виден пункт; без списка — всем ролям */
  roles?: Role[]
}

export interface NavModule {
  id: string
  /** Трёхбуквенный код модуля, как код аэропорта на билете */
  code: string
  title: string
  description: string
  /** Короткая сводка, которую центр управления показывает по кнопке «Показать статистику» */
  stat: string
  icon: Component
  tone: Tone
  items: NavItem[]
}

// Каждый модуль показывает в сайдбаре свой набор разделов. Здесь пока один модуль с дашбордом:
// остальные разделы и модули добавляются по мере появления страниц
export const modules: NavModule[] = [
  {
    id: 'sales',
    code: 'SLS',
    get title() {
      return t('Продажи')
    },
    get description() {
      return t('Система управления продажами')
    },
    get stat() {
      return t('Данные появятся после подключения сервера')
    },
    icon: TrendingUp,
    tone: 'blue',
    items: [
      {
        get title() {
          return t('Дашборд')
        },
        to: '/',
        icon: LayoutDashboard,
      },
      {
        get title() {
          return t('Клиенты')
        },
        to: '/clients',
        icon: Building2,
      },
      {
        get title() {
          return t('Лиды')
        },
        to: '/leads',
        icon: UserPlus,
      },
    ],
  },
]

export const systemNav: NavItem[] = [
  {
    get title() {
      return t('Сотрудники')
    },
    to: '/users',
    icon: UsersRound,
    roles: ['superadmin'],
  },
  {
    get title() {
      return t('Настройки')
    },
    to: '/settings',
    icon: Settings,
  },
  {
    get title() {
      return t('Поддержка')
    },
    to: '/support',
    icon: LifeBuoy,
  },
]

export const allNav: NavItem[] = [...modules.flatMap((module) => module.items), ...systemNav]

export function isActivePath(to: string, path: string) {
  return to === '/' ? path === '/' : path === to || path.startsWith(`${to}/`)
}

/** Виден ли пункт меню сотруднику с ролью role; пока профиль не загружен, закрытые пункты скрыты */
export const canSee = (item: NavItem, role: Role | undefined) =>
  !item.roles || (role !== undefined && item.roles.includes(role))

/** Разделы со своей страницей; остальным пунктам меню показывается заглушка */
const pages = ['/', '/settings', '/profile', '/users', '/clients', '/leads']

/** Разделы, для которых пока показывается заглушка */
export const placeholderSlugs = allNav
  .filter((item) => !pages.includes(item.to))
  .map((item) => item.to.slice(1))
