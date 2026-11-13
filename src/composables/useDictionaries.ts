import { computed, ref } from 'vue'
import { listDictionaries, type Industry } from '@/api/dictionaries'

// Общее состояние: справочник отраслей нужен и форме компании, и фильтрам списка
const industries = ref<Industry[]>([])
const loaded = ref(false)
let pending: Promise<void> | undefined

async function load(force = false) {
  if (loaded.value && !force) return
  // Параллельные вызовы ждут один и тот же запрос
  pending ??= listDictionaries()
    .then((items) => {
      industries.value = items
      loaded.value = true
    })
    .finally(() => (pending = undefined))
  await pending
}

export function useDictionaries() {
  const spheresOf = (industryId: number | '') =>
    industries.value.find((industry) => industry.id === industryId)?.spheres ?? []

  return { industries: computed(() => industries.value), loaded, load, spheresOf }
}
