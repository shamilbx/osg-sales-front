<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { ArrowUpDown, Check, Eye, EyeOff, LayoutGrid } from '@lucide/vue'
import { modules } from '@/config/navigation'
import { cn } from '@/lib/utils'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import HubHero from '@/components/hub/HubHero.vue'
import ModuleCard from '@/components/hub/ModuleCard.vue'

const showStats = ref(false)
const editing = ref(false)

// Порядок модулей запоминается; новые модули из конфигурации добавляются в конец
const savedOrder = useLocalStorage<string[]>(
  'ambassador:module-order',
  modules.map((m) => m.id),
)

const ordered = computed(() => {
  const known = savedOrder.value.flatMap((id) => modules.filter((module) => module.id === id))
  const rest = modules.filter((module) => !savedOrder.value.includes(module.id))
  return [...known, ...rest]
})

function move(index: number, direction: -1 | 1) {
  const ids = ordered.value.map((module) => module.id)
  const target = index + direction
  if (target < 0 || target >= ids.length) return
  ;[ids[index], ids[target]] = [ids[target]!, ids[index]!]
  savedOrder.value = ids
}

const actionButton =
  'flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950'
</script>

<template>
  <div class="flex flex-col gap-4">
    <HubHero />

    <BasePanel class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2
          class="flex items-center gap-2.5 rounded-2xl bg-zinc-50 px-3.5 py-2 text-lg font-semibold tracking-tight text-zinc-950 ring-1 ring-zinc-100"
        >
          <LayoutGrid class="size-5 text-zinc-700" :stroke-width="1.9" />
          {{ $t('Модули') }}
        </h2>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            :aria-pressed="showStats"
            :class="
              cn(
                actionButton,
                showStats &&
                  'border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800 hover:text-white',
              )
            "
            @click="showStats = !showStats"
          >
            <EyeOff v-if="showStats" class="size-4" />
            <Eye v-else class="size-4" />
            {{ showStats ? $t('Скрыть статистику') : $t('Показать статистику') }}
          </button>
          <button
            type="button"
            :aria-pressed="editing"
            :class="
              cn(
                actionButton,
                editing &&
                  'border-zinc-950 bg-zinc-950 text-white hover:bg-zinc-800 hover:text-white',
              )
            "
            @click="editing = !editing"
          >
            <Check v-if="editing" class="size-4" />
            <ArrowUpDown v-else class="size-4" />
            {{ editing ? $t('Готово') : $t('Настроить порядок модулей') }}
          </button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ModuleCard
          v-for="(module, index) in ordered"
          :key="module.id"
          :module="module"
          :show-stats="showStats"
          :editing="editing"
          :is-first="index === 0"
          :is-last="index === ordered.length - 1"
          @move="move(index, $event)"
        />
      </div>
    </BasePanel>
  </div>
</template>
