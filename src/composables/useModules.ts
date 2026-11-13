import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import { isActivePath, modules, type NavModule } from '@/config/navigation'

// Запоминаем выбор для страниц вне модулей (например, «Настройки»)
let remembered: ReturnType<typeof useLocalStorage<string>> | undefined

export function useModules() {
  const route = useRoute()
  const router = useRouter()
  remembered ??= useLocalStorage<string>('ambassador:module', modules[0]!.id)

  // Модуль определяется текущей страницей, а если она вне модулей — последним выбором
  const activeModule = computed<NavModule>(
    () =>
      modules.find((module) => module.items.some((item) => isActivePath(item.to, route.path))) ??
      modules.find((module) => module.id === remembered?.value) ??
      modules[0]!,
  )

  async function selectModule(module: NavModule) {
    if (remembered) remembered.value = module.id
    const first = module.items[0]
    if (first && module.id !== activeModule.value.id) await router.push(first.to)
  }

  return { modules, activeModule, selectModule }
}
