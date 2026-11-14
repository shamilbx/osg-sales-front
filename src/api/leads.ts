import { request } from '@/api/http'
import type { Company, Contact, Duplicate } from '@/api/companies'

export const leadStatuses = ['new', 'contacted', 'qualified', 'disqualified', 'converted'] as const
export type LeadStatus = (typeof leadStatuses)[number]
/** open — все, кроме конвертированных: конвертированный становится клиентом и из списка уходит */
export type LeadStatusFilter = LeadStatus | 'all' | 'open'
export type LeadSort = 'created' | 'name' | 'amount'

export interface Lead {
  id: number
  full_name: string
  position: string
  phone: string
  email: string
  telegram: string
  company_name: string
  industry_id: number | null
  sphere_id: number | null
  source_id: number
  service_interest: string
  /** Ожидаемая сумма в сумах */
  expected_amount: number
  notes: string
  owner_id: number
  status: LeadStatus
  disqualify_reason: string
  converted_company_id: number | null
  converted_contact_id: number | null
  converted_deal_id: number | null
  source_name: string
  owner_name: string
  industry_name: string
  sphere_name: string
  created_at: string
  updated_at: string
}

/** Совпадение, о котором сервер предупреждает при сохранении лида; сохранению не мешает */
export interface LeadDuplicate {
  message: string
  kind: 'lead' | 'contact'
  id: number
  name: string
  owner: string
  company_id: number
  company_name: string
}

export interface LeadForm {
  full_name: string
  position: string
  phone: string
  email: string
  telegram: string
  company_name: string
  /** 0 — не выбрано */
  industry_id: number
  sphere_id: number
  source_id: number
  service_interest: string
  expected_amount: number
  notes: string
}

export interface LeadListQuery {
  status?: LeadStatusFilter
  source_id?: number
  owner_id?: number
  q?: string
  sort?: LeadSort
  dir?: 'asc' | 'desc'
  limit: number
  offset: number
}

export interface LeadPage {
  leads: Lead[]
  total: number
  counts: Record<LeadStatus, number>
}

export interface ConvertForm {
  company_id?: number
  industry_id?: number
  sphere_id?: number
  deal_title?: string
  amount?: number
}

export interface ConvertResult {
  lead: Lead
  company: Company
  contact: Contact
  deal: { id: number; title: string; amount: number; stage_id: number; company_id: number }
}

export type { Duplicate }

export async function listLeads(query: LeadListQuery) {
  return request<LeadPage>('/api/leads', { query: { ...query } })
}

export async function getLead(id: number) {
  return (await request<{ lead: Lead }>(`/api/leads/${id}`)).lead
}

export async function createLead(form: LeadForm) {
  return request<{ lead: Lead; duplicates: LeadDuplicate[] }>('/api/sales/leads', {
    method: 'POST',
    body: form,
  })
}

export async function updateLead(id: number, form: Partial<LeadForm>) {
  return request<{ lead: Lead; duplicates: LeadDuplicate[] }>(`/api/sales/leads/${id}`, {
    method: 'PATCH',
    body: form,
  })
}

export async function setLeadStatus(id: number, status: LeadStatus, reason = '') {
  return (
    await request<{ lead: Lead }>(`/api/sales/leads/${id}/status`, {
      method: 'POST',
      body: { status, reason },
    })
  ).lead
}

export async function updateLeadOwner(id: number, ownerId: number) {
  return (
    await request<{ lead: Lead }>(`/api/sales/leads/${id}/owner`, {
      method: 'PATCH',
      body: { owner_id: ownerId },
    })
  ).lead
}

export async function convertLead(id: number, form: ConvertForm) {
  return request<ConvertResult>(`/api/sales/leads/${id}/convert`, { method: 'POST', body: form })
}
