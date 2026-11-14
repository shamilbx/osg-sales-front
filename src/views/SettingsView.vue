<script setup lang="ts">
import { t } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ListTree, Moon, Palette, Sun } from '@lucide/vue'
import { useAuth } from '@/composables/useAuth'
import { useTheme } from '@/composables/useTheme'
import { cn } from '@/lib/utils'
import SegmentedControl from '@/components/form/SegmentedControl.vue'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'
import DictionariesPanel from '@/components/settings/DictionariesPanel.vue'

const route = useRoute()
const router = useRouter()
const { user } = useAuth()
const { isDark, toggle } = useTheme()

const themes = [
  { dark: false, label: 'Светлая', icon: Sun },
  { dark: true, label: 'Тёмная', icon: Moon },
]

const setTheme = (dark: boolean) => {
  if (isDark.value !== dark) toggle()
}

// Справочники ведёт только суперадмин; вкладка выбирается ссылкой /settings?tab=dictionaries
type Tab = 'appearance' | 'dictionaries'
const isSuperAdmin = computed(() => user.value?.role === 'superadmin')
const tab = ref<Tab>(route.query.tab === 'dictionaries' ? 'dictionaries' : 'appearance')
watch(
  () => route.query.tab,
  (value) => (tab.value = value === 'dictionaries' ? 'dictionaries' : 'appearance'),
)
watch(tab, (value) => {
  void router.replace({ query: value === 'appearance' ? {} : { tab: value } })
})

const tabOptions = computed(() => {
  const items: { value: Tab; label: string; icon: typeof Palette }[] = [
    { value: 'appearance', label: t('Оформление'), icon: Palette },
  ]
  if (isSuperAdmin.value)
    items.push({ value: 'dictionaries', label: t('Справочники'), icon: ListTree })
  return items
})
const showDictionaries = computed(() => tab.value === 'dictionaries' && isSuperAdmin.value)
</script>

<template>
  <div class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Настройки') }}</h1>
      <p class="mt-1 text-sm text-zinc-700">
        {{ $t('Тема оформления и справочники') }}
      </p>
    </header>

    <SegmentedControl
      v-if="tabOptions.length > 1"
      v-model="tab"
      :label="$t('Раздел настроек')"
      :options="tabOptions"
    />

    <DictionariesPanel v-if="showDictionaries" />

    <BasePanel v-else class="flex flex-col gap-7">
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
