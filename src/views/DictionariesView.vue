<script setup lang="ts">
import { t } from '@/i18n'
import { computed, ref } from 'vue'
import { Check, ListTree, Pencil, Plus, X } from '@lucide/vue'
import { ApiError } from '@/api/http'
import {
  createIndustry,
  createSphere,
  listIndustries,
  updateIndustry,
  updateSphere,
  type Industry,
  type Sphere,
} from '@/api/dictionaries'
import { useDictionaries } from '@/composables/useDictionaries'
import { useToast } from '@/composables/useToast'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/components/form/field-styles'
import ToggleSwitch from '@/components/form/ToggleSwitch.vue'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'

const toast = useToast()
const dictionaries = useDictionaries()

const industries = ref<Industry[]>([])
const selectedId = ref<number | null>(null)
const loading = ref(false)
const error = ref('')

const selected = computed(() => industries.value.find((i) => i.id === selectedId.value) ?? null)

async function load() {
  loading.value = true
  try {
    industries.value = await listIndustries()
    if (!selected.value) selectedId.value = industries.value[0]?.id ?? null
    error.value = ''
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : t('Ошибка сервера')
  } finally {
    loading.value = false
  }
}
void load()

// Что бы ни поменялось здесь, формы и фильтры компаний должны увидеть новое
async function refresh() {
  await load()
  void dictionaries.load(true)
}

const newIndustry = ref('')
const newSphere = ref('')
// Переименование: ключ вида «industry-3» или «sphere-7» и текст в поле
const renaming = ref<{ key: string; value: string } | null>(null)

const startRename = (key: string, value: string) => (renaming.value = { key, value })

function fail(e: unknown, title: string) {
  toast.error(title, e instanceof ApiError ? e.message : undefined)
}

async function addIndustry() {
  const name = newIndustry.value.trim()
  if (!name) return
  try {
    const created = await createIndustry(name)
    newIndustry.value = ''
    selectedId.value = created.id
    toast.success(t('Отрасль добавлена'), name)
    await refresh()
  } catch (e) {
    fail(e, t('Не удалось добавить отрасль'))
  }
}

async function addSphere() {
  const name = newSphere.value.trim()
  if (!name || !selected.value) return
  try {
    await createSphere(selected.value.id, name)
    newSphere.value = ''
    toast.success(t('Сфера добавлена'), name)
    await refresh()
  } catch (e) {
    fail(e, t('Не удалось добавить сферу'))
  }
}

async function saveRename() {
  const current = renaming.value
  if (!current) return
  const [kind, rawId] = current.key.split('-')
  const id = Number(rawId)
  try {
    if (kind === 'industry') await updateIndustry(id, { name: current.value })
    else await updateSphere(id, { name: current.value })
    renaming.value = null
    toast.success(t('Название обновлено'))
    await refresh()
  } catch (e) {
    fail(e, t('Не удалось переименовать'))
  }
}

async function toggleIndustry(industry: Industry, active: boolean) {
  try {
    await updateIndustry(industry.id, { is_active: active })
    await refresh()
  } catch (e) {
    fail(e, t('Не удалось изменить'))
  }
}

async function toggleSphere(sphere: Sphere, active: boolean) {
  try {
    await updateSphere(sphere.id, { is_active: active })
    await refresh()
  } catch (e) {
    fail(e, t('Не удалось изменить'))
  }
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Справочники') }}</h1>
      <p class="mt-1 text-sm text-zinc-700">
        {{
          $t(
            'Отрасли и сферы клиентов. Записи отключаются, а не удаляются: на них ссылаются компании.',
          )
        }}
      </p>
    </header>

    <p v-if="error" role="alert" class="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ error }}
    </p>

    <div class="grid gap-4 lg:grid-cols-2">
      <BasePanel class="flex flex-col gap-4">
        <PanelHeader :icon="ListTree" :title="$t('Отрасли')" />
        <form class="flex gap-2" @submit.prevent="addIndustry">
          <input
            v-model="newIndustry"
            :class="fieldClass"
            :placeholder="$t('Новая отрасль')"
            :aria-label="$t('Новая отрасль')"
          />
          <button
            type="submit"
            class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            <Plus class="size-4" />
            {{ $t('Добавить') }}
          </button>
        </form>

        <ul :class="cn('flex flex-col gap-1.5', loading && 'opacity-60')">
          <li
            v-for="industry in industries"
            :key="industry.id"
            :class="
              cn(
                'flex items-center gap-2 rounded-xl border px-3 py-2',
                industry.id === selectedId
                  ? 'border-zinc-950/20 bg-zinc-50'
                  : 'border-transparent hover:bg-zinc-50',
              )
            "
          >
            <template v-if="renaming?.key === `industry-${industry.id}`">
              <input
                v-model="renaming.value"
                :class="cn(fieldClass, 'h-9')"
                @keydown.enter.prevent="saveRename"
              />
              <button
                type="button"
                class="grid size-8 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                :aria-label="$t('Сохранить')"
                @click="saveRename"
              >
                <Check class="size-4" />
              </button>
              <button
                type="button"
                class="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                :aria-label="$t('Отмена')"
                @click="renaming = null"
              >
                <X class="size-4" />
              </button>
            </template>
            <template v-else>
              <button
                type="button"
                class="min-w-0 flex-1 text-left"
                @click="selectedId = industry.id"
              >
                <span
                  :class="
                    cn(
                      'block truncate text-sm font-semibold',
                      industry.is_active ? 'text-zinc-950' : 'text-zinc-400 line-through',
                    )
                  "
                >
                  {{ industry.name }}
                </span>
                <span class="text-xs text-zinc-500">{{
                  $t('Сфер: {n}', { n: industry.spheres.length })
                }}</span>
              </button>
              <button
                type="button"
                class="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                :aria-label="$t('Переименовать')"
                @click="startRename(`industry-${industry.id}`, industry.name)"
              >
                <Pencil class="size-4" />
              </button>
              <ToggleSwitch
                :model-value="industry.is_active"
                :label="industry.is_active ? $t('Включена') : $t('Отключена')"
                hide-label
                @update:model-value="toggleIndustry(industry, $event)"
              />
            </template>
          </li>
        </ul>
      </BasePanel>

      <BasePanel class="flex flex-col gap-4">
        <PanelHeader
          :icon="ListTree"
          :title="selected ? $t('Сферы: {name}', { name: selected.name }) : $t('Сферы')"
        />
        <template v-if="selected">
          <form class="flex gap-2" @submit.prevent="addSphere">
            <input
              v-model="newSphere"
              :class="fieldClass"
              :placeholder="$t('Новая сфера')"
              :aria-label="$t('Новая сфера')"
            />
            <button
              type="submit"
              class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              <Plus class="size-4" />
              {{ $t('Добавить') }}
            </button>
          </form>
          <ul class="flex flex-col gap-1.5">
            <li
              v-for="sphere in selected.spheres"
              :key="sphere.id"
              class="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-zinc-50"
            >
              <template v-if="renaming?.key === `sphere-${sphere.id}`">
                <input
                  v-model="renaming.value"
                  :class="cn(fieldClass, 'h-9')"
                  @keydown.enter.prevent="saveRename"
                />
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                  :aria-label="$t('Сохранить')"
                  @click="saveRename"
                >
                  <Check class="size-4" />
                </button>
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100"
                  :aria-label="$t('Отмена')"
                  @click="renaming = null"
                >
                  <X class="size-4" />
                </button>
              </template>
              <template v-else>
                <span
                  :class="
                    cn(
                      'min-w-0 flex-1 truncate text-sm',
                      sphere.is_active ? 'text-zinc-900' : 'text-zinc-400 line-through',
                    )
                  "
                  >{{ sphere.name }}</span
                >
                <button
                  type="button"
                  class="grid size-8 place-items-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-950"
                  :aria-label="$t('Переименовать')"
                  @click="startRename(`sphere-${sphere.id}`, sphere.name)"
                >
                  <Pencil class="size-4" />
                </button>
                <ToggleSwitch
                  :model-value="sphere.is_active"
                  :label="sphere.is_active ? $t('Включена') : $t('Отключена')"
                  hide-label
                  @update:model-value="toggleSphere(sphere, $event)"
                />
              </template>
            </li>
          </ul>
        </template>
        <p v-else class="text-sm text-zinc-500">{{ $t('Выберите отрасль слева') }}</p>
      </BasePanel>
    </div>
  </div>
</template>
