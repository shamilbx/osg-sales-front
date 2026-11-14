<script setup lang="ts">
import { ref } from 'vue'
import { onKeyStroke } from '@vueuse/core'
import { Search } from '@lucide/vue'
import CommandPalette from '@/components/layout/CommandPalette.vue'

const open = ref(false)

// ⌘K / Ctrl+K открывает поиск из любого места CRM
onKeyStroke(['k', 'K'], (event) => {
  if (!event.metaKey && !event.ctrlKey) return
  event.preventDefault()
  open.value = !open.value
})
</script>

<template>
  <div class="min-w-0">
    <button
      type="button"
      aria-haspopup="dialog"
      :aria-label="$t('Открыть поиск по CRM')"
      class="relative flex h-11 w-full min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white pr-4 pl-4 text-left text-sm text-zinc-400 transition-colors outline-none hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-3 focus-visible:ring-zinc-900/5 sm:pr-16"
      @click="open = true"
    >
      <Search class="size-[18px] shrink-0 text-zinc-500" />
      <span class="truncate">{{ $t('Поиск компаний, контактов, разделов…') }}</span>
      <kbd
        class="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-500 sm:block"
      >
        ⌘K
      </kbd>
    </button>

    <CommandPalette v-model:open="open" />
  </div>
</template>
