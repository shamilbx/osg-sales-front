<script setup lang="ts">
import { t } from '@/i18n'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Archive,
  ArchiveRestore,
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Send,
  Star,
  Trash2,
  UserRound,
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
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { fieldClass, textareaClass } from '@/components/form/field-styles'
import FormField from '@/components/form/FormField.vue'
import SelectField from '@/components/form/SelectField.vue'
import SideDrawer from '@/components/common/SideDrawer.vue'
import AuditTimeline from '@/components/audit/AuditTimeline.vue'
import ContactFormBlock from '@/components/companies/ContactForm.vue'
import {
  companyNameError,
  socialError,
  taxIdError,
  websiteError,
} from '@/components/companies/validation'

// Карточка существующей компании; новая создаётся на отдельной странице /companies/new
const props = defineProps<{ companyId: number | null }>()
const open = defineModel<boolean>('open', { required: true })
// После любого сохранения список за drawer'ом обновляется
const emit = defineEmits<{ changed: [] }>()

const router = useRouter()
const toast = useToast()
const { user: me } = useAuth()
const dictionaries = useDictionaries()

const company = ref<Company | null>(null)
const contacts = ref<Contact[]>([])
const loading = ref(false)
const loadError = ref('')
// Меняется после каждого сохранения, чтобы история подтянулась заново
const version = ref(0)

// Контакты: undefined — форма закрыта, null — новый контакт, иначе правка выбранного
const editingContact = ref<Contact | null | undefined>(undefined)
// Перенос в архив подтверждается вторым нажатием
const confirmArchive = ref(false)

const isArchived = computed(() => company.value?.status === 'archived')
const isSuperAdmin = computed(() => me.value?.role === 'superadmin')
const canAssign = computed(() => me.value?.role === 'superadmin' || me.value?.role === 'director')

// Менеджер правит только свои компании, суперадмин — любые; архивная доступна только для чтения
const canEdit = computed(() => {
  if (!company.value || isArchived.value) return false
  return (
    isSuperAdmin.value || (me.value?.role === 'manager' && company.value.owner_id === me.value.id)
  )
})
// Архивировать и возвращать из архива может тот, кто вправе править компанию
const canArchive = computed(
  () =>
    company.value !== null &&
    (isSuperAdmin.value ||
      (me.value?.role === 'manager' && company.value.owner_id === me.value.id)),
)

const form = reactive<CompanyForm>({
  name: '',
  tax_id: '',
  industry_id: 0,
  sphere_id: 0,
  website: '',
  address: '',
  social_links: {},
  notes: '',
})
const errors = reactive({ name: '', tax_id: '', industry: '', sphere: '', website: '', social: '' })
const duplicate = ref<{ message: string; found: Duplicate } | null>(null)
const saving = ref(false)

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

function fillForm(source: Company | null) {
  Object.assign(
    form,
    emptyForm(),
    source && {
      name: source.name,
      tax_id: source.tax_id,
      industry_id: source.industry_id,
      sphere_id: source.sphere_id,
      website: source.website,
      address: source.address,
      social_links: { ...source.social_links },
      notes: source.notes,
    },
  )
  Object.assign(errors, { name: '', tax_id: '', industry: '', sphere: '', website: '', social: '' })
  duplicate.value = null
}

async function load() {
  loadError.value = ''
  editingContact.value = undefined
  confirmArchive.value = false
  if (props.companyId === null) {
    company.value = null
    contacts.value = []
    fillForm(null)
    return
  }
  loading.value = true
  try {
    const card = await getCompany(props.companyId)
    company.value = card.company
    contacts.value = card.contacts
    fillForm(card.company)
    ownerId.value = card.company.owner_id
  } catch (error) {
    loadError.value = error instanceof ApiError ? error.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

const owners = ref<Owner[]>([])
const ownerId = ref<number | ''>('')
const ownerSaving = ref(false)

watch(
  () => [open.value, props.companyId],
  ([isOpen]) => {
    if (!isOpen) return
    void dictionaries.load()
    void load()
    if (owners.value.length === 0)
      listOwners()
        .then((items) => (owners.value = items))
        .catch(() => {})
  },
  { immediate: true },
)

// Выбор отрасли и сферы: в списке только включённые, но текущее значение компании остаётся, даже если его потом отключили
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
    if (props.companyId === null) return
    company.value = await updateCompany(props.companyId, payload)
    fillForm(company.value)
    version.value++
    toast.success(t('Данные компании обновлены'))
    emit('changed')
  } catch (error) {
    showServerError(error, t('Не удалось сохранить компанию'))
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
    emit('changed')
  } catch (error) {
    ownerId.value = company.value.owner_id
    toast.error(t('Не удалось назначить'), error instanceof ApiError ? error.message : undefined)
  } finally {
    ownerSaving.value = false
  }
}

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
    version.value++
    confirmArchive.value = false
    toast.success(archive ? t('Компания перенесена в архив') : t('Компания возвращена из архива'))
    emit('changed')
  } catch (error) {
    toast.error(t('Не удалось выполнить'), error instanceof ApiError ? error.message : undefined)
  } finally {
    archiving.value = false
  }
}

async function reloadContacts() {
  if (props.companyId === null) return
  const card = await getCompany(props.companyId)
  company.value = card.company
  contacts.value = card.contacts
  version.value++
  emit('changed')
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

const deletingContact = ref<number | null>(null)

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

const openDuplicate = () => duplicate.value && router.push(`/companies/${duplicate.value.found.id}`)

const title = computed(() => company.value?.name ?? '…')

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
  if (field === 'status') return value === 'archived' ? t('В архиве') : t('Активна')
  if (field === 'contact_phone') return formatPhone(String(value))
  return String(value)
}

const ids = {
  name: 'company-name',
  taxId: 'company-tax-id',
  industry: 'company-industry',
  sphere: 'company-sphere',
  website: 'company-website',
  address: 'company-address',
  notes: 'company-notes',
  owner: 'company-owner',
}

const ownerOptions = computed(() =>
  owners.value.map((owner) => ({
    value: owner.id,
    label: `${ownerName(owner)} · ${roleLabels[owner.role]}`,
  })),
)
</script>

<template>
  <SideDrawer v-model:open="open" :title="title">
    <template #header>
      <div class="flex items-center gap-3">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-700"
        >
          <Building2 class="size-5" />
        </span>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold tracking-tight text-zinc-950">{{ title }}</h2>
          <p v-if="company" class="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span
              v-if="isArchived"
              class="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200"
              >{{ $t('В архиве') }}</span
            >
            <span>{{ company.industry_name }} · {{ company.sphere_name }}</span>
          </p>
          <p v-else class="text-xs text-zinc-500">{{ $t('Карточка клиента') }}</p>
        </div>
      </div>
    </template>

    <p
      v-if="loadError"
      role="alert"
      class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
    >
      {{ loadError }}
    </p>
    <p v-else-if="loading" class="text-sm text-zinc-500">{{ $t('Загрузка…') }}</p>

    <template v-else>
      <div
        v-if="isArchived"
        class="mb-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200"
      >
        {{
          $t(
            'Компания в архиве: данные доступны только для чтения. Верните её из архива, чтобы редактировать.',
          )
        }}
      </div>
      <p
        v-else-if="company && !canEdit"
        class="mb-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200"
      >
        {{
          $t('Менять компанию может только её ответственный — {name}', {
            name: company?.owner_name ?? '',
          })
        }}
      </p>

      <div
        v-if="duplicate"
        role="alert"
        class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
      >
        <span>
          {{ duplicate.message }}: <b>{{ duplicate.found.name }}</b>
          <template v-if="duplicate.found.owner">
            ({{ $t('ответственный: {name}', { name: duplicate.found.owner }) }})</template
          >
        </span>
        <button
          type="button"
          class="h-9 rounded-xl border border-amber-300 bg-white px-3.5 text-[13px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
          @click="openDuplicate"
        >
          {{ $t('Открыть карточку') }}
        </button>
      </div>

      <form id="company-form" class="flex flex-col gap-4" novalidate @submit.prevent="save">
        <h3 class="text-sm font-semibold text-zinc-950">{{ $t('Данные') }}</h3>
        <fieldset :disabled="!canEdit" class="grid min-w-0 gap-4 sm:grid-cols-2">
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
          <FormField :label="$t('Отрасль')" :for="ids.industry" required :error="errors.industry">
            <SelectField
              :id="ids.industry"
              v-model="industryModel"
              :options="industryOptions"
              :placeholder="$t('Выберите отрасль')"
              :invalid="Boolean(errors.industry)"
              :disabled="!canEdit"
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
              :disabled="!canEdit || !form.industry_id"
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
        </fieldset>

        <h3 class="mt-2 text-sm font-semibold text-zinc-950">{{ $t('Социальные сети') }}</h3>
        <fieldset :disabled="!canEdit" class="grid min-w-0 gap-4 sm:grid-cols-2">
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
        </fieldset>

        <FormField :label="$t('Заметка')" :for="ids.notes">
          <textarea
            :id="ids.notes"
            v-model="form.notes"
            rows="3"
            :disabled="!canEdit"
            :class="textareaClass"
          />
        </FormField>
      </form>

      <template v-if="company">
        <section class="mt-7 flex flex-col gap-3 border-t border-zinc-100 pt-6">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <UserRound class="size-4 text-zinc-500" />
            {{ $t('Ответственный') }}
          </h3>
          <div v-if="canAssign && !isArchived" class="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormField :label="$t('Сотрудник')" :for="ids.owner" class="flex-1">
              <SelectField :id="ids.owner" v-model="ownerId" :options="ownerOptions" />
            </FormField>
            <button
              type="button"
              class="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
              :disabled="ownerSaving || ownerId === '' || ownerId === company.owner_id"
              @click="saveOwner"
            >
              {{ $t('Назначить') }}
            </button>
          </div>
          <p v-else class="text-sm text-zinc-900">{{ company.owner_name }}</p>
        </section>

        <section class="mt-7 flex flex-col gap-4 border-t border-zinc-100 pt-6">
          <div class="flex items-center justify-between gap-3">
            <h3 class="text-sm font-semibold text-zinc-950">
              {{ $t('Контакты') }}
              <span class="ml-1 text-zinc-400">{{ contacts.length }}</span>
            </h3>
            <button
              v-if="canEdit && editingContact === undefined"
              type="button"
              class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-[13px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
              @click="editingContact = null"
            >
              <Plus class="size-4" />
              {{ $t('Добавить контакт') }}
            </button>
          </div>

          <ContactFormBlock
            v-if="editingContact !== undefined"
            :key="editingContact?.id ?? 'new'"
            :company-id="company.id"
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

          <ul class="flex flex-col gap-3">
            <li
              v-for="contact in contacts"
              :key="contact.id"
              :class="
                cn(
                  'rounded-2xl border p-4',
                  contact.is_primary ? 'border-zinc-950/15 bg-zinc-50' : 'border-zinc-200 bg-white',
                )
              "
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-950">
                    {{ contact.full_name }}
                    <span
                      v-if="contact.is_primary"
                      class="inline-flex items-center gap-1 rounded-full bg-zinc-950 px-2 py-0.5 text-[11px] font-semibold text-white"
                    >
                      <Star class="size-3" />
                      {{ $t('Основной') }}
                    </span>
                  </p>
                  <p v-if="contact.position" class="text-xs text-zinc-500">
                    {{ contact.position }}
                  </p>
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
        </section>

        <section class="mt-7 flex flex-col gap-4 border-t border-zinc-100 pt-6">
          <h3 class="text-sm font-semibold text-zinc-950">{{ $t('История изменений') }}</h3>
          <AuditTimeline
            entity="company"
            :entity-id="company.id"
            :field-labels="fieldLabels"
            :format-value="formatValue"
            :version="version"
          />
        </section>
      </template>
    </template>

    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <button
          v-if="canArchive"
          type="button"
          :class="
            cn(
              'inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors disabled:opacity-60',
              confirmArchive
                ? 'border-rose-600 bg-rose-600 text-white hover:bg-rose-700'
                : 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
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
        <span v-else />
        <div class="flex gap-2">
          <button
            type="button"
            class="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
            @click="open = false"
          >
            {{ $t('Закрыть') }}
          </button>
          <button
            v-if="canEdit"
            type="submit"
            form="company-form"
            class="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
            :disabled="saving"
          >
            {{ $t('Сохранить') }}
          </button>
        </div>
      </div>
    </template>
  </SideDrawer>
</template>
