import { request } from '@/api/http'
import type { AuthUser, Role } from '@/composables/useAuth'

/** Сотрудник в списке и карточке: те же поля, что и у профиля */
export type StaffUser = AuthUser

export type UserStatusFilter = 'active' | 'blocked'
export type UserSort = 'name' | 'created' | 'last_login'

export interface UserListQuery {
  role?: Role
  status?: UserStatusFilter
  q?: string
  sort?: UserSort
  dir?: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface UserPage {
  users: StaffUser[]
  total: number
  /** Сотрудники по ролям без учёта фильтров: числа для выпадающего фильтра */
  counts: Record<Role, number>
}

export interface UserForm {
  username: string
  email: string
  full_name: string
  phone: string
}

export async function listUsers(query: UserListQuery) {
  return request<UserPage>('/api/superadmin/users', { query: { ...query } })
}

export async function createUser(form: UserForm & { password: string; role: Role }) {
  return (
    await request<{ user: StaffUser }>('/api/superadmin/users', { method: 'POST', body: form })
  ).user
}

/** Частичная правка: пустой пароль не отправляется и не меняется */
export async function updateUser(id: number, form: UserForm & { password?: string }) {
  const body: Record<string, string> = { ...form }
  if (!form.password) delete body.password
  return (
    await request<{ user: StaffUser }>(`/api/superadmin/users/${id}`, { method: 'PATCH', body })
  ).user
}

export async function updateUserRole(id: number, role: Role) {
  await request(`/api/superadmin/users/${id}/role`, { method: 'PATCH', body: { role } })
}

export async function updateUserStatus(id: number, status: boolean) {
  await request(`/api/superadmin/users/${id}/status`, { method: 'PATCH', body: { status } })
}
