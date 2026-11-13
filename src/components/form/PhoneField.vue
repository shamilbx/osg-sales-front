<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDown } from '@lucide/vue'
import {
  composePhone,
  defaultPhoneCountry,
  findPhoneCountry,
  parsePhone,
  phoneCountries,
} from '@/lib/phone'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/components/form/field-styles'

defineProps<{ id?: string; invalid?: boolean }>()
// Полный номер вместе с кодом страны: «+998 90 123 45 67»
const model = defineModel<string>({ required: true })

const code = ref(defaultPhoneCountry.code)
const local = ref('')

// Последний номер, который поле отдало наружу; всё остальное пришло извне и разбирается
let emitted = ''

watch([code, local], () => {
  const country = findPhoneCountry(code.value)
  const digits = local.value.replace(/\D/g, '').slice(0, country.digits)
  local.value = digits ? country.format(digits) : ''
  emitted = composePhone(code.value, digits)
  model.value = emitted
})

// Номер подставили снаружи (например, данные существующего клиента): раскладываем на код и цифры
watch(
  model,
  (value) => {
    if (value === emitted) return
    const parsed = parsePhone(value)
    code.value = parsed.code
    local.value = parsed.digits
  },
  { immediate: true },
)

// Смена страны обрезает лишние цифры под длину нового номера
const placeholder = () =>
  findPhoneCountry(code.value).format('0'.repeat(findPhoneCountry(code.value).digits))
</script>

<template>
  <div
    :class="
      cn(
        'flex h-11 overflow-hidden rounded-xl border border-zinc-200 bg-white transition-colors focus-within:border-zinc-400 focus-within:ring-3 focus-within:ring-zinc-900/5 hover:border-zinc-300',
        invalid && 'border-rose-400',
      )
    "
  >
    <div class="relative shrink-0 border-r border-zinc-200">
      <select
        v-model="code"
        :aria-label="$t('Код страны')"
        class="h-full appearance-none bg-transparent pr-8 pl-3.5 text-sm font-medium text-zinc-900 outline-none"
      >
        <option v-for="country in phoneCountries" :key="country.code" :value="country.code">
          {{ country.flag }} {{ country.code }}
        </option>
      </select>
      <ChevronDown
        class="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-zinc-400"
      />
    </div>
    <input
      :id="id"
      v-model="local"
      type="tel"
      inputmode="tel"
      autocomplete="tel-national"
      :placeholder="placeholder()"
      :aria-invalid="invalid || undefined"
      :class="
        cn(fieldClass, 'h-full flex-1 rounded-none border-0 bg-transparent focus-visible:ring-0')
      "
    />
  </div>
</template>
