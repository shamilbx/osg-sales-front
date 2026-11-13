import { useLocalStorage } from '@vueuse/core'

export const pageSizeOptions = [10, 25, 50, 100]

// Выбор «Показывать по» общий для всех таблиц и запоминается в браузере
export const usePageSize = () => useLocalStorage('ambassador:page-size', pageSizeOptions[0]!)
