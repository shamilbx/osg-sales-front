<script setup lang="ts">
import { t } from '@/i18n'
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import {
  createCompany,
  createContact,
  socialNetworks,
  type ContactForm,
  type Duplicate,
} from '@/api/companies'
import { listOwners, ownerName, type Owner } from '@/api/staff'
import { roleLabels, useAuth } from '@/composables/useAuth'
import { useDictionaries } from '@/composables/useDictionaries'
import { useToast } from '@/composables/useToast'
import { fieldClass, textareaClass } from '@/components/form/field-styles'
import FormField from '@/components/form/FormField.vue'
import FormPageHeader from '@/components/form/FormPageHeader.vue'
import FormSection from '@/components/form/FormSection.vue'
import PhoneField from '@/components/form/PhoneField.vue'
import SelectField from '@/components/form/SelectField.vue'
import {
  companyNameError,
  contactChannelError,
  contactEmailError,
  contactNameError,
  contactPhoneError,
  socialError,
  taxIdError,
  telegramError,
  websiteError,
} from '@/components/companies/validation'

const router = useRouter()
const toast = useToast()
const { user: me } = useAuth()
const dictionaries = useDictionaries()
void dictionaries.load()

const form = reactive({
  name: '',
  tax_id: '',
  industry_id: 0,
  sphere_id: 0,
  website: '',
  address: '',
  notes: '',
})
const social = reactive<Record<string, string>>({})
const contact = reactive<ContactForm>({
  full_name: '',
  position: '',
  phone: '',
  email: '',
  telegram: '',
  notes: '',
})
const errors = reactive({
  name: '',
  tax_id: '',
  industry: '',
  sphere: '',
  website: '',
  social: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  contactTelegram: '',
  contactChannel: '',
})
const duplicate = ref<{ message: string; found: Duplicate } | null>(null)
const formError = ref('')
const saving = ref(false)

// Ответственного может назначить только суперадмин; у менеджера им становится он сам
const canPickOwner = computed(() => me.value?.role === 'superadmin')
const owners = ref<Owner[]>([])
const ownerId = ref<number | ''>('')
if (canPickOwner.value) {
  listOwners()
    .then((items) => (owners.value = items))
    .catch(() => {})
}
const ownerOptions = computed(() =>
  owners.value.map((o) => ({ value: o.id, label: `${ownerName(o)} · ${roleLabels[o.role]}` })),
)

const industryOptions = computed(() =>
  dictionaries.industries.value.map((i) => ({ value: i.id, label: i.name })),
)
const sphereOptions = computed(() =>
  dictionaries.spheresOf(form.industry_id || '').map((s) => ({ value: s.id, label: s.name })),
)
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

// Контакт необязателен, но если начат (заполнено хоть одно поле), он проверяется целиком
const contactStarted = computed(() =>
  [
    contact.full_name,
    contact.position,
    contact.phone.replace(/\D/g, ''),
    contact.email,
    contact.telegram,
    contact.notes,
  ].some((value) => value.trim() !== ''),
)

function validate() {
  errors.name = companyNameError(form.name)
  errors.tax_id = taxIdError(form.tax_id)
  errors.industry = form.industry_id ? '' : t('Выберите отрасль')
  errors.sphere = form.sphere_id ? '' : t('Выберите сферу')
  errors.website = websiteError(form.website)
  errors.social = socialNetworks.map((n) => socialError(social[n] ?? '')).find(Boolean) ?? ''
  if (contactStarted.value) {
    errors.contactName = contactNameError(contact.full_name)
    errors.contactPhone = contactPhoneError(contact.phone)
    errors.contactEmail = contactEmailError(contact.email)
    errors.contactTelegram = telegramError(contact.telegram)
    errors.contactChannel =
      errors.contactPhone || errors.contactEmail || errors.contactTelegram
        ? ''
        : contactChannelError(contact.phone, contact.email, contact.telegram)
  } else {
    errors.contactName = errors.contactPhone = errors.contactEmail = ''
    errors.contactTelegram = errors.contactChannel = ''
  }
  return !Object.values(errors).some(Boolean)
}

// Сервер сообщил о дубликате компании: показываем, на что наткнулись, и отмечаем поле
function showCompanyError(error: unknown) {
  if (error instanceof ApiError && error.data?.duplicate) {
    duplicate.value = { message: error.message, found: error.data.duplicate as Duplicate }
    window.scrollTo({ top: 0 })
    document.querySelector('main, .app-content')?.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }
  const message = error instanceof ApiError ? error.message : t('Ошибка сервера')
  const lower = message.toLowerCase()
  if (lower.includes('инн')) errors.tax_id = message
  else if (lower.includes('сайт')) errors.website = message
  else if (lower.includes('названи')) errors.name = message
  else formError.value = message
}

async function submit() {
  if (saving.value || !validate()) return
  saving.value = true
  duplicate.value = null
  formError.value = ''

  let companyId: number
  try {
    const created = await createCompany({
      name: form.name.trim(),
      tax_id: form.tax_id.trim(),
      industry_id: form.industry_id,
      sphere_id: form.sphere_id,
      website: form.website.trim(),
      address: form.address.trim(),
      social_links: Object.fromEntries(Object.entries(social).filter(([, value]) => value?.trim())),
      notes: form.notes.trim(),
      ...(canPickOwner.value && ownerId.value !== '' ? { owner_id: ownerId.value } : {}),
    })
    companyId = created.id
  } catch (error) {
    showCompanyError(error)
    saving.value = false
    return
  }

  // Компания уже создана. Если контакт не сохранился (например, такой телефон уже есть у другой компании),
  // сообщаем об этом и открываем карточку, где его можно поправить
  if (contactStarted.value) {
    try {
      await createContact(companyId, { ...contact, is_primary: true })
    } catch (error) {
      toast.error(
        t('Клиент создан, но контакт не сохранён'),
        error instanceof ApiError ? error.message : undefined,
      )
      await router.push(`/clients/${companyId}`)
      return
    }
  }

  toast.success(t('Клиент создан'), form.name.trim())
  await router.push(`/clients/${companyId}`)
}

const openDuplicate = () => duplicate.value && router.push(`/clients/${duplicate.value.found.id}`)

const sectionGrid = 'grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-3'

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
</script>

<template>
  <form class="flex min-h-full flex-col gap-4" novalidate @submit.prevent="submit">
    <FormPageHeader
      :title="$t('Добавить клиента')"
      :subtitle="$t('Заполните данные клиента, его социальные сети и контактное лицо')"
      back-to="/clients"
      :back-label="$t('Клиенты')"
    />

    <div
      v-if="duplicate"
      role="alert"
      class="glass flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-5 py-4 text-sm text-amber-900 ring-1 ring-amber-200 sm:px-6"
    >
      <span>
        {{ duplicate.message }}: <b>{{ duplicate.found.name }}</b>
        <template v-if="duplicate.found.owner">
          ({{ $t('ответственный: {name}', { name: duplicate.found.owner }) }})
        </template>
      </span>
      <button
        type="button"
        class="h-10 rounded-xl border border-amber-300 bg-white px-4 text-[13px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
        @click="openDuplicate"
      >
        {{ $t('Открыть карточку') }}
      </button>
    </div>

    <FormSection :number="1" :title="$t('Основная информация')">
      <div :class="sectionGrid">
        <FormField
          :label="$t('Название клиента')"
          :for="ids.name"
          required
          :error="errors.name"
          class="sm:col-span-2 xl:col-span-3"
        >
          <input
            :id="ids.name"
            v-model="form.name"
            type="text"
            autocomplete="off"
            :placeholder="$t('Например, ООО «Орзу Маркет»')"
            :aria-invalid="!!errors.name || undefined"
            :class="fieldClass"
          />
        </FormField>
        <FormField :label="$t('Отрасль')" :for="ids.industry" required :error="errors.industry">
          <SelectField
            :id="ids.industry"
            v-model="industryModel"
            :options="industryOptions"
            :placeholder="$t('Выберите отрасль')"
            :invalid="!!errors.industry"
          />
        </FormField>
        <FormField :label="$t('Сфера')" :for="ids.sphere" required :error="errors.sphere">
          <SelectField
            :id="ids.sphere"
            v-model="sphereModel"
            :options="sphereOptions"
            :placeholder="form.industry_id ? $t('Выберите сферу') : $t('Сначала выберите отрасль')"
            :invalid="!!errors.sphere"
            :disabled="!form.industry_id"
          />
        </FormField>
        <FormField
          :label="$t('ИНН')"
          :for="ids.taxId"
          :error="errors.tax_id"
          :hint="$t('От 9 до 14 цифр')"
        >
          <input
            :id="ids.taxId"
            v-model="form.tax_id"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            :aria-invalid="!!errors.tax_id || undefined"
            :class="fieldClass"
          />
        </FormField>
        <FormField :label="$t('Сайт')" :for="ids.website" :error="errors.website">
          <input
            :id="ids.website"
            v-model="form.website"
            type="text"
            autocomplete="off"
            placeholder="example.uz"
            :aria-invalid="!!errors.website || undefined"
            :class="fieldClass"
          />
        </FormField>
        <FormField :label="$t('Адрес')" :for="ids.address" class="sm:col-span-2">
          <input
            :id="ids.address"
            v-model="form.address"
            type="text"
            autocomplete="off"
            :class="fieldClass"
          />
        </FormField>
      </div>
    </FormSection>

    <FormSection :number="2" :title="$t('Социальные сети')">
      <div :class="sectionGrid">
        <FormField
          v-for="network in socialNetworks"
          :key="network"
          :label="socialLabels[network]!"
          :for="`social-${network}`"
        >
          <input
            :id="`social-${network}`"
            v-model="social[network]"
            type="text"
            autocomplete="off"
            :placeholder="
              network === 'telegram' || network === 'instagram' ? '@username' : 'https://…'
            "
            :class="fieldClass"
          />
        </FormField>
      </div>
      <p v-if="errors.social" role="alert" class="-mt-2 text-xs text-rose-600">
        {{ errors.social }}
      </p>
    </FormSection>

    <FormSection :number="3" :title="$t('Контактное лицо')">
      <p class="-mt-2 text-sm text-zinc-500">
        {{
          $t('Необязательно. Контакт станет основным; остальных можно добавить в карточке клиента.')
        }}
      </p>
      <div :class="sectionGrid">
        <FormField
          :label="$t('Имя и фамилия')"
          for="contact-name"
          :required="contactStarted"
          :error="errors.contactName"
        >
          <input
            id="contact-name"
            v-model="contact.full_name"
            type="text"
            autocomplete="off"
            :placeholder="$t('Например, Азиз Юлдашев')"
            :aria-invalid="!!errors.contactName || undefined"
            :class="fieldClass"
          />
        </FormField>
        <FormField :label="$t('Должность')" for="contact-position">
          <input
            id="contact-position"
            v-model="contact.position"
            type="text"
            autocomplete="off"
            :class="fieldClass"
          />
        </FormField>
        <FormField :label="$t('Телефон')" for="contact-phone" :error="errors.contactPhone">
          <PhoneField id="contact-phone" v-model="contact.phone" :invalid="!!errors.contactPhone" />
        </FormField>
        <FormField label="Email" for="contact-email" :error="errors.contactEmail">
          <input
            id="contact-email"
            v-model="contact.email"
            type="email"
            autocomplete="off"
            placeholder="client@example.com"
            :aria-invalid="!!errors.contactEmail || undefined"
            :class="fieldClass"
          />
        </FormField>
        <FormField label="Telegram" for="contact-telegram" :error="errors.contactTelegram">
          <input
            id="contact-telegram"
            v-model="contact.telegram"
            type="text"
            autocomplete="off"
            placeholder="@username"
            :aria-invalid="!!errors.contactTelegram || undefined"
            :class="fieldClass"
          />
        </FormField>
      </div>
      <p v-if="errors.contactChannel" role="alert" class="-mt-2 text-xs text-rose-600">
        {{ errors.contactChannel }}
      </p>
    </FormSection>

    <FormSection :number="4" :title="$t('Дополнительно')">
      <div :class="sectionGrid">
        <FormField
          v-if="canPickOwner"
          :label="$t('Ответственный')"
          :for="ids.owner"
          :hint="$t('По умолчанию — вы')"
        >
          <SelectField
            :id="ids.owner"
            v-model="ownerId"
            :options="ownerOptions"
            :placeholder="$t('Я')"
          />
        </FormField>
        <FormField :label="$t('Заметка')" :for="ids.notes" class="sm:col-span-2 xl:col-span-3">
          <textarea :id="ids.notes" v-model="form.notes" rows="3" :class="textareaClass" />
        </FormField>
      </div>
    </FormSection>

    <div
      class="glass mt-auto flex flex-wrap items-center justify-between gap-3 rounded-[18px] px-5 py-4 sm:px-6 sm:py-5"
    >
      <p v-if="formError" role="alert" class="text-sm text-rose-600">{{ formError }}</p>
      <div class="ml-auto flex gap-3">
        <RouterLink
          to="/clients"
          class="flex h-12 items-center rounded-xl border border-zinc-200 bg-white px-6 text-[15px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
        >
          {{ $t('Отмена') }}
        </RouterLink>
        <button
          type="submit"
          :disabled="saving"
          class="h-12 rounded-xl bg-brand px-7 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-70"
        >
          {{ $t('Сохранить клиента') }}
        </button>
      </div>
    </div>
  </form>
</template>
