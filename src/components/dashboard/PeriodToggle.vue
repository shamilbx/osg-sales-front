<script setup lang="ts">
import { cn } from '@/lib/utils'
import type { Period } from '@/lib/types'

const { periods = ['day', 'week', 'month'] } = defineProps<{ periods?: Period[] }>()
const model = defineModel<Period>({ required: true })

const periodLabels: Record<Period, { short: string; full: string }> = {
  day: { short: 'Д', full: 'День' },
  week: { short: 'Н', full: 'Неделя' },
  month: { short: 'М', full: 'Месяц' },
}
</script>

<template>
  <div
    role="radiogroup"
    :aria-label="$t('Период')"
    class="inline-flex items-center rounded-full bg-zinc-100/80 p-0.5"
  >
    <button
      v-for="period in periods"
      :key="period"
      type="button"
      role="radio"
      :aria-checked="period === model"
      :aria-label="$t(periodLabels[period].full)"
      :title="$t(periodLabels[period].full)"
      :class="
        cn(
          'grid size-7 place-items-center rounded-full text-[11px] font-semibold transition-all',
          period === model
            ? 'bg-white text-zinc-950 shadow-sm'
            : 'text-zinc-400 hover:text-zinc-800',
        )
      "
      @click="model = period"
    >
      {{ $t(periodLabels[period].short) }}
    </button>
  </div>
</template>
