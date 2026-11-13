<script setup lang="ts">
import type { Component } from 'vue'
import type { Tone } from '@/lib/types'
import IconTile from '@/components/dashboard/IconTile.vue'

defineProps<{
  title: string
  value: string
  icon: Component
  tone: Tone
  hint?: string
}>()
</script>

<template>
  <article
    class="flex items-center gap-3.5 glass rounded-[24px] p-4 transition-[scale,box-shadow] duration-200 ease-out hover:scale-[1.025] hover:shadow-[0_18px_40px_-22px_rgba(16,24,40,.4)] motion-reduce:transition-none motion-reduce:hover:scale-100"
  >
    <IconTile :icon="icon" :tone="tone" />
    <div class="min-w-0">
      <p class="truncate text-[13px] text-zinc-500">{{ title }}</p>
      <p class="flex items-baseline gap-2">
        <span class="text-2xl font-semibold tracking-tight text-zinc-950 tabular-nums">{{
          value
        }}</span>
        <span v-if="hint" class="truncate text-xs text-zinc-400">{{ hint }}</span>
      </p>
    </div>
  </article>
</template>
