<script setup lang="ts">
import { Mars, Venus } from '@lucide/vue'
import { genderLabels } from '@/lib/gender'
import { cn } from '@/lib/utils'
import type { Gender } from '@/lib/types'

defineProps<{ id?: string; invalid?: boolean; label: string }>()
// Пока пол не выбран, значение пустое: поле обязательное и проверяется при отправке
const model = defineModel<Gender | ''>({ required: true })

// Привычные цвета: голубой для мужского, розовый для женского; невыбранный вариант тонирует только значок
const options = [
  {
    value: 'male' as const,
    icon: Mars,
    active: 'bg-sky-500 text-white shadow-sm shadow-sky-500/30',
    tint: 'text-sky-500',
  },
  {
    value: 'female' as const,
    icon: Venus,
    active: 'bg-pink-500 text-white shadow-sm shadow-pink-500/30',
    tint: 'text-pink-500',
  },
]
</script>

<template>
  <div
    :id="id"
    role="radiogroup"
    :aria-label="label"
    :aria-invalid="invalid || undefined"
    :class="
      cn(
        'grid h-11 grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1 transition-shadow',
        invalid && 'ring-2 ring-rose-400/60',
      )
    "
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      role="radio"
      :aria-checked="model === option.value"
      :class="
        cn(
          'flex min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors',
          model === option.value
            ? option.active
            : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-950',
        )
      "
      @click="model = option.value"
    >
      <component
        :is="option.icon"
        :class="cn('size-4 shrink-0', model !== option.value && option.tint)"
        :stroke-width="2.1"
      />
      <span class="truncate">{{ genderLabels[option.value] }}</span>
    </button>
  </div>
</template>
