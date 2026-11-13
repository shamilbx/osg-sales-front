<script setup lang="ts">
import { ref, type Component } from 'vue'
import { Check, Copy } from '@lucide/vue'

const props = defineProps<{
  icon: Component
  label: string
  value?: string
  /** Ссылка вокруг значения: tel:, mailto: */
  href?: string
  /** Что копируется по кнопке; без значения кнопки нет */
  copyValue?: string
}>()

// Галочка вместо иконки копирования на полторы секунды
const copied = ref(false)
async function copy() {
  if (!props.copyValue) return
  try {
    await navigator.clipboard.writeText(props.copyValue)
  } catch {
    return
  }
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}
</script>

<template>
  <div class="flex min-h-11 items-center gap-3 py-1.5">
    <component :is="icon" class="size-[18px] shrink-0 text-zinc-600" :stroke-width="1.9" />
    <span class="shrink-0 text-sm font-medium text-zinc-700">{{ label }}</span>
    <div class="ml-auto flex min-w-0 items-center justify-end gap-1.5 text-right">
      <slot>
        <a
          v-if="href && value"
          :href="href"
          class="min-w-0 truncate text-sm font-medium text-sky-700 hover:underline"
          >{{ value }}</a
        >
        <span
          v-else
          :class="
            value
              ? 'min-w-0 text-sm font-semibold break-words text-zinc-950'
              : 'text-sm text-zinc-500'
          "
          >{{ value || '—' }}</span
        >
      </slot>
      <button
        v-if="copyValue"
        type="button"
        class="grid size-8 shrink-0 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        :aria-label="$t('Скопировать: {value}', { value: label })"
        @click="copy"
      >
        <Check v-if="copied" class="size-4 text-emerald-600" />
        <Copy v-else class="size-4" />
      </button>
    </div>
  </div>
</template>
