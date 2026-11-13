<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { onClickOutside, onKeyStroke, useEventListener } from '@vueuse/core'
import { ChevronsUpDown } from '@lucide/vue'
import { useModules } from '@/composables/useModules'
import { useNavTooltip } from '@/composables/useNavTooltip'
import { t } from '@/i18n'
import IconTile from '@/components/dashboard/IconTile.vue'
import ModuleList from '@/components/layout/ModuleList.vue'

// В свернутом сайдбаре остается только значок текущего модуля: по нему открывается тот же список модулей
defineProps<{ collapsed?: boolean }>()

const { activeModule } = useModules()
const { show, showOnKeyboardFocus, hide } = useNavTooltip()
const tipText = () =>
  t('Модуль: {name}. Открыть центр управления', { name: activeModule.value.title })

const open = ref(false)
const root = useTemplateRef<HTMLDivElement>('root')
const floating = useTemplateRef<HTMLDivElement>('floating')

// Список свёрнутого меню рисуется в body рядом со значком: прокрутка сайдбара его не обрежет
const position = ref({ top: 0, left: 0 })
const PANEL_GAP = 12
const PANEL_MARGIN = 8

function toggleFloating(event: Event) {
  hide()
  if (open.value) {
    open.value = false
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  position.value = {
    top: Math.max(PANEL_MARGIN, Math.min(rect.top, window.innerHeight - 420)),
    left: rect.right + PANEL_GAP,
  }
  open.value = true
}

onClickOutside(root, () => (open.value = false), { ignore: [floating] })
onKeyStroke('Escape', () => (open.value = false))
useEventListener(window, 'resize', () => (open.value = false))
</script>

<template>
  <div ref="root" class="relative">
    <template v-if="collapsed">
      <button
        type="button"
        aria-haspopup="listbox"
        :aria-expanded="open"
        :aria-label="$t('Выбрать модуль')"
        class="grid w-full place-items-center rounded-xl py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        @click="toggleFloating"
        @mouseenter="!open && show($event, tipText())"
        @mouseleave="hide"
        @focus="!open && showOnKeyboardFocus($event, tipText())"
        @blur="hide"
      >
        <IconTile :icon="activeModule.icon" :tone="activeModule.tone" />
      </button>

      <Teleport to="body">
        <div
          v-if="open"
          ref="floating"
          class="fixed z-[100] max-h-[70vh] w-[288px] overflow-y-auto rounded-2xl border border-white/10 bg-[#101f4a] p-1.5 shadow-[0_24px_48px_-16px_rgba(0,0,0,.6)]"
          :style="{ top: `${position.top}px`, left: `${position.left}px` }"
        >
          <ModuleList @close="open = false" />
        </div>
      </Teleport>
    </template>

    <template v-else>
      <button
        type="button"
        aria-haspopup="listbox"
        :aria-expanded="open"
        class="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.08] p-2.5 text-left backdrop-blur-sm transition-colors hover:bg-white/[0.13]"
        @click="open = !open"
      >
        <IconTile :icon="activeModule.icon" :tone="activeModule.tone" />
        <span class="min-w-0 flex-1 leading-tight">
          <span class="block text-[10px] font-semibold tracking-[0.14em] text-white/50 uppercase">
            {{ $t('Модуль') }}
          </span>
          <span class="block truncate text-[15px] font-semibold text-white">
            {{ activeModule.title }}
          </span>
        </span>
        <ChevronsUpDown class="mr-1 size-4 shrink-0 text-white/55" />
      </button>

      <div
        v-if="open"
        class="absolute top-[calc(100%+8px)] right-0 left-0 z-30 max-h-[60vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#101f4a] p-1.5 shadow-[0_24px_48px_-16px_rgba(0,0,0,.6)]"
      >
        <ModuleList @close="open = false" />
      </div>
    </template>
  </div>
</template>
