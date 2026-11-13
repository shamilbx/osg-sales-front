import { request } from '@/api/http'
import type { Role } from '@/composables/useAuth'

/** Сотрудник, которого можно назначить ответственным: только краткие данные */
export interface Owner {
  id: number
  username: string
  full_name: string
  role: Role
}

export const ownerName = (owner: Pick<Owner, 'full_name' | 'username'>) =>
  owner.full_name || owner.username

export async function listOwners() {
  return (await request<{ staff: Owner[] }>('/api/staff')).staff
}
