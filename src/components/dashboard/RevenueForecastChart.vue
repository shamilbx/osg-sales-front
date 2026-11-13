<script setup lang="ts">
import { t } from '@/i18n'
import { computed, ref, useId, useTemplateRef } from 'vue'
import { useElementSize } from '@vueuse/core'
import { CalendarClock, ChartColumn, Settings2 } from '@lucide/vue'
import { formatCompactMoney, formatCompactNumber, formatMoney } from '@/lib/format'
import type { ForecastPoint } from '@/lib/types'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import ChartTooltip from '@/components/dashboard/ChartTooltip.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'

const props = defineProps<{ data: ForecastPoint[] }>()

const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const ids = { base: `${uid}-base`, peak: `${uid}-peak`, dots: `${uid}-dots` }

const HEIGHT = 260
const margin = { top: 48, bottom: 28, left: 68 }
const plotHeight = HEIGHT - margin.top - margin.bottom
const yMax = 2_400_000_000
const yTicks = [0, 600_000_000, 1_200_000_000, 1_800_000_000, 2_400_000_000]

const container = useTemplateRef<HTMLDivElement>('container')
const { width } = useElementSize(container)
const hovered = ref<number | null>(null)

const total = computed(() => props.data.reduce((sum, point) => sum + point.revenue, 0))

const yScale = (value: number) => margin.top + plotHeight - (value / yMax) * plotHeight

const bars = computed(() => {
  const band = Math.max(width.value - margin.left, 0) / props.data.length
  const barWidth = band * 0.86
  return props.data.map((point, index) => {
    const bandX = margin.left + index * band
    const y = yScale(point.revenue)
    return {
      point,
      band,
      bandX,
      x: bandX + (band - barWidth) / 2,
      y,
      width: barWidth,
      height: margin.top + plotHeight - y,
      center: bandX + band / 2,
    }
  })
})

const active = computed(() => (hovered.value === null ? null : bars.value[hovered.value]))

function tickLabel(value: number) {
  return value === 0 ? '0' : formatCompactNumber(value)
}

function hintFor(point: ForecastPoint) {
  if (point.isPeak) return t('Пик: новогодние туры')
  return point.isCurrent ? t('Текущий месяц') : t('Прогноз')
}
</script>

<template>
  <BasePanel class="flex h-full flex-col">
    <PanelHeader :icon="ChartColumn" :title="$t('Прогноз выручки')">
      <template #action>
        <button
          type="button"
          class="flex h-9 items-center gap-1.5 rounded-full bg-zinc-100/80 px-3.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-950 hover:text-white"
        >
          <Settings2 class="size-3.5" />
          {{ $t('Настроить') }}
        </button>
      </template>
    </PanelHeader>

    <div class="mt-4">
      <p class="text-[32px] leading-none font-semibold tracking-tight text-zinc-950 tabular-nums">
        {{ formatMoney(total) }}
      </p>
      <p class="mt-2 flex items-center gap-2 text-[13px] text-zinc-500">
        <span class="grid size-4 place-items-center rounded-full bg-amber-300">
          <CalendarClock class="size-2.5 text-amber-900" :stroke-width="2.5" />
        </span>
        {{ $t('Сен — Фев · на 18% выше прошлого сезона') }}
      </p>
    </div>

    <div
      ref="container"
      class="relative mt-auto w-full pt-3"
      :style="{ height: `${HEIGHT + 12}px` }"
    >
      <svg v-if="width > 0" :width="width" :height="HEIGHT" class="overflow-visible">
        <defs>
          <linearGradient :id="ids.base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#7d97ff" />
            <stop offset="100%" stop-color="#6a87fb" />
          </linearGradient>
          <linearGradient :id="ids.peak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ff5f9f" />
            <stop offset="100%" stop-color="#ff7cb0" />
          </linearGradient>
          <!-- Мелкая «зернистая» текстура поверх столбцов, как в референсе -->
          <pattern :id="ids.dots" width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="#ffffff" fill-opacity="0.28" />
          </pattern>
        </defs>

        <g v-for="tick in yTicks" :key="tick">
          <line
            :x1="margin.left"
            :x2="width"
            :y1="yScale(tick)"
            :y2="yScale(tick)"
            class="stroke-zinc-200"
            stroke-dasharray="2 6"
          />
          <text :x="0" :y="yScale(tick)" dy="4" class="fill-zinc-400" font-size="11">
            {{ tickLabel(tick) }}
          </text>
        </g>

        <rect
          v-if="active"
          :x="active.bandX"
          :y="margin.top - 40"
          :width="active.band"
          :height="plotHeight + 40"
          rx="14"
          class="fill-zinc-900/5"
        />

        <g v-for="(bar, index) in bars" :key="bar.point.month">
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            rx="14"
            :fill="`url(#${bar.point.isPeak ? ids.peak : ids.base})`"
          />
          <rect
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            rx="14"
            :fill="`url(#${ids.dots})`"
          />

          <template v-if="bar.point.isPeak">
            <text
              :x="bar.center"
              :y="bar.y - 30"
              text-anchor="middle"
              class="fill-zinc-600"
              font-size="11"
            >
              {{ $t('Пик сезона') }}
            </text>
            <text
              :x="bar.center"
              :y="bar.y - 10"
              text-anchor="middle"
              class="fill-zinc-950"
              font-size="17"
              font-weight="600"
            >
              {{ formatCompactMoney(bar.point.revenue) }}
            </text>
          </template>
          <text
            v-else
            :x="bar.center"
            :y="bar.y - 10"
            text-anchor="middle"
            class="fill-zinc-500"
            font-size="12"
          >
            {{ formatCompactMoney(bar.point.revenue) }}
          </text>

          <text
            :x="bar.center"
            :y="HEIGHT - 6"
            text-anchor="middle"
            class="fill-zinc-500"
            font-size="12"
          >
            {{ bar.point.month }}
          </text>

          <!-- Невидимая зона наведения на всю колонку -->
          <rect
            :x="bar.bandX"
            :y="0"
            :width="bar.band"
            :height="HEIGHT"
            fill="transparent"
            @mouseenter="hovered = index"
            @mouseleave="hovered = null"
          />
        </g>
      </svg>

      <ChartTooltip
        v-if="active"
        class="absolute -translate-1/2"
        :style="{ left: `${active.center}px`, top: `${active.y + active.height / 2 + 12}px` }"
        :label="active.point.month"
        :value="formatMoney(active.point.revenue)"
        :hint="hintFor(active.point)"
      />
    </div>
  </BasePanel>
</template>
