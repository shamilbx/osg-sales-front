import { t } from '@/i18n'
import type { Component } from 'vue'
import { LayoutDashboard, LifeBuoy, Settings, TrendingUp } from '@lucide/vue'
import type { Tone } from '@/lib/types'

export interface NavItem {
  title: string
  to: string
  icon: Component
  badge?: number
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
    ],
  },
]

export const systemNav: NavItem[] = [
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

/** Разделы, для которых пока показывается заглушка */
export const placeholderSlugs = allNav
  .filter((item) => item.to !== '/' && item.to !== '/settings')
  .map((item) => item.to.slice(1))
