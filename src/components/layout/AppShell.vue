<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { onKeyStroke, useLocalStorage } from '@vueuse/core'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'
import AppHeader from '@/components/layout/AppHeader.vue'
import AppLogo from '@/components/layout/AppLogo.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'

const mobileOpen = ref(false)
// Состояние запоминается между визитами
const sidebarCollapsed = useLocalStorage('ambassador:sidebar-collapsed', false)
const route = useRoute()

const content = useTemplateRef<HTMLElement>('content')

watch(
  () => route.fullPath,
  () => (mobileOpen.value = false),
)
// Страница прокручивается внутри контейнера, поэтому при переходе его надо возвращать наверх
watch(
  () => route.path,
  () => content.value?.scrollTo({ top: 0 }),
)
onKeyStroke('Escape', () => (mobileOpen.value = false))
</script>

<template>
  <div
    :class="
      cn(
        'mx-auto grid h-svh max-w-[1920px] grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden p-3 transition-[grid-template-columns] duration-300 sm:p-4 lg:p-6',
        sidebarCollapsed
          ? 'lg:grid-cols-[84px_minmax(0,1fr)]'
          : 'lg:grid-cols-[320px_minmax(0,1fr)]',
      )
    "
  >
    <!-- Логотип в отдельной карточке над сайдбаром -->
    <div
      :class="
        cn(
          'glass hidden items-center justify-center overflow-hidden rounded-[18px] lg:flex',
          sidebarCollapsed ? 'px-0' : 'px-4',
        )
      "
    >
      <AppLogo :compact="sidebarCollapsed" large />
    </div>

    <AppHeader
      :sidebar-collapsed="sidebarCollapsed"
      @open-menu="mobileOpen = true"
      @toggle-sidebar="sidebarCollapsed = !sidebarCollapsed"
    />

    <AppSidebar :collapsed="sidebarCollapsed" class="hidden lg:flex" />

    <!-- Шапка и меню стоят на месте, прокручивается только этот контейнер -->
    <main
      ref="content"
      class="app-content min-h-0 min-w-0 overflow-y-auto rounded-[18px] p-1 sm:p-1.5"
    >
      <slot />
    </main>

    <!-- Мобильное меню -->
    <div
      :class="
        cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )
      "
      :aria-hidden="!mobileOpen"
    >
      <div
        :class="
          cn(
            'absolute inset-0 bg-zinc-950/30 backdrop-blur-sm transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )
        "
        @click="mobileOpen = false"
      />
      <div
        :class="
          cn(
            'absolute inset-y-3 left-3 w-[288px] max-w-[calc(100vw-24px)] transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-[110%]',
          )
        "
      >
        <AppSidebar class="h-full overflow-y-auto shadow-2xl" />
        <button
          type="button"
          class="absolute top-4 right-4 grid size-9 place-items-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          :aria-label="$t('Закрыть меню')"
          @click="mobileOpen = false"
        >
          <X class="size-5" />
        </button>
      </div>
    </div>
  </div>
</template>
