<script setup lang="ts" generic="T extends string">
import type { Component } from 'vue'
import { cn } from '@/lib/utils'

defineProps<{
  options: { value: T; label: string; icon?: Component }[]
  label: string
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="label"
    class="flex w-full gap-1 rounded-xl bg-zinc-100 p-1 sm:inline-flex sm:w-auto"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :class="
        cn(
          'flex h-9 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors sm:flex-none sm:px-4 sm:text-sm',
          model === option.value ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:text-zinc-950',
        )
      "
      @click="model = option.value"
    >
      <component
        :is="option.icon"
        v-if="option.icon"
        class="hidden size-4 shrink-0 sm:block"
        :stroke-width="1.9"
      />
      {{ option.label }}
    </button>
  </div>
</template>
