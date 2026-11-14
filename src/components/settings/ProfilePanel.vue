<script setup lang="ts">
import { t } from '@/i18n'
import { reactive, ref, watch } from 'vue'
import { KeyRound, UserRound } from '@lucide/vue'
import { ApiError } from '@/api/http'
import { changePassword, updateProfile } from '@/api/profile'
import { roleLabels, useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { fieldClass } from '@/components/form/field-styles'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'
import FormField from '@/components/form/FormField.vue'
import PhoneField from '@/components/form/PhoneField.vue'
import { emailError, fullNameError, passwordError, phoneError } from '@/components/users/validation'

const { user, setUser } = useAuth()
const toast = useToast()

const form = reactive({ full_name: '', email: '', phone: '' })
const errors = reactive({ full_name: '', email: '', phone: '' })
const saving = ref(false)

// Профиль подтягивается после входа асинхронно: заполняем форму, как только он пришёл
watch(
  user,
  (value) => {
    form.full_name = value?.full_name ?? ''
    form.email = value?.email ?? ''
    form.phone = value?.phone ?? ''
  },
  { immediate: true },
)

async function saveProfile() {
  errors.full_name = fullNameError(form.full_name)
  errors.email = emailError(form.email)
  errors.phone = phoneError(form.phone)
  if (saving.value || errors.full_name || errors.email || errors.phone) return
  saving.value = true
  try {
    setUser(
      await updateProfile({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone,
      }),
    )
    toast.success(t('Профиль обновлён'))
  } catch (error) {
    const message = error instanceof ApiError ? error.message : t('Ошибка сервера')
    if (message.toLowerCase().includes('email')) errors.email = message
    else if (message.toLowerCase().includes('телефон')) errors.phone = message
    else toast.error(t('Не удалось сохранить профиль'), message)
  } finally {
    saving.value = false
  }
}

const pwd = reactive({ old: '', next: '', confirm: '' })
const pwdErrors = reactive({ old: '', next: '', confirm: '' })
const changing = ref(false)

async function savePassword() {
  pwdErrors.old = pwd.old ? '' : t('Введите текущий пароль')
  pwdErrors.next = passwordError(pwd.next, true)
  pwdErrors.confirm = pwd.confirm === pwd.next ? '' : t('Пароли не совпадают')
  if (changing.value || pwdErrors.old || pwdErrors.next || pwdErrors.confirm) return
  changing.value = true
  try {
    await changePassword(pwd.old, pwd.next)
    Object.assign(pwd, { old: '', next: '', confirm: '' })
    toast.success(t('Пароль изменён'))
  } catch (error) {
    const message = error instanceof ApiError ? error.message : t('Ошибка сервера')
    if (message.toLowerCase().includes('текущий')) pwdErrors.old = message
    else pwdErrors.next = message
  } finally {
    changing.value = false
  }
}

const ids = {
  fullName: 'profile-full-name',
  email: 'profile-email',
  phone: 'profile-phone',
  old: 'password-old',
  next: 'password-new',
  confirm: 'password-confirm',
}
</script>

<template>
  <BasePanel class="flex flex-col gap-6">
    <PanelHeader :icon="UserRound" :title="$t('Профиль')" />
    <p v-if="user" class="-mt-3 text-sm text-zinc-500">
      @{{ user.username }} · {{ roleLabels[user.role] }}
    </p>

    <form class="grid gap-4 md:grid-cols-2 xl:grid-cols-3" novalidate @submit.prevent="saveProfile">
      <FormField :label="$t('Имя и фамилия')" :for="ids.fullName" :error="errors.full_name">
        <input
          :id="ids.fullName"
          v-model="form.full_name"
          :class="fieldClass"
          :aria-invalid="Boolean(errors.full_name) || undefined"
          autocomplete="name"
        />
      </FormField>
      <FormField :label="$t('Email')" :for="ids.email" required :error="errors.email">
        <input
          :id="ids.email"
          v-model="form.email"
          type="email"
          :class="fieldClass"
          :aria-invalid="Boolean(errors.email) || undefined"
          autocomplete="email"
        />
      </FormField>
      <FormField :label="$t('Телефон')" :for="ids.phone" :error="errors.phone">
        <PhoneField :id="ids.phone" v-model="form.phone" :invalid="Boolean(errors.phone)" />
      </FormField>
      <div class="md:col-span-2 xl:col-span-3">
        <button
          type="submit"
          class="h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
          :disabled="saving"
        >
          {{ $t('Сохранить профиль') }}
        </button>
      </div>
    </form>

    <form
      class="grid gap-4 border-t border-zinc-100 pt-6 md:grid-cols-2 xl:grid-cols-3"
      novalidate
      @submit.prevent="savePassword"
    >
      <h3
        class="flex items-center gap-2 text-sm font-semibold text-zinc-950 md:col-span-2 xl:col-span-3"
      >
        <KeyRound class="size-4 text-zinc-500" />
        {{ $t('Смена пароля') }}
      </h3>
      <FormField :label="$t('Текущий пароль')" :for="ids.old" :error="pwdErrors.old">
        <input
          :id="ids.old"
          v-model="pwd.old"
          type="password"
          :class="fieldClass"
          :aria-invalid="Boolean(pwdErrors.old) || undefined"
          autocomplete="current-password"
        />
      </FormField>
      <FormField
        :label="$t('Новый пароль')"
        :for="ids.next"
        :error="pwdErrors.next"
        :hint="$t('От 8 символов: буквы, цифры и хотя бы один символ')"
      >
        <input
          :id="ids.next"
          v-model="pwd.next"
          type="password"
          :class="fieldClass"
          :aria-invalid="Boolean(pwdErrors.next) || undefined"
          autocomplete="new-password"
        />
      </FormField>
      <FormField :label="$t('Повторите пароль')" :for="ids.confirm" :error="pwdErrors.confirm">
        <input
          :id="ids.confirm"
          v-model="pwd.confirm"
          type="password"
          :class="fieldClass"
          :aria-invalid="Boolean(pwdErrors.confirm) || undefined"
          autocomplete="new-password"
        />
      </FormField>
      <div class="md:col-span-2 xl:col-span-3">
        <button
          type="submit"
          class="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:opacity-60"
          :disabled="changing"
        >
          {{ $t('Изменить пароль') }}
        </button>
      </div>
    </form>
  </BasePanel>
</template>
