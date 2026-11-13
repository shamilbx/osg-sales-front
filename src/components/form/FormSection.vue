<script setup lang="ts">
import BasePanel from '@/components/dashboard/BasePanel.vue'

defineProps<{ number: number; title: string }>()
</script>

<template>
  <BasePanel class="flex flex-col gap-5 p-5 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-zinc-950">
        {{ number }}. {{ title }}
        <slot name="badge" />
      </h2>
      <slot name="action" />
    </div>
    <slot />
  </BasePanel>
</template>
