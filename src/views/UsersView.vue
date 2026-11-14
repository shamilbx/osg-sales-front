<script setup lang="ts">
import { t } from '@/i18n'
import { computed, ref, watch } from 'vue'
import { watchDebounced } from '@vueuse/core'
import { Plus, Search, ShieldCheck, UserCheck, UserX, UsersRound } from '@lucide/vue'
import { ApiError } from '@/api/http'
import { listUsers, type StaffUser, type UserSort, type UserStatusFilter } from '@/api/users'
import { roleLabels, type Role } from '@/composables/useAuth'
import { usePageSize } from '@/composables/usePageSize'
import { formatDateTime } from '@/lib/dates'
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import FilterDropdown, { type FilterOption } from '@/components/common/FilterDropdown.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import UserDrawer from '@/components/users/UserDrawer.vue'
import { initials, roleBadge, roles } from '@/components/users/roles'

const users = ref<StaffUser[]>([])
const total = ref(0)
const counts = ref<Partial<Record<Role, number>>>({})
const loading = ref(false)
const error = ref('')

const query = ref('')
const role = ref<Role | 'all'>('all')
const status = ref<UserStatusFilter | 'all'>('all')
const sort = ref<'created' | 'name' | 'last_login'>('created')
const page = ref(1)
const pageSize = usePageSize()

const sortDir: Record<UserSort, 'asc' | 'desc'> = {
  created: 'desc',
  name: 'asc',
  last_login: 'desc',
}

async function load() {
  loading.value = true
  try {
    const result = await listUsers({
      q: query.value.trim() || undefined,
      role: role.value === 'all' ? undefined : role.value,
      status: status.value === 'all' ? undefined : status.value,
      sort: sort.value,
      dir: sortDir[sort.value],
      limit: pageSize.value,
      offset: (page.value - 1) * pageSize.value,
    })
    users.value = result.users
    total.value = result.total
    counts.value = result.counts
    error.value = ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

// Смена фильтра возвращает на первую страницу; поиск ждёт, пока сотрудник допечатает
watch([role, status, sort, pageSize], () => {
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

const allCount = computed(() => Object.values(counts.value).reduce((sum, n) => sum + (n ?? 0), 0))

const roleFilter = computed<FilterOption<Role | 'all'>[]>(() => [
  { value: 'all', label: t('Все роли'), count: allCount.value, glyph: UsersRound },
  ...roles.map((value) => ({ value, label: roleLabels[value], count: counts.value[value] ?? 0 })),
])
const statusFilter = computed<FilterOption<UserStatusFilter | 'all'>[]>(() => [
  { value: 'all', label: t('Все') },
  { value: 'active', label: t('Активные'), dot: 'bg-emerald-500' },
  { value: 'blocked', label: t('Заблокированные'), dot: 'bg-rose-500' },
])
const sortFilter = computed<FilterOption<UserSort>[]>(() => [
  { value: 'created', label: t('Сначала новые') },
  { value: 'name', label: t('По имени') },
  { value: 'last_login', label: t('По последнему входу') },
])

// Карточка сотрудника: selected — открытый сотрудник, null — создание нового
const drawerOpen = ref(false)
const selected = ref<StaffUser | null>(null)

function openUser(user: StaffUser) {
  selected.value = user
  drawerOpen.value = true
}

function openCreate() {
  selected.value = null
  drawerOpen.value = true
}

function onSaved(user: StaffUser) {
  const isNew = selected.value === null
  selected.value = user
  if (isNew) drawerOpen.value = false
  void load()
}

const displayName = (user: StaffUser) => user.full_name || user.username
</script>

<template>
  <!-- Шапка страницы, фильтры и пагинация закреплены, при прокрутке движется только список -->
  <div class="flex h-full min-h-0 flex-col gap-4">
    <header class="flex shrink-0 flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Сотрудники') }}</h1>
        <p class="mt-1 text-sm text-zinc-700">
          {{ $t('Учётные записи, роли и доступ в CRM') }}
        </p>
      </div>
      <button
        type="button"
        class="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
        @click="openCreate"
      >
        <Plus class="size-4" />
        {{ $t('Добавить сотрудника') }}
      </button>
    </header>

    <p v-if="error" role="alert" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </p>

    <div class="flex shrink-0 flex-wrap items-center gap-2">
      <label class="relative min-w-[220px] flex-1 sm:max-w-[320px]">
        <span class="sr-only">{{ $t('Поиск сотрудников') }}</span>
        <Search
          class="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          v-model="query"
          type="search"
          :placeholder="$t('Имя, логин, email или телефон')"
          class="h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3.5 pl-10 text-[13px] text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
        />
      </label>
      <FilterDropdown v-model="role" :label="$t('Роль')" :options="roleFilter" all-value="all" />
      <FilterDropdown
        v-model="status"
        :label="$t('Статус')"
        :options="statusFilter"
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
        <table class="w-full min-w-[760px] text-left">
          <thead
            class="sticky top-0 z-10 border-b border-zinc-100 bg-zinc-50 text-xs text-zinc-500"
          >
            <tr>
              <th class="px-5 py-3 font-medium">{{ $t('Сотрудник') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Контакты') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Роль') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Доступ') }}</th>
              <th class="px-5 py-3 font-medium">{{ $t('Последний вход') }}</th>
            </tr>
          </thead>
          <tbody :class="cn('divide-y divide-zinc-100', loading && 'opacity-60')">
            <tr
              v-for="user in users"
              :key="user.id"
              tabindex="0"
              class="cursor-pointer transition-colors outline-none hover:bg-zinc-50 focus-visible:bg-zinc-50"
              @click="openUser(user)"
              @keydown.enter="openUser(user)"
            >
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <span
                    class="grid size-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-200 to-rose-300 text-xs font-semibold text-slate-900"
                  >
                    {{ initials(displayName(user)) }}
                  </span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-zinc-950">
                      {{ displayName(user) }}
                    </p>
                    <p class="truncate text-xs text-zinc-500">@{{ user.username }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5">
                <p class="truncate text-sm text-zinc-900">{{ user.email }}</p>
                <p class="text-xs text-zinc-500">
                  {{ user.phone ? formatPhone(user.phone) : '—' }}
                </p>
              </td>
              <td class="px-5 py-3.5">
                <span
                  :class="
                    cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
                      roleBadge[user.role],
                    )
                  "
                >
                  <ShieldCheck v-if="user.role === 'superadmin'" class="size-3.5" />
                  {{ roleLabels[user.role] }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <span
                  v-if="user.status"
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"
                >
                  <UserCheck class="size-4" />
                  {{ $t('Активен') }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600"
                >
                  <UserX class="size-4" />
                  {{ $t('Заблокирован') }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-sm text-zinc-700">
                {{ user.last_login_at ? formatDateTime(user.last_login_at) : $t('Ещё не входил') }}
              </td>
            </tr>
            <tr v-if="!loading && users.length === 0">
              <td colspan="5" class="px-5 py-12 text-center text-sm text-zinc-500">
                {{ $t('Сотрудники не найдены') }}
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

    <UserDrawer v-model:open="drawerOpen" :user="selected" @saved="onSaved" />
  </div>
</template>
