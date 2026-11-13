<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'
import { pageSizeOptions } from '@/composables/usePageSize'
import { cn } from '@/lib/utils'

const props = defineProps<{ total: number }>()
const page = defineModel<number>({ required: true })
const pageSize = defineModel<number>('pageSize', { required: true })

const pageCount = computed(() => Math.max(1, Math.ceil(props.total / pageSize.value)))
const from = computed(() => (props.total === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const to = computed(() => Math.min(page.value * pageSize.value, props.total))

const go = (next: number) => (page.value = Math.min(Math.max(next, 1), pageCount.value))

// Показываем не больше пяти номеров вокруг текущей страницы
const numbers = computed(() => {
  const count = pageCount.value
  const start = Math.min(Math.max(page.value - 2, 1), Math.max(count - 4, 1))
  return Array.from({ length: Math.min(5, count) }, (_, i) => start + i)
})

function onSize(event: Event) {
  pageSize.value = Number((event.target as HTMLSelectElement).value)
  page.value = 1
}

const baseButton =
  'grid size-9 place-items-center rounded-xl text-[13px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-40'
</script>

<template>
  <!-- Прилипает к низу контейнера страницы (минус его отступ): пагинация видна, пока таблица прокручивается -->
  <nav
    class="sticky -bottom-4 z-10 sm:-bottom-5 flex flex-col items-center justify-between gap-3 rounded-b-[24px] border-t border-zinc-100 bg-white px-5 py-4 shadow-[0_-10px_20px_-16px_rgba(16,24,40,0.35)] sm:flex-row"
    :aria-label="$t('Постраничная навигация')"
  >
    <label class="flex items-center gap-3 text-[13px] font-medium text-zinc-700">
      {{ $t('Показывать по') }}:
      <span class="relative">
        <select
          :value="pageSize"
          :aria-label="$t('Показывать по')"
          class="h-9 appearance-none rounded-xl border border-zinc-200 bg-white pr-8 pl-3 text-[13px] font-medium text-zinc-900 outline-none transition-colors hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-3 focus-visible:ring-zinc-900/5"
          @change="onSize"
        >
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
        <ChevronDown
          class="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-zinc-500"
        />
      </span>
    </label>

    <p class="text-[13px] font-medium text-zinc-700">
      <span class="font-semibold text-zinc-900 tabular-nums">{{ from }}–{{ to }}</span>
      {{ $t('из') }}
      <span class="font-semibold text-zinc-900 tabular-nums">{{ total }}</span>
    </p>

    <div class="flex items-center gap-1">
      <button
        type="button"
        :class="cn(baseButton, 'text-zinc-600 hover:bg-zinc-100')"
        :disabled="page === 1"
        :aria-label="$t('Первая страница')"
        @click="go(1)"
      >
        <ChevronsLeft class="size-4" />
      </button>
      <button
        type="button"
        :class="cn(baseButton, 'text-zinc-600 hover:bg-zinc-100')"
        :disabled="page === 1"
        :aria-label="$t('Предыдущая страница')"
        @click="go(page - 1)"
      >
        <ChevronLeft class="size-4" />
      </button>
      <button
        v-for="number in numbers"
        :key="number"
        type="button"
        :aria-current="number === page ? 'page' : undefined"
        :class="
          cn(
            baseButton,
            number === page ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100',
          )
        "
        @click="go(number)"
      >
        {{ number }}
      </button>
      <button
        type="button"
        :class="cn(baseButton, 'text-zinc-600 hover:bg-zinc-100')"
        :disabled="page === pageCount"
        :aria-label="$t('Следующая страница')"
        @click="go(page + 1)"
      >
        <ChevronRight class="size-4" />
      </button>
      <button
        type="button"
        :class="cn(baseButton, 'text-zinc-600 hover:bg-zinc-100')"
        :disabled="page === pageCount"
        :aria-label="$t('Последняя страница')"
        @click="go(pageCount)"
      >
        <ChevronsRight class="size-4" />
      </button>
    </div>
  </nav>
</template>
