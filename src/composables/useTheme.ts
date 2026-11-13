import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'

export type ThemeMode = 'light' | 'dark'

// Хранится как обычная строка, чтобы ее мог прочитать скрипт в index.html до отрисовки
let mode: ReturnType<typeof useLocalStorage<ThemeMode>> | undefined

export function useTheme() {
  mode ??= useLocalStorage<ThemeMode>('ambassador:theme', 'light')
  const current = mode

  return {
    isDark: computed(() => current.value === 'dark'),
    toggle: () => (current.value = current.value === 'dark' ? 'light' : 'dark'),
  }
}
