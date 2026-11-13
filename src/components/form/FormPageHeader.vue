<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'
import BasePanel from '@/components/dashboard/BasePanel.vue'

defineProps<{
  title: string
  subtitle: string
  backTo: string
  backLabel: string
}>()
</script>

<template>
  <BasePanel class="p-5 sm:p-6">
    <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ title }}</h1>
    <p class="mt-1 text-sm text-zinc-600">{{ subtitle }}</p>
    <nav :aria-label="$t('Навигация')" class="mt-4 flex items-center gap-2 text-sm">
      <RouterLink
        :to="backTo"
        class="flex items-center gap-1.5 font-semibold text-zinc-900 transition-colors hover:text-zinc-600"
      >
        <ArrowLeft class="size-4" />
        {{ backLabel }}
      </RouterLink>
      <span class="text-zinc-300">/</span>
      <span class="font-medium text-zinc-600">{{ title }}</span>
    </nav>
  </BasePanel>
</template>
