<script setup lang="ts">
defineProps<{
  label: string
  value: string
  hint?: string
}>()
</script>

<template>
  <div
    class="pointer-events-none rounded-2xl bg-ink px-3.5 py-2.5 whitespace-nowrap text-white shadow-xl"
  >
    <p class="text-xs text-zinc-400">{{ label }}</p>
    <p class="text-sm font-semibold tabular-nums">{{ value }}</p>
    <p v-if="hint" class="mt-0.5 text-[11px] text-zinc-400">{{ hint }}</p>
  </div>
</template>
