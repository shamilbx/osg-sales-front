import { request } from '@/api/http'

export interface Sphere {
  id: number
  industry_id: number
  name: string
  is_active: boolean
}

export interface Industry {
  id: number
  name: string
  is_active: boolean
  spheres: Sphere[]
}

/** Только включённые отрасли и сферы: для форм и фильтров */
export async function listDictionaries() {
  return (await request<{ industries: Industry[] }>('/api/dictionaries')).industries
}

/** Все отрасли и сферы, включая отключённые: для суперадмина */
export async function listIndustries() {
  return (await request<{ industries: Industry[] }>('/api/superadmin/industries')).industries
}

export async function createIndustry(name: string) {
  return (
    await request<{ industry: Industry }>('/api/superadmin/industries', {
      method: 'POST',
      body: { name },
    })
  ).industry
}

export async function updateIndustry(id: number, patch: { name?: string; is_active?: boolean }) {
  await request(`/api/superadmin/industries/${id}`, { method: 'PATCH', body: patch })
}

export async function createSphere(industryId: number, name: string) {
  return (
    await request<{ sphere: Sphere }>(`/api/superadmin/industries/${industryId}/spheres`, {
      method: 'POST',
      body: { name },
    })
  ).sphere
}

export async function updateSphere(id: number, patch: { name?: string; is_active?: boolean }) {
  await request(`/api/superadmin/spheres/${id}`, { method: 'PATCH', body: patch })
}
