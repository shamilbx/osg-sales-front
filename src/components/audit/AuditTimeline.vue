<script setup lang="ts">
import { t } from '@/i18n'
import { ref, watch } from 'vue'
import { History } from '@lucide/vue'
import { ApiError } from '@/api/http'
import { listAudit, type AuditChange, type AuditEntry } from '@/api/audit'
import { formatDateTime } from '@/lib/dates'

const props = defineProps<{
  entity: string
  entityId: number
  /** Подписи полей: { full_name: 'Имя' } */
  fieldLabels: Record<string, string>
  /** Как показать значение поля, например роль названием */
  formatValue?: (field: string, value: unknown) => string
  /** Меняется после каждого сохранения: история подтягивается заново */
  version?: number
}>()

const LIMIT = 20

const entries = ref<AuditEntry[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

const actionLabels: Record<string, string> = {
  get create() {
    return t('Создание')
  },
  get update() {
    return t('Изменение данных')
  },
  get role_change() {
    return t('Смена роли')
  },
  get block() {
    return t('Блокировка')
  },
  get unblock() {
    return t('Разблокировка')
  },
  get password_change() {
    return t('Смена пароля')
  },
  get archive() {
    return t('Перенос в архив')
  },
  get restore() {
    return t('Возврат из архива')
  },
  get owner_change() {
    return t('Смена ответственного')
  },
  get contact_create() {
    return t('Добавлен контакт')
  },
  get contact_update() {
    return t('Изменён контакт')
  },
  get contact_delete() {
    return t('Удалён контакт')
  },
  get primary_change() {
    return t('Смена основного контакта')
  },
}

async function load(more = false) {
  loading.value = true
  try {
    const page = await listAudit({
      entity: props.entity,
      entity_id: props.entityId,
      limit: LIMIT,
      offset: more ? entries.value.length : 0,
    })
    entries.value = more ? [...entries.value, ...page.entries] : page.entries
    total.value = page.total
    error.value = ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.entity, props.entityId, props.version],
  () => load(),
  { immediate: true },
)

const filled = (value: unknown) => value !== undefined && value !== null && value !== ''

/** «Было → стало»; у новых значений только «стало», у удалённых «было → —» */
function describe(field: string, change: AuditChange) {
  if (!filled(change.from)) return show(field, change.to)
  return `${show(field, change.from)} → ${show(field, change.to)}`
}

function show(field: string, value: unknown) {
  if (value === undefined || value === null || value === '') return '—'
  if (props.formatValue) return props.formatValue(field, value)
  if (typeof value === 'boolean') return value ? t('Да') : t('Нет')
  return String(value)
}
</script>

<template>
  <div>
    <p v-if="error" role="alert" class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      {{ error }}
    </p>
    <p
      v-else-if="!loading && entries.length === 0"
      class="flex items-center gap-2 text-sm text-zinc-500"
    >
      <History class="size-4" />
      {{ $t('Изменений пока нет') }}
    </p>

    <ol class="relative flex flex-col gap-4 border-l border-zinc-200 pl-5">
      <li v-for="entry in entries" :key="entry.id" class="relative">
        <span
          class="absolute top-1.5 -left-[25px] size-2.5 rounded-full bg-zinc-300 ring-4 ring-white"
        />
        <p class="text-sm font-semibold text-zinc-950">
          {{ actionLabels[entry.action] ?? entry.action }}
        </p>
        <p class="text-xs text-zinc-500">
          {{ entry.user_name || $t('Система') }} · {{ formatDateTime(entry.created_at) }}
        </p>
        <ul
          v-if="entry.action !== 'create' && Object.keys(entry.changes).length"
          class="mt-2 flex flex-col gap-1 rounded-xl bg-zinc-50 px-3 py-2 text-xs"
        >
          <li v-for="(change, field) in entry.changes" :key="field" class="text-zinc-700">
            <span class="mr-1 font-medium text-zinc-950">{{ fieldLabels[field] ?? field }}:</span>
            <template v-if="field === 'password'"> {{ $t('изменён') }}</template>
            <template v-else> {{ describe(field, change) }}</template>
          </li>
        </ul>
      </li>
    </ol>

    <button
      v-if="entries.length < total"
      type="button"
      class="mt-4 h-9 rounded-xl border border-zinc-200 bg-white px-4 text-[13px] font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-60"
      :disabled="loading"
      @click="load(true)"
    >
      {{ $t('Показать ещё') }}
    </button>
  </div>
</template>
