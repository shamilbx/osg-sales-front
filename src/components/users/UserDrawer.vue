<script setup lang="ts">
import { t } from '@/i18n'
import { computed, reactive, ref, watch } from 'vue'
import { KeyRound, ShieldCheck, UserRound } from '@lucide/vue'
import { ApiError } from '@/api/http'
import {
  createUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  type StaffUser,
} from '@/api/users'
import { roleLabels, useAuth, type Role } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { formatDateTime } from '@/lib/dates'
import { formatPhone } from '@/lib/phone'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/components/form/field-styles'
import FormField from '@/components/form/FormField.vue'
import PhoneField from '@/components/form/PhoneField.vue'
import SelectField from '@/components/form/SelectField.vue'
import ToggleSwitch from '@/components/form/ToggleSwitch.vue'
import SideDrawer from '@/components/common/SideDrawer.vue'
import AuditTimeline from '@/components/audit/AuditTimeline.vue'
import { initials, roleBadge, roleOptions } from '@/components/users/roles'
import {
  emailError,
  fullNameError,
  passwordError,
  phoneError,
  usernameError,
} from '@/components/users/validation'

// user: null — создание нового сотрудника, иначе карточка существующего
const props = defineProps<{ user: StaffUser | null }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ saved: [user: StaffUser] }>()

const toast = useToast()
const { user: me } = useAuth()

const isNew = computed(() => props.user === null)
const isSelf = computed(() => props.user !== null && props.user.id === me.value?.id)

const form = reactive({ username: '', full_name: '', email: '', phone: '', password: '' })
const role = ref<Role | ''>('manager')
const errors = reactive({ username: '', full_name: '', email: '', phone: '', password: '' })
const saving = ref(false)
const roleSaving = ref(false)
const statusSaving = ref(false)
// Меняется после каждого сохранения, чтобы история изменений подтянулась заново
const version = ref(0)

const active = ref(true)

function fill() {
  const u = props.user
  form.username = u?.username ?? ''
  form.full_name = u?.full_name ?? ''
  form.email = u?.email ?? ''
  form.phone = u?.phone ?? ''
  form.password = ''
  role.value = u?.role ?? 'manager'
  active.value = u?.status ?? true
  Object.assign(errors, { username: '', full_name: '', email: '', phone: '', password: '' })
}

watch(() => [open.value, props.user], fill, { immediate: true })

const fieldLabels: Record<string, string> = {
  get username() {
    return t('Логин')
  },
  get email() {
    return t('Email')
  },
  get full_name() {
    return t('Имя')
  },
  get phone() {
    return t('Телефон')
  },
  get role() {
    return t('Роль')
  },
  get status() {
    return t('Доступ в CRM')
  },
  get password() {
    return t('Пароль')
  },
}

function formatValue(field: string, value: unknown) {
  if (field === 'role') return roleLabels[value as Role] ?? String(value)
  if (field === 'status') return value ? t('Открыт') : t('Заблокирован')
  if (field === 'phone') return formatPhone(String(value))
  return String(value)
}

function validate() {
  errors.username = usernameError(form.username)
  errors.full_name = fullNameError(form.full_name)
  errors.email = emailError(form.email)
  errors.phone = phoneError(form.phone)
  errors.password = passwordError(form.password, isNew.value)
  return !Object.values(errors).some(Boolean)
}

// Ошибка сервера про конкретное поле показывается у поля, остальные — всплывающим уведомлением
function serverError(error: unknown, title: string) {
  const message = error instanceof ApiError ? error.message : t('Ошибка сервера')
  const lower = message.toLowerCase()
  if (lower.includes('username')) errors.username = message
  else if (lower.includes('email')) errors.email = message
  else if (lower.includes('телефон')) errors.phone = message
  else if (lower.includes('пароль')) errors.password = message
  else toast.error(title, message)
}

async function save() {
  if (saving.value || !validate()) return
  saving.value = true
  const data = {
    username: form.username.trim(),
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone: form.phone,
  }
  try {
    if (props.user) {
      const updated = await updateUser(props.user.id, { ...data, password: form.password })
      form.password = ''
      version.value++
      toast.success(t('Данные сотрудника обновлены'))
      emit('saved', updated)
    } else {
      const created = await createUser({
        ...data,
        password: form.password,
        role: role.value as Role,
      })
      toast.success(t('Сотрудник создан'), created.full_name || created.username)
      emit('saved', created)
    }
  } catch (error) {
    serverError(error, props.user ? t('Не удалось сохранить') : t('Не удалось создать сотрудника'))
  } finally {
    saving.value = false
  }
}

async function saveRole() {
  if (!props.user || !role.value || role.value === props.user.role || roleSaving.value) return
  roleSaving.value = true
  try {
    await updateUserRole(props.user.id, role.value)
    toast.success(t('Роль обновлена'), roleLabels[role.value])
    version.value++
    emit('saved', { ...props.user, role: role.value })
  } catch (error) {
    role.value = props.user.role
    toast.error(
      t('Не удалось изменить роль'),
      error instanceof ApiError ? error.message : undefined,
    )
  } finally {
    roleSaving.value = false
  }
}

async function toggleStatus(next: boolean) {
  if (!props.user || statusSaving.value) return
  statusSaving.value = true
  active.value = next
  try {
    await updateUserStatus(props.user.id, next)
    toast.success(next ? t('Сотрудник разблокирован') : t('Сотрудник заблокирован'))
    version.value++
    emit('saved', { ...props.user, status: next })
  } catch (error) {
    active.value = !next
    toast.error(
      t('Не удалось изменить доступ'),
      error instanceof ApiError ? error.message : undefined,
    )
  } finally {
    statusSaving.value = false
  }
}

const title = computed(() =>
  props.user ? props.user.full_name || props.user.username : t('Новый сотрудник'),
)
const ids = {
  username: 'user-username',
  fullName: 'user-full-name',
  email: 'user-email',
  phone: 'user-phone',
  password: 'user-password',
  role: 'user-role',
}
</script>

<template>
  <SideDrawer v-model:open="open" :title="title">
    <template #header>
      <div class="flex items-center gap-3">
        <span
          class="grid size-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-amber-200 to-rose-300 text-sm font-semibold text-slate-900"
        >
          <UserRound v-if="isNew" class="size-5" />
          <template v-else>{{ initials(title) }}</template>
        </span>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold tracking-tight text-zinc-950">{{ title }}</h2>
          <p v-if="user" class="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span
              :class="
                cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                  roleBadge[user.role],
                )
              "
              >{{ roleLabels[user.role] }}</span
            >
            <span>@{{ user.username }}</span>
          </p>
          <p v-else class="text-xs text-zinc-500">{{ $t('Учётная запись для входа в CRM') }}</p>
        </div>
      </div>
    </template>

    <form id="user-form" class="flex flex-col gap-4" novalidate @submit.prevent="save">
      <h3 class="text-sm font-semibold text-zinc-950">{{ $t('Данные') }}</h3>
      <div class="grid gap-4 sm:grid-cols-2">
        <FormField :label="$t('Имя и фамилия')" :for="ids.fullName" :error="errors.full_name">
          <input
            :id="ids.fullName"
            v-model="form.full_name"
            :class="fieldClass"
            :aria-invalid="Boolean(errors.full_name) || undefined"
            autocomplete="off"
          />
        </FormField>
        <FormField :label="$t('Логин')" :for="ids.username" required :error="errors.username">
          <input
            :id="ids.username"
            v-model="form.username"
            :class="fieldClass"
            :aria-invalid="Boolean(errors.username) || undefined"
            autocomplete="off"
          />
        </FormField>
        <FormField :label="$t('Email')" :for="ids.email" required :error="errors.email">
          <input
            :id="ids.email"
            v-model="form.email"
            type="email"
            :class="fieldClass"
            :aria-invalid="Boolean(errors.email) || undefined"
            autocomplete="off"
          />
        </FormField>
        <FormField :label="$t('Телефон')" :for="ids.phone" :error="errors.phone">
          <PhoneField :id="ids.phone" v-model="form.phone" :invalid="Boolean(errors.phone)" />
        </FormField>
        <FormField v-if="isNew" :label="$t('Роль')" :for="ids.role" required>
          <SelectField :id="ids.role" v-model="role" :options="roleOptions()" />
        </FormField>
        <FormField
          :label="isNew ? $t('Пароль') : $t('Новый пароль')"
          :for="ids.password"
          :required="isNew"
          :error="errors.password"
          :hint="
            isNew
              ? $t('От 8 символов: буквы, цифры и хотя бы один символ')
              : $t('Оставьте пустым, чтобы не менять')
          "
        >
          <input
            :id="ids.password"
            v-model="form.password"
            type="password"
            :class="fieldClass"
            :aria-invalid="Boolean(errors.password) || undefined"
            autocomplete="new-password"
          />
        </FormField>
      </div>
    </form>

    <template v-if="user">
      <section class="mt-7 flex flex-col gap-4 border-t border-zinc-100 pt-6">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-zinc-950">
          <ShieldCheck class="size-4 text-zinc-500" />
          {{ $t('Роль и доступ') }}
        </h3>
        <p v-if="isSelf" class="text-xs text-zinc-500">
          {{ $t('Свою роль и доступ может изменить только другой суперадмин') }}
        </p>
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end">
          <FormField :label="$t('Роль')" :for="ids.role" class="flex-1">
            <SelectField
              :id="ids.role"
              v-model="role"
              :options="roleOptions()"
              :disabled="isSelf"
            />
          </FormField>
          <button
            type="button"
            class="h-11 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
            :disabled="isSelf || roleSaving || role === user.role"
            @click="saveRole"
          >
            {{ $t('Сменить роль') }}
          </button>
        </div>
        <div class="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3">
          <div>
            <p class="text-sm font-semibold text-zinc-950">{{ $t('Доступ в CRM') }}</p>
            <p class="text-xs text-zinc-500">
              {{
                user.last_login_at
                  ? $t('Последний вход: {date}', { date: formatDateTime(user.last_login_at) })
                  : $t('Ещё не входил')
              }}
            </p>
          </div>
          <ToggleSwitch
            :model-value="active"
            :label="active ? $t('Открыт') : $t('Заблокирован')"
            :class="cn((isSelf || statusSaving) && 'pointer-events-none opacity-50')"
            :aria-disabled="isSelf || statusSaving"
            @update:model-value="toggleStatus"
          />
        </div>
      </section>

      <section class="mt-7 flex flex-col gap-4 border-t border-zinc-100 pt-6">
        <h3 class="flex items-center gap-2 text-sm font-semibold text-zinc-950">
          <KeyRound class="size-4 text-zinc-500" />
          {{ $t('История изменений') }}
        </h3>
        <AuditTimeline
          entity="user"
          :entity-id="user.id"
          :field-labels="fieldLabels"
          :format-value="formatValue"
          :version="version"
        />
      </section>
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
          type="submit"
          form="user-form"
          class="h-11 rounded-xl bg-zinc-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-60"
          :disabled="saving"
        >
          {{ isNew ? $t('Создать сотрудника') : $t('Сохранить') }}
        </button>
      </div>
    </template>
  </SideDrawer>
</template>
