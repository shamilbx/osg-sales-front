<script setup lang="ts">
import { computed, ref, useId, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import { Target } from '@lucide/vue'
import { decimalSign, formatPercent } from '@/lib/format'
import type { ConversionPoint, Period } from '@/lib/types'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import ChartTooltip from '@/components/dashboard/ChartTooltip.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'
import PeriodToggle from '@/components/dashboard/PeriodToggle.vue'

const props = defineProps<{ data: ConversionPoint[] }>()

const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const HEIGHT = 180
const PAD_TOP = 8

// Сколько последних недель показывать для каждого периода
const windowByPeriod: Record<Period, number> = { day: 2, week: 4, month: 12 }
const period = ref<Period>('month')
const visible = computed(() => props.data.slice(-windowByPeriod[period.value]))

const current = computed(() => visible.value.at(-1)?.rate ?? 0)
const diff = computed(() => current.value - (visible.value[0]?.rate ?? 0))

const container = useTemplateRef<HTMLDivElement>('container')
const { width } = useElementSize(container)
const hovered = ref<number | null>(null)

const step = computed(() => width.value / Math.max(visible.value.length, 1))

const yScale = computed(() => {
  const rates = visible.value.map((point) => point.rate)
  const min = Math.min(...rates) - 4
  const max = Math.max(...rates) + 2
  return (value: number) => PAD_TOP + (1 - (value - min) / (max - min)) * (HEIGHT - PAD_TOP)
})

// Ступенчатая линия (stepAfter): горизонталь до следующей точки, затем вертикаль
const linePath = computed(() => {
  const segments = visible.value.map((point, index) => {
    const y = yScale.value(point.rate)
    return index === 0 ? `M0,${y}` : `H${index * step.value}V${y}`
  })
  return `${segments.join('')}H${width.value}`
})
const areaPath = computed(() => `${linePath.value}V${HEIGHT}H0Z`)

const active = computed(() => {
  if (hovered.value === null) return null
  const point = visible.value[hovered.value]
  if (!point) return null
  return { point, x: hovered.value * step.value + step.value / 2, y: yScale.value(point.rate) }
})

function onMove(event: MouseEvent) {
  const left = container.value?.getBoundingClientRect().left ?? 0
  const index = Math.floor((event.clientX - left) / step.value)
  hovered.value = Math.min(Math.max(index, 0), visible.value.length - 1)
}
</script>

<template>
  <BasePanel class="flex h-full flex-col gap-6 sm:flex-row sm:items-stretch">
    <div class="flex shrink-0 flex-col justify-between gap-4 sm:w-[210px]">
      <PanelHeader :icon="Target" :title="$t('Конверсия в продажу')" />
      <div>
        <p class="text-[32px] leading-none font-semibold tracking-tight text-zinc-950 tabular-nums">
          {{ formatPercent(current) }}
        </p>
        <p class="mt-2 flex items-center gap-2 text-[13px] text-zinc-500">
          <span class="size-2.5 rounded-full bg-brand-pink ring-4 ring-brand-pink/15" />
          <span>
            {{ diff >= 0 ? '+' : '−'
            }}{{
              $t('{value} п.п. за {weeks} нед.', {
                value: Math.abs(diff).toFixed(1).replace('.', decimalSign()),
                weeks: visible.length,
              })
            }}
          </span>
        </p>
      </div>
      <PeriodToggle v-model="period" :periods="['week', 'month']" class="self-start" />
    </div>

    <div ref="container" class="relative min-w-0 flex-1" :style="{ height: `${HEIGHT}px` }">
      <svg
        v-if="width > 0"
        :width="width"
        :height="HEIGHT"
        @mousemove="onMove"
        @mouseleave="hovered = null"
      >
        <defs>
          <linearGradient :id="`${uid}-fill`" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#f2508f" stop-opacity="0.22" />
            <stop offset="100%" stop-color="#f2508f" stop-opacity="0" />
          </linearGradient>
          <pattern :id="`${uid}-stripes`" width="5" height="6" patternUnits="userSpaceOnUse">
            <line x1="0.5" y1="0" x2="0.5" y2="6" stroke="#f2508f" stroke-opacity="0.35" />
          </pattern>
        </defs>

        <path :d="areaPath" :fill="`url(#${uid}-stripes)`" />
        <path :d="areaPath" :fill="`url(#${uid}-fill)`" />
        <path :d="linePath" fill="none" stroke="#f2508f" stroke-width="2" />

        <template v-if="active">
          <line
            :x1="active.x"
            :x2="active.x"
            :y1="0"
            :y2="HEIGHT"
            stroke="#f2508f"
            stroke-opacity="0.3"
            stroke-dasharray="3 3"
          />
          <circle
            :cx="active.x"
            :cy="active.y"
            r="5"
            fill="#f2508f"
            stroke="#fff"
            stroke-width="2"
          />
        </template>
      </svg>

      <ChartTooltip
        v-if="active"
        class="absolute -translate-x-1/2 -translate-y-[calc(100%+12px)]"
        :style="{ left: `${active.x}px`, top: `${active.y}px` }"
        :label="active.point.week"
        :value="formatPercent(active.point.rate)"
      />
    </div>
  </BasePanel>
</template>
