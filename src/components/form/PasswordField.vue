<script setup lang="ts">
import { ref } from 'vue'
import { Eye, EyeOff } from '@lucide/vue'
import { fieldClass } from '@/components/form/field-styles'
import { cn } from '@/lib/utils'

// Поле пароля с кнопкой «показать / скрыть»
defineProps<{
  id?: string
  autocomplete?: string
  invalid?: boolean
}>()
const model = defineModel<string>({ required: true })

const visible = ref(false)
</script>

<template>
  <div class="relative">
    <input
      :id="id"
      v-model="model"
      :type="visible ? 'text' : 'password'"
      :autocomplete="autocomplete"
      :aria-invalid="invalid || undefined"
      :class="cn(fieldClass, 'pr-12')"
    />
    <button
      type="button"
      class="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      :aria-label="visible ? $t('Скрыть пароль') : $t('Показать пароль')"
      :aria-pressed="visible"
      @click="visible = !visible"
    >
      <EyeOff v-if="visible" class="size-[18px]" />
      <Eye v-else class="size-[18px]" />
    </button>
  </div>
</template>
