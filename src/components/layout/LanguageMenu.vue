<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { Check, Globe } from '@lucide/vue'
import { localeOptions, setLocale, useI18n, type Locale } from '@/i18n'
import { cn } from '@/lib/utils'

const { locale } = useI18n()

const open = ref(false)
const root = useTemplateRef<HTMLDivElement>('root')

const current = computed(
  () => localeOptions.find((option) => option.code === locale.value) ?? localeOptions[0]!,
)

onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

function choose(code: Locale) {
  setLocale(code)
  open.value = false
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      :aria-expanded="open"
      aria-haspopup="menu"
      :aria-label="`${$t('Язык')}: ${current.label}`"
      class="flex h-11 items-center gap-1.5 rounded-xl px-2 sm:px-2.5 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-white/70 hover:text-zinc-950"
      @click="open = !open"
    >
      <Globe class="size-5" :stroke-width="1.8" />
      <span class="hidden sm:inline">{{ current.short }}</span>
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute top-[calc(100%+8px)] right-0 z-40 w-64 rounded-3xl border border-zinc-200 bg-white p-2 shadow-[0_20px_40px_-16px_rgba(16,24,40,.3)]"
    >
      <button
        v-for="option in localeOptions"
        :key="option.code"
        type="button"
        role="menuitemradio"
        :aria-checked="option.code === locale"
        class="flex h-14 w-full items-center gap-4 rounded-2xl px-4 text-left transition-colors hover:bg-zinc-100"
        @click="choose(option.code)"
      >
        <span class="w-7 shrink-0 text-xs font-semibold tracking-wide text-zinc-400 uppercase">
          {{ option.badge }}
        </span>
        <span
          :class="
            cn(
              'flex-1 text-lg font-semibold',
              option.code === locale ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-950',
            )
          "
        >
          {{ option.label }}
        </span>
        <Check v-if="option.code === locale" class="size-[18px] text-zinc-500" />
      </button>
    </div>
  </div>
</template>
