<script setup lang="ts">
import { Check, LayoutGrid } from '@lucide/vue'
import { useModules } from '@/composables/useModules'
import { cn } from '@/lib/utils'
import type { NavModule } from '@/config/navigation'
import IconTile from '@/components/dashboard/IconTile.vue'

// Список модулей с переходом в центр управления: общий для развёрнутого и свёрнутого сайдбара
const emit = defineEmits<{ close: [] }>()

const { modules, activeModule, selectModule } = useModules()

async function choose(module: NavModule) {
  emit('close')
  await selectModule(module)
}
</script>

<template>
  <RouterLink
    to="/modules"
    class="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors outline-none hover:bg-white/10 focus-visible:bg-white/10"
    @click="emit('close')"
  >
    <span class="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
      <LayoutGrid class="size-[18px]" :stroke-width="1.9" />
    </span>
    <span class="min-w-0 flex-1 leading-tight">
      <span class="block truncate text-sm font-semibold text-white">{{
        $t('Центр управления')
      }}</span>
      <span class="block truncate text-xs text-white/55">{{ $t('Все модули в одном месте') }}</span>
    </span>
  </RouterLink>

  <div class="my-1.5 h-px bg-white/10" />

  <ul role="listbox" :aria-label="$t('Выбор модуля')">
    <li v-for="module in modules" :key="module.id">
      <button
        type="button"
        role="option"
        :aria-selected="module.id === activeModule.id"
        :class="
          cn(
            'flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/10',
            module.id === activeModule.id && 'bg-white/10',
          )
        "
        @click="choose(module)"
      >
        <IconTile :icon="module.icon" :tone="module.tone" class="size-9" />
        <span class="min-w-0 flex-1 leading-tight">
          <span class="block truncate text-sm font-semibold text-white">{{ module.title }}</span>
          <span class="block truncate text-xs text-white/55">{{ module.description }}</span>
        </span>
        <Check v-if="module.id === activeModule.id" class="size-4 shrink-0 text-white" />
      </button>
    </li>
  </ul>
</template>
