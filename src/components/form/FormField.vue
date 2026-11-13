<script setup lang="ts">
import { TriangleAlert } from '@lucide/vue'

defineProps<{
  /** Пустая подпись скрывает строку над полем */
  label: string
  /** id поля, к которому привязана подпись */
  for?: string
  required?: boolean
  hint?: string
  /** Красное предупреждение, которое не блокирует сохранение */
  warning?: string
  error?: string
  /** Счётчик справа от подписи, например «12/500» */
  counter?: string
}>()
</script>

<template>
  <div class="min-w-0">
    <div v-if="label || counter" class="mb-1.5 flex items-center justify-between gap-3">
      <label :for="$props.for" class="text-[13px] font-medium text-zinc-700">
        {{ label }}<span v-if="required" class="ml-0.5 text-rose-500" aria-hidden="true">*</span>
      </label>
      <span v-if="counter" class="text-xs text-zinc-400 tabular-nums">{{ counter }}</span>
    </div>
    <slot />
    <p v-if="error" role="alert" class="mt-1.5 text-xs text-rose-600">{{ error }}</p>
    <p
      v-else-if="warning"
      role="status"
      class="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600"
    >
      <TriangleAlert class="mt-px size-3.5 shrink-0" />
      {{ warning }}
    </p>
    <p v-else-if="hint" class="mt-1.5 text-xs text-zinc-500">{{ hint }}</p>
  </div>
</template>
