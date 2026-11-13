import { ref } from 'vue'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from '@/api/notifications'
import { ApiError } from '@/api/http'
import { t } from '@/i18n'

// Новые напоминания создаёт сервер раз в час; раз в минуту — достаточно, чтобы значок не отставал
const POLL_MS = 60_000

// Общее состояние на всё приложение: колокольчик в шапке один
const items = ref<AppNotification[]>([])
const unread = ref(0)
const loading = ref(false)
const error = ref('')

let timer: ReturnType<typeof setInterval> | undefined
let users = 0

async function load() {
  loading.value = true
  try {
    const page = await listNotifications()
    items.value = page.items
    unread.value = page.unread
    error.value = ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

async function markRead(item: AppNotification) {
  if (item.read) return
  // Отмечаем сразу, чтобы значок не мигал; при ошибке возвращаем как было
  item.read = true
  unread.value = Math.max(0, unread.value - 1)
  try {
    await markNotificationRead(item.id)
  } catch {
    item.read = false
    unread.value += 1
  }
}

async function markAllRead() {
  if (unread.value === 0) return
  const before = items.value.map((item) => item.read)
  const count = unread.value
  items.value.forEach((item) => (item.read = true))
  unread.value = 0
  try {
    await markAllNotificationsRead()
  } catch {
    items.value.forEach((item, i) => (item.read = before[i] ?? false))
    unread.value = count
  }
}

/** Подключает опрос на время жизни компонента: start при монтировании, stop при размонтировании */
export function useNotifications() {
  function start() {
    users += 1
    if (users === 1) {
      void load()
      timer = setInterval(load, POLL_MS)
    }
  }

  function stop() {
    users = Math.max(0, users - 1)
    if (users === 0 && timer) {
      clearInterval(timer)
      timer = undefined
    }
  }

  return { items, unread, loading, error, load, markRead, markAllRead, start, stop }
}
