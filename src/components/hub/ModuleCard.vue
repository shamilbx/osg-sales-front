<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { ArrowRight, ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import type { NavModule } from '@/config/navigation'
import type { Tone } from '@/lib/types'
import IconTile from '@/components/dashboard/IconTile.vue'

defineProps<{
  module: NavModule
  showStats: boolean
  editing: boolean
  isFirst: boolean
  isLast: boolean
}>()
defineEmits<{ move: [direction: -1 | 1] }>()

// Легкий цветной оттенок карточки по тону модуля
const wash: Record<Tone, string> = {
  blue: 'from-sky-50/90 via-white to-white dark:from-sky-400/15',
  red: 'from-red-50/90 via-white to-white dark:from-red-400/15',
  green: 'from-emerald-50/90 via-white to-white dark:from-emerald-400/15',
  orange: 'from-orange-50/90 via-white to-white dark:from-orange-400/15',
  pink: 'from-rose-50/90 via-white to-white dark:from-rose-400/15',
  violet: 'from-violet-50/90 via-white to-white dark:from-violet-400/15',
}
</script>

<template>
  <component
    :is="editing ? 'div' : RouterLink"
    v-bind="editing ? {} : { to: module.items[0]?.to ?? '/' }"
    :class="
      cn(
        'group relative flex min-h-[150px] items-start gap-5 rounded-[18px] border border-zinc-200/70 bg-linear-to-br p-5 transition-all duration-200 outline-none',
        wash[module.tone],
        editing
          ? 'border-dashed border-zinc-300'
          : 'hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-24px_rgba(16,24,40,.35)] focus-visible:ring-3 focus-visible:ring-ring/50',
      )
    "
  >
    <IconTile :icon="module.icon" :tone="module.tone" size="lg" />

    <div class="min-w-0 flex-1">
      <h3 class="text-lg font-semibold tracking-tight text-zinc-950">{{ module.title }}</h3>
      <p class="mt-1.5 text-sm leading-snug text-zinc-500">{{ module.description }}</p>

      <p
        v-if="showStats"
        class="mt-3 inline-flex rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200"
      >
        {{ module.stat }}
      </p>
    </div>

    <ArrowRight
      v-if="!editing"
      class="absolute top-5 right-5 size-4 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-zinc-900"
    />

    <div v-else class="absolute right-4 bottom-4 flex gap-1.5">
      <button
        type="button"
        class="grid size-8 place-items-center rounded-lg bg-white text-zinc-600 ring-1 ring-zinc-200 transition-colors hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-30"
        :disabled="isFirst"
        :aria-label="$t('Переместить модуль «{name}» раньше', { name: module.title })"
        @click="$emit('move', -1)"
      >
        <ChevronLeft class="size-4" />
      </button>
      <button
        type="button"
        class="grid size-8 place-items-center rounded-lg bg-white text-zinc-600 ring-1 ring-zinc-200 transition-colors hover:bg-brand hover:text-white disabled:pointer-events-none disabled:opacity-30"
        :disabled="isLast"
        :aria-label="$t('Переместить модуль «{name}» позже', { name: module.title })"
        @click="$emit('move', 1)"
      >
        <ChevronRight class="size-4" />
      </button>
    </div>
  </component>
</template>
