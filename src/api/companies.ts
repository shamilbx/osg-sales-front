import { request } from '@/api/http'

export type CompanyStatus = 'active' | 'archived'
export type CompanyStatusFilter = CompanyStatus | 'all'
export type CompanySort = 'name' | 'created' | 'contacts'

/** Соцсети компании: фиксированный набор */
export const socialNetworks = ['instagram', 'telegram', 'facebook', 'linkedin', 'youtube'] as const
export type SocialNetwork = (typeof socialNetworks)[number]

export interface Company {
  id: number
  name: string
  tax_id: string
  industry_id: number
  sphere_id: number
  website: string
  address: string
  social_links: Partial<Record<SocialNetwork, string>>
  notes: string
  owner_id: number
  status: CompanyStatus
  industry_name: string
  sphere_name: string
  owner_name: string
  contacts_count: number
  primary_contact_name: string
  primary_contact_phone: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: number
  company_id: number
  full_name: string
  position: string
  phone: string
  email: string
  telegram: string
  notes: string
  is_primary: boolean
  company_name: string
}

/** Запись, на которую наткнулись при создании дубликата */
export interface Duplicate {
  kind: 'company' | 'contact'
  id: number
  name: string
  owner: string
  company_id: number
  company_name: string
}

export interface CompanyListQuery {
  status?: CompanyStatusFilter
  industry_id?: number
  sphere_id?: number
  owner_id?: number
  q?: string
  sort?: CompanySort
  dir?: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface CompanyPage {
  companies: Company[]
  total: number
  counts: Record<CompanyStatus, number>
}

export interface CompanyForm {
  name: string
  tax_id: string
  industry_id: number
  sphere_id: number
  website: string
  address: string
  social_links: Partial<Record<SocialNetwork, string>>
  notes: string
}

export interface ContactForm {
  full_name: string
  position: string
  phone: string
  email: string
  telegram: string
  notes: string
}

export async function listCompanies(query: CompanyListQuery) {
  return request<CompanyPage>('/api/companies', { query: { ...query } })
}

export async function getCompany(id: number) {
  return request<{ company: Company; contacts: Contact[] }>(`/api/companies/${id}`)
}

export async function createCompany(form: CompanyForm) {
  return (
    await request<{ company: Company }>('/api/sales/companies', { method: 'POST', body: form })
  ).company
}

export async function updateCompany(id: number, form: CompanyForm) {
  return (
    await request<{ company: Company }>(`/api/sales/companies/${id}`, {
      method: 'PATCH',
      body: form,
    })
  ).company
}

export async function updateCompanyOwner(id: number, ownerId: number) {
  return (
    await request<{ company: Company }>(`/api/sales/companies/${id}/owner`, {
      method: 'PATCH',
      body: { owner_id: ownerId },
    })
  ).company
}

export async function setCompanyArchived(id: number, archived: boolean) {
  return (
    await request<{ company: Company }>(
      `/api/sales/companies/${id}/${archived ? 'archive' : 'restore'}`,
      { method: 'PATCH' },
    )
  ).company
}

export async function createContact(
  companyId: number,
  form: ContactForm & { is_primary: boolean },
) {
  return (
    await request<{ contact: Contact }>(`/api/sales/companies/${companyId}/contacts`, {
      method: 'POST',
      body: form,
    })
  ).contact
}

export async function updateContact(id: number, form: ContactForm) {
  return (
    await request<{ contact: Contact }>(`/api/sales/contacts/${id}`, {
      method: 'PATCH',
      body: form,
    })
  ).contact
}

export async function setContactPrimary(id: number) {
  await request(`/api/sales/contacts/${id}/primary`, { method: 'PATCH' })
}

export async function deleteContact(id: number) {
  await request(`/api/sales/contacts/${id}`, { method: 'DELETE' })
}
