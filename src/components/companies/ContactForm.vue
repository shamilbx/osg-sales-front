<script setup lang="ts">
import { t } from '@/i18n'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ApiError } from '@/api/http'
import {
  createContact,
  updateContact,
  type Contact,
  type ContactForm,
  type Duplicate,
} from '@/api/companies'
import { fieldClass, textareaClass } from '@/components/form/field-styles'
import FormField from '@/components/form/FormField.vue'
import PhoneField from '@/components/form/PhoneField.vue'
import ToggleSwitch from '@/components/form/ToggleSwitch.vue'
import {
  contactChannelError,
  contactEmailError,
  contactNameError,
  contactPhoneError,
  telegramError,
} from '@/components/companies/validation'

// contact: null — новый контакт; first — у компании ещё нет контактов, он станет основным сам
const props = defineProps<{ companyId: number; contact: Contact | null; first: boolean }>()
const emit = defineEmits<{ saved: [contact: Contact]; cancel: [] }>()

const router = useRouter()

const form = reactive<ContactForm>({
  full_name: props.contact?.full_name ?? '',
  position: props.contact?.position ?? '',
  phone: props.contact?.phone ?? '',
  email: props.contact?.email ?? '',
  telegram: props.contact?.telegram ?? '',
  notes: props.contact?.notes ?? '',
})
const primary = ref(false)
const errors = reactive({ full_name: '', phone: '', email: '', telegram: '', channel: '' })
const duplicate = ref<{ message: string; found: Duplicate } | null>(null)
const serverError = ref('')
const saving = ref(false)

function validate() {
  errors.full_name = contactNameError(form.full_name)
  errors.phone = contactPhoneError(form.phone)
  errors.email = contactEmailError(form.email)
  errors.telegram = telegramError(form.telegram)
  errors.channel =
    errors.phone || errors.email || errors.telegram
      ? ''
      : contactChannelError(form.phone, form.email, form.telegram)
  return !Object.values(errors).some(Boolean)
}

async function save() {
  if (saving.value || !validate()) return
  saving.value = true
  duplicate.value = null
  serverError.value = ''
  try {
    const saved = props.contact
      ? await updateContact(props.contact.id, form)
      : await createContact(props.companyId, { ...form, is_primary: primary.value })
    emit('saved', saved)
  } catch (error) {
    if (error instanceof ApiError && error.data?.duplicate) {
      duplicate.value = { message: error.message, found: error.data.duplicate as Duplicate }
    } else {
      serverError.value = error instanceof ApiError ? error.message : t('Ошибка сервера')
    }
  } finally {
    saving.value = false
  }
}

// Контакт уже есть в другой компании: ведём в её карточку
const openDuplicate = () =>
  duplicate.value && router.push(`/companies/${duplicate.value.found.company_id}`)
</script>

<template>
  <form
    class="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4"
    novalidate
    @submit.prevent="save"
  >
    <p class="text-sm font-semibold text-zinc-950">
      {{ contact ? $t('Изменить контакт') : $t('Новый контакт') }}
    </p>

    <div
      v-if="duplicate"
      role="alert"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
    >
      <span>
        {{ duplicate.message }}:
        <b>{{ duplicate.found.name }}</b>
        ({{ $t('компания «{name}»', { name: duplicate.found.company_name }) }})
      </span>
      <button
        type="button"
        class="h-9 rounded-xl border border-amber-300 bg-white px-3.5 text-[13px] font-semibold text-amber-900 transition-colors hover:bg-amber-100"
        @click="openDuplicate"
      >
        {{ $t('Открыть компанию') }}
      </button>
    </div>
    <p
      v-if="serverError"
      role="alert"
      class="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
    >
      {{ serverError }}
    </p>

    <div class="grid gap-4 sm:grid-cols-2">
      <FormField :label="$t('Имя и фамилия')" for="contact-name" required :error="errors.full_name">
        <input
          id="contact-name"
          v-model="form.full_name"
          :class="fieldClass"
          :aria-invalid="Boolean(errors.full_name) || undefined"
          autocomplete="off"
        />
      </FormField>
      <FormField :label="$t('Должность')" for="contact-position">
        <input
          id="contact-position"
          v-model="form.position"
          :class="fieldClass"
          autocomplete="off"
        />
      </FormField>
      <FormField :label="$t('Телефон')" for="contact-phone" :error="errors.phone">
        <PhoneField id="contact-phone" v-model="form.phone" :invalid="Boolean(errors.phone)" />
      </FormField>
      <FormField :label="$t('Email')" for="contact-email" :error="errors.email">
        <input
          id="contact-email"
          v-model="form.email"
          type="email"
          :class="fieldClass"
          :aria-invalid="Boolean(errors.email) || undefined"
          autocomplete="off"
        />
      </FormField>
      <FormField :label="$t('Telegram')" for="contact-telegram" :error="errors.telegram">
        <input
          id="contact-telegram"
          v-model="form.telegram"
          :class="fieldClass"
          :aria-invalid="Boolean(errors.telegram) || undefined"
          placeholder="@username"
          autocomplete="off"
        />
      </FormField>
      <FormField :label="$t('Заметка')" for="contact-notes" class="sm:col-span-2">
        <textarea id="contact-notes" v-model="form.notes" rows="2" :class="textareaClass" />
      </FormField>
    </div>
    <p v-if="errors.channel" role="alert" class="-mt-2 text-xs text-rose-600">
      {{ errors.channel }}
    </p>

    <ToggleSwitch
      v-if="!contact && !first"
      v-model="primary"
      :label="$t('Сделать основным контактом')"
    />
    <p v-else-if="!contact" class="text-xs text-zinc-500">
      {{ $t('Первый контакт компании становится основным') }}
    </p>

    <div class="flex justify-end gap-2">
      <button
        type="button"
        class="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-[13px] font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
        @click="emit('cancel')"
      >
        {{ $t('Отмена') }}
      </button>
      <button
        type="submit"
        class="h-10 rounded-xl bg-zinc-950 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
        :disabled="saving"
      >
        {{ contact ? $t('Сохранить') : $t('Добавить контакт') }}
      </button>
    </div>
  </form>
</template>
