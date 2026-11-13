import { roleLabels, type Role } from '@/composables/useAuth'

export const roles: Role[] = ['superadmin', 'director', 'manager', 'accountant']

/** Цвет значка роли в списке и карточке */
export const roleBadge: Record<Role, string> = {
  superadmin: 'bg-violet-50 text-violet-700 ring-violet-200',
  director: 'bg-sky-50 text-sky-700 ring-sky-200',
  manager: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  accountant: 'bg-amber-50 text-amber-700 ring-amber-200',
}

export const roleOptions = () => roles.map((role) => ({ value: role, label: roleLabels[role] }))

/** Инициалы для аватара: «Анна Смирнова» → «АС», без имени — первые буквы логина */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
