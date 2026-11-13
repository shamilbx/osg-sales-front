<script setup lang="ts">
import { t } from '@/i18n'
import { computed, nextTick, ref, watch, type Component } from 'vue'
import { useRouter } from 'vue-router'
import { Search, SearchX } from '@lucide/vue'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { allNav, modules, type NavModule } from '@/config/navigation'
import { useModules } from '@/composables/useModules'
import { matchesSearch } from '@/lib/search'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/types'
import IconTile from '@/components/dashboard/IconTile.vue'

type Kind = 'module' | 'section'

interface PaletteItem {
  id: string
  kind: Kind
  title: string
  description: string
  icon?: Component
  tone?: Tone
  /** Текст в кружке вместо значка: инициалы клиента или флаг страны */
  badge?: string
  run: () => void
}

const open = defineModel<boolean>('open', { required: true })

const router = useRouter()
const { selectModule } = useModules()

const query = ref('')
const activeIndex = ref(0)
const list = ref<HTMLElement | null>(null)

const groupLabels: Record<Kind, string> = {
  module: 'Модули',
  section: 'Разделы',
}
const groupOrder: Kind[] = ['module', 'section']
// Сколько результатов показывать в группе при поиске
const LIMIT = 5

function go(to: string) {
  open.value = false
  router.push(to)
}

async function openModule(module: NavModule) {
  open.value = false
  await selectModule(module)
}

const moduleOfSection = (to: string) =>
  modules.find((module) => module.items.some((item) => item.to === to))?.title ?? t('Система')

const allItems = computed<PaletteItem[]>(() => [
  ...modules.map<PaletteItem>((module) => ({
    id: `module-${module.id}`,
    kind: 'module',
    title: module.title,
    description: module.description,
    icon: module.icon,
    tone: module.tone,
    run: () => openModule(module),
  })),
  ...allNav.map<PaletteItem>((item) => ({
    id: `section-${item.to}`,
    kind: 'section',
    title: item.title,
    description: t('Раздел модуля «{name}»', { name: moduleOfSection(item.to) }),
    icon: item.icon,
    run: () => go(item.to),
  })),
])

const results = computed(() => {
  // Без запроса показываем только модули, как в центре управления
  if (!query.value.trim()) return allItems.value.filter((item) => item.kind === 'module')

  const found = allItems.value.filter((item) =>
    matchesSearch(query.value, [item.title, item.description], [item.description]),
  )
  return groupOrder.flatMap((kind) => found.filter((item) => item.kind === kind).slice(0, LIMIT))
})

// Список с заголовками групп; индекс нужен для навигации с клавиатуры
const sections = computed(() => {
  let index = 0
  return groupOrder
    .map((kind) => ({
      kind,
      label: groupLabels[kind],
      items: results.value
        .filter((item) => item.kind === kind)
        .map((item) => ({ item, index: index++ })),
    }))
    .filter((section) => section.items.length > 0)
})

watch(open, (isOpen) => {
  if (!isOpen) return
  query.value = ''
  activeIndex.value = 0
})
watch(query, () => (activeIndex.value = 0))

function scrollToActive() {
  nextTick(() => {
    list.value?.querySelector<HTMLElement>(`[data-index="${activeIndex.value}"]`)?.scrollIntoView({
      block: 'nearest',
    })
  })
}

function onKeydown(event: KeyboardEvent) {
  const count = results.value.length
  if (!count) return
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value + 1) % count
    scrollToActive()
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = (activeIndex.value - 1 + count) % count
    scrollToActive()
  } else if (event.key === 'Enter') {
    event.preventDefault()
    results.value[activeIndex.value]?.run()
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="top-[12vh] translate-y-0 gap-0 overflow-hidden rounded-3xl bg-white p-0 sm:max-w-[640px]"
    >
      <DialogTitle class="sr-only">{{ $t('Поиск по CRM') }}</DialogTitle>
      <DialogDescription class="sr-only">
        {{ $t('Найдите модуль, раздел, клиента или заявку и откройте его') }}
      </DialogDescription>

      <div class="flex items-center gap-3 border-b border-zinc-100 px-5">
        <Search class="size-5 shrink-0 text-zinc-500" />
        <input
          v-model="query"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-list"
          :aria-label="$t('Поиск по CRM')"
          :placeholder="$t('Модуль, клиент, заявка или раздел')"
          autocomplete="off"
          class="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-zinc-900 outline-none placeholder:text-zinc-400"
          @keydown="onKeydown"
        />
        <kbd
          class="hidden rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-500 sm:block"
        >
          Esc
        </kbd>
      </div>

      <div id="palette-list" ref="list" role="listbox" class="max-h-[60vh] overflow-y-auto p-2">
        <section v-for="section in sections" :key="section.kind" class="mb-1">
          <h2
            class="px-3 pt-3 pb-1.5 text-[11px] font-semibold tracking-[0.1em] text-zinc-400 uppercase"
          >
            {{ $t(section.label) }}
          </h2>
          <button
            v-for="{ item, index } in section.items"
            :key="item.id"
            type="button"
            role="option"
            :data-index="index"
            :aria-selected="index === activeIndex"
            :class="
              cn(
                'flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors',
                index === activeIndex ? 'bg-zinc-100' : 'hover:bg-zinc-50',
              )
            "
            @mousemove="activeIndex = index"
            @click="item.run()"
          >
            <IconTile
              v-if="item.kind === 'module' && item.icon && item.tone"
              :icon="item.icon"
              :tone="item.tone"
              class="size-9"
            />
            <span
              v-else-if="item.badge"
              class="grid size-9 shrink-0 place-items-center rounded-xl bg-zinc-100 text-xs font-semibold text-zinc-700"
            >
              {{ item.badge }}
            </span>
            <span
              v-else-if="item.icon"
              class="grid size-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700"
            >
              <component :is="item.icon" class="size-[18px]" :stroke-width="1.9" />
            </span>

            <span class="min-w-0 flex-1 leading-tight">
              <span class="block truncate text-sm font-semibold text-zinc-950">{{
                item.title
              }}</span>
              <span class="mt-0.5 block truncate text-[13px] text-zinc-500">{{
                item.description
              }}</span>
            </span>
          </button>
        </section>

        <div
          v-if="results.length === 0"
          class="grid place-items-center gap-2 px-6 py-12 text-center"
        >
          <span class="grid size-11 place-items-center rounded-2xl bg-zinc-100 text-zinc-500">
            <SearchX class="size-5" />
          </span>
          <p class="text-sm font-semibold text-zinc-900">{{ $t('Ничего не найдено') }}</p>
          <p class="text-[13px] text-zinc-500">
            {{
              $t('Проверьте написание или введите имя клиента, номер заявки или название раздела')
            }}
          </p>
        </div>
      </div>

      <div
        class="hidden items-center gap-4 border-t border-zinc-100 px-5 py-2.5 text-xs text-zinc-500 sm:flex"
      >
        <span><kbd class="font-semibold text-zinc-700">↑↓</kbd> {{ $t('выбрать') }}</span>
        <span><kbd class="font-semibold text-zinc-700">Enter</kbd> {{ $t('открыть') }}</span>
        <span><kbd class="font-semibold text-zinc-700">Esc</kbd> {{ $t('закрыть') }}</span>
      </div>
    </DialogContent>
  </Dialog>
</template>
