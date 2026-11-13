import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import { placeholderSlugs } from '@/config/navigation'
import { useAuth } from '@/composables/useAuth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Страница доступна без входа и рисуется без оболочки приложения */
    public?: boolean
    /** hub — центр управления без бокового меню */
    layout?: 'hub'
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
      path: `/:section(${placeholderSlugs.join('|')})`,
      name: 'section',
      component: () => import('@/views/SectionPlaceholderView.vue'),
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()

  if (!to.meta.public && !isAuthenticated.value) {
    return {
      name: 'login',
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath },
    }
  }
  if (to.name === 'login' && isAuthenticated.value) return { name: 'modules' }
})

export default router
