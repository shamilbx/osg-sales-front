<script setup lang="ts">
import type { Component } from 'vue'
import { Banknote, ChevronRight, FileCheck, Sparkles, Tag } from '@lucide/vue'
import type { Insight, InsightIcon } from '@/lib/types'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import IconTile from '@/components/dashboard/IconTile.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'

defineProps<{ insights: Insight[] }>()

const icons: Record<InsightIcon, Component> = {
  payment: Banknote,
  visa: FileCheck,
  offer: Tag,
}
</script>

<template>
  <BasePanel class="flex h-full flex-col">
    <PanelHeader :icon="Sparkles" :title="$t('AI-подсказки')" />

    <p class="mt-4 font-serif text-[21px] leading-[1.25] text-zinc-950">
      {{ $t('Эти действия помогут закрыть больше сделок на этой неделе') }}
    </p>

    <ul class="mt-4 flex flex-1 flex-col gap-2.5">
      <li v-for="insight in insights" :key="insight.id">
        <button
          type="button"
          class="group flex w-full items-center gap-3 rounded-[18px] bg-zinc-50 p-2.5 text-left ring-1 ring-zinc-100 transition-all hover:bg-white hover:shadow-[0_12px_28px_-18px_rgba(16,24,40,.45)] hover:ring-zinc-200"
        >
          <IconTile :icon="icons[insight.icon]" :tone="insight.tone" />
          <span class="min-w-0 flex-1">
            <span class="block text-sm leading-snug font-semibold text-zinc-950">
              {{ insight.title }}
            </span>
            <span class="mt-0.5 block text-xs text-zinc-500">{{ insight.description }}</span>
          </span>
          <ChevronRight
            class="size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-900"
          />
        </button>
      </li>
    </ul>
  </BasePanel>
</template>
