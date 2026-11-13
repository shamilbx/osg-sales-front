import { request } from '@/api/http'
import type { AuthUser } from '@/composables/useAuth'

export interface ProfileForm {
  email: string
  full_name: string
  phone: string
}

export async function updateProfile(form: ProfileForm) {
  return (await request<{ user: AuthUser }>('/api/profile', { method: 'PATCH', body: form })).user
}

export async function changePassword(oldPassword: string, newPassword: string) {
  await request('/api/profile/password', {
    method: 'POST',
    body: { old_password: oldPassword, new_password: newPassword },
  })
}
