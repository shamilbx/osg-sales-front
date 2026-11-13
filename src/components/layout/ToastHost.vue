<script setup lang="ts">
import { Check, TriangleAlert, X } from '@lucide/vue'
import { useToast } from '@/composables/useToast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div
    class="pointer-events-none fixed top-32 right-6 z-[100] flex w-[min(24rem,calc(100vw-3rem))] flex-col gap-3"
  >
    <TransitionGroup
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-x-6 opacity-0"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="translate-x-6 opacity-0"
    >
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :role="toast.tone === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto relative flex items-center gap-3.5 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white py-3.5 pr-10 pl-4 shadow-[0_12px_32px_-8px_rgba(24,24,27,0.25)]"
      >
        <span
          class="absolute inset-y-0 left-0 w-1"
          :class="toast.tone === 'error' ? 'bg-rose-500' : 'bg-emerald-500'"
        />
        <span
          class="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
          :class="toast.tone === 'error' ? 'bg-rose-500' : 'bg-emerald-500'"
        >
          <TriangleAlert v-if="toast.tone === 'error'" class="size-[18px]" />
          <Check v-else class="size-[18px]" stroke-width="3" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-[15px] leading-tight font-semibold text-zinc-950">
            {{ toast.title }}
          </span>
          <span v-if="toast.message" class="mt-0.5 block text-[13px] text-zinc-500">
            {{ toast.message }}
          </span>
        </span>
        <button
          type="button"
          class="absolute top-2.5 right-2.5 flex size-6 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          :aria-label="$t('Закрыть')"
          @click="dismiss(toast.id)"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>
