import { t } from '@/i18n'
import type { Gender } from '@/lib/types'

export const genderLabels: Record<Gender, string> = {
  get male() {
    return t('Мужской')
  },
  get female() {
    return t('Женский')
  },
}
