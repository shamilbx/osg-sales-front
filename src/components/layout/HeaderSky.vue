<script setup lang="ts">
import { useId } from 'vue'

const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
const blur = `${uid}-blur`

// Маршрут самолёта совпадает с пунктиром; при «уменьшении движения» самолёт стоит на месте
const route = 'M0 74 C 380 40 760 96 1180 52 S 1500 36 1600 22'
// Встречный маршрут справа налево: часть самолётов летит навстречу остальным
const routeBack = 'M1600 30 C 1250 82 800 18 400 58 S 100 40 0 66'
// У каждого самолёта своя скорость, размер и высота; phase разводит их по маршруту с самого начала
const planes = [
  { seconds: 22, phase: 0.55, scale: 1.05, dy: 0, opacity: 1, restX: 1540, restY: 26 },
  { seconds: 30, phase: 0.1, scale: 0.7, dy: -10, opacity: 0.7, restX: 900, restY: 38, back: true },
  { seconds: 26, phase: 0.8, scale: 0.85, dy: 8, opacity: 0.85, restX: 300, restY: 62 },
  {
    seconds: 36,
    phase: 0.35,
    scale: 0.6,
    dy: -4,
    opacity: 0.55,
    restX: 1250,
    restY: 40,
    back: true,
  },
  { seconds: 19, phase: 0.95, scale: 0.9, dy: 14, opacity: 0.9, restX: 600, restY: 82 },
]
const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const planePath =
  'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'

// Облака: центр, размер и прозрачность
const clouds = [
  { x: 120, y: 70, rx: 150, ry: 18, opacity: 0.85 },
  { x: 420, y: 28, rx: 110, ry: 13, opacity: 0.7 },
  { x: 760, y: 76, rx: 190, ry: 20, opacity: 0.8 },
  { x: 1080, y: 30, rx: 130, ry: 14, opacity: 0.75 },
  { x: 1380, y: 72, rx: 170, ry: 18, opacity: 0.85 },
  { x: 1560, y: 24, rx: 100, ry: 12, opacity: 0.7 },
]
</script>

<!-- Небо для шапки классического варианта: лёгкие облака и пунктир маршрута -->
<template>
  <div
    aria-hidden="true"
    class="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
  >
    <div
      class="absolute inset-0 bg-linear-to-r from-[#f4f8ff] via-[#d9e8fb] to-[#b9d2f2] dark:from-[#0b1430] dark:via-[#111f4d] dark:to-[#1d3a8a]"
    />
    <svg
      class="absolute inset-0 size-full"
      viewBox="0 0 1600 96"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <filter :id="blur" x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <g :filter="`url(#${blur})`" class="fill-white dark:fill-sky-200/20">
        <ellipse
          v-for="cloud in clouds"
          :key="cloud.x"
          :cx="cloud.x"
          :cy="cloud.y"
          :rx="cloud.rx"
          :ry="cloud.ry"
          :opacity="cloud.opacity"
        />
      </g>
      <path
        :d="route"
        fill="none"
        stroke-width="1.5"
        stroke-dasharray="5 7"
        class="stroke-[#6f93d1]/60 dark:stroke-sky-300/40"
      />
      <!-- Иконка повёрнута носом вправо: animateMotion сам разворачивает её вдоль маршрута -->
      <g
        v-for="(plane, index) in planes"
        :key="index"
        :transform="`translate(0 ${plane.dy})`"
        :opacity="plane.opacity"
      >
        <g
          :transform="
            reduceMotion
              ? `translate(${plane.restX} ${plane.restY})${plane.back ? ' rotate(180)' : ''}`
              : undefined
          "
        >
          <animateMotion
            v-if="!reduceMotion"
            :path="plane.back ? routeBack : route"
            :dur="`${plane.seconds}s`"
            :begin="`${-plane.seconds * plane.phase}s`"
            rotate="auto"
            repeatCount="indefinite"
          />
          <animate
            v-if="!reduceMotion"
            attributeName="opacity"
            values="0;1;1;0"
            keyTimes="0;0.06;0.94;1"
            :dur="`${plane.seconds}s`"
            :begin="`${-plane.seconds * plane.phase}s`"
            repeatCount="indefinite"
          />
          <path
            :d="planePath"
            :transform="`rotate(45) scale(${plane.scale}) translate(-12 -12)`"
            fill="none"
            stroke-width="1.9"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="stroke-sky-500 dark:stroke-sky-300"
          />
        </g>
      </g>
    </svg>
  </div>
</template>
