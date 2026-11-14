import { computed, ref } from 'vue'
import { listDictionaries, type Industry, type LeadSource } from '@/api/dictionaries'

// Общее состояние: справочник отраслей нужен и форме компании, и фильтрам списка
const industries = ref<Industry[]>([])
const leadSources = ref<LeadSource[]>([])
const loaded = ref(false)
let pending: Promise<void> | undefined

async function load(force = false) {
  if (loaded.value && !force) return
  // Параллельные вызовы ждут один и тот же запрос
  pending ??= listDictionaries()
    .then((result) => {
      industries.value = result.industries
      leadSources.value = result.lead_sources
      loaded.value = true
    })
    .finally(() => (pending = undefined))
  await pending
}

export function useDictionaries() {
  const spheresOf = (industryId: number | '') =>
    industries.value.find((industry) => industry.id === industryId)?.spheres ?? []

  return {
    industries: computed(() => industries.value),
    leadSources: computed(() => leadSources.value),
    loaded,
    load,
    spheresOf,
  }
}
