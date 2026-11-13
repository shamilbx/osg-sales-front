<script setup lang="ts">
import type { Component, HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import type { Tone } from '@/lib/types'

const props = defineProps<{
  icon: Component
  tone: Tone
  /** lg — крупная плитка для карточек модулей */
  size?: 'md' | 'lg'
  class?: HTMLAttributes['class']
}>()

const toneStyles: Record<Tone, string> = {
  blue: 'from-[#93a9ff] to-[#5373f6] shadow-[0_6px_14px_-6px_rgba(83,115,246,.9)]',
  green: 'from-[#6ee59a] to-[#1fb556] shadow-[0_6px_14px_-6px_rgba(31,181,86,.9)]',
  orange: 'from-[#ffb07e] to-[#f7652f] shadow-[0_6px_14px_-6px_rgba(247,101,47,.9)]',
  pink: 'from-[#ff94c2] to-[#ee4589] shadow-[0_6px_14px_-6px_rgba(238,69,137,.9)]',
  violet: 'from-[#c4a6ff] to-[#8b5cf6] shadow-[0_6px_14px_-6px_rgba(139,92,246,.9)]',
}
</script>

<template>
  <span
    :class="
      cn(
        'relative grid shrink-0 place-items-center bg-linear-to-b text-white',
        size === 'lg' ? 'size-16 rounded-[20px]' : 'size-10 rounded-xl',
        'before:absolute before:inset-0 before:shadow-[inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_4px_rgba(0,0,0,.08)]',
        size === 'lg' ? 'before:rounded-[20px]' : 'before:rounded-xl',
        toneStyles[tone],
        props.class,
      )
    "
  >
    <component
      :is="icon"
      :class="cn('relative', size === 'lg' ? 'size-7' : 'size-[18px]')"
      :stroke-width="1.9"
    />
  </span>
</template>
