<script setup lang="ts">
import { t } from '@/i18n'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock,
  Globe,
  Hash,
  History,
  Layers,
  LayoutGrid,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Send,
  Star,
  StickyNote,
  Tag,
  Trash2,
  UserRound,
  Users,
} from '@lucide/vue'
import { ApiError } from '@/api/http'
import {
  deleteContact,
  getCompany,
  setCompanyArchived,
  setContactPrimary,
  socialNetworks,
  updateCompany,
  updateCompanyOwner,
  type Company,
  type CompanyForm,
  type Contact,
  type Duplicate,
} from '@/api/companies'
import { listOwners, ownerName, type Owner } from '@/api/staff'
import { roleLabels, useAuth } from '@/composables/useAuth'
import { useDictionaries } from '@/composables/useDictionaries'
import { useToast } from '@/composables/useToast'
import { formatIsoDate, formatDateTime } from '@/lib/dates'
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { fieldClass, textareaClass } from '@/components/form/field-styles'
import FormField from '@/components/form/FormField.vue'
import SelectField from '@/components/form/SelectField.vue'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import InfoCard from '@/components/common/InfoCard.vue'
import InfoRow from '@/components/common/InfoRow.vue'
import AuditTimeline from '@/components/audit/AuditTimeline.vue'
import ContactFormBlock from '@/components/companies/ContactForm.vue'
import {
  companyNameError,
  socialError,
  taxIdError,
  websiteError,
} from '@/components/companies/validation'

// Страница существующего клиента; нового создают на /clients/new
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { user: me } = useAuth()
const dictionaries = useDictionaries()

const companyId = computed(() => Number(route.params.id))

const company = ref<Company | null>(null)
const contacts = ref<Contact[]>([])
const loading = ref(false)
const loadError = ref('')
// Меняется после каждого сохранения, чтобы история подтянулась заново
const version = ref(0)

type Tab = 'overview' | 'contacts' | 'history'
const tab = ref<Tab>('overview')

const isArchived = computed(() => company.value?.status === 'archived')
const isSuperAdmin = computed(() => me.value?.role === 'superadmin')
const isSupervisor = computed(() => isSuperAdmin.value || me.value?.role === 'director')
const isOwner = computed(
  () => me.value?.role === 'manager' && company.value?.owner_id === me.value.id,
)
// Менеджер правит только своих клиентов, суперадмин — любых; архивный доступен только для чтения
const canEdit = computed(
  () => company.value !== null && !isArchived.value && (isSuperAdmin.value || isOwner.value),
)
// Архивировать и возвращать из архива может тот, кто вправе править клиента
const canArchive = computed(() => company.value !== null && (isSuperAdmin.value || isOwner.value))

const tabs = computed(() => {
  const items: { id: Tab; label: string; icon: typeof LayoutGrid; count?: number }[] = [
    { id: 'overview', label: t('Обзор'), icon: LayoutGrid },
    { id: 'contacts', label: t('Контакты'), icon: Users, count: contacts.value.length },
  ]
  // Журнал изменений сервер отдаёт только руководителю и суперадмину
  if (isSupervisor.value) items.push({ id: 'history', label: t('История действий'), icon: History })
  return items
})

async function load() {
  loadError.value = ''
  loading.value = true
  try {
    const card = await getCompany(companyId.value)
    company.value = card.company
    contacts.value = card.contacts
    ownerId.value = card.company.owner_id
    fillForm(card.company)
  } catch (error) {
    loadError.value = error instanceof ApiError ? error.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

const owners = ref<Owner[]>([])
const ownerId = ref<number | ''>('')
const ownerSaving = ref(false)

void dictionaries.load()
if (isSupervisor.value || me.value === null)
  listOwners()
    .then((items) => (owners.value = items))
    .catch(() => {})

// Если роль загрузилась позже страницы, список сотрудников для назначения подтягивается заново
watch(isSupervisor, (value) => {
  if (value && owners.value.length === 0)
    listOwners()
      .then((items) => (owners.value = items))
      .catch(() => {})
})

// Редактирование данных клиента
const editing = ref(false)
const emptyForm = (): CompanyForm => ({
  name: '',
  tax_id: '',
  industry_id: 0,
  sphere_id: 0,
  website: '',
  address: '',
  social_links: {},
  notes: '',
})
const form = reactive<CompanyForm>(emptyForm())
const errors = reactive({ name: '', tax_id: '', industry: '', sphere: '', website: '', social: '' })
const duplicate = ref<{ message: string; found: Duplicate } | null>(null)
const saving = ref(false)

function fillForm(source: Company) {
  Object.assign(form, emptyForm(), {
    name: source.name,
    tax_id: source.tax_id,
    industry_id: source.industry_id,
    sphere_id: source.sphere_id,
    website: source.website,
    address: source.address,
    social_links: { ...source.social_links },
    notes: source.notes,
  })
  Object.assign(errors, { name: '', tax_id: '', industry: '', sphere: '', website: '', social: '' })
  duplicate.value = null
}

function startEdit() {
  if (!company.value || !canEdit.value) return
  fillForm(company.value)
  tab.value = 'overview'
  editing.value = true
}

function cancelEdit() {
  if (company.value) fillForm(company.value)
  editing.value = false
}

// Выбор отрасли и сферы: в списке только включённые, но текущее значение остаётся, даже если его потом отключили
const industryOptions = computed(() => {
  const options = dictionaries.industries.value.map((i) => ({ value: i.id, label: i.name }))
  if (company.value && !options.some((o) => o.value === company.value!.industry_id)) {
    options.push({ value: company.value.industry_id, label: company.value.industry_name })
  }
  return options
})
const sphereOptions = computed(() => {
  const options = dictionaries
    .spheresOf(form.industry_id || '')
    .map((s) => ({ value: s.id, label: s.name }))
  const current = company.value
  if (
    current &&
    current.industry_id === form.industry_id &&
    !options.some((o) => o.value === current.sphere_id)
  ) {
    options.push({ value: current.sphere_id, label: current.sphere_name })
  }
  return options
})

const industryModel = computed({
  get: () => form.industry_id || ('' as const),
  set: (value: number | '') => {
    form.industry_id = value === '' ? 0 : value
    // У каждой отрасли свои сферы: прежняя больше не подходит
    form.sphere_id = 0
    errors.industry = ''
  },
})
const sphereModel = computed({
  get: () => form.sphere_id || ('' as const),
  set: (value: number | '') => {
    form.sphere_id = value === '' ? 0 : value
    errors.sphere = ''
  },
})

const socialLabels: Record<string, string> = {
  instagram: 'Instagram',
  telegram: 'Telegram',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
}

function validate() {
  errors.name = companyNameError(form.name)
  errors.tax_id = taxIdError(form.tax_id)
  errors.industry = form.industry_id ? '' : t('Выберите отрасль')
  errors.sphere = form.sphere_id ? '' : t('Выберите сферу')
  errors.website = websiteError(form.website)
  errors.social =
    socialNetworks.map((n) => socialError(form.social_links[n] ?? '')).find(Boolean) ?? ''
  return !Object.values(errors).some(Boolean)
}

// Сервер сообщил о дубликате: показываем, на что наткнулись, и отмечаем поле
function showServerError(error: unknown, title: string) {
  if (error instanceof ApiError && error.data?.duplicate) {
    duplicate.value = { message: error.message, found: error.data.duplicate as Duplicate }
    return
  }
  const message = error instanceof ApiError ? error.message : t('Ошибка сервера')
  const lower = message.toLowerCase()
  if (lower.includes('инн')) errors.tax_id = message
  else if (lower.includes('сайт')) errors.website = message
  else if (lower.includes('названи')) errors.name = message
  else toast.error(title, message)
}

async function save() {
  if (saving.value || !canEdit.value || !validate()) return
  saving.value = true
  duplicate.value = null
  try {
    const payload: CompanyForm = {
      ...form,
      name: form.name.trim(),
      social_links: Object.fromEntries(
        Object.entries(form.social_links).filter(([, value]) => value?.trim()),
      ),
    }
    company.value = await updateCompany(companyId.value, payload)
    fillForm(company.value)
    editing.value = false
    version.value++
    toast.success(t('Данные клиента обновлены'))
  } catch (error) {
    showServerError(error, t('Не удалось сохранить клиента'))
  } finally {
    saving.value = false
  }
}

async function saveOwner() {
  if (!company.value || ownerId.value === '' || ownerId.value === company.value.owner_id) return
  ownerSaving.value = true
  try {
    company.value = await updateCompanyOwner(company.value.id, ownerId.value)
    version.value++
    toast.success(t('Ответственный назначен'), company.value.owner_name)
  } catch (error) {
    ownerId.value = company.value.owner_id
    toast.error(t('Не удалось назначить'), error instanceof ApiError ? error.message : undefined)
  } finally {
    ownerSaving.value = false
  }
}

// Перенос в архив подтверждается вторым нажатием
const confirmArchive = ref(false)
const archiving = ref(false)

async function toggleArchived() {
  if (!company.value || archiving.value) return
  const archive = !isArchived.value
  if (archive && !confirmArchive.value) {
    confirmArchive.value = true
    return
  }
  archiving.value = true
  try {
    company.value = await setCompanyArchived(company.value.id, archive)
    fillForm(company.value)
    editing.value = false
    version.value++
    confirmArchive.value = false
    toast.success(archive ? t('Клиент перенесён в архив') : t('Клиент возвращён из архива'))
  } catch (error) {
    toast.error(t('Не удалось выполнить'), error instanceof ApiError ? error.message : undefined)
  } finally {
    archiving.value = false
  }
}

// Контакты: undefined — форма закрыта, null — новый контакт, иначе правка выбранного
const editingContact = ref<Contact | null | undefined>(undefined)
const deletingContact = ref<number | null>(null)

async function reloadContacts() {
  const card = await getCompany(companyId.value)
  company.value = card.company
  contacts.value = card.contacts
  version.value++
}

async function onContactSaved() {
  const wasNew = editingContact.value === null
  editingContact.value = undefined
  await reloadContacts()
  toast.success(wasNew ? t('Контакт добавлен') : t('Контакт обновлён'))
}

async function makePrimary(contact: Contact) {
  try {
    await setContactPrimary(contact.id)
    await reloadContacts()
    toast.success(t('Основной контакт назначен'), contact.full_name)
  } catch (error) {
    toast.error(t('Не удалось назначить'), error instanceof ApiError ? error.message : undefined)
  }
}

async function removeContact(contact: Contact) {
  if (deletingContact.value !== contact.id) {
    deletingContact.value = contact.id
    return
  }
  try {
    await deleteContact(contact.id)
    deletingContact.value = null
    await reloadContacts()
    toast.success(t('Контакт удалён'), contact.full_name)
  } catch (error) {
    toast.error(t('Не удалось удалить'), error instanceof ApiError ? error.message : undefined)
  }
}

const openDuplicate = () => duplicate.value && router.push(`/clients/${duplicate.value.found.id}`)

const primaryContact = computed(() => contacts.value.find((c) => c.is_primary) ?? null)
const socials = computed(() =>
  socialNetworks
    .map((network) => ({ network, value: company.value?.social_links[network] ?? '' }))
    .filter((item) => item.value),
)
const ownerOptions = computed(() =>
  owners.value.map((owner) => ({
    value: owner.id,
    label: `${ownerName(owner)} · ${roleLabels[owner.role]}`,
  })),
)

const fieldLabels: Record<string, string> = {
  get name() {
    return t('Название')
  },
  get tax_id() {
    return t('ИНН')
  },
  get industry() {
    return t('Отрасль')
  },
  get sphere() {
    return t('Сфера')
  },
  get website() {
    return t('Сайт')
  },
  get address() {
    return t('Адрес')
  },
  get notes() {
    return t('Заметка')
  },
  get owner() {
    return t('Ответственный')
  },
  get status() {
    return t('Статус')
  },
  social_instagram: 'Instagram',
  social_telegram: 'Telegram',
  social_facebook: 'Facebook',
  social_linkedin: 'LinkedIn',
  social_youtube: 'YouTube',
  get contact() {
    return t('Контакт')
  },
  get contact_full_name() {
    return t('Имя контакта')
  },
  get contact_position() {
    return t('Должность контакта')
  },
  get contact_phone() {
    return t('Телефон контакта')
  },
  get contact_email() {
    return t('Email контакта')
  },
  get contact_telegram() {
    return t('Telegram контакта')
  },
  get contact_notes() {
    return t('Заметка контакта')
  },
  get primary_contact() {
    return t('Основной контакт')
  },
}

function formatValue(field: string, value: unknown) {
  if (field === 'status') return value === 'archived' ? t('В архиве') : t('Активен')
  if (field === 'contact_phone') return formatPhone(String(value))
  return String(value)
}

const ids = {
  name: 'client-name',
  taxId: 'client-tax-id',
  industry: 'client-industry',
  sphere: 'client-sphere',
  website: 'client-website',
  address: 'client-address',
  notes: 'client-notes',
  owner: 'client-owner',
}

// Запускается после объявления всех состояний, которые сбрасывает
watch(
  companyId,
  () => {
    tab.value = 'overview'
    editing.value = false
    editingContact.value = undefined
    confirmArchive.value = false
    if (Number.isFinite(companyId.value)) void load()
  },
  { immediate: true },
)

// Основная кнопка красная (--color-brand), вторичные — белые с рамкой
const headerButton =
  'inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:pointer-events-none disabled:opacity-60'
const smallButton =
  'inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-100'
const plainButton =
  'inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-[13px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-60'
</script>

<template>
  <div class="flex min-h-full flex-col gap-4">
    <!-- Хлебные крошки -->
    <nav :aria-label="$t('Навигация')" class="flex flex-wrap items-center gap-1.5 px-1 text-sm">
      <RouterLink to="/" class="text-zinc-500 transition-colors hover:text-zinc-900">{{
        $t('Главная')
      }}</RouterLink>
      <ChevronRight class="size-3.5 text-zinc-400" />
      <RouterLink to="/clients" class="text-zinc-500 transition-colors hover:text-zinc-900">{{
        $t('Клиенты')
      }}</RouterLink>
      <ChevronRight class="size-3.5 text-zinc-400" />
      <span class="font-semibold text-zinc-900">{{ company?.name ?? '…' }}</span>
    </nav>

    <p v-if="loadError" role="alert" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ loadError }}
    </p>
    <p v-else-if="loading && !company" class="px-1 text-sm text-zinc-500">{{ $t('Загрузка…') }}</p>

    <template v-if="company">
      <!-- Шапка клиента -->
      <BasePanel class="flex flex-col gap-5 p-5 sm:p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <span
              class="grid size-16 shrink-0 place-items-center rounded-full bg-zinc-100 text-zinc-700"
            >
              <Building2 class="size-7" :stroke-width="1.7" />
            </span>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">
                  {{ company.name }}
                </h1>
                <span
                  :class="
                    cn(
                      'rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1',
                      isArchived
                        ? 'bg-zinc-100 text-zinc-600 ring-zinc-200'
                        : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                    )
                  "
                  >{{ isArchived ? $t('В архиве') : $t('Активный') }}</span
                >
              </div>
              <p class="mt-1 text-sm text-zinc-600">
                <template v-if="company.tax_id">{{ $t('ИНН') }}: {{ company.tax_id }} · </template>
                {{ $t('Создан') }}: {{ formatIsoDate(company.created_at.slice(0, 10)) }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button type="button" :class="plainButton" @click="router.push('/clients')">
              <ArrowLeft class="size-4" />
              {{ $t('Назад') }}
            </button>
            <button
              v-if="canEdit && !editing"
              type="button"
              :class="headerButton"
              @click="startEdit"
            >
              <Pencil class="size-4" />
              {{ $t('Редактировать') }}
            </button>
            <button
              v-if="canArchive"
              type="button"
              :class="
                cn(
                  plainButton,
                  confirmArchive && 'border-brand bg-brand text-white hover:bg-brand-dark',
                )
              "
              :disabled="archiving"
              @click="toggleArchived"
              @blur="confirmArchive = false"
            >
              <ArchiveRestore v-if="isArchived" class="size-4" />
              <Archive v-else class="size-4" />
              {{
                isArchived
                  ? $t('Вернуть из архива')
                  : confirmArchive
                    ? $t('Подтвердить перенос в архив')
                    : $t('В архив')
              }}
            </button>
          </div>
        </div>

        <!-- Вкладки -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div
            role="tablist"
            class="flex max-w-full flex-wrap gap-1 rounded-2xl bg-zinc-50 p-1 ring-1 ring-zinc-100"
          >
            <button
              v-for="item in tabs"
              :key="item.id"
              type="button"
              role="tab"
              :aria-selected="tab === item.id"
              :class="
                cn(
                  'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-colors',
                  tab === item.id
                    ? 'bg-brand text-white'
                    : 'text-zinc-700 hover:bg-white hover:text-zinc-950',
                )
              "
              @click="tab = item.id"
            >
              <component :is="item.icon" class="size-4" />
              {{ item.label }}
              <span v-if="item.count !== undefined" class="text-xs opacity-60">{{
                item.count
              }}</span>
            </button>
          </div>
          <p class="flex items-center gap-1.5 text-xs text-zinc-500">
            <Clock class="size-3.5" />
            {{ $t('Обновлено') }}: {{ formatDateTime(company.updated_at) }}
          </p>
        </div>
      </BasePanel>

      <div
        v-if="isArchived"
        class="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200"
      >
        {{
          $t(
            'Клиент в архиве: данные доступны только для чтения. Верните его из архива, чтобы редактировать.',
          )
        }}
      </div>
      <p
        v-else-if="!canEdit"
        class="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200"
      >
        {{
          $t('Менять клиента может только его ответственный — {name}', { name: company.owner_name })
        }}
      </p>

      <!-- Обзор -->
      <template v-if="tab === 'overview'">
        <form v-if="editing" class="flex flex-col gap-4" novalidate @submit.prevent="save">
          <div
            v-if="duplicate"
            role="alert"
            class="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900 ring-1 ring-amber-200"
          >
            <span>
              {{ duplicate.message }}: <b>{{ duplicate.found.name }}</b>
              <template v-if="duplicate.found.owner">
                ({{ $t('ответственный: {name}', { name: duplicate.found.owner }) }})</template
              >
            </span>
            <button
              type="button"
              class="h-10 rounded-xl border border-amber-300 bg-white px-4 text-[13px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              @click="openDuplicate"
            >
              {{ $t('Открыть карточку') }}
            </button>
          </div>

          <BasePanel class="flex flex-col gap-4 p-5 sm:p-6">
            <h2 class="text-base font-semibold tracking-tight text-zinc-950">{{ $t('Данные') }}</h2>
            <div class="grid min-w-0 gap-4 sm:grid-cols-2">
              <FormField
                :label="$t('Название')"
                :for="ids.name"
                required
                :error="errors.name"
                class="sm:col-span-2"
              >
                <input
                  :id="ids.name"
                  v-model="form.name"
                  :class="fieldClass"
                  :aria-invalid="Boolean(errors.name) || undefined"
                  autocomplete="off"
                />
              </FormField>
              <FormField
                :label="$t('Отрасль')"
                :for="ids.industry"
                required
                :error="errors.industry"
              >
                <SelectField
                  :id="ids.industry"
                  v-model="industryModel"
                  :options="industryOptions"
                  :placeholder="$t('Выберите отрасль')"
                  :invalid="Boolean(errors.industry)"
                />
              </FormField>
              <FormField :label="$t('Сфера')" :for="ids.sphere" required :error="errors.sphere">
                <SelectField
                  :id="ids.sphere"
                  v-model="sphereModel"
                  :options="sphereOptions"
                  :placeholder="
                    form.industry_id ? $t('Выберите сферу') : $t('Сначала выберите отрасль')
                  "
                  :invalid="Boolean(errors.sphere)"
                  :disabled="!form.industry_id"
                />
              </FormField>
              <FormField :label="$t('ИНН')" :for="ids.taxId" :error="errors.tax_id">
                <input
                  :id="ids.taxId"
                  v-model="form.tax_id"
                  inputmode="numeric"
                  :class="fieldClass"
                  :aria-invalid="Boolean(errors.tax_id) || undefined"
                  autocomplete="off"
                />
              </FormField>
              <FormField :label="$t('Сайт')" :for="ids.website" :error="errors.website">
                <input
                  :id="ids.website"
                  v-model="form.website"
                  :class="fieldClass"
                  placeholder="example.uz"
                  :aria-invalid="Boolean(errors.website) || undefined"
                  autocomplete="off"
                />
              </FormField>
              <FormField :label="$t('Адрес')" :for="ids.address" class="sm:col-span-2">
                <input
                  :id="ids.address"
                  v-model="form.address"
                  :class="fieldClass"
                  autocomplete="off"
                />
              </FormField>
            </div>

            <h2 class="mt-2 text-base font-semibold tracking-tight text-zinc-950">
              {{ $t('Социальные сети') }}
            </h2>
            <div class="grid min-w-0 gap-4 sm:grid-cols-2">
              <FormField
                v-for="network in socialNetworks"
                :key="network"
                :label="socialLabels[network]!"
                :for="`social-${network}`"
              >
                <input
                  :id="`social-${network}`"
                  :value="form.social_links[network] ?? ''"
                  :class="fieldClass"
                  :placeholder="
                    network === 'telegram' || network === 'instagram' ? '@username' : 'https://…'
                  "
                  autocomplete="off"
                  @input="form.social_links[network] = ($event.target as HTMLInputElement).value"
                />
              </FormField>
              <p v-if="errors.social" role="alert" class="text-xs text-rose-600 sm:col-span-2">
                {{ errors.social }}
              </p>
            </div>

            <FormField :label="$t('Заметка')" :for="ids.notes">
              <textarea :id="ids.notes" v-model="form.notes" rows="3" :class="textareaClass" />
            </FormField>

            <div class="flex justify-end gap-2">
              <button type="button" :class="plainButton" @click="cancelEdit">
                {{ $t('Отмена') }}
              </button>
              <button
                type="submit"
                class="h-10 rounded-xl bg-brand px-5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                :disabled="saving"
              >
                {{ $t('Сохранить') }}
              </button>
            </div>
          </BasePanel>
        </form>

        <div v-else class="grid gap-4 lg:grid-cols-3">
          <InfoCard :title="$t('О клиенте')">
            <template #action>
              <button v-if="canEdit" type="button" :class="smallButton" @click="startEdit">
                <Pencil class="size-3.5" />
                {{ $t('Редактировать') }}
              </button>
            </template>
            <InfoRow :icon="Tag" :label="$t('Отрасль')" :value="company.industry_name" />
            <InfoRow :icon="Layers" :label="$t('Сфера')" :value="company.sphere_name" />
            <InfoRow :icon="Hash" :label="$t('ИНН')" :value="company.tax_id || '—'" />
            <InfoRow
              :icon="Globe"
              :label="$t('Сайт')"
              :value="company.website.replace(/^https?:\/\//, '') || '—'"
              :href="company.website ? company.website : undefined"
            />
            <InfoRow :icon="MapPin" :label="$t('Адрес')" :value="company.address || '—'" />
          </InfoCard>

          <InfoCard :title="$t('Ответственный')" :icon="UserRound">
            <div v-if="isSupervisor && !isArchived" class="flex flex-col gap-2">
              <FormField :label="$t('Сотрудник')" :for="ids.owner">
                <SelectField :id="ids.owner" v-model="ownerId" :options="ownerOptions" />
              </FormField>
              <button
                type="button"
                :class="cn(headerButton, 'self-start')"
                :disabled="ownerSaving || ownerId === '' || ownerId === company.owner_id"
                @click="saveOwner"
              >
                {{ $t('Назначить') }}
              </button>
            </div>
            <p v-else class="py-1.5 text-sm font-semibold text-zinc-950">
              {{ company.owner_name }}
            </p>
          </InfoCard>

          <InfoCard :title="$t('Основной контакт')" :icon="Star">
            <template v-if="primaryContact">
              <p class="py-1 text-sm font-semibold text-zinc-950">
                {{ primaryContact.full_name }}
                <span
                  v-if="primaryContact.position"
                  class="block text-xs font-normal text-zinc-500"
                  >{{ primaryContact.position }}</span
                >
              </p>
              <InfoRow
                v-if="primaryContact.phone"
                :icon="Phone"
                :label="$t('Телефон')"
                :value="formatPhone(primaryContact.phone)"
                :href="`tel:${primaryContact.phone}`"
                :copy-value="primaryContact.phone"
              />
              <InfoRow
                v-if="primaryContact.email"
                :icon="Mail"
                label="Email"
                :value="primaryContact.email"
                :href="`mailto:${primaryContact.email}`"
                :copy-value="primaryContact.email"
              />
              <InfoRow
                v-if="primaryContact.telegram"
                :icon="Send"
                label="Telegram"
                :value="primaryContact.telegram"
                :href="`https://t.me/${primaryContact.telegram.slice(1)}`"
              />
            </template>
            <p v-else class="py-1.5 text-sm text-zinc-500">{{ $t('Контактов пока нет') }}</p>
          </InfoCard>

          <InfoCard
            v-if="socials.length || company.notes"
            :title="$t('Дополнительно')"
            :icon="StickyNote"
          >
            <InfoRow
              v-for="item in socials"
              :key="item.network"
              :icon="Globe"
              :label="socialLabels[item.network]!"
            >
              <span class="truncate text-sm font-semibold text-zinc-950">{{ item.value }}</span>
            </InfoRow>
            <p v-if="company.notes" class="mt-2 text-sm whitespace-pre-line text-zinc-700">
              {{ company.notes }}
            </p>
          </InfoCard>
        </div>
      </template>

      <!-- Контакты -->
      <BasePanel v-if="tab === 'contacts'" class="flex flex-col gap-4 p-5 sm:p-6">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-semibold tracking-tight text-zinc-950">
            {{ $t('Контакты') }}
            <span class="ml-1 text-zinc-400">{{ contacts.length }}</span>
          </h2>
          <button
            v-if="canEdit && editingContact === undefined"
            type="button"
            :class="headerButton"
            @click="editingContact = null"
          >
            <Plus class="size-4" />
            {{ $t('Добавить контакт') }}
          </button>
        </div>

        <ContactFormBlock
          v-if="editingContact !== undefined"
          :key="editingContact?.id ?? 'new'"
          :company-id="companyId"
          :contact="editingContact"
          :first="contacts.length === 0"
          @saved="onContactSaved"
          @cancel="editingContact = undefined"
        />

        <p
          v-if="contacts.length === 0 && editingContact === undefined"
          class="text-sm text-zinc-500"
        >
          {{ $t('Контактов пока нет') }}
        </p>

        <ul class="grid gap-3 md:grid-cols-2">
          <li
            v-for="contact in contacts"
            :key="contact.id"
            :class="
              cn(
                'rounded-2xl border p-4',
                contact.is_primary ? 'border-brand/15 bg-zinc-50' : 'border-zinc-200 bg-white',
              )
            "
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-950">
                  {{ contact.full_name }}
                  <span
                    v-if="contact.is_primary"
                    class="inline-flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    <Star class="size-3" />
                    {{ $t('Основной') }}
                  </span>
                </p>
                <p v-if="contact.position" class="text-xs text-zinc-500">{{ contact.position }}</p>
              </div>
              <div v-if="canEdit" class="flex items-center gap-1">
                <button
                  v-if="!contact.is_primary"
                  type="button"
                  class="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                  :aria-label="$t('Сделать основным')"
                  :title="$t('Сделать основным')"
                  @click="makePrimary(contact)"
                >
                  <Star class="size-4" />
                </button>
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                  :aria-label="$t('Изменить контакт')"
                  :title="$t('Изменить контакт')"
                  @click="editingContact = contact"
                >
                  <Pencil class="size-4" />
                </button>
                <button
                  type="button"
                  :class="
                    cn(
                      'grid h-8 place-items-center rounded-lg px-2 text-xs font-semibold transition-colors',
                      deletingContact === contact.id
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : 'size-8 px-0 text-zinc-500 hover:bg-rose-50 hover:text-rose-600',
                    )
                  "
                  :aria-label="$t('Удалить контакт')"
                  :title="$t('Удалить контакт')"
                  @click="removeContact(contact)"
                  @blur="deletingContact = null"
                >
                  <template v-if="deletingContact === contact.id">{{ $t('Удалить?') }}</template>
                  <Trash2 v-else class="size-4" />
                </button>
              </div>
            </div>
            <dl class="mt-3 grid gap-1.5 text-sm text-zinc-800">
              <div v-if="contact.phone" class="flex items-center gap-2">
                <Phone class="size-4 shrink-0 text-zinc-400" />
                <a :href="`tel:${contact.phone}`" class="hover:underline">{{
                  formatPhone(contact.phone)
                }}</a>
              </div>
              <div v-if="contact.email" class="flex items-center gap-2">
                <Mail class="size-4 shrink-0 text-zinc-400" />
                <a :href="`mailto:${contact.email}`" class="truncate hover:underline">{{
                  contact.email
                }}</a>
              </div>
              <div v-if="contact.telegram" class="flex items-center gap-2">
                <Send class="size-4 shrink-0 text-zinc-400" />
                <a
                  :href="`https://t.me/${contact.telegram.slice(1)}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="hover:underline"
                  >{{ contact.telegram }}</a
                >
              </div>
              <p v-if="contact.notes" class="mt-1 text-xs text-zinc-500">{{ contact.notes }}</p>
            </dl>
          </li>
        </ul>
      </BasePanel>

      <!-- История -->
      <BasePanel
        v-else-if="tab === 'history' && isSupervisor"
        class="flex flex-col gap-4 p-5 sm:p-6"
      >
        <h2 class="text-base font-semibold tracking-tight text-zinc-950">
          {{ $t('История изменений') }}
        </h2>
        <AuditTimeline
          entity="company"
          :entity-id="companyId"
          :field-labels="fieldLabels"
          :format-value="formatValue"
          :version="version"
        />
      </BasePanel>
    </template>
  </div>
</template>
