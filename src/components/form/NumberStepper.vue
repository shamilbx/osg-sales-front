<script setup lang="ts">
import { ref, watch } from 'vue'
import { Minus, Plus } from '@lucide/vue'

const props = defineProps<{
  id?: string
  min?: number
  max?: number
  label: string
  /** Подпись справа внутри поля, например «%» */
  suffix?: string
}>()
const model = defineModel<number>({ required: true })

const low = () => props.min ?? 0
const high = () => props.max ?? 99
const clamp = (value: number) => Math.min(high(), Math.max(low(), value))

// Значение можно набрать руками или менять кнопками; пока поле пустое, модель не трогаем
const text = ref(String(model.value))
watch(model, (value) => {
  if (Number(text.value) !== value) text.value = String(value)
})

function onInput(event: Event) {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '').slice(0, 3)
  if (!digits) {
    text.value = ''
    input.value = ''
    return
  }
  const next = clamp(Number(digits))
  text.value = String(next)
  input.value = text.value
  model.value = next
}

function onBlur() {
  if (!text.value) {
    model.value = low()
    text.value = String(low())
  }
}

const step = (delta: number) => {
  model.value = clamp(model.value + delta)
  text.value = String(model.value)
}

const button =
  'grid size-11 shrink-0 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-40'
</script>

<template>
  <div class="flex items-center gap-2" role="group" :aria-label="label">
    <button
      type="button"
      :class="button"
      :disabled="model <= low()"
      :aria-label="$t('Уменьшить')"
      @click="step(-1)"
    >
      <Minus class="size-4" />
    </button>
    <div class="relative min-w-0 flex-1">
      <input
        :id="id"
        :value="text"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        :aria-label="label"
        class="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-center text-sm font-semibold text-zinc-900 tabular-nums outline-none transition-colors hover:border-zinc-300 focus-visible:border-zinc-400 focus-visible:ring-3 focus-visible:ring-zinc-900/5"
        :class="suffix && 'pr-8'"
        @input="onInput"
        @blur="onBlur"
        @focus="($event.target as HTMLInputElement).select()"
      />
      <span
        v-if="suffix"
        class="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-zinc-400"
      >
        {{ suffix }}
      </span>
    </div>
    <button
      type="button"
      :class="button"
      :disabled="model >= high()"
      :aria-label="$t('Увеличить')"
      @click="step(1)"
    >
      <Plus class="size-4" />
    </button>
  </div>
</template>
