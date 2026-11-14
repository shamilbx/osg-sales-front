<script setup lang="ts" generic="T extends string">
import { computed, ref, useTemplateRef, type Component } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { Check, ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'

export interface FilterOption<V> {
  value: V
  label: string
  /** Цифра справа, например число клиентов */
  count?: number
  /** Цветная точка слева; класс Tailwind, например bg-emerald-500 */
  dot?: string
  /** Эмодзи или значок слева, например флаг страны */
  icon?: string
  /** Векторный значок слева вместо эмодзи, например Globe для «Все страны» */
  glyph?: Component
}

const props = defineProps<{
  /** Подпись фильтра: «Статус», «Страна» */
  label: string
  options: FilterOption<T>[]
  /** Значение «Все»: при нём кнопка не выделяется */
  allValue: T
}>()
const model = defineModel<T>({ required: true })

const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

const current = computed(() => props.options.find((option) => option.value === model.value))
const active = computed(() => model.value !== props.allValue)

function pick(value: T) {
  model.value = value
  open.value = false
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :class="
        cn(
          'flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition-colors',
          active
            ? 'border-brand bg-brand text-white'
            : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950',
        )
      "
      @click="open = !open"
    >
      <span :class="active ? 'text-white/70' : 'text-zinc-400'">{{ label }}:</span>
      <component :is="current.glyph" v-if="current?.glyph" class="size-4 shrink-0" />
      <span v-else-if="current?.icon" aria-hidden="true">{{ current.icon }}</span>
      <span class="max-w-[160px] truncate">{{ current?.label }}</span>
      <ChevronDown :class="cn('size-4 transition-transform', open && 'rotate-180')" />
    </button>

    <ul
      v-if="open"
      role="listbox"
      :aria-label="label"
      class="absolute top-[calc(100%+6px)] left-0 z-30 max-h-72 min-w-full w-max overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-[0_20px_40px_-16px_rgba(16,24,40,.3)] dark:border-white/10 dark:bg-[#1a2540] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,.7)]"
    >
      <li
        v-for="option in options"
        :key="option.value"
        role="option"
        :aria-selected="option.value === model"
      >
        <button
          type="button"
          :class="
            cn(
              'flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] transition-colors hover:bg-zinc-100 dark:hover:bg-[#e12526]/15',
              option.value === model
                ? 'font-semibold text-zinc-950 dark:bg-[#e12526]/25'
                : 'text-zinc-700',
            )
          "
          @click="pick(option.value)"
        >
          <span v-if="option.dot" :class="cn('size-2 shrink-0 rounded-full', option.dot)" />
          <component
            :is="option.glyph"
            v-else-if="option.glyph"
            class="size-4 shrink-0 text-zinc-500"
          />
          <span
            v-else-if="option.icon"
            aria-hidden="true"
            class="shrink-0 text-base leading-none"
            >{{ option.icon }}</span
          >
          <span class="flex-1 whitespace-nowrap">{{ option.label }}</span>
          <span
            v-if="option.count !== undefined"
            class="rounded-full bg-zinc-100 px-1.5 text-[11px] font-semibold text-zinc-500 tabular-nums"
          >
            {{ option.count }}
          </span>
          <Check
            v-if="option.value === model"
            class="size-4 shrink-0 text-zinc-950 dark:text-[#ff5b5d]"
          />
        </button>
      </li>
    </ul>
  </div>
</template>
