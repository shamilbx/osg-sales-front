import { useLocalStorage } from '@vueuse/core'
import type { NavItem } from '@/config/navigation'

// Порядок пунктов меню (sort_order) по разделам: ключ раздела → адреса пунктов сверху вниз.
// Пока нет API, он хранится в браузере; пункты, которых в списке нет, идут в конце.
const saved = useLocalStorage<Record<string, string[]>>('ambassador:menu-order', {})

export function useMenuOrder() {
  function sorted(key: string, items: NavItem[]): NavItem[] {
    const order = saved.value[key]
    if (!order?.length) return items
    const rank = (item: NavItem) => {
      const index = order.indexOf(item.to)
      return index === -1 ? order.length : index
    }
    return [...items].sort((a, b) => rank(a) - rank(b))
  }

  function move(key: string, items: NavItem[], from: number, to: number) {
    if (from === to || to < 0 || to >= items.length) return
    const list = sorted(key, items).map((item) => item.to)
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved!)
    saved.value = { ...saved.value, [key]: list }
  }

  function reset() {
    saved.value = {}
  }

  const hasCustomOrder = () => Object.keys(saved.value).length > 0

  return { sorted, move, reset, hasCustomOrder }
}
