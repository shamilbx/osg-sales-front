<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch, type Component } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import {
  ChartColumn,
  ChevronDown,
  ClipboardList,
  LayoutGrid,
  ListPlus,
  Search,
  SquareKanban,
  UserPlus,
} from '@lucide/vue'
import IconTile from '@/components/dashboard/IconTile.vue'
import { useModules } from '@/composables/useModules'
import { cn } from '@/lib/utils'
import type { NavModule } from '@/config/navigation'

const { modules, activeModule, selectModule } = useModules()

const open = ref(false)
const query = ref('')
const root = useTemplateRef<HTMLDivElement>('root')
const search = useTemplateRef<HTMLInputElement>('search')

onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

watch(open, async (isOpen) => {
  if (!isOpen) return
  query.value = ''
  await nextTick()
  search.value?.focus()
})

const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return needle
    ? modules.filter(
        (module) =>
          module.title.toLowerCase().includes(needle) ||
          module.description.toLowerCase().includes(needle),
      )
    : modules
})

async function choose(module: NavModule) {
  open.value = false
  await selectModule(module)
}

interface QuickAction {
  label: string
  to: string
  icon: Component
}
const actions = computed<QuickAction[]>(() => [
  { label: 'Новая заявка', to: '/requests/new', icon: ClipboardList },
  { label: 'Новый клиент', to: '/clients/new', icon: UserPlus },
  { label: 'Новая задача', to: '/tasks', icon: ListPlus },
  { label: 'Воронка продаж', to: '/leads', icon: SquareKanban },
  { label: 'Центр управления', to: '/modules', icon: LayoutGrid },
  { label: 'Открыть отчёт', to: '/reports', icon: ChartColumn },
])
</script>

<template>
  <!-- Без relative у корня: панель привязана к шапке и не вылезает за экран -->
  <div ref="root">
    <button
      type="button"
      :aria-expanded="open"
      aria-haspopup="menu"
      :class="
        cn(
          'flex h-11 items-center gap-2.5 rounded-xl px-3 text-[15px] font-semibold transition-colors',
          open ? 'bg-brand-soft text-brand' : 'text-zinc-900 hover:bg-white/70',
        )
      "
      @click="open = !open"
    >
      <LayoutGrid class="size-[18px]" :stroke-width="1.9" />
      {{ $t('Все модули') }}
      <ChevronDown :class="cn('size-4 transition-transform', open && 'rotate-180')" />
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute top-[calc(100%+8px)] left-4 z-40 grid max-h-[80vh] w-[min(1120px,calc(100%-2rem))] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_60px_-20px_rgba(16,24,40,.35)] lg:grid-cols-[minmax(0,1fr)_260px]"
    >
      <div class="min-w-0 overflow-y-auto p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold tracking-tight text-zinc-950">
              {{ $t('Все модули') }}
            </h2>
            <p class="mt-0.5 text-[13px] text-zinc-600">
              {{ $t('Быстрый переход к нужному модулю') }}
            </p>
          </div>
          <div class="relative w-full sm:w-[300px]">
            <Search
              class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
            />
            <input
              ref="search"
              v-model="query"
              type="text"
              autocomplete="off"
              :placeholder="$t('Поиск модуля...')"
              :aria-label="$t('Поиск модуля...')"
              class="h-11 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-10 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
              @keydown.enter.prevent="filtered[0] && choose(filtered[0])"
            />
          </div>
        </div>

        <div v-if="filtered.length" class="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="module in filtered"
            :key="module.id"
            type="button"
            role="menuitem"
            :class="
              cn(
                'flex items-center gap-3.5 rounded-2xl border p-3 text-left transition-colors',
                module.id === activeModule.id
                  ? 'border-brand/40 bg-brand-soft'
                  : 'border-transparent bg-zinc-50 hover:bg-zinc-100',
              )
            "
            @click="choose(module)"
          >
            <IconTile :icon="module.icon" :tone="module.tone" class="size-11" />
            <span class="min-w-0 flex-1 leading-tight">
              <span class="flex items-center gap-2 text-sm font-semibold text-zinc-950">
                <span class="truncate">{{ module.title }}</span>
                <span
                  v-if="module.id === activeModule.id"
                  class="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white"
                >
                  {{ $t('Текущий') }}
                </span>
              </span>
              <span class="mt-1 block truncate text-xs text-zinc-600">
                {{ module.description }}
              </span>
            </span>
          </button>
        </div>
        <p v-else class="mt-8 mb-6 text-center text-sm text-zinc-600">
          {{ $t('Модули не найдены') }}
        </p>
      </div>

      <aside class="hidden border-l border-zinc-100 p-5 lg:block">
        <h3 class="text-sm font-semibold text-zinc-950">{{ $t('Быстрые действия') }}</h3>
        <ul class="mt-4 space-y-1">
          <li v-for="action in actions" :key="action.to">
            <RouterLink
              :to="action.to"
              role="menuitem"
              class="flex h-10 items-center gap-3 rounded-xl px-2 text-sm font-medium text-brand transition-colors hover:bg-brand-soft"
              @click="open = false"
            >
              <component :is="action.icon" class="size-[18px]" :stroke-width="1.9" />
              {{ $t(action.label) }}
            </RouterLink>
          </li>
        </ul>
      </aside>
    </div>
  </div>
</template>
