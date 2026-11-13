<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LogOut,
  RotateCcw,
} from '@lucide/vue'
import { cn } from '@/lib/utils'
import { isActivePath, systemNav, type NavItem } from '@/config/navigation'
import { useAuth } from '@/composables/useAuth'
import { useMenuOrder } from '@/composables/useMenuOrder'
import { useNavTooltip } from '@/composables/useNavTooltip'
import { useModules } from '@/composables/useModules'
import AppVersionCard from '@/components/layout/AppVersionCard.vue'
import ModuleSwitcher from '@/components/layout/ModuleSwitcher.vue'
import NavTooltip from '@/components/layout/NavTooltip.vue'
import SidebarBackdrop from '@/components/layout/SidebarBackdrop.vue'

// В свернутом виде остаются только иконки (десктоп)
const props = defineProps<{ collapsed?: boolean }>()

const route = useRoute()
const router = useRouter()
const { logout } = useAuth()
const { activeModule } = useModules()

function onLogout() {
  logout()
  router.push({ name: 'login' })
}

const { sorted, move, reset, hasCustomOrder } = useMenuOrder()
const { show, showOnKeyboardFocus, hide } = useNavTooltip()

// Подсказки нужны только у свёрнутого меню: у широкого названия и так видны
const showTip = (event: Event, text: string) => props.collapsed && show(event, text)
const showTipOnFocus = (event: FocusEvent, text: string) =>
  props.collapsed && showOnKeyboardFocus(event, text)
watch(
  () => props.collapsed,
  () => hide(),
)

const sections = computed<{ key: string; label: string; items: NavItem[] }[]>(() => [
  {
    key: activeModule.value.id,
    label: activeModule.value.title,
    items: sorted(activeModule.value.id, activeModule.value.items),
  },
  { key: 'system', label: 'Система', items: sorted('system', systemNav) },
])

// Режим настройки порядка: пункты можно перетаскивать или двигать стрелками
const editing = ref(false)
const dragging = ref<{ key: string; index: number } | null>(null)

function onDragStart(event: DragEvent, key: string, index: number) {
  dragging.value = { key, index }
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', key)
  }
}

// Пункт меняется местами сразу, как только его навели на другой: порядок видно до отпускания мыши
function onDragEnter(key: string, items: NavItem[], index: number) {
  const current = dragging.value
  if (!current || current.key !== key || current.index === index) return
  move(key, items, current.index, index)
  current.index = index
}

const isActive = (to: string) => isActivePath(to, route.path)
</script>

<template>
  <aside
    :class="
      cn(
        'relative flex min-h-0 flex-col overflow-y-auto sidebar-glass rounded-[24px] p-4 text-white',
        collapsed && 'px-3',
      )
    "
  >
    <SidebarBackdrop />
    <NavTooltip />

    <!-- На десктопе меню «прилипает» при прокрутке, а сайдбар тянется на всю высоту контента -->
    <div class="relative">
      <ModuleSwitcher :collapsed="collapsed" />

      <div class="flex flex-col pt-5">
        <nav
          v-for="(section, index) in sections"
          :key="section.label"
          :aria-label="$t(section.label)"
          :class="cn('space-y-0.5', index > 0 && 'mt-5 border-t border-white/10 pt-5')"
        >
          <p
            v-if="!collapsed"
            class="px-3.5 pb-2 text-[11px] font-bold tracking-[0.12em] text-white/60 uppercase"
          >
            {{ $t(section.label) }}
          </p>
          <TransitionGroup
            v-if="editing && !collapsed"
            tag="div"
            name="menu-move"
            class="flex flex-col gap-2"
          >
            <div
              v-for="(item, index) in section.items"
              :key="item.to"
              draggable="true"
              :class="
                cn(
                  'flex h-10 cursor-grab items-center gap-2 rounded-xl bg-white/5 pr-1.5 pl-2 text-[15px] font-semibold text-white/90 ring-1 ring-white/10 active:cursor-grabbing',
                  dragging?.key === section.key && dragging.index === index && 'opacity-40',
                )
              "
              @dragstart="onDragStart($event, section.key, index)"
              @dragenter.prevent="onDragEnter(section.key, section.items, index)"
              @dragend="dragging = null"
              @dragover.prevent
              @drop.prevent="dragging = null"
            >
              <GripVertical class="size-4 shrink-0 text-white/50" />
              <component
                :is="item.icon"
                class="size-[17px] shrink-0 text-white/75"
                :stroke-width="1.9"
              />
              <span class="flex-1 truncate">{{ item.title }}</span>
              <button
                type="button"
                :disabled="index === 0"
                :aria-label="$t('Выше')"
                class="grid size-7 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-25"
                @click="move(section.key, section.items, index, index - 1)"
              >
                <ChevronUp class="size-4" />
              </button>
              <button
                type="button"
                :disabled="index === section.items.length - 1"
                :aria-label="$t('Ниже')"
                class="grid size-7 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:pointer-events-none disabled:opacity-25"
                @click="move(section.key, section.items, index, index + 1)"
              >
                <ChevronDown class="size-4" />
              </button>
            </div>
          </TransitionGroup>
          <RouterLink
            v-for="item in editing && !collapsed ? [] : section.items"
            :key="item.to"
            :to="item.to"
            :aria-label="collapsed ? item.title : undefined"
            @mouseenter="showTip($event, item.title)"
            @mouseleave="hide"
            @focus="showTipOnFocus($event, item.title)"
            @blur="hide"
            @click="hide"
            :aria-current="isActive(item.to) ? 'page' : undefined"
            :class="
              cn(
                'group relative flex h-10 items-center gap-3 rounded-xl px-3.5 text-[15px] font-semibold transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                collapsed && 'justify-center px-0',
                isActive(item.to)
                  ? 'bg-white/15 text-white ring-1 ring-white/10'
                  : 'text-white/90 hover:bg-white/10 hover:text-white',
              )
            "
          >
            <component
              :is="item.icon"
              :class="
                cn(
                  'size-[17px] shrink-0 transition-transform group-hover:scale-110',
                  isActive(item.to) ? 'text-white' : 'text-white/75 group-hover:text-white',
                )
              "
              :stroke-width="1.9"
            />
            <template v-if="!collapsed">
              <span class="flex-1 truncate">{{ item.title }}</span>
              <span
                v-if="item.badge"
                :class="
                  cn(
                    'grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-semibold',
                    isActive(item.to) ? 'bg-white/20 text-white' : 'bg-brand-pink text-white',
                  )
                "
              >
                {{ item.badge }}
              </span>
            </template>
            <span
              v-else-if="item.badge"
              class="absolute top-2 right-2.5 size-2 rounded-full bg-brand-pink ring-2 ring-[#0b1736]"
            />
          </RouterLink>
        </nav>
      </div>
    </div>

    <div class="relative mt-auto space-y-3 pt-6">
      <div v-if="!collapsed" class="flex gap-2">
        <button
          type="button"
          :aria-pressed="editing"
          :class="
            cn(
              'flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition-colors',
              editing
                ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30'
                : 'border-white/10 bg-white/5 text-white/90 hover:bg-white/10 hover:text-white',
            )
          "
          @click="editing = !editing"
        >
          <Check v-if="editing" class="size-4" :stroke-width="2" />
          <ArrowUpDown v-else class="size-4" :stroke-width="1.9" />
          {{ editing ? $t('Готово') : $t('Порядок меню') }}
        </button>
        <button
          v-if="editing && hasCustomOrder()"
          type="button"
          :title="$t('Сбросить порядок')"
          :aria-label="$t('Сбросить порядок')"
          class="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          @click="reset"
        >
          <RotateCcw class="size-4" :stroke-width="1.9" />
        </button>
      </div>
      <button
        type="button"
        :aria-label="collapsed ? $t('Выйти') : undefined"
        @mouseenter="showTip($event, $t('Выйти'))"
        @mouseleave="hide"
        @focus="showTipOnFocus($event, $t('Выйти'))"
        @blur="hide"
        :class="
          cn(
            'flex h-10 w-full items-center gap-3 rounded-xl px-3.5 text-[15px] font-semibold text-white/90 transition-colors hover:bg-rose-500/15 hover:text-rose-200',
            collapsed && 'justify-center px-0',
          )
        "
        @click="onLogout"
      >
        <LogOut class="size-[17px]" :stroke-width="1.9" />
        <span v-if="!collapsed">{{ $t('Выйти') }}</span>
      </button>
      <AppVersionCard v-if="!collapsed" />
    </div>
  </aside>
</template>
