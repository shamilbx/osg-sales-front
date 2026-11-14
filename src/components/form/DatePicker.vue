<script setup lang="ts">
import { locale, t } from '@/i18n'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from '@lucide/vue'
import { cn } from '@/lib/utils'
import { fieldClass } from '@/components/form/field-styles'

const props = defineProps<{
  id?: string
  /** Границы в формате YYYY-MM-DD */
  min?: string
  max?: string
  invalid?: boolean
}>()
// ISO-дата «2026-11-08» или пустая строка
const model = defineModel<string>({ required: true })

const monthNames = {
  ru: [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  uz: [
    'Yanvar',
    'Fevral',
    'Mart',
    'Aprel',
    'May',
    'Iyun',
    'Iyul',
    'Avgust',
    'Sentabr',
    'Oktabr',
    'Noyabr',
    'Dekabr',
  ],
}
const weekdayNames = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  uz: ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'],
}

const pad = (value: number) => String(value).padStart(2, '0')
const toIso = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`
const now = new Date()
const todayIso = toIso(now.getFullYear(), now.getMonth(), now.getDate())

const display = (iso: string) => (iso ? iso.split('-').reverse().join('.') : '')

/** «08.11.2026» → ISO, если такая дата существует, иначе пустая строка */
function parse(text: string) {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text)
  if (!match) return ''
  const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])]
  const date = new Date(year, month - 1, day)
  const real =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return real ? toIso(year, month - 1, day) : ''
}

const allowed = (iso: string) =>
  (!props.min || iso >= props.min) && (!props.max || iso <= props.max)

const text = ref(display(model.value))
watch(model, (value) => {
  if (value !== parse(text.value)) text.value = display(value)
})

// Полностью набранная, но несуществующая или недоступная дата подсвечивается ошибкой
const textInvalid = computed(() => {
  if (text.value.length < 10) return false
  const iso = parse(text.value)
  return !iso || !allowed(iso)
})

const root = useTemplateRef<HTMLDivElement>('root')
const input = useTemplateRef<HTMLInputElement>('input')
const open = ref(false)
const dropUp = ref(false)
const viewYear = ref(now.getFullYear())
const viewMonth = ref(now.getMonth())
// Что показано: дни месяца, сетка месяцев или сетка лет
const view = ref<'days' | 'months' | 'years'>('days')
const yearsStart = ref(now.getFullYear())
const YEARS_PER_PAGE = 12

onClickOutside(root, () => (open.value = false))
onKeyStroke('Escape', () => {
  if (!open.value) return
  open.value = false
  input.value?.focus()
})

function showView(iso: string) {
  const base =
    iso ||
    (props.max && todayIso > props.max
      ? props.max
      : props.min && todayIso < props.min
        ? props.min
        : todayIso)
  viewYear.value = Number(base.slice(0, 4))
  viewMonth.value = Number(base.slice(5, 7)) - 1
}

function toggle() {
  if (!open.value) {
    showView(model.value)
    view.value = 'days'
    // Если снизу мало места, календарь раскрывается вверх
    const rect = root.value?.getBoundingClientRect()
    dropUp.value = !!rect && window.innerHeight - rect.bottom < 380 && rect.top > 380
  }
  open.value = !open.value
}

// Маска «дд.мм.гггг»: точки ставятся сами, курсор остаётся у тех же цифр
function onInput(event: Event) {
  const el = event.target as HTMLInputElement
  const caret = el.selectionStart ?? el.value.length
  const digitsBefore = el.value.slice(0, caret).replace(/\D/g, '').length
  const digits = el.value.replace(/\D/g, '').slice(0, 8)
  const masked = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join('.')

  text.value = masked
  el.value = masked
  const iso = parse(masked)
  model.value = iso && allowed(iso) ? iso : ''
  if (model.value) showView(model.value)

  let position = 0
  let seen = 0
  while (position < masked.length && seen < digitsBefore) {
    if (/\d/.test(masked[position]!)) seen++
    position++
  }
  el.setSelectionRange(position, position)
}

function pick(day: number) {
  const iso = toIso(viewYear.value, viewMonth.value, day)
  if (!allowed(iso)) return
  model.value = iso
  text.value = display(iso)
  open.value = false
  input.value?.focus()
}

function clear() {
  model.value = ''
  text.value = ''
  open.value = false
  input.value?.focus()
}

const names = computed(() => monthNames[locale().value])
const weekdays = computed(() => weekdayNames[locale().value])

const minYear = computed(() =>
  props.min ? Number(props.min.slice(0, 4)) : now.getFullYear() - 100,
)
const maxYear = computed(() => (props.max ? Number(props.max.slice(0, 4)) : now.getFullYear() + 20))
// Страница лет подбирается так, чтобы выбранный год был в середине, но не выходил за границы
function openYears() {
  const last = Math.max(minYear.value, maxYear.value - YEARS_PER_PAGE + 1)
  yearsStart.value = Math.min(Math.max(viewYear.value - 6, minYear.value), last)
  view.value = 'years'
}

const yearGrid = computed(() =>
  Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearsStart.value + i),
)
const yearAllowed = (year: number) => year >= minYear.value && year <= maxYear.value

function pickYear(year: number) {
  if (!yearAllowed(year)) return
  viewYear.value = year
  view.value = 'days'
}

// Месяц недоступен, если весь он лежит за границами min и max
function monthAllowed(month: number) {
  const first = toIso(viewYear.value, month, 1)
  const last = toIso(viewYear.value, month, new Date(viewYear.value, month + 1, 0).getDate())
  return (!props.min || last >= props.min) && (!props.max || first <= props.max)
}

function pickMonth(month: number) {
  if (!monthAllowed(month)) return
  viewMonth.value = month
  view.value = 'days'
}

const cells = computed(() => {
  const offset = (new Date(viewYear.value, viewMonth.value, 1).getDay() + 6) % 7
  const total = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ]
})

function shift(delta: number) {
  const date = new Date(viewYear.value, viewMonth.value + delta, 1)
  if (date.getFullYear() < minYear.value || date.getFullYear() > maxYear.value) return
  viewYear.value = date.getFullYear()
  viewMonth.value = date.getMonth()
}

const canPrev = computed(() => {
  if (view.value === 'years') return yearsStart.value > minYear.value
  if (view.value === 'months') return viewYear.value > minYear.value
  return !(viewYear.value === minYear.value && viewMonth.value === 0)
})
const canNext = computed(() => {
  if (view.value === 'years') return yearsStart.value + YEARS_PER_PAGE - 1 < maxYear.value
  if (view.value === 'months') return viewYear.value < maxYear.value
  return !(viewYear.value === maxYear.value && viewMonth.value === 11)
})

function step(delta: number) {
  if (view.value === 'years') {
    const last = Math.max(minYear.value, maxYear.value - YEARS_PER_PAGE + 1)
    yearsStart.value = Math.min(
      Math.max(yearsStart.value + delta * YEARS_PER_PAGE, minYear.value),
      last,
    )
  } else if (view.value === 'months') {
    viewYear.value = Math.min(Math.max(viewYear.value + delta, minYear.value), maxYear.value)
  } else {
    shift(delta)
  }
}

const prevLabel = computed(() =>
  view.value === 'years'
    ? t('Предыдущие годы')
    : view.value === 'months'
      ? t('Предыдущий год')
      : t('Предыдущий месяц'),
)
const nextLabel = computed(() =>
  view.value === 'years'
    ? t('Следующие годы')
    : view.value === 'months'
      ? t('Следующий год')
      : t('Следующий месяц'),
)

const headButton =
  'flex h-9 items-center justify-center gap-1 rounded-lg px-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-100'
const gridCell =
  'grid h-11 place-items-center rounded-xl text-sm font-medium tabular-nums transition-colors disabled:pointer-events-none disabled:text-zinc-300'
const navButton =
  'grid size-9 place-items-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 disabled:pointer-events-none disabled:opacity-30'
</script>

<template>
  <div ref="root" class="relative">
    <input
      :id="id"
      ref="input"
      :value="text"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :placeholder="$t('дд.мм.гггг')"
      :aria-invalid="invalid || textInvalid || undefined"
      :class="cn(fieldClass, 'pr-12 tabular-nums')"
      @input="onInput"
    />
    <button
      type="button"
      :aria-label="$t('Открыть календарь')"
      :aria-expanded="open"
      class="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      @click="toggle"
    >
      <CalendarDays class="size-[18px]" :stroke-width="1.8" />
    </button>

    <div
      v-if="open"
      role="dialog"
      :aria-label="$t('Выбор даты')"
      :class="
        cn(
          'date-popover absolute left-0 z-40 w-[304px] max-w-[calc(100vw-2rem)] rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_20px_40px_-16px_rgba(16,24,40,.3)]',
          dropUp ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]',
        )
      "
    >
      <div class="flex items-center gap-1.5">
        <button
          type="button"
          :class="navButton"
          :disabled="!canPrev"
          :aria-label="prevLabel"
          @click="step(-1)"
        >
          <ChevronLeft class="size-4" />
        </button>

        <template v-if="view === 'days'">
          <button
            type="button"
            :class="cn(headButton, 'min-w-0 flex-1')"
            :aria-label="$t('Выбрать месяц')"
            @click="view = 'months'"
          >
            {{ names[viewMonth] }}
            <ChevronDown class="size-3.5 text-zinc-400" />
          </button>
          <button
            type="button"
            :class="cn(headButton, 'w-[88px]')"
            :aria-label="$t('Выбрать год')"
            @click="openYears"
          >
            {{ viewYear }}
            <ChevronDown class="size-3.5 text-zinc-400" />
          </button>
        </template>
        <button
          v-else
          type="button"
          :class="cn(headButton, 'min-w-0 flex-1')"
          :aria-label="$t('Вернуться к календарю')"
          @click="view = 'days'"
        >
          <template v-if="view === 'months'">{{ viewYear }}</template>
          <template v-else>{{ yearGrid[0] }} – {{ yearGrid[YEARS_PER_PAGE - 1] }}</template>
        </button>

        <button
          type="button"
          :class="navButton"
          :disabled="!canNext"
          :aria-label="nextLabel"
          @click="step(1)"
        >
          <ChevronRight class="size-4" />
        </button>
      </div>

      <div class="mt-3 min-h-[252px]">
        <template v-if="view === 'days'">
          <div class="grid grid-cols-7 text-center text-[11px] font-semibold text-zinc-400">
            <span v-for="day in weekdays" :key="day" class="py-1">{{ day }}</span>
          </div>
          <div class="grid grid-cols-7 gap-y-0.5">
            <template v-for="(day, index) in cells" :key="index">
              <span v-if="day === null" />
              <button
                v-else
                type="button"
                :disabled="!allowed(toIso(viewYear, viewMonth, day))"
                :aria-pressed="model === toIso(viewYear, viewMonth, day)"
                :class="
                  cn(
                    'mx-auto grid size-9 place-items-center rounded-lg text-sm tabular-nums transition-colors disabled:pointer-events-none disabled:text-zinc-300',
                    model === toIso(viewYear, viewMonth, day)
                      ? 'bg-brand font-semibold text-white'
                      : toIso(viewYear, viewMonth, day) === todayIso
                        ? 'font-semibold text-brand ring-1 ring-brand/30 hover:bg-brand-soft'
                        : 'text-zinc-800 hover:bg-zinc-100',
                  )
                "
                @click="pick(day)"
              >
                {{ day }}
              </button>
            </template>
          </div>
        </template>

        <div v-else-if="view === 'months'" class="grid grid-cols-3 gap-2">
          <button
            v-for="(name, index) in names"
            :key="name"
            type="button"
            :disabled="!monthAllowed(index)"
            :aria-pressed="index === viewMonth"
            :class="
              cn(
                gridCell,
                index === viewMonth
                  ? 'bg-brand font-semibold text-white'
                  : 'text-zinc-800 hover:bg-zinc-100',
              )
            "
            @click="pickMonth(index)"
          >
            {{ name }}
          </button>
        </div>

        <div v-else class="grid grid-cols-3 gap-2">
          <button
            v-for="year in yearGrid"
            :key="year"
            type="button"
            :disabled="!yearAllowed(year)"
            :aria-pressed="year === viewYear"
            :class="
              cn(
                gridCell,
                year === viewYear
                  ? 'bg-brand font-semibold text-white'
                  : year === now.getFullYear()
                    ? 'font-semibold text-brand ring-1 ring-brand/30 hover:bg-brand-soft'
                    : 'text-zinc-800 hover:bg-zinc-100',
              )
            "
            @click="pickYear(year)"
          >
            {{ year }}
          </button>
        </div>
      </div>

      <div class="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2">
        <button
          type="button"
          class="h-8 rounded-lg px-2.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          @click="clear"
        >
          {{ $t('Очистить') }}
        </button>
        <button
          type="button"
          :disabled="!allowed(todayIso)"
          class="h-8 rounded-lg px-2.5 text-[13px] font-medium text-brand transition-colors hover:bg-brand-soft disabled:pointer-events-none disabled:opacity-40"
          @click="
            ((viewYear = now.getFullYear()), (viewMonth = now.getMonth()), pick(now.getDate()))
          "
        >
          {{ $t('Сегодня') }}
        </button>
      </div>
    </div>
  </div>
</template>
