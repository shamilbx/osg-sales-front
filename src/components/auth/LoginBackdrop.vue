<script setup lang="ts">
import { ref, useId } from 'vue'
import { useMediaQuery } from '@vueuse/core'

// Фото фона лежит в public/login-bg.webp; если его нет, остаётся нарисованный фон.
// Путь в переменной, чтобы Vite не пытался искать файл при сборке, когда его нет.
const photoUrl = '/login-bg.webp'
const photoMissing = ref(false)

const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const ids = { sky: `${uid}-sky`, cloud: `${uid}-cloud`, wave: `${uid}-wave`, glow: `${uid}-glow` }

const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const routePath = 'M 330 760 C 620 700 760 460 1120 420 S 1400 260 1680 215'
const planeShape =
  'M16 0 L5 -3 L-1 -15 L-5 -15 L-2 -3 L-10 -3 L-13 -8 L-16 -8 L-13 0 L-16 8 L-13 8 L-10 3 L-2 3 L-5 15 L-1 15 L5 3 Z'

// Материки карты мира: упрощенные силуэты
const continents = [
  'M330 190 C380 150 470 140 560 150 S720 170 760 220 S740 300 690 340 S640 420 600 470 S540 500 520 440 S470 380 420 360 S340 300 330 190 Z',
  'M780 70 C840 50 920 60 940 100 S880 160 820 150 S760 110 780 70 Z',
  'M640 520 C700 490 780 520 800 580 S790 700 740 780 S690 860 660 780 S620 640 640 520 Z',
  'M980 240 C1020 200 1100 190 1150 220 S1190 280 1140 310 S1040 330 990 300 Z',
  'M1000 340 C1070 320 1160 340 1200 400 S1220 520 1170 600 S1090 700 1050 640 S980 480 1000 340 Z',
  'M1180 190 C1280 130 1440 140 1560 200 S1640 320 1560 380 S1380 420 1300 380 S1200 320 1180 190 Z',
  'M1400 640 C1460 610 1540 630 1560 680 S1520 740 1450 730 S1380 690 1400 640 Z',
]

// Облака внизу справа: центр и размеры
const clouds = [
  [980, 880, 170, 56],
  [1120, 850, 150, 60],
  [1260, 880, 190, 64],
  [1420, 850, 170, 62],
  [1560, 880, 170, 58],
  [900, 905, 150, 44],
  [1340, 905, 220, 48],
] as const

// Арки Колизея: ряды окон
const arcRows = [
  { y: 668, count: 12 },
  { y: 698, count: 12 },
  { y: 728, count: 12 },
]
</script>

<!-- Светлый туристический фон: карта мира, достопримечательности в облаках и маршрут самолета -->
<template>
  <div aria-hidden="true" class="pointer-events-none absolute inset-0 overflow-hidden bg-[#dbe7f8]">
    <svg
      class="absolute inset-0 size-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient :id="ids.sky" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f6f9ff" />
          <stop offset="45%" stop-color="#c9daf3" />
          <stop offset="100%" stop-color="#7fa2d8" />
        </linearGradient>
        <radialGradient :id="ids.glow" cx="0.12" cy="0.1" r="0.7">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <linearGradient :id="ids.wave" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#e8f0fc" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#a9c2ea" stop-opacity="0.9" />
        </linearGradient>
        <linearGradient :id="ids.cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="100%" stop-color="#dfe9f8" stop-opacity="0.95" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" :fill="`url(#${ids.sky})`" />
      <rect width="1600" height="900" :fill="`url(#${ids.glow})`" />

      <!-- Карта мира -->
      <g fill="#5b82c8" fill-opacity="0.13">
        <path v-for="d in continents" :key="d" :d="d" />
      </g>

      <!-- Волны слева внизу -->
      <path
        d="M0 560 C 250 640 470 790 640 900 L0 900 Z"
        :fill="`url(#${ids.wave})`"
        opacity="0.55"
      />
      <path
        d="M0 690 C 220 700 440 800 600 900 L0 900 Z"
        :fill="`url(#${ids.wave})`"
        opacity="0.85"
      />

      <!-- Маршрут самолета -->
      <g
        fill="none"
        stroke="#7e9fd6"
        stroke-width="2"
        stroke-dasharray="8 8"
        stroke-linecap="round"
      >
        <path :d="routePath" />
        <path d="M 1120 420 C 1250 410 1330 380 1420 330" stroke-opacity="0.6" />
      </g>
      <g :transform="reduceMotion ? 'translate(1250 322) rotate(-24) scale(1.8)' : undefined">
        <path :d="planeShape" fill="#4f78bd" />
        <animateMotion
          v-if="!reduceMotion"
          :path="routePath"
          dur="36s"
          rotate="auto"
          repeatCount="indefinite"
        />
      </g>

      <!-- Эйфелева башня -->
      <g fill="#d3def2" stroke="#8da6d4" stroke-width="1.2" stroke-linejoin="round">
        <path d="M1232 330 L1232 352" fill="none" />
        <path d="M1226 352 L1238 352 L1244 470 L1220 470 Z" />
        <rect x="1214" y="466" width="36" height="8" />
        <path d="M1220 474 L1244 474 L1256 560 L1208 560 Z" />
        <rect x="1202" y="556" width="60" height="9" />
        <path d="M1208 565 L1256 565 L1292 740 L1262 740 L1232 622 L1202 740 L1172 740 Z" />
        <path
          d="M1226 380 L1238 408 M1238 380 L1226 408 M1222 500 L1242 530 M1242 500 L1222 530"
          fill="none"
          stroke-opacity="0.6"
        />
      </g>

      <!-- Колизей -->
      <g>
        <path
          d="M920 760 L920 664 C920 628 1040 600 1130 622 L1176 654 L1176 760 Z"
          fill="#d3def2"
          stroke="#8da6d4"
          stroke-width="1.2"
        />
        <g fill="#9db4dd">
          <rect
            v-for="row in arcRows.flatMap((r) =>
              Array.from({ length: r.count }, (_, i) => ({ x: 932 + i * 20, y: r.y })),
            )"
            :key="`${row.x}-${row.y}`"
            :x="row.x"
            :y="row.y"
            width="9"
            height="18"
            rx="4"
          />
        </g>
      </g>

      <!-- Биг-Бен -->
      <g fill="#d3def2" stroke="#8da6d4" stroke-width="1.2" stroke-linejoin="round">
        <path d="M1356 760 L1356 480 L1370 420 L1384 480 L1384 760 Z" />
        <rect x="1352" y="478" width="36" height="10" />
        <circle cx="1370" cy="526" r="12" fill="#eef3fb" />
        <path d="M1370 518 V526 L1376 530" fill="none" />
        <path d="M1362 560 V640 M1378 560 V640" fill="none" stroke-opacity="0.5" />
      </g>

      <!-- Тадж-Махал -->
      <g fill="#d3def2" stroke="#8da6d4" stroke-width="1.2" stroke-linejoin="round">
        <rect x="1500" y="672" width="100" height="90" />
        <path d="M1520 672 C 1520 620 1580 620 1580 672 Z" />
        <path d="M1550 612 V622" fill="none" />
        <rect x="1494" y="640" width="8" height="122" />
        <rect x="1598" y="640" width="8" height="122" />
        <path
          d="M1494 640 C 1494 628 1502 628 1502 640 Z M1598 640 C 1598 628 1606 628 1606 640 Z"
        />
      </g>

      <!-- Облака поверх основания зданий -->
      <g :fill="`url(#${ids.cloud})`">
        <ellipse
          v-for="[cx, cy, rx, ry] in clouds"
          :key="`${cx}-${cy}`"
          :cx="cx"
          :cy="cy"
          :rx="rx"
          :ry="ry"
        />
      </g>
    </svg>

    <img
      v-if="!photoMissing"
      :src="photoUrl"
      alt=""
      class="absolute inset-0 size-full object-cover object-[72%_center]"
      @error="photoMissing = true"
    />
  </div>
</template>
