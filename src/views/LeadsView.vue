<script setup lang="ts">
import { t } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { watchDebounced } from '@vueuse/core'
import { Plus, Search, UserRound } from '@lucide/vue'
import { ApiError } from '@/api/http'
import {
  leadStatuses,
  listLeads,
  type Lead,
  type LeadSort,
  type LeadStatus,
  type LeadStatusFilter,
} from '@/api/leads'
import { listOwners, ownerName, type Owner } from '@/api/staff'
import { useAuth } from '@/composables/useAuth'
import { useDictionaries } from '@/composables/useDictionaries'
import { usePageSize } from '@/composables/usePageSize'
import { formatMoney } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import FilterDropdown, { type FilterOption } from '@/components/common/FilterDropdown.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import LeadDrawer from '@/components/leads/LeadDrawer.vue'
import { leadStatusMeta } from '@/components/leads/status'

const route = useRoute()
const router = useRouter()
const { user: me } = useAuth()
const dictionaries = useDictionaries()

const emptyCounts = (): Record<LeadStatus, number> => ({
  new: 0,
  contacted: 0,
  qualified: 0,
  disqualified: 0,
  converted: 0,
})

const leads = ref<Lead[]>([])
const total = ref(0)
const counts = ref(emptyCounts())
const loading = ref(false)
const error = ref('')

const query = ref('')
const status = ref<LeadStatusFilter>('all')
const source = ref('all')
const owner = ref('all')
const sort = ref<LeadSort>('created')
const page = ref(1)
const pageSize = usePageSize()

const sortDir: Record<LeadSort, 'asc' | 'desc'> = { created: 'desc', name: 'asc', amount: 'desc' }
const numberOrUndefined = (value: string) => (value === 'all' ? undefined : Number(value))

async function load() {
  loading.value = true
  try {
    const result = await listLeads({
      status: status.value,
      q: query.value.trim() || undefined,
      source_id: numberOrUndefined(source.value),
      owner_id: numberOrUndefined(owner.value),
      sort: sort.value,
      dir: sortDir[sort.value],
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
    })
    leads.value = result.leads
    total.value = result.total
    counts.value = { ...emptyCounts(), ...result.counts }
    error.value = ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

watch([status, source, owner, sort, pageSize], () => {
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

const statusFilter = computed<FilterOption<LeadStatusFilter>[]>(() => [
  {
    value: 'all',
    label: t('Все'),
    count: Object.values(counts.value).reduce((sum, n) => sum + n, 0),
  },
  ...leadStatuses.map((s) => ({
    value: s,
    label: leadStatusMeta[s].label(),
    count: counts.value[s],
    dot: leadStatusMeta[s].dot,
  })),
])
const sourceFilter = computed<FilterOption<string>[]>(() => [
  { value: 'all', label: t('Все источники') },
  ...dictionaries.leadSources.value.map((s) => ({ value: String(s.id), label: s.name })),
])
const ownerFilter = computed<FilterOption<string>[]>(() => [
  { value: 'all', label: t('Все') },
  ...owners.value.map((o) => ({ value: String(o.id), label: ownerName(o) })),
])
const sortFilter = computed<FilterOption<LeadSort>[]>(() => [
  { value: 'created', label: t('Сначала новые') },
  { value: 'name', label: t('По имени') },
  { value: 'amount', label: t('По сумме') },
])

// Карточка лида. Ссылка /leads/:id открывает её сразу, по ней ведут уведомления; /leads/new — форма нового лида
const routeId = computed(() => {
  if (route.params.id === 'new') return 'new' as const
  return Number(route.params.id) || null
})
const drawerOpen = ref(false)
const selectedId = ref<number | null>(null)

watch(
  routeId,
  (id) => {
    if (!id) return
    selectedId.value = id === 'new' ? null : id
    drawerOpen.value = true
  },
  { immediate: true },
)
watch(drawerOpen, (isOpen) => {
  if (!isOpen && routeId.value) void router.replace('/leads')
})

const canCreate = computed(() => me.value?.role === 'superadmin' || me.value?.role === 'manager')

const openLead = (lead: Lead) => router.push(`/leads/${lead.id}`)
const openCreate = () => router.push('/leads/new')

// Новый лид сохранён: карточка переключается на него
function onCreated(id: number) {
  void router.replace(`/leads/${id}`)
  void load()
}
</script>

<template>
  <!-- Шапка страницы, фильтры и пагинация закреплены, при прокрутке движется только список -->
  <div class="flex h-full min-h-0 flex-col gap-4">
    <header class="flex shrink-0 flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Лиды') }}</h1>
        <p class="mt-1 text-sm text-zinc-700">
          {{ $t('Потенциальные клиенты до конвертации в клиента и сделку') }}
        </p>
      </div>
      <button
        v-if="canCreate"
        type="button"
        class="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        @click="openCreate"
      >
        <Plus class="size-4" />
        {{ $t('Добавить лида') }}
      </button>
    </header>

    <p v-if="error" role="alert" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </p>

    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <label class="relative min-w-[220px] flex-1 sm:max-w-[340px]">
        <span class="sr-only">{{ $t('Поиск лидов') }}</span>
        <Search
          class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          v-model="query"
          type="search"
          :placeholder="$t('Имя, компания, телефон или email')"
          class="h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3.5 pl-10 text-[13px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
        />
      </label>
      <FilterDropdown
        v-model="status"
        :label="$t('Статус')"
        :options="statusFilter"
        all-value="all"
      />
      <FilterDropdown
        v-model="source"
        :label="$t('Источник')"
        :options="sourceFilter"
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
      class="flex min-h-[260px] min-w-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-zinc-100 bg-white"
    >
      <div class="min-h-0 flex-1 overflow-auto">
        <table class="w-full min-w-[900px] text-left">
          <thead
            class="sticky top-0 z-10 border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500"
          >
            <tr>
              <th class="px-5 py-3 font-medium">{{ $t('Лид') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Компания') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Статус') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Источник') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Ответственный') }}</th>
              <th class="px-5 py-3 text-right font-medium">{{ $t('Ожидаемая сумма') }}</th>
            </tr>
          </thead>
          <tbody :class="cn('divide-y divide-zinc-100', loading && 'opacity-60')">
            <tr
              v-for="lead in leads"
              :key="lead.id"
              tabindex="0"
              :class="
                cn(
                  'cursor-pointer transition-colors outline-none hover:bg-zinc-50 focus-visible:bg-zinc-50',
                  lead.status === 'disqualified' && 'opacity-60',
                )
              "
              @click="openLead(lead)"
              @keydown.enter="openLead(lead)"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <span
                    class="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-600"
                  >
                    <UserRound class="size-5" :stroke-width="1.8" />
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-zinc-950">{{ lead.full_name }}</p>
                    <p class="truncate text-xs text-zinc-500">
                      {{
                        lead.phone ? formatPhone(lead.phone) : lead.email || lead.telegram || '—'
                      }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <p class="text-sm text-zinc-900">{{ lead.company_name }}</p>
                <p class="text-xs text-zinc-500">{{ lead.service_interest || '—' }}</p>
              </td>
              <td class="px-5 py-3.5">
                <span
                  :class="
                    cn(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                      leadStatusMeta[lead.status].badge,
                    )
                  "
                  >{{ leadStatusMeta[lead.status].label() }}</span
                >
              </td>
              <td class="px-5 py-3.5 text-sm text-zinc-800">{{ lead.source_name }}</td>
              <td class="px-5 py-3.5 text-sm text-zinc-800">{{ lead.owner_name }}</td>
              <td class="px-5 py-3.5 text-right text-sm font-semibold text-zinc-950 tabular-nums">
                {{ lead.expected_amount ? formatMoney(lead.expected_amount) : '—' }}
              </td>
            </tr>
            <tr v-if="!loading && leads.length === 0">
              <td colspan="6" class="px-5 py-12 text-center text-sm text-zinc-500">
                {{ $t('Лиды не найдены') }}
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

    <LeadDrawer
      v-model:open="drawerOpen"
      :lead-id="selectedId"
      @changed="load"
      @created="onCreated"
    />
  </div>
</template>
