<script setup lang="ts">
import { t } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { Building2, Globe, Plus, Search, Users } from '@lucide/vue'
import { ApiError } from '@/api/http'
import {
  listCompanies,
  type Company,
  type CompanySort,
  type CompanyStatusFilter,
} from '@/api/companies'
import { listOwners, ownerName, type Owner } from '@/api/staff'
import { useAuth } from '@/composables/useAuth'
import { useDictionaries } from '@/composables/useDictionaries'
import { usePageSize } from '@/composables/usePageSize'
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import FilterDropdown, { type FilterOption } from '@/components/common/FilterDropdown.vue'
import TablePagination from '@/components/common/TablePagination.vue'

const router = useRouter()
const { user: me } = useAuth()
const dictionaries = useDictionaries()

const companies = ref<Company[]>([])
const total = ref(0)
const counts = ref({ active: 0, archived: 0 })
const loading = ref(false)
const error = ref('')

const query = ref('')
const industry = ref('all')
const sphere = ref('all')
const owner = ref('all')
const status = ref<CompanyStatusFilter>('active')
const sort = ref<CompanySort>('created')
const page = ref(1)
const pageSize = usePageSize()

const sortDir: Record<CompanySort, 'asc' | 'desc'> = {
  created: 'desc',
  name: 'asc',
  contacts: 'desc',
}
const numberOrUndefined = (value: string) => (value === 'all' ? undefined : Number(value))

async function load() {
  loading.value = true
  try {
    const result = await listCompanies({
      status: status.value,
      q: query.value.trim() || undefined,
      industry_id: numberOrUndefined(industry.value),
      sphere_id: numberOrUndefined(sphere.value),
      owner_id: numberOrUndefined(owner.value),
      sort: sort.value,
      dir: sortDir[sort.value],
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
    })
    companies.value = result.companies
    total.value = result.total
    counts.value = result.counts
    error.value = ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

// Смена отрасли сбрасывает сферу; любой фильтр возвращает на первую страницу
watch(industry, () => (sphere.value = 'all'))
watch([industry, sphere, owner, status, sort, pageSize], () => {
  if (page.value !== 1) page.value = 1
  else void load()
})
watch(page, () => void load())
watchDebounced(
  query,
  () => {
    if (page.value !== 1) page.value = 1
    else void load()
  },
  { debounce: 300 },
)
void load()
void dictionaries.load()

const owners = ref<Owner[]>([])
listOwners()
  .then((items) => (owners.value = items))
  .catch(() => {})

const industryFilter = computed<FilterOption<string>[]>(() => [
  { value: 'all', label: t('Все отрасли') },
  ...dictionaries.industries.value.map((i) => ({ value: String(i.id), label: i.name })),
])
const sphereFilter = computed<FilterOption<string>[]>(() => [
  { value: 'all', label: t('Все сферы') },
  ...dictionaries
    .spheresOf(industry.value === 'all' ? '' : Number(industry.value))
    .map((s) => ({ value: String(s.id), label: s.name })),
])
const ownerFilter = computed<FilterOption<string>[]>(() => [
  { value: 'all', label: t('Все') },
  ...owners.value.map((o) => ({ value: String(o.id), label: ownerName(o) })),
])
const statusFilter = computed<FilterOption<CompanyStatusFilter>[]>(() => [
  { value: 'active', label: t('Активные'), count: counts.value.active, dot: 'bg-emerald-500' },
  { value: 'archived', label: t('В архиве'), count: counts.value.archived, dot: 'bg-zinc-400' },
  { value: 'all', label: t('Все'), count: counts.value.active + counts.value.archived },
])
const sortFilter = computed<FilterOption<CompanySort>[]>(() => [
  { value: 'created', label: t('Сначала новые') },
  { value: 'name', label: t('По названию') },
  { value: 'contacts', label: t('По числу контактов') },
])

const canCreate = computed(() => me.value?.role === 'superadmin' || me.value?.role === 'manager')

const openCompany = (company: Company) => router.push(`/clients/${company.id}`)

const openCreate = () => router.push('/clients/new')
</script>

<template>
  <!-- Шапка страницы, фильтры и пагинация закреплены, при прокрутке движется только список -->
  <div class="flex h-full min-h-0 flex-col gap-4">
    <header class="flex shrink-0 flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Клиенты') }}</h1>
        <p class="mt-1 text-sm text-zinc-700">
          {{ $t('Клиенты, их контакты и ответственные менеджеры') }}
        </p>
      </div>
      <button
        v-if="canCreate"
        type="button"
        class="inline-flex h-11 items-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
        @click="openCreate"
      >
        <Plus class="size-4" />
        {{ $t('Добавить клиента') }}
      </button>
    </header>

    <p v-if="error" role="alert" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </p>

    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <label class="relative min-w-[220px] flex-1 sm:max-w-[340px]">
        <span class="sr-only">{{ $t('Поиск клиентов') }}</span>
        <Search
          class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          v-model="query"
          type="search"
          :placeholder="$t('Название, ИНН, сайт или контакт')"
          class="h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3.5 pl-10 text-[13px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-3 focus-visible:ring-zinc-900/5"
        />
      </label>
      <FilterDropdown
        v-model="status"
        :label="$t('Статус')"
        :options="statusFilter"
        all-value="active"
      />
      <FilterDropdown
        v-model="industry"
        :label="$t('Отрасль')"
        :options="industryFilter"
        all-value="all"
      />
      <FilterDropdown
        v-if="industry !== 'all'"
        v-model="sphere"
        :label="$t('Сфера')"
        :options="sphereFilter"
        all-value="all"
      />
      <FilterDropdown
        v-model="owner"
        :label="$t('Ответственный')"
        :options="ownerFilter"
        all-value="all"
      />
      <FilterDropdown
        v-model="sort"
        :label="$t('Сортировка')"
        :options="sortFilter"
        all-value="created"
      />
    </div>

    <section
      class="flex min-h-[260px] min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-zinc-100 bg-white"
    >
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full min-w-[860px] text-left">
          <thead
            class="sticky top-0 z-10 border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500"
          >
            <tr>
              <th class="px-5 py-3 font-medium">{{ $t('Клиент') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Отрасль и сфера') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Основной контакт') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Ответственный') }}</th>
              <th class="px-5 py-3 text-right font-medium">{{ $t('Контактов') }}</th>
            </tr>
          </thead>
          <tbody :class="cn('divide-y divide-zinc-100', loading && 'opacity-60')">
            <tr
              v-for="company in companies"
              :key="company.id"
              tabindex="0"
              :class="
                cn(
                  'cursor-pointer transition-colors outline-none hover:bg-zinc-50 focus-visible:bg-zinc-50',
                  company.status === 'archived' && 'opacity-60',
                )
              "
              @click="openCompany(company)"
              @keydown.enter="openCompany(company)"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <span
                    class="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600"
                  >
                    <Building2 class="size-5" :stroke-width="1.8" />
                  </span>
                  <div class="min-w-0">
                    <p class="flex items-center gap-2 truncate text-sm font-semibold text-zinc-950">
                      {{ company.name }}
                      <span
                        v-if="company.status === 'archived'"
                        class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600"
                        >{{ $t('В архиве') }}</span
                      >
                    </p>
                    <p class="flex items-center gap-1.5 truncate text-xs text-zinc-500">
                      <template v-if="company.tax_id"
                        >{{ $t('ИНН') }} {{ company.tax_id }}</template
                      >
                      <template v-if="company.tax_id && company.website"> · </template>
                      <template v-if="company.website">
                        <Globe class="size-3" />{{ company.website.replace(/^https?:\/\//, '') }}
                      </template>
                      <template v-if="!company.tax_id && !company.website">—</template>
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <p class="text-sm text-zinc-900">{{ company.industry_name }}</p>
                <p class="text-xs text-zinc-500">{{ company.sphere_name }}</p>
              </td>
              <td class="px-5 py-3.5">
                <template v-if="company.primary_contact_name">
                  <p class="text-sm text-zinc-900">{{ company.primary_contact_name }}</p>
                  <p class="text-xs text-zinc-500">
                    {{
                      company.primary_contact_phone
                        ? formatPhone(company.primary_contact_phone)
                        : '—'
                    }}
                  </p>
                </template>
                <span v-else class="text-sm text-zinc-400">—</span>
              </td>
              <td class="px-5 py-3.5 text-sm text-zinc-800">{{ company.owner_name }}</td>
              <td class="px-5 py-3.5 text-right">
                <span
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 tabular-nums"
                >
                  <Users class="size-4 text-zinc-400" />
                  {{ company.contacts_count }}
                </span>
              </td>
            </tr>
            <tr v-if="!loading && companies.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-sm text-zinc-500">
                {{ $t('Клиенты не найдены') }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <TablePagination
        v-model="page"
        v-model:page-size="pageSize"
        :total="total"
        class="shrink-0"
      />
    </section>
  </div>
</template>
