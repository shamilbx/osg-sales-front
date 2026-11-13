import { ref } from 'vue'

export interface Toast {
  id: number
  title: string
  message?: string
  tone: 'success' | 'error'
}

const TOAST_MS = 5000

// Общий список: показывает его один ToastHost в корне приложения
const toasts = ref<Toast[]>([])
let nextId = 1

function dismiss(id: number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

function push(title: string, message: string | undefined, tone: Toast['tone']) {
  const id = nextId++
  toasts.value = [...toasts.value, { id, title, message, tone }]
  setTimeout(() => dismiss(id), TOAST_MS)
}

export function useToast() {
  return {
    toasts,
    dismiss,
    success: (title: string, message?: string) => push(title, message, 'success'),
    error: (title: string, message?: string) => push(title, message, 'error'),
  }
}
