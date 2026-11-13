<script setup lang="ts">
import type { Component } from 'vue'
import BasePanel from '@/components/dashboard/BasePanel.vue'

defineProps<{ title: string; icon?: Component }>()
</script>

<!-- Небольшая карточка с данными: заголовок и ряды «подпись — значение» -->
<template>
  <BasePanel class="flex min-w-0 flex-col gap-3">
    <div class="flex min-h-9 items-center justify-between gap-3">
      <h2 class="flex items-center gap-2 text-base font-semibold tracking-tight text-zinc-950">
        <component :is="icon" v-if="icon" class="size-[18px] text-zinc-700" :stroke-width="1.9" />
        {{ title }}
        <slot name="badge" />
      </h2>
      <slot name="action" />
    </div>
    <div class="flex flex-col">
      <slot />
    </div>
  </BasePanel>
</template>
