<script setup lang="ts">
import { computed, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import { dtf } from '@/lib/dates'

const now = ref(new Date())
useIntervalFn(() => (now.value = new Date()), 1000)

const time = computed(() =>
  dtf({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now.value),
)
const weekday = computed(() => {
  const name = dtf({ weekday: 'long' }).format(now.value)
  return name.charAt(0).toUpperCase() + name.slice(1)
})
// Собираем из частей, чтобы не было хвоста « г.», который добавляет локаль
const date = computed(() => {
  const parts = dtf({ day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(now.value)
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? ''
  return `${pick('day')} ${pick('month')} ${pick('year')}`
})
</script>

<template>
  <div class="flex items-center gap-4" role="timer" :aria-label="$t('Текущее время')">
    <span class="text-[28px] leading-none font-semibold tracking-tight text-zinc-950 tabular-nums">
      {{ time }}
    </span>
    <span class="h-8 w-px bg-zinc-900/10" />
    <span class="leading-tight">
      <span class="block text-sm font-semibold text-zinc-900">{{ weekday }}</span>
      <span class="block text-xs text-zinc-500">{{ date }}</span>
    </span>
  </div>
</template>
