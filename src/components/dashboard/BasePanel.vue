<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <section :class="cn('glass rounded-[18px] p-4 sm:p-5', props.class)">
    <slot />
  </section>
</template>
