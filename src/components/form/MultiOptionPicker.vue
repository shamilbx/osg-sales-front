<script setup lang="ts" generic="T extends string">
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { Check, ChevronDown, Search } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/components/form/field-styles'
import type { PickerOption } from '@/components/form/OptionPicker.vue'

const props = defineProps<{
  id?: string
  options: PickerOption<T>[]
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  invalid?: boolean
  disabled?: boolean
}>()
// Выбранные значения в порядке выбора; в поле они показываются через запятую
const model = defineModel<T[]>({ required: true })

const root = useTemplateRef<HTMLDivElement>('root')
const search = useTemplateRef<HTMLInputElement>('search')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const open = ref(false)
const dropUp = ref(false)
const query = ref('')

const searchable = computed(() => props.options.length > 8)
const labelOf = (value: T) => props.options.find((option) => option.value === value)?.label ?? value
const summary = computed(() => model.value.map(labelOf).join(', '))
const filtered = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return needle
    ? props.options.filter((option) => option.label.toLowerCase().includes(needle))
    : props.options
})

onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => {
  if (!open.value) return
  open.value = false
  trigger.value?.focus()
})

async function toggleOpen() {
  if (props.disabled) return
  if (!open.value) {
    query.value = ''
    const rect = root.value?.getBoundingClientRect()
    dropUp.value = !!rect && window.innerHeight - rect.bottom < 420 && rect.top > 420
  }
  open.value = !open.value
  if (open.value && searchable.value) {
    await nextTick()
    search.value?.focus()
  }
}

function toggle(value: T) {
  model.value = model.value.includes(value)
    ? model.value.filter((item) => item !== value)
    : [...model.value, value]
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      :id="id"
      ref="trigger"
      type="button"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open"
      :aria-invalid="invalid || undefined"
      :class="cn(fieldClass, 'flex items-center gap-2 pr-3 text-left')"
      @click="toggleOpen"
    >
      <span v-if="summary" class="min-w-0 flex-1 truncate">{{ summary }}</span>
      <span v-else class="min-w-0 flex-1 truncate text-zinc-400">{{ placeholder }}</span>
      <ChevronDown
        :class="cn('size-4 shrink-0 text-zinc-400 transition-transform', open && 'rotate-180')"
      />
    </button>

    <div
      v-if="open"
      class="picker-popover absolute left-0 z-40 w-full min-w-[280px] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_20px_40px_-16px_rgba(16,24,40,.3)]"
      :class="dropUp ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'"
    >
      <div v-if="searchable" class="relative mb-2.5">
        <Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
        <input
          ref="search"
          v-model="query"
          type="text"
          autocomplete="off"
          :placeholder="searchPlaceholder ?? $t('Найти')"
          :aria-label="searchPlaceholder ?? $t('Найти')"
          class="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50/60 pr-3 pl-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-3 focus-visible:ring-zinc-900/5"
        />
      </div>

      <div
        v-if="filtered.length"
        role="listbox"
        aria-multiselectable="true"
        class="grid max-h-[264px] grid-cols-2 gap-2 overflow-y-auto"
      >
        <button
          v-for="option in filtered"
          :key="option.value"
          type="button"
          role="option"
          :aria-selected="model.includes(option.value)"
          :class="
            cn(
              'flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors',
              model.includes(option.value)
                ? 'bg-zinc-950 font-semibold text-white'
                : 'bg-zinc-50 text-zinc-800 hover:bg-zinc-100',
            )
          "
          @click="toggle(option.value)"
        >
          <span class="min-w-0 flex-1 leading-tight break-words">{{ option.label }}</span>
          <Check v-if="model.includes(option.value)" class="size-4 shrink-0" />
        </button>
      </div>
      <p v-else class="px-2 py-6 text-center text-sm text-zinc-500">
        {{ emptyText ?? $t('Ничего не найдено') }}
      </p>

      <div class="mt-2.5 flex items-center justify-between gap-2">
        <button
          type="button"
          class="h-9 rounded-xl px-3 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40"
          :disabled="!model.length"
          @click="model = []"
        >
          {{ $t('Сбросить выбор') }}
        </button>
        <button
          type="button"
          class="h-9 rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800"
          @click="open = false"
        >
          {{ $t('Готово') }}
        </button>
      </div>
    </div>
  </div>
</template>
