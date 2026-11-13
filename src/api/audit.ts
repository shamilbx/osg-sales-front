import { request } from '@/api/http'

/** Значение поля до и после; при создании записи from нет */
export interface AuditChange {
  from?: unknown
  to?: unknown
}

export interface AuditEntry {
  id: number
  /** Кто сделал; 0 — система */
  user_id: number
  user_name: string
  entity: string
  entity_id: number
  action: string
  changes: Record<string, AuditChange>
  created_at: string
}

export interface AuditQuery {
  entity?: string
  entity_id?: number
  user_id?: number
  action?: string
  from?: string
  to?: string
  limit: number
  offset: number
}

export async function listAudit(query: AuditQuery) {
  return request<{ entries: AuditEntry[]; total: number }>('/api/audit', { query: { ...query } })
}
