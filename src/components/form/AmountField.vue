<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '@/lib/format'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/components/form/field-styles'

const props = defineProps<{
  id?: string
  placeholder?: string
  invalid?: boolean
  maxDigits?: number
  /** Подпись справа в поле; по умолчанию «сум» */
  suffix?: string
}>()
const model = defineModel<number | ''>({ required: true })

const text = computed(() => (model.value === '' ? '' : formatNumber(model.value)))

// Пробелы между разрядами расставляются на лету, курсор остаётся у тех же цифр
function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const caret = input.selectionStart ?? input.value.length
  const digitsBefore = input.value.slice(0, caret).replace(/\D/g, '').length
  const digits = input.value.replace(/\D/g, '').slice(0, props.maxDigits ?? 10)

  model.value = digits ? Number(digits) : ''
  input.value = text.value

  let position = 0
  let seen = 0
  while (position < input.value.length && seen < digitsBefore) {
    if (/\d/.test(input.value[position]!)) seen++
    position++
  }
  input.setSelectionRange(position, position)
}
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :placeholder="placeholder"
      :value="text"
      :aria-invalid="invalid || undefined"
      :class="cn(fieldClass, 'pr-14 tabular-nums')"
      @input="onInput"
    />
    <span
      class="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-xs font-medium text-zinc-400"
    >
      {{ suffix ?? $t('сум') }}
    </span>
  </div>
</template>
