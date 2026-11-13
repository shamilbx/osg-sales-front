import { request } from '@/api/http'

/** Вид уведомления задаёт сервер; по нему выбирается значок (см. kindStyle в NotificationsMenu) */
export type NotificationKind = string

interface ApiNotification {
  id: number
  kind: NotificationKind
  params: Record<string, string>
  read_at: string | null
  created_at: string
  // Текст приходит готовым на языке запроса (Accept-Language)
  message: string
}

export interface AppNotification {
  id: number
  kind: NotificationKind
  message: string
  read: boolean
  createdAt: string
  /** Куда ведёт уведомление по клику, например /deals/12; нет, если сервер ссылку не прислал */
  link?: string
}

function toNotification(row: ApiNotification): AppNotification {
  return {
    id: row.id,
    kind: row.kind,
    message: row.message,
    read: row.read_at !== null,
    createdAt: row.created_at,
    link: row.params.link || undefined,
  }
}

/** Последние уведомления сотрудника и число непрочитанных для значка на колокольчике */
export async function listNotifications(limit = 20) {
  const data = await request<{ notifications: ApiNotification[]; unread: number }>(
    '/api/notifications',
    { query: { limit } },
  )
  return { items: data.notifications.map(toNotification), unread: data.unread }
}

export async function markNotificationRead(id: number) {
  await request(`/api/notifications/${id}/read`, { method: 'PATCH' })
}

export async function markAllNotificationsRead() {
  await request('/api/notifications/read-all', { method: 'POST' })
}
