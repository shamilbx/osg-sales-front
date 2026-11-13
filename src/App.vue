<script setup lang="ts">
import { computed, onMounted, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import AppShell from '@/components/layout/AppShell.vue'
import HubShell from '@/components/layout/HubShell.vue'
import ToastHost from '@/components/layout/ToastHost.vue'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, restore } = useAuth()
const isPublic = computed(() => route.meta.public === true)

const { isDark } = useTheme()
// Тёмная тема действует только в самой админке, страница входа всегда светлая
watchEffect(() => {
  document.documentElement.classList.toggle('dark', isDark.value && !isPublic.value)
})

onMounted(restore)

// Сессия закончилась (выход или сервер отклонил токен) — возвращаем на вход
watch(isAuthenticated, (signedIn) => {
  if (!signedIn && !isPublic.value) {
    router.replace({ name: 'login', query: { redirect: route.fullPath } })
  }
})
</script>

<template>
  <ToastHost />
  <RouterView v-if="isPublic" />
  <HubShell v-else-if="route.meta.layout === 'hub'">
    <RouterView />
  </HubShell>
  <AppShell v-else>
    <RouterView />
  </AppShell>
</template>
