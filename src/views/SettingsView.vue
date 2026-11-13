<script setup lang="ts">
import { Moon, Palette, Sun } from '@lucide/vue'
import { useTheme } from '@/composables/useTheme'
import { cn } from '@/lib/utils'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'
import ProfilePanel from '@/components/settings/ProfilePanel.vue'

const { isDark, toggle } = useTheme()

const themes = [
  { dark: false, label: 'Светлая', icon: Sun },
  { dark: true, label: 'Тёмная', icon: Moon },
]

const setTheme = (dark: boolean) => {
  if (isDark.value !== dark) toggle()
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Настройки') }}</h1>
      <p class="mt-1 text-sm text-zinc-700">
        {{ $t('Профиль, пароль и тема оформления') }}
      </p>
    </header>

    <ProfilePanel />

    <BasePanel class="flex flex-col gap-7">
      <PanelHeader :icon="Palette" :title="$t('Оформление')" />

      <fieldset>
        <legend class="text-sm font-semibold text-zinc-950">{{ $t('Тема') }}</legend>
        <div class="mt-3 inline-flex gap-1 rounded-2xl bg-zinc-100 p-1">
          <label
            v-for="item in themes"
            :key="item.label"
            :class="
              cn(
                'flex h-10 cursor-pointer items-center gap-2 rounded-xl px-4 text-sm font-medium transition-colors has-focus-visible:ring-3 has-focus-visible:ring-zinc-900/15',
                isDark === item.dark
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:text-zinc-950',
              )
            "
          >
            <input
              type="radio"
              name="theme"
              class="sr-only"
              :checked="isDark === item.dark"
              @change="setTheme(item.dark)"
            />
            <component :is="item.icon" class="size-4" :stroke-width="1.9" />
            {{ $t(item.label) }}
          </label>
        </div>
      </fieldset>
    </BasePanel>
  </div>
</template>
