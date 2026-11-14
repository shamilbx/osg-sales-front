import { t } from '@/i18n'
import type { LeadStatus } from '@/api/leads'

/** Подпись и цвет статуса лида: точка для фильтра и плашка для списка и карточки */
export const leadStatusMeta: Record<
  LeadStatus,
  { label: () => string; dot: string; badge: string }
> = {
  new: {
    label: () => t('Новый'),
    dot: 'bg-sky-500',
    badge: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  contacted: {
    label: () => t('Связались'),
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  qualified: {
    label: () => t('Квалифицирован'),
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-800 ring-amber-200',
  },
  disqualified: {
    label: () => t('Отклонён'),
    dot: 'bg-zinc-400',
    badge: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  },
  converted: {
    label: () => t('Конвертирован'),
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
}
