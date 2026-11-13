<script setup lang="ts">
import { cn } from '@/lib/utils'

// hideLabel — подпись остаётся для скринридеров, но на экране её нет: переключатель в тесной строке списка
defineProps<{ label: string; hideLabel?: boolean }>()
const model = defineModel<boolean>({ required: true })
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model"
    class="flex items-center gap-3 rounded-lg text-left text-sm text-zinc-800 outline-none focus-visible:ring-3 focus-visible:ring-zinc-900/10"
    @click="model = !model"
  >
    <span
      :class="
        cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors',
          model ? 'bg-emerald-500' : 'bg-zinc-300',
        )
      "
    >
      <span
        :class="
          cn(
            'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-sm transition-transform',
            model && 'translate-x-5',
          )
        "
      />
    </span>
    <span :class="cn(hideLabel && 'sr-only')">{{ label }}</span>
  </button>
</template>
