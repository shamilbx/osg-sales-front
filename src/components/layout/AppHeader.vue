<script setup lang="ts">
import { computed } from 'vue'
import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTheme } from '@/composables/useTheme'
import { roleLabels, useAuth } from '@/composables/useAuth'
import AppLogo from '@/components/layout/AppLogo.vue'
import GlobalSearch from '@/components/layout/GlobalSearch.vue'
import HeaderClock from '@/components/layout/HeaderClock.vue'
import LanguageMenu from '@/components/layout/LanguageMenu.vue'
import ModulesMenu from '@/components/layout/ModulesMenu.vue'
import NotificationsMenu from '@/components/layout/NotificationsMenu.vue'

// hub — режим центра управления: кнопок бокового меню нет
defineProps<{ sidebarCollapsed?: boolean; hub?: boolean }>()
defineEmits<{ openMenu: []; toggleSidebar: [] }>()

const { isDark, toggle: toggleTheme } = useTheme()
const { user } = useAuth()

const displayName = computed(() => user.value?.full_name || user.value?.username || '')
const initials = computed(() =>
  displayName.value
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase(),
)

const iconButton =
  'size-11 rounded-xl border border-zinc-200/80 bg-white/80 text-zinc-700 hover:bg-white hover:text-zinc-950'
</script>

<template>
  <!-- z-30: меню модулей и языка раскрываются поверх панелей страницы, у каждой из них свой слой -->
  <!-- В разделах шапка — отдельная белая карточка; на экране «Центр управления» её оборачивает страница -->
  <header :class="cn('relative z-30 min-w-0', !hub && 'glass min-h-[92px] rounded-[24px]')">
    <div
      :class="
        cn('relative flex items-center gap-3 sm:gap-4', !hub && 'px-3 py-4 sm:px-5 sm:py-5 lg:px-6')
      "
    >
      <!-- Мобильное меню -->
      <Button
        v-if="!hub"
        variant="ghost"
        size="icon"
        :class="cn(iconButton, 'lg:hidden')"
        :aria-label="$t('Открыть меню')"
        @click="$emit('openMenu')"
      >
        <Menu class="size-5" />
      </Button>

      <!-- Свернуть / развернуть сайдбар на десктопе -->
      <Button
        v-if="!hub"
        variant="ghost"
        size="icon"
        :class="cn(iconButton, 'hidden lg:inline-flex')"
        :aria-label="sidebarCollapsed ? $t('Развернуть меню') : $t('Свернуть меню')"
        :aria-pressed="sidebarCollapsed"
        @click="$emit('toggleSidebar')"
      >
        <PanelLeftOpen v-if="sidebarCollapsed" class="size-5" />
        <PanelLeftClose v-else class="size-5" />
      </Button>

      <AppLogo :class="hub ? 'hidden sm:flex' : 'hidden sm:flex lg:hidden'" />

      <div class="hidden xl:block">
        <ModulesMenu />
      </div>

      <div class="hidden 2xl:block">
        <HeaderClock />
      </div>

      <div class="flex min-w-0 flex-1 justify-end">
        <GlobalSearch class="w-full max-w-[420px]" />
      </div>

      <Button
        variant="ghost"
        size="icon"
        :class="cn(iconButton, 'hidden border-transparent bg-transparent md:inline-flex')"
        :aria-label="isDark ? $t('Светлая тема') : $t('Тёмная тема')"
        :aria-pressed="isDark"
        @click="toggleTheme"
      >
        <Sun v-if="isDark" class="size-5" />
        <Moon v-else class="size-5" />
      </Button>

      <LanguageMenu />

      <NotificationsMenu :button-class="iconButton" />

      <RouterLink
        to="/profile"
        class="flex items-center gap-3 rounded-xl py-1 pr-2 pl-1 transition-colors hover:bg-white/70"
        :aria-label="$t('Профиль')"
      >
        <span class="hidden text-right leading-tight xl:block">
          <span class="block text-sm font-semibold text-zinc-950">{{ displayName }}</span>
          <span class="block text-xs text-zinc-500">{{ user ? roleLabels[user.role] : '' }}</span>
        </span>
        <Avatar class="size-11 ring-2 ring-white">
          <AvatarFallback
            class="bg-linear-to-br from-amber-200 to-rose-300 font-semibold text-slate-900"
          >
            {{ initials }}
          </AvatarFallback>
        </Avatar>
      </RouterLink>
    </div>
  </header>
</template>
