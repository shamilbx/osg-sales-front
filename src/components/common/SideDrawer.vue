<script setup lang="ts">
import { onKeyStroke } from '@vueuse/core'
import { X } from '@lucide/vue'
import { cn } from '@/lib/utils'

defineProps<{ title: string; subtitle?: string }>()
const open = defineModel<boolean>('open', { required: true })

// Esc закрывает только открытую панель
onKeyStroke('Escape', () => {
  if (open.value) open.value = false
})
</script>

<template>
  <!-- Карточка записи справа: закрывается кликом вне панели, Esc и крестиком -->
  <Teleport to="body">
    <div
      :class="cn('fixed inset-0 z-50', open ? 'pointer-events-auto' : 'pointer-events-none')"
      :aria-hidden="!open"
    >
      <div
        :class="
          cn(
            'absolute inset-0 bg-zinc-950/30 backdrop-blur-sm transition-opacity',
            open ? 'opacity-100' : 'opacity-0',
          )
        "
        @click="open = false"
      />
      <aside
        role="dialog"
        aria-modal="true"
        :aria-label="title"
        :class="
          cn(
            'absolute inset-y-3 right-3 flex w-[560px] max-w-[calc(100vw-24px)] flex-col overflow-hidden rounded-[20px] bg-white shadow-2xl transition-transform duration-300',
            open ? 'translate-x-0' : 'translate-x-[110%]',
          )
        "
      >
        <header class="flex items-start gap-3 border-b border-zinc-100 px-6 py-5">
          <div class="min-w-0 flex-1">
            <slot name="header">
              <h2 class="truncate text-lg font-semibold tracking-tight text-zinc-950">
                {{ title }}
              </h2>
              <p v-if="subtitle" class="mt-0.5 truncate text-xs text-zinc-500">{{ subtitle }}</p>
            </slot>
          </div>
          <button
            type="button"
            class="grid size-9 shrink-0 place-items-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
            :aria-label="$t('Закрыть')"
            @click="open = false"
          >
            <X class="size-5" />
          </button>
        </header>
        <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <slot v-if="open" />
        </div>
        <footer v-if="$slots.footer" class="border-t border-zinc-100 px-6 py-4">
          <slot name="footer" />
        </footer>
      </aside>
    </div>
  </Teleport>
</template>
