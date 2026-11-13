<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { Bell, BellOff, CheckCheck } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { t } from '@/i18n'
import { formatIsoDate } from '@/lib/dates'
import { useNotifications } from '@/composables/useNotifications'
import type { AppNotification } from '@/api/notifications'

defineProps<{ buttonClass?: string }>()

const router = useRouter()
const { items, unread, loading, error, load, markRead, markAllRead, start, stop } =
  useNotifications()

const open = ref(false)
const root = useTemplateRef<HTMLDivElement>('root')

onMounted(start)
onBeforeUnmount(stop)
onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => (open.value = false))

// При открытии подтягиваем свежий список, не дожидаясь очередного опроса
watch(open, (value) => {
  if (value) void load()
})

const badge = computed(() => (unread.value > 9 ? '9+' : String(unread.value)))
const label = computed(() =>
  unread.value > 0 ? t('Уведомления: {n} новых', { n: unread.value }) : t('Уведомления'),
)

// Значок и цвет по виду уведомления; незнакомый вид получает нейтральный колокольчик.
// Новые виды сервера добавляются сюда: { icon: Clock, tile: 'bg-amber-100 text-amber-700' }
const defaultStyle = { icon: Bell, tile: 'bg-zinc-100 text-zinc-600' }
const kindStyle: Record<string, { icon: typeof Bell; tile: string }> = {}
const styleOf = (kind: string) => kindStyle[kind] ?? defaultStyle

/** «5 мин назад», «3 ч назад», а старше суток — датой */
function ago(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 1) return t('только что')
  if (minutes < 60) return t('{n} мин назад', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('{n} ч назад', { n: hours })
  return formatIsoDate(iso.slice(0, 10))
}

async function openItem(item: AppNotification) {
  void markRead(item)
  open.value = false
  if (item.link) await router.push(item.link)
}
</script>

<template>
  <div ref="root" class="relative">
    <Button
      variant="ghost"
      size="icon"
      :class="cn(buttonClass, 'relative')"
      :aria-label="label"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="open = !open"
    >
      <Bell class="size-5" />
      <span
        v-if="unread > 0"
        class="absolute top-2 right-2 grid min-w-4 place-items-center rounded-full bg-brand-pink px-1 text-[10px] leading-4 font-bold text-white ring-2 ring-white"
      >
        {{ badge }}
      </span>
    </Button>

    <div
      v-if="open"
      role="dialog"
      :aria-label="$t('Уведомления')"
      class="absolute top-[calc(100%+8px)] right-0 z-40 flex max-h-[min(560px,calc(100vh-140px))] w-[min(400px,calc(100vw-32px))] flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_20px_40px_-16px_rgba(16,24,40,.3)]"
    >
      <div class="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <h2 class="text-base font-semibold text-zinc-950">{{ $t('Уведомления') }}</h2>
        <button
          type="button"
          :disabled="unread === 0"
          class="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40"
          @click="markAllRead"
        >
          <CheckCheck class="size-4" />
          {{ $t('Прочитать все') }}
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto border-t border-zinc-100">
        <p v-if="error && items.length === 0" class="px-5 py-8 text-center text-sm text-rose-600">
          {{ error }}
        </p>

        <p
          v-else-if="loading && items.length === 0"
          class="px-5 py-8 text-center text-sm text-zinc-500"
        >
          {{ $t('Загрузка…') }}
        </p>

        <div v-else-if="items.length === 0" class="grid justify-items-center gap-2 px-5 py-10">
          <BellOff class="size-8 text-zinc-300" :stroke-width="1.6" />
          <p class="text-sm text-zinc-500">{{ $t('Новых уведомлений нет') }}</p>
        </div>

        <ul v-else class="divide-y divide-zinc-100">
          <li v-for="item in items" :key="item.id">
            <button
              type="button"
              :class="
                cn(
                  'flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-zinc-50',
                  !item.read && 'bg-brand-pink/5',
                )
              "
              @click="openItem(item)"
            >
              <span
                :class="
                  cn(
                    'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
                    styleOf(item.kind).tile,
                  )
                "
              >
                <component :is="styleOf(item.kind).icon" class="size-[18px]" />
              </span>
              <span class="min-w-0 flex-1">
                <span
                  :class="
                    cn(
                      'block text-[13px] leading-snug text-zinc-700',
                      !item.read && 'font-medium text-zinc-950',
                    )
                  "
                >
                  {{ item.message }}
                </span>
                <span class="mt-1 block text-xs text-zinc-400">{{ ago(item.createdAt) }}</span>
              </span>
              <span
                v-if="!item.read"
                class="mt-2 size-2 shrink-0 rounded-full bg-brand-pink"
                :aria-label="$t('Не прочитано')"
              />
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
