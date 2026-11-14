<script setup lang="ts">
import { t } from '@/i18n'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Eye, EyeOff, Lock, Plane, UserRound, Wand2 } from '@lucide/vue'
import { ApiError } from '@/api/http'
import LanguageMenu from '@/components/layout/LanguageMenu.vue'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const form = reactive({ username: '', password: '', remember: true })
const errors = reactive({ username: '', password: '', form: '' })
const showPassword = ref(false)
const loading = ref(false)

// Быстрый вход при разработке. Логин и пароль берутся из .env.local (VITE_DEV_USERNAME и VITE_DEV_PASSWORD),
// в код и в репозиторий они не попадают. Кнопка есть только в dev-режиме и только если оба значения заданы
const DEMO_CREDENTIALS = {
  username: String(import.meta.env.VITE_DEV_USERNAME ?? ''),
  password: String(import.meta.env.VITE_DEV_PASSWORD ?? ''),
}
const showDemo =
  import.meta.env.DEV && Boolean(DEMO_CREDENTIALS.username && DEMO_CREDENTIALS.password)

function fillDemo() {
  form.username = DEMO_CREDENTIALS.username
  form.password = DEMO_CREDENTIALS.password
  errors.username = ''
  errors.password = ''
  errors.form = ''
}

const redirectTo = computed(() => {
  const target = route.query.redirect
  // Только внутренние пути, иначе возможен редирект на чужой сайт
  return typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')
    ? target
    : '/modules'
})

function validate() {
  errors.username = form.username.trim() ? '' : t('Введите логин')
  errors.password = form.password ? '' : t('Введите пароль')
  errors.form = ''
  return !errors.username && !errors.password
}

async function onSubmit() {
  if (loading.value || !validate()) return
  loading.value = true
  try {
    await login(form.username, form.password, form.remember)
    await router.replace(redirectTo.value)
  } catch (error) {
    // Текст ошибки приходит с сервера уже на языке интерфейса
    errors.form = error instanceof ApiError ? error.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}

const fieldClass =
  'h-12 rounded-xl border-zinc-200 bg-white pr-4 pl-11 text-[15px] text-zinc-900 transition-colors placeholder:text-zinc-400 hover:border-zinc-300 focus-visible:border-brand-blue focus-visible:ring-brand-blue/20 md:text-[15px] dark:bg-white'
</script>

<template>
  <div class="relative grid min-h-screen place-items-center bg-white px-4 py-10">
    <div
      class="absolute top-4 right-4 z-20 rounded-xl border border-zinc-200 bg-white sm:top-6 sm:right-6"
    >
      <LanguageMenu />
    </div>

    <main class="relative w-full max-w-[440px]">
      <div class="rounded-[20px] border border-zinc-200 bg-white p-7 text-zinc-900 sm:p-9">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="grid size-10 place-items-center rounded-[14px] bg-brand text-white">
              <Plane class="size-5 -rotate-45" :stroke-width="2.25" />
            </span>
            <span class="text-xl font-semibold tracking-tight">
              AMBASSADOR <span class="text-zinc-400">CRM</span>
            </span>
          </div>

          <h1 class="mt-8 font-serif text-[32px] leading-[1.15]">{{ $t('С возвращением') }}</h1>
          <p class="mt-2 text-sm text-zinc-500">
            {{ $t('Войдите, чтобы открыть рабочий стол агентства') }}
          </p>

          <form class="mt-7 space-y-4" novalidate @submit.prevent="onSubmit">
            <div>
              <label for="username" class="mb-1.5 block text-[13px] font-medium text-zinc-700">
                {{ $t('Логин') }}
              </label>
              <div class="relative">
                <UserRound
                  class="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-zinc-400"
                />
                <Input
                  id="username"
                  v-model="form.username"
                  type="text"
                  autocomplete="username"
                  autocapitalize="none"
                  spellcheck="false"
                  :aria-invalid="Boolean(errors.username)"
                  :aria-describedby="errors.username ? 'username-error' : undefined"
                  :class="fieldClass"
                />
              </div>
              <p
                v-if="errors.username"
                id="username-error"
                role="alert"
                class="mt-1.5 text-xs text-rose-600"
              >
                {{ errors.username }}
              </p>
            </div>

            <div>
              <div class="mb-1.5 flex items-center justify-between">
                <label for="password" class="text-[13px] font-medium text-zinc-700">{{
                  $t('Пароль')
                }}</label>
                <button
                  type="button"
                  class="text-xs text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-900 hover:underline"
                >
                  {{ $t('Забыли пароль?') }}
                </button>
              </div>
              <div class="relative">
                <Lock
                  class="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-zinc-400"
                />
                <Input
                  id="password"
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  :aria-invalid="Boolean(errors.password)"
                  :aria-describedby="errors.password ? 'password-error' : undefined"
                  :class="[fieldClass, 'pr-12']"
                />
                <button
                  type="button"
                  class="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                  :aria-label="showPassword ? $t('Скрыть пароль') : $t('Показать пароль')"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-[18px]" />
                  <Eye v-else class="size-[18px]" />
                </button>
              </div>
              <p
                v-if="errors.password"
                id="password-error"
                role="alert"
                class="mt-1.5 text-xs text-rose-600"
              >
                {{ errors.password }}
              </p>
            </div>

            <div class="flex items-center justify-between gap-3">
              <label
                class="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-700 select-none"
              >
                <input
                  v-model="form.remember"
                  type="checkbox"
                  class="size-4 cursor-pointer rounded border-zinc-300 accent-zinc-950"
                />
                {{ $t('Запомнить меня') }}
              </label>

              <button
                v-if="showDemo"
                type="button"
                class="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
                @click="fillDemo"
              >
                <Wand2 class="size-3.5" />
                {{ $t('Автозаполнение') }}
              </button>
            </div>

            <p v-if="errors.form" role="alert" class="text-center text-sm text-rose-600">
              {{ errors.form }}
            </p>

            <button
              type="submit"
              :disabled="loading"
              class="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-semibold text-white shadow-[0_14px_28px_-14px_rgba(229,43,43,.55)] transition-all hover:bg-brand-dark active:translate-y-px disabled:cursor-wait disabled:opacity-80"
            >
              <span
                v-if="loading"
                class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              {{ loading ? $t('Входим…') : $t('Войти') }}
              <ArrowRight
                v-if="!loading"
                class="size-4 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </form>
        </div>
      </div>

      <p class="mt-5 text-center text-xs text-zinc-600">
        AMBASSADOR CRM v1.0.0 · Online Service Group
      </p>
    </main>
  </div>
</template>
