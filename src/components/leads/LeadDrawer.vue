<script setup lang="ts">
import { t } from '@/i18n'
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, Ban, Building2, RotateCcw, Sparkles, UserRound } from '@lucide/vue'
import { ApiError } from '@/api/http'
import {
  convertLead,
  createLead,
  getLead,
  setLeadStatus,
  updateLead,
  updateLeadOwner,
  type ConvertForm,
  type Duplicate,
  type Lead,
  type LeadDuplicate,
  type LeadForm,
  type LeadStatus,
} from '@/api/leads'
import { listOwners, ownerName, type Owner } from '@/api/staff'
import { roleLabels, useAuth } from '@/composables/useAuth'
import { useDictionaries } from '@/composables/useDictionaries'
import { useToast } from '@/composables/useToast'
import { formatMoney, formatNumber } from '@/lib/format'
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { fieldClass, textareaClass } from '@/components/form/field-styles'
import AmountField from '@/components/form/AmountField.vue'
import FormField from '@/components/form/FormField.vue'
import PhoneField from '@/components/form/PhoneField.vue'
import SelectField from '@/components/form/SelectField.vue'
import SideDrawer from '@/components/common/SideDrawer.vue'
import AuditTimeline from '@/components/audit/AuditTimeline.vue'
import {
  companyNameError,
  contactChannelError,
  contactEmailError,
  contactNameError,
  contactPhoneError,
  telegramError,
} from '@/components/companies/validation'
import { leadStatusMeta } from '@/components/leads/status'

// leadId: null — форма нового лида
const props = defineProps<{ leadId: number | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ changed: []; created: [id: number] }>()

const router = useRouter()
const toast = useToast()
const { user: me } = useAuth()
const dictionaries = useDictionaries()

const lead = ref<Lead | null>(null)
const loading = ref(false)
const loadError = ref('')
// Меняется после каждого сохранения, чтобы история подтянулась заново
const version = ref(0)

const isNew = computed(() => props.leadId === null)
const isSuperAdmin = computed(() => me.value?.role === 'superadmin')
const isSupervisor = computed(() => isSuperAdmin.value || me.value?.role === 'director')
const isOwner = computed(
  () => me.value?.role === 'manager' && lead.value !== null && lead.value.owner_id === me.value.id,
)
const isClosed = computed(
  () => lead.value?.status === 'disqualified' || lead.value?.status === 'converted',
)

// Создают менеджер и суперадмин; правит открытого лида ответственный менеджер или суперадмин
const canEdit = computed(() => {
  if (isNew.value) return isSuperAdmin.value || me.value?.role === 'manager'
  return !isClosed.value && (isSuperAdmin.value || isOwner.value)
})
const canAssign = computed(
  () => isSupervisor.value && lead.value !== null && lead.value.status !== 'converted',
)

const emptyForm = (): LeadForm => ({
  full_name: '',
  position: '',
  phone: '',
  email: '',
  telegram: '',
  company_name: '',
  industry_id: 0,
  sphere_id: 0,
  source_id: 0,
  service_interest: '',
  expected_amount: 0,
  notes: '',
})
const form = reactive<LeadForm>(emptyForm())
const errors = reactive({
  full_name: '',
  phone: '',
  email: '',
  telegram: '',
  channel: '',
  company_name: '',
  sphere: '',
  source: '',
})
const warnings = ref<LeadDuplicate[]>([])
const saving = ref(false)

function clearErrors() {
  for (const key of Object.keys(errors) as (keyof typeof errors)[]) errors[key] = ''
}

function fillForm(source: Lead | null) {
  Object.assign(
    form,
    emptyForm(),
    source && {
      full_name: source.full_name,
      position: source.position,
      phone: source.phone,
      email: source.email,
      telegram: source.telegram,
      company_name: source.company_name,
      industry_id: source.industry_id ?? 0,
      sphere_id: source.sphere_id ?? 0,
      source_id: source.source_id,
      service_interest: source.service_interest,
      expected_amount: source.expected_amount,
      notes: source.notes,
    },
  )
  clearErrors()
}

function resetActions() {
  rejecting.value = false
  reason.value = ''
  reasonError.value = ''
  convertDuplicate.value = null
  convertError.value = ''
  Object.assign(convertForm, { industry_id: 0, sphere_id: 0, deal_title: '', amount: '' })
}

async function load() {
  loadError.value = ''
  warnings.value = []
  resetActions()
  if (props.leadId === null) {
    lead.value = null
    fillForm(null)
    form.source_id = dictionaries.leadSources.value[0]?.id ?? 0
    return
  }
  loading.value = true
  try {
    lead.value = await getLead(props.leadId)
    fillForm(lead.value)
    ownerId.value = lead.value.owner_id
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
  () => [open.value, props.leadId],
  async ([isOpen]) => {
    if (!isOpen) return
    await dictionaries.load()
    void load()
    if (owners.value.length === 0)
      listOwners()
        .then((items) => (owners.value = items))
        .catch(() => {})
  },
  { immediate: true },
)

// Отрасль и сфера у лида необязательны, но задаются парой
const industryOptions = computed(() => {
  const options = dictionaries.industries.value.map((i) => ({ value: i.id, label: i.name }))
  const current = lead.value
  if (current?.industry_id && !options.some((o) => o.value === current.industry_id)) {
    options.push({ value: current.industry_id, label: current.industry_name })
  }
  return options
})
const spheresFor = (industryId: number) => {
  const options = dictionaries
    .spheresOf(industryId || '')
    .map((s) => ({ value: s.id, label: s.name }))
  const current = lead.value
  if (
    current?.sphere_id &&
    current.industry_id === industryId &&
    !options.some((o) => o.value === current.sphere_id)
  ) {
    options.push({ value: current.sphere_id, label: current.sphere_name })
  }
  return options
}
const sourceOptions = computed(() => {
  const options = dictionaries.leadSources.value.map((s) => ({ value: s.id, label: s.name }))
  const current = lead.value
  if (current && !options.some((o) => o.value === current.source_id)) {
    options.push({ value: current.source_id, label: current.source_name })
  }
  return options
})

const industryModel = computed({
  get: () => form.industry_id || ('' as const),
  set: (value: number | '') => {
    form.industry_id = value === '' ? 0 : value
    form.sphere_id = 0
    errors.sphere = ''
  },
})
const sphereModel = computed({
  get: () => form.sphere_id || ('' as const),
  set: (value: number | '') => {
    form.sphere_id = value === '' ? 0 : value
    errors.sphere = ''
  },
})
const sourceModel = computed({
  get: () => form.source_id || ('' as const),
  set: (value: number | '') => {
    form.source_id = value === '' ? 0 : value
    errors.source = ''
  },
})
const amountModel = computed({
  get: () => form.expected_amount || ('' as const),
  set: (value: number | '') => (form.expected_amount = value === '' ? 0 : value),
})

function validate() {
  errors.full_name = contactNameError(form.full_name)
  errors.phone = contactPhoneError(form.phone)
  errors.email = contactEmailError(form.email)
  errors.telegram = telegramError(form.telegram)
  errors.channel =
    errors.phone || errors.email || errors.telegram
      ? ''
      : contactChannelError(form.phone, form.email, form.telegram)
  errors.company_name = companyNameError(form.company_name)
  errors.sphere = form.industry_id && !form.sphere_id ? t('Выберите сферу') : ''
  errors.source = form.source_id ? '' : t('Выберите источник')
  return !Object.values(errors).some(Boolean)
}

async function save() {
  if (saving.value || !canEdit.value || !validate()) return
  saving.value = true
  warnings.value = []
  try {
    const payload: LeadForm = { ...form, full_name: form.full_name.trim() }
    if (props.leadId === null) {
      const result = await createLead(payload)
      toast.success(t('Потенциальный клиент создан'), result.lead.full_name)
      emit('created', result.lead.id)
      // Предупреждения о совпадениях показываются уже в карточке созданного лида
      pendingWarnings = result.duplicates
      return
    }
    const result = await updateLead(props.leadId, payload)
    lead.value = result.lead
    fillForm(result.lead)
    warnings.value = result.duplicates
    version.value++
    toast.success(t('Данные обновлены'))
    emit('changed')
  } catch (error) {
    toast.error(t('Не удалось сохранить'), error instanceof ApiError ? error.message : undefined)
  } finally {
    saving.value = false
  }
}

// Предупреждения после создания: карточка перезагружается под новым id, а они должны остаться видны
let pendingWarnings: LeadDuplicate[] = []
watch(lead, (value) => {
  if (value && pendingWarnings.length) {
    warnings.value = pendingWarnings
    pendingWarnings = []
  }
})

function openWarning(item: LeadDuplicate) {
  void router.push(item.kind === 'lead' ? `/leads/${item.id}` : `/clients/${item.company_id}`)
}

// Статусы: вперёд по цепочке, отклонение с причиной, возврат отклонённого руководителем
const nextStep = computed<{ status: LeadStatus; label: string } | null>(() => {
  if (!lead.value || !canEdit.value) return null
  if (lead.value.status === 'new') return { status: 'contacted', label: t('Связались с клиентом') }
  if (lead.value.status === 'contacted') return { status: 'qualified', label: t('Квалифицировать') }
  return null
})
const canReject = computed(() => lead.value !== null && canEdit.value)
const canReopen = computed(() => lead.value?.status === 'disqualified' && isSupervisor.value)

const rejecting = ref(false)
const reason = ref('')
const reasonError = ref('')
const statusSaving = ref(false)

async function changeStatus(status: LeadStatus, why = '') {
  if (!lead.value || statusSaving.value) return
  statusSaving.value = true
  try {
    lead.value = await setLeadStatus(lead.value.id, status, why)
    fillForm(lead.value)
    resetActions()
    version.value++
    toast.success(t('Статус изменён'), leadStatusMeta[lead.value.status].label())
    emit('changed')
  } catch (error) {
    toast.error(
      t('Не удалось сменить статус'),
      error instanceof ApiError ? error.message : undefined,
    )
  } finally {
    statusSaving.value = false
  }
}

function confirmReject() {
  reasonError.value = reason.value.trim() ? '' : t('Укажите причину отклонения')
  if (!reasonError.value) void changeStatus('disqualified', reason.value.trim())
}

// Конвертация: компания, контакт и сделка одной транзакцией на сервере
const canConvert = computed(() => lead.value?.status === 'qualified' && canEdit.value)
const convertForm = reactive<{
  industry_id: number
  sphere_id: number
  deal_title: string
  amount: number | ''
}>({ industry_id: 0, sphere_id: 0, deal_title: '', amount: '' })
const needsIndustry = computed(() => !lead.value?.industry_id)
const convertDuplicate = ref<{ message: string; found: Duplicate } | null>(null)
const convertError = ref('')
const converting = ref(false)

const convertIndustryModel = computed({
  get: () => convertForm.industry_id || ('' as const),
  set: (value: number | '') => {
    convertForm.industry_id = value === '' ? 0 : value
    convertForm.sphere_id = 0
  },
})
const convertSphereModel = computed({
  get: () => convertForm.sphere_id || ('' as const),
  set: (value: number | '') => (convertForm.sphere_id = value === '' ? 0 : value),
})
const defaultDealTitle = computed(() => {
  if (!lead.value) return ''
  return lead.value.service_interest
    ? `${lead.value.company_name} — ${lead.value.service_interest}`
    : lead.value.company_name
})

async function convert(companyId?: number) {
  if (!lead.value || converting.value) return
  convertError.value = ''
  if (!companyId && needsIndustry.value && (!convertForm.industry_id || !convertForm.sphere_id)) {
    convertError.value = t('Для нового клиента выберите отрасль и сферу')
    return
  }
  converting.value = true
  try {
    const payload: ConvertForm = {}
    if (companyId) payload.company_id = companyId
    else if (needsIndustry.value) {
      payload.industry_id = convertForm.industry_id
      payload.sphere_id = convertForm.sphere_id
    }
    if (convertForm.deal_title.trim()) payload.deal_title = convertForm.deal_title.trim()
    if (convertForm.amount !== '') payload.amount = convertForm.amount
    const result = await convertLead(lead.value.id, payload)
    lead.value = result.lead
    resetActions()
    version.value++
    toast.success(t('Конвертация выполнена'), result.deal.title)
    emit('changed')
  } catch (error) {
    if (error instanceof ApiError && error.data?.duplicate) {
      convertDuplicate.value = { message: error.message, found: error.data.duplicate as Duplicate }
    } else {
      convertError.value = error instanceof ApiError ? error.message : t('Ошибка сервера')
    }
  } finally {
    converting.value = false
  }
}

async function saveOwner() {
  if (!lead.value || ownerId.value === '' || ownerId.value === lead.value.owner_id) return
  ownerSaving.value = true
  try {
    lead.value = await updateLeadOwner(lead.value.id, ownerId.value)
    version.value++
    toast.success(t('Ответственный назначен'), lead.value.owner_name)
    emit('changed')
  } catch (error) {
    ownerId.value = lead.value.owner_id
    toast.error(t('Не удалось назначить'), error instanceof ApiError ? error.message : undefined)
  } finally {
    ownerSaving.value = false
  }
}

const ownerOptions = computed(() =>
  owners.value.map((owner) => ({
    value: owner.id,
    label: `${ownerName(owner)} · ${roleLabels[owner.role]}`,
  })),
)

const title = computed(() =>
  isNew.value ? t('Новый потенциальный клиент') : (lead.value?.full_name ?? '…'),
)

const fieldLabels: Record<string, string> = {
  get lead_full_name() {
    return t('Имя и фамилия')
  },
  get lead_position() {
    return t('Должность')
  },
  get lead_phone() {
    return t('Телефон')
  },
  get lead_email() {
    return t('Email')
  },
  get lead_telegram() {
    return t('Telegram')
  },
  get company_name() {
    return t('Компания')
  },
  get industry() {
    return t('Отрасль')
  },
  get sphere() {
    return t('Сфера')
  },
  get source() {
    return t('Источник')
  },
  get service_interest() {
    return t('Интересующая услуга')
  },
  get expected_amount() {
    return t('Ожидаемая сумма')
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
  get disqualify_reason() {
    return t('Причина отклонения')
  },
  get company() {
    return t('Компания')
  },
  get deal() {
    return t('Сделка')
  },
}

function formatValue(field: string, value: unknown) {
  if (field === 'status' && typeof value === 'string' && value in leadStatusMeta) {
    return leadStatusMeta[value as LeadStatus].label()
  }
  if (field === 'lead_phone') return formatPhone(String(value))
  if (field === 'expected_amount') return formatMoney(Number(value))
  return String(value)
}

const actionButton =
  'inline-flex h-10 items-center gap-2 rounded-xl px-4 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-60'
</script>

<template>
  <SideDrawer v-model:open="open" :title="title">
    <template #header>
      <div class="flex items-center gap-3">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-2xl bg-zinc-100 text-zinc-700"
        >
          <UserRound class="size-5" />
        </span>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold tracking-tight text-zinc-950">{{ title }}</h2>
          <p v-if="lead" class="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span
              :class="
                cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                  leadStatusMeta[lead.status].badge,
                )
              "
              >{{ leadStatusMeta[lead.status].label() }}</span
            >
            <span>{{ lead.company_name }}</span>
          </p>
          <p v-else class="text-xs text-zinc-500">{{ $t('Потенциальный клиент') }}</p>
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
      <!-- Итог конвертации -->
      <div
        v-if="lead?.status === 'converted'"
        class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200"
      >
        <span>{{ $t('Конвертация выполнена: созданы клиент, контакт и сделка.') }}</span>
        <button
          v-if="lead.converted_company_id"
          type="button"
          class="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 text-[13px] font-semibold text-emerald-900 transition-colors hover:bg-emerald-100"
          @click="router.push(`/clients/${lead.converted_company_id}`)"
        >
          <Building2 class="size-4" />
          {{ $t('Открыть клиента') }}
        </button>
      </div>

      <!-- Отклонённый лид -->
      <div
        v-else-if="lead?.status === 'disqualified'"
        class="mb-5 flex flex-col gap-3 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200"
      >
        <p>
          <span class="font-semibold text-zinc-950">{{ $t('Причина отклонения') }}:</span>
          {{ lead.disqualify_reason }}
        </p>
        <div v-if="canReopen">
          <button
            type="button"
            :class="
              cn(actionButton, 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50')
            "
            :disabled="statusSaving"
            @click="changeStatus('new')"
          >
            <RotateCcw class="size-4" />
            {{ $t('Вернуть в работу') }}
          </button>
        </div>
        <p v-else class="text-xs text-zinc-500">
          {{ $t('Вернуть отклонённого в работу может руководитель или суперадмин') }}
        </p>
      </div>

      <p
        v-else-if="lead && !canEdit"
        class="mb-5 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-700 ring-1 ring-zinc-200"
      >
        {{ $t('Менять запись может только её ответственный — {name}', { name: lead.owner_name }) }}
      </p>

      <!-- Предупреждения о совпадениях: сохранению не мешают -->
      <ul v-if="warnings.length" class="mb-5 flex flex-col gap-2">
        <li
          v-for="item in warnings"
          :key="`${item.kind}-${item.id}`"
          role="status"
          class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span>
            {{ item.message }}: <b>{{ item.name }}</b>
            <template v-if="item.kind === 'contact'">
              ({{ $t('клиент «{name}»', { name: item.company_name }) }})</template
            >
            <template v-else-if="item.owner">
              ({{ $t('ответственный: {name}', { name: item.owner }) }})</template
            >
          </span>
          <button
            type="button"
            class="h-9 rounded-xl border border-amber-300 bg-white px-3.5 text-[13px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
            @click="openWarning(item)"
          >
            {{
              item.kind === 'lead' ? $t('Открыть потенциального клиента') : $t('Открыть клиента')
            }}
          </button>
        </li>
      </ul>

      <!-- Движение по воронке -->
      <section
        v-if="nextStep || canReject"
        class="mb-6 flex flex-col gap-3 rounded-2xl border border-zinc-200 p-4"
      >
        <h3 class="text-sm font-semibold text-zinc-950">{{ $t('Работа') }}</h3>
        <div v-if="!rejecting" class="flex flex-wrap gap-2">
          <button
            v-if="nextStep"
            type="button"
            :class="cn(actionButton, 'bg-brand text-white hover:bg-brand-dark')"
            :disabled="statusSaving"
            @click="changeStatus(nextStep.status)"
          >
            <ArrowRight class="size-4" />
            {{ nextStep.label }}
          </button>
          <button
            v-if="canReject"
            type="button"
            :class="
              cn(
                actionButton,
                'border border-zinc-200 bg-white text-zinc-900 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700',
              )
            "
            :disabled="statusSaving"
            @click="rejecting = true"
          >
            <Ban class="size-4" />
            {{ $t('Отклонить') }}
          </button>
        </div>
        <form v-else class="flex flex-col gap-3" novalidate @submit.prevent="confirmReject">
          <FormField
            :label="$t('Причина отклонения')"
            for="lead-reason"
            required
            :error="reasonError"
          >
            <textarea
              id="lead-reason"
              v-model="reason"
              rows="2"
              :class="textareaClass"
              :aria-invalid="Boolean(reasonError) || undefined"
            />
          </FormField>
          <div class="flex justify-end gap-2">
            <button
              type="button"
              :class="
                cn(actionButton, 'border border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50')
              "
              @click="rejecting = false"
            >
              {{ $t('Отмена') }}
            </button>
            <button
              type="submit"
              :class="cn(actionButton, 'bg-rose-600 text-white hover:bg-rose-700')"
              :disabled="statusSaving"
            >
              {{ $t('Отклонить') }}
            </button>
          </div>
        </form>
      </section>

      <!-- Конвертация -->
      <section
        v-if="canConvert"
        class="mb-6 flex flex-col gap-4 rounded-2xl border border-brand/20 bg-brand-soft/60 p-4"
      >
        <div>
          <h3 class="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <Sparkles class="size-4 text-brand" />
            {{ $t('Конвертация') }}
          </h3>
          <p class="mt-1 text-xs text-zinc-600">
            {{
              $t(
                'Будут созданы клиент, контакт и сделка на стадии «Discovery / Briefing». Дубликаты не создаются.',
              )
            }}
          </p>
        </div>

        <div
          v-if="convertDuplicate"
          role="alert"
          class="flex flex-col gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span>
            {{ convertDuplicate.message }}: <b>{{ convertDuplicate.found.name }}</b>
            <template v-if="convertDuplicate.found.kind === 'contact'">
              ({{ $t('клиент «{name}»', { name: convertDuplicate.found.company_name }) }})</template
            >
            <template v-else-if="convertDuplicate.found.owner">
              ({{ $t('ответственный: {name}', { name: convertDuplicate.found.owner }) }})</template
            >
          </span>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              class="h-9 rounded-xl bg-brand px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
              :disabled="converting"
              @click="convert(convertDuplicate.found.company_id)"
            >
              {{ $t('Привязать к этому клиенту') }}
            </button>
            <button
              type="button"
              class="h-9 rounded-xl border border-amber-300 bg-white px-3.5 text-[13px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
              @click="router.push(`/clients/${convertDuplicate.found.company_id}`)"
            >
              {{ $t('Открыть клиента') }}
            </button>
          </div>
        </div>
        <p
          v-if="convertError"
          role="alert"
          class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
        >
          {{ convertError }}
        </p>

        <div class="grid gap-4 sm:grid-cols-2">
          <template v-if="needsIndustry">
            <FormField :label="$t('Отрасль клиента')" for="convert-industry" required>
              <SelectField
                id="convert-industry"
                v-model="convertIndustryModel"
                :options="industryOptions"
                :placeholder="$t('Выберите отрасль')"
              />
            </FormField>
            <FormField :label="$t('Сфера клиента')" for="convert-sphere" required>
              <SelectField
                id="convert-sphere"
                v-model="convertSphereModel"
                :options="spheresFor(convertForm.industry_id)"
                :placeholder="
                  convertForm.industry_id ? $t('Выберите сферу') : $t('Сначала выберите отрасль')
                "
                :disabled="!convertForm.industry_id"
              />
            </FormField>
          </template>
          <FormField :label="$t('Название сделки')" for="convert-title" class="sm:col-span-2">
            <input
              id="convert-title"
              v-model="convertForm.deal_title"
              :class="fieldClass"
              :placeholder="defaultDealTitle"
              autocomplete="off"
            />
          </FormField>
          <FormField :label="$t('Сумма сделки')" for="convert-amount" class="sm:col-span-2">
            <AmountField
              id="convert-amount"
              v-model="convertForm.amount"
              :max-digits="13"
              :placeholder="lead?.expected_amount ? formatNumber(lead.expected_amount) : '0'"
            />
          </FormField>
        </div>
        <div class="flex justify-end">
          <button
            type="button"
            :class="cn(actionButton, 'bg-brand text-white hover:bg-brand-dark')"
            :disabled="converting"
            @click="convert()"
          >
            <Sparkles class="size-4" />
            {{ $t('Конвертировать') }}
          </button>
        </div>
      </section>

      <form id="lead-form" class="flex flex-col gap-4" novalidate @submit.prevent="save">
        <h3 class="text-sm font-semibold text-zinc-950">{{ $t('Контактное лицо') }}</h3>
        <fieldset :disabled="!canEdit" class="grid min-w-0 gap-4 sm:grid-cols-2">
          <FormField
            :label="$t('Имя и фамилия')"
            for="lead-name"
            required
            :error="errors.full_name"
          >
            <input
              id="lead-name"
              v-model="form.full_name"
              :class="fieldClass"
              :aria-invalid="Boolean(errors.full_name) || undefined"
              autocomplete="off"
            />
          </FormField>
          <FormField :label="$t('Должность')" for="lead-position">
            <input
              id="lead-position"
              v-model="form.position"
              :class="fieldClass"
              autocomplete="off"
            />
          </FormField>
          <FormField :label="$t('Телефон')" for="lead-phone" :error="errors.phone">
            <PhoneField id="lead-phone" v-model="form.phone" :invalid="Boolean(errors.phone)" />
          </FormField>
          <FormField :label="$t('Email')" for="lead-email" :error="errors.email">
            <input
              id="lead-email"
              v-model="form.email"
              type="email"
              :class="fieldClass"
              :aria-invalid="Boolean(errors.email) || undefined"
              autocomplete="off"
            />
          </FormField>
          <FormField :label="$t('Telegram')" for="lead-telegram" :error="errors.telegram">
            <input
              id="lead-telegram"
              v-model="form.telegram"
              :class="fieldClass"
              :aria-invalid="Boolean(errors.telegram) || undefined"
              placeholder="@username"
              autocomplete="off"
            />
          </FormField>
          <p v-if="errors.channel" role="alert" class="text-xs text-rose-600 sm:col-span-2">
            {{ errors.channel }}
          </p>
        </fieldset>

        <h3 class="mt-2 text-sm font-semibold text-zinc-950">{{ $t('Компания и интерес') }}</h3>
        <fieldset :disabled="!canEdit" class="grid min-w-0 gap-4 sm:grid-cols-2">
          <FormField
            :label="$t('Название компании')"
            for="lead-company"
            required
            :error="errors.company_name"
            class="sm:col-span-2"
          >
            <input
              id="lead-company"
              v-model="form.company_name"
              :class="fieldClass"
              :aria-invalid="Boolean(errors.company_name) || undefined"
              autocomplete="off"
            />
          </FormField>
          <FormField :label="$t('Отрасль')" for="lead-industry" :hint="$t('Необязательно')">
            <SelectField
              id="lead-industry"
              v-model="industryModel"
              :options="industryOptions"
              :placeholder="$t('Не выбрана')"
              :disabled="!canEdit"
            />
          </FormField>
          <FormField :label="$t('Сфера')" for="lead-sphere" :error="errors.sphere">
            <SelectField
              id="lead-sphere"
              v-model="sphereModel"
              :options="spheresFor(form.industry_id)"
              :placeholder="
                form.industry_id ? $t('Выберите сферу') : $t('Сначала выберите отрасль')
              "
              :invalid="Boolean(errors.sphere)"
              :disabled="!canEdit || !form.industry_id"
            />
          </FormField>
          <FormField :label="$t('Источник')" for="lead-source" required :error="errors.source">
            <SelectField
              id="lead-source"
              v-model="sourceModel"
              :options="sourceOptions"
              :placeholder="$t('Выберите источник')"
              :invalid="Boolean(errors.source)"
              :disabled="!canEdit"
            />
          </FormField>
          <FormField :label="$t('Ожидаемая сумма')" for="lead-amount">
            <AmountField id="lead-amount" v-model="amountModel" :max-digits="13" />
          </FormField>
          <FormField :label="$t('Интересующая услуга')" for="lead-service" class="sm:col-span-2">
            <input
              id="lead-service"
              v-model="form.service_interest"
              :class="fieldClass"
              :placeholder="$t('Например, корпоративный сайт')"
              autocomplete="off"
            />
          </FormField>
          <FormField :label="$t('Заметка')" for="lead-notes" class="sm:col-span-2">
            <textarea id="lead-notes" v-model="form.notes" rows="3" :class="textareaClass" />
          </FormField>
        </fieldset>
      </form>

      <template v-if="lead">
        <section class="mt-7 flex flex-col gap-3 border-t border-zinc-100 pt-6">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <UserRound class="size-4 text-zinc-500" />
            {{ $t('Ответственный') }}
          </h3>
          <div v-if="canAssign" class="flex flex-col gap-2 sm:flex-row sm:items-end">
            <FormField :label="$t('Сотрудник')" for="lead-owner" class="flex-1">
              <SelectField id="lead-owner" v-model="ownerId" :options="ownerOptions" />
            </FormField>
            <button
              type="button"
              class="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
              :disabled="ownerSaving || ownerId === '' || ownerId === lead.owner_id"
              @click="saveOwner"
            >
              {{ $t('Назначить') }}
            </button>
          </div>
          <p v-else class="text-sm text-zinc-900">{{ lead.owner_name }}</p>
        </section>

        <!-- Журнал изменений сервер отдаёт только руководителю и суперадмину -->
        <section v-if="isSupervisor" class="mt-7 flex flex-col gap-4 border-t border-zinc-100 pt-6">
          <h3 class="text-sm font-semibold text-zinc-950">{{ $t('История изменений') }}</h3>
          <AuditTimeline
            entity="lead"
            :entity-id="lead.id"
            :field-labels="fieldLabels"
            :format-value="formatValue"
            :version="version"
          />
        </section>
      </template>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
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
          form="lead-form"
          class="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          :disabled="saving"
        >
          {{ isNew ? $t('Создать') : $t('Сохранить') }}
        </button>
      </div>
    </template>
  </SideDrawer>
</template>
