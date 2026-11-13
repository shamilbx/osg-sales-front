import { ref } from 'vue'

interface Tip {
  text: string
  /** Центр пункта по вертикали, в пикселях окна */
  top: number
  /** Правый край пункта плюс отступ */
  left: number
}

// Подсказка одна на всё приложение: показывается у свёрнутого меню и рисуется поверх всего
const tip = ref<Tip | null>(null)

const GAP = 12

export function useNavTooltip() {
  function show(event: Event, text: string) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    tip.value = { text, top: rect.top + rect.height / 2, left: rect.right + GAP }
  }

  /** С клавиатуры подсказка нужна, а после щелчка мышью — нет */
  function showOnKeyboardFocus(event: FocusEvent, text: string) {
    if ((event.currentTarget as HTMLElement).matches(':focus-visible')) show(event, text)
  }

  const hide = () => (tip.value = null)

  return { tip, show, showOnKeyboardFocus, hide }
}
