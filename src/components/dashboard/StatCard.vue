<script setup lang="ts">
import { computed, ref, type Component } from 'vue'
import { ArrowDown, ArrowUp, ArrowUpRight, Inbox, PlaneTakeoff, Target, Wallet } from '@lucide/vue'
import { formatDelta, formatMetric } from '@/lib/format'
import type { Period, StatIcon, StatMetric } from '@/lib/types'
import IconTile from '@/components/dashboard/IconTile.vue'
import PeriodToggle from '@/components/dashboard/PeriodToggle.vue'

const { metric, defaultPeriod = 'week' } = defineProps<{
  metric: StatMetric
  defaultPeriod?: Period
}>()

const icons: Record<StatIcon, Component> = {
  leads: Inbox,
  revenue: Wallet,
  departures: PlaneTakeoff,
  conversion: Target,
}

const period = ref<Period>(defaultPeriod)
const snapshot = computed(() => metric.periods[period.value])
const positive = computed(() => snapshot.value.delta >= 0)
</script>

<template>
  <article
    class="group flex flex-col justify-between gap-5 glass rounded-[24px] p-4 transition-[scale,box-shadow] duration-200 ease-out hover:scale-[1.025] hover:shadow-[0_18px_40px_-22px_rgba(16,24,40,.4)] motion-reduce:transition-none motion-reduce:hover:scale-100"
  >
    <div class="flex items-start gap-3">
      <IconTile :icon="icons[metric.icon]" :tone="metric.tone" />
      <div class="min-w-0 flex-1 pt-0.5">
        <h3 class="truncate text-[15px] font-semibold text-zinc-950">{{ metric.title }}</h3>
        <p class="truncate text-[13px] text-zinc-500">{{ metric.subtitle }}</p>
      </div>
      <button
        type="button"
        :aria-label="$t('Подробнее: {name}', { name: metric.title })"
        class="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-100/80 text-zinc-600 transition-all hover:bg-zinc-950 hover:text-white"
      >
        <ArrowUpRight class="size-3.5 transition-transform group-hover:rotate-12" />
      </button>
    </div>

    <div>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-start gap-1.5">
          <span
            class="text-[28px] leading-none font-semibold tracking-tight text-zinc-950 tabular-nums"
          >
            {{ formatMetric(snapshot.value, metric.format) }}
          </span>
          <span
            :class="[
              'inline-flex items-center text-xs font-semibold',
              positive ? 'text-emerald-500' : 'text-rose-500',
            ]"
          >
            <ArrowUp v-if="positive" class="size-3" :stroke-width="2.5" />
            <ArrowDown v-else class="size-3" :stroke-width="2.5" />
            {{ formatDelta(snapshot.delta) }}
          </span>
        </div>
        <PeriodToggle v-model="period" class="shrink-0" />
      </div>
      <p class="mt-2 truncate text-xs text-zinc-500">{{ snapshot.caption }}</p>
    </div>
  </article>
</template>
