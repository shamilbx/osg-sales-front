<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{
  icon: Component
  title: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div :class="cn('flex items-center justify-between gap-3', props.class)">
    <h2 class="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-950">
      <component :is="icon" class="size-[18px] text-zinc-800" :stroke-width="1.9" />
      {{ title }}
    </h2>
    <slot name="action" />
  </div>
</template>
