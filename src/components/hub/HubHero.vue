<script setup lang="ts">
import { useId } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const ids = { globe: `${uid}-globe`, haze: `${uid}-haze`, blur: `${uid}-blur` }

const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// Самолет, нос смотрит вправо
const planeShape =
  'M16 0 L5 -3 L-1 -15 L-5 -15 L-2 -3 L-10 -3 L-13 -8 L-16 -8 L-13 0 L-16 8 L-13 8 L-10 3 L-2 3 L-5 15 L-1 15 L5 3 Z'

// Путь полета: слева внизу под текстом, вверх через глобус и за правый край, затем снова слева
const flightPath = 'M -90 232 C 260 262, 520 218, 800 196 S 1190 92, 1400 70 S 1620 100, 1720 84'

// Облака: центр и размеры
const clouds = [
  [1340, 250, 130, 16],
  [1460, 232, 80, 14],
  [1030, 40, 110, 12],
  [1710, 60, 90, 11],
  [300, 262, 140, 12],
  [820, 276, 110, 11],
] as const

// Метки направлений на глобусе
const pins = [
  [1400, 120],
  [1458, 196],
] as const
</script>

<template>
  <section
    class="relative overflow-hidden rounded-[24px] bg-linear-to-r from-[#f6f9ff] via-[#dbe8fb] to-[#adc8f0] px-6 py-10 text-ink sm:px-10 sm:py-12 dark:from-[#0b1430] dark:via-[#111f4d] dark:to-[#1d3a8a]"
  >
    <!-- Светлое небо с линиями маршрутов и контуром глобуса; самолет летит по окну по кругу -->
    <svg
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 hidden size-full sm:block"
      viewBox="0 0 1600 300"
      preserveAspectRatio="xMaxYMid slice"
    >
      <defs>
        <radialGradient :id="ids.globe" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
          <stop offset="100%" stop-color="#8fb2e8" stop-opacity="0.35" />
        </radialGradient>
        <radialGradient :id="ids.haze" cx="0.88" cy="0.45" r="0.3">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <filter :id="ids.blur" x="-30%" y="-200%" width="160%" height="500%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      <rect width="1600" height="300" :fill="`url(#${ids.haze})`" class="dark:opacity-15" />

      <!-- Облака -->
      <g fill="#ffffff" fill-opacity="0.85" :filter="`url(#${ids.blur})`" class="dark:opacity-20">
        <ellipse
          v-for="[cx, cy, rx, ry] in clouds"
          :key="`${cx}-${cy}`"
          :cx="cx"
          :cy="cy"
          :rx="rx"
          :ry="ry"
        />
      </g>

      <!-- Маршрут, по которому летит самолет -->
      <path
        :d="flightPath"
        fill="none"
        class="stroke-[#4f78bd] dark:stroke-[#9ad7ff]"
        stroke-width="1.6"
        stroke-opacity="0.55"
        stroke-dasharray="6 8"
        stroke-linecap="round"
      />

      <!-- Глобус: тонкий контур -->
      <g transform="translate(1400 150)">
        <circle r="112" :fill="`url(#${ids.globe})`" class="dark:opacity-40" />
        <g fill="none" class="stroke-[#4f78bd] dark:stroke-[#9ad7ff]" stroke-opacity="0.4">
          <ellipse rx="38" ry="112" />
          <ellipse rx="76" ry="112" />
          <ellipse rx="108" ry="112" />
          <ellipse cy="-56" rx="97" ry="13" />
          <ellipse rx="112" ry="17" />
          <ellipse cy="56" rx="97" ry="13" />
        </g>
        <circle
          r="112"
          fill="none"
          class="stroke-[#4f78bd] dark:stroke-[#9ad7ff]"
          stroke-opacity="0.7"
          stroke-width="1.5"
        />
      </g>

      <!-- Метки направлений -->
      <g v-for="[x, y] in pins" :key="`${x}-${y}`" :transform="`translate(${x} ${y})`">
        <path
          d="M0 0 C -7 -9 -8 -14 -8 -17 A8 8 0 1 1 8 -17 C 8 -14 7 -9 0 0 Z"
          fill="#f2508f"
          stroke="#ffffff"
          stroke-width="1.5"
        />
        <circle cy="-17" r="3" fill="#ffffff" />
      </g>

      <!-- Самолет: постоянно летит по маршруту -->
      <g :transform="reduceMotion ? 'translate(800 196) rotate(-8) scale(1.6)' : undefined">
        <path :d="planeShape" class="fill-ink" />
        <animateMotion
          v-if="!reduceMotion"
          :path="flightPath"
          dur="18s"
          rotate="auto"
          repeatCount="indefinite"
        />
      </g>
    </svg>

    <div class="relative max-w-[640px]">
      <h1 class="text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-tight">
        {{ $t('Центр управления') }}
      </h1>
      <p class="mt-3 text-[15px] leading-relaxed text-zinc-600 sm:text-base">
        {{
          $t(
            'Все модули для управления турагентством — в одном месте. Выберите модуль и перейдите в нужный раздел.',
          )
        }}
      </p>
    </div>
  </section>
</template>
