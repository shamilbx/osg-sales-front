<script setup lang="ts">
import { reactive, useTemplateRef, watch } from 'vue'
import { useElementSize, useMediaQuery, useRafFn } from '@vueuse/core'

const section = useTemplateRef<HTMLElement>('section')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const { width, height } = useElementSize(section)
const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789'
const SIZE = 16

// Положение «головы» каждой колонки в строках; у одной колонки своя скорость
const rain = reactive<{ drops: number[]; speeds: number[] }>({ drops: [], speeds: [] })
const randomGlyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!

// Размер холста подгоняется под баннер с учётом плотности пикселей экрана
watch([width, height, canvas], () => {
  const el = canvas.value
  if (!el || width.value === 0) return
  const ratio = window.devicePixelRatio || 1
  el.width = Math.round(width.value * ratio)
  el.height = Math.round(height.value * ratio)
  const ctx = el.getContext('2d')!
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, width.value, height.value)

  const columns = Math.ceil(width.value / SIZE)
  rain.drops = Array.from({ length: columns }, () => Math.random() * (height.value / SIZE))
  rain.speeds = Array.from({ length: columns }, () => 0.35 + Math.random() * 0.65)
})

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx || rain.drops.length === 0) return

  // Лёгкая заливка вместо очистки оставляет за каждым символом затухающий след
  ctx.fillStyle = 'rgba(0, 0, 0, 0.09)'
  ctx.fillRect(0, 0, width.value, height.value)
  ctx.font = `${SIZE}px ui-monospace, Menlo, monospace`

  rain.drops.forEach((row, column) => {
    const x = column * SIZE
    const y = row * SIZE
    if (y > 0) {
      ctx.fillStyle = '#00ff41'
      ctx.fillText(randomGlyph(), x, y)
      // Голова колонки светлее остальных символов
      ctx.fillStyle = '#d6ffe0'
      ctx.fillText(randomGlyph(), x, y + SIZE)
    }
    rain.drops[column] = row + rain.speeds[column]!
    if (y > height.value && Math.random() > 0.975) rain.drops[column] = 0
  })
}

// При «меньше движения» показываем один статичный кадр: дождь не идёт
useRafFn(draw, { fpsLimit: 24, immediate: true })
watch(reduceMotion, (value) => {
  if (value) for (let i = 0; i < 80; i++) draw()
})
</script>

<template>
  <section
    ref="section"
    class="relative overflow-hidden rounded-[18px] bg-black px-6 py-10 text-white sm:px-10 sm:py-12"
  >
    <!-- Матрица: падающие символы на чёрном фоне -->
    <canvas
      ref="canvas"
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 size-full"
    />
    <!-- Затемнение слева, чтобы текст читался поверх дождя -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-0 bg-linear-to-r from-black/85 via-black/45 to-transparent"
    />

    <div class="relative max-w-[640px]">
      <h1 class="text-3xl font-semibold tracking-tight sm:text-[40px] sm:leading-tight">
        {{ $t('Центр управления') }}
      </h1>
      <p class="mt-3 text-[15px] leading-relaxed text-zinc-300 sm:text-base">
        {{
          $t(
            'Все модули для управления турагентством — в одном месте. Выберите модуль и перейдите в нужный раздел.',
          )
        }}
      </p>
    </div>
  </section>
</template>
