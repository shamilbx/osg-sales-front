import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { placeholderSlugs } from '@/config/navigation'
import { useAuth, type Role } from '@/composables/useAuth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Страница доступна без входа и рисуется без оболочки приложения */
    public?: boolean
    /** hub — центр управления без бокового меню */
    layout?: 'hub'
    /** Кому открыта страница; без списка — всем ролям. Сервер проверяет права сам, это только навигация */
    roles?: Role[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/modules',
      name: 'modules',
      component: () => import('@/views/HubView.vue'),
      meta: { layout: 'hub' },
    },
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/UsersView.vue'),
      meta: { roles: ['superadmin'] },
    },
    {
      path: `/:section(${placeholderSlugs.join('|')})`,
      name: 'section',
      component: () => import('@/views/SectionPlaceholderView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const { isAuthenticated, user, restore } = useAuth()

  if (!to.meta.public && !isAuthenticated.value) {
    return {
      name: 'login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
    }
  }
  if (to.name === 'login' && isAuthenticated.value) return { name: 'modules' }

  // Страница только для некоторых ролей: сначала нужен профиль, чтобы знать роль
  if (to.meta.roles && isAuthenticated.value) {
    await restore()
    if (user.value && !to.meta.roles.includes(user.value.role)) return { name: 'dashboard' }
  }
})

export default router
