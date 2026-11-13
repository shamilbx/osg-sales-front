<script setup lang="ts" generic="T extends string | number">
import { ChevronDown } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/components/form/field-styles'

export interface SelectOption<V> {
  value: V
  label: string
}

defineProps<{
  id?: string
  options: SelectOption<T>[]
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
}>()
const model = defineModel<T | ''>({ required: true })
</script>

<template>
  <div class="relative">
    <select
      :id="id"
      v-model="model"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      :class="cn(fieldClass, 'appearance-none pr-10', model === '' && 'text-zinc-400')"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <ChevronDown
      class="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-zinc-400"
    />
  </div>
</template>
