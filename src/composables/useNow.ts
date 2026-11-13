import { onBeforeUnmount, onMounted, ref } from 'vue'

/** Текущее время в миллисекундах; обновляется раз в минуту, чтобы таймеры на карточках шли сами */
export function useNow() {
  const now = ref(Date.now())
  let timer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    now.value = Date.now()
    timer = setInterval(() => (now.value = Date.now()), 60_000)
  })
  onBeforeUnmount(() => clearInterval(timer))
  return now
}
