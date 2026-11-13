export type Period = 'day' | 'week' | 'month'

export type Tone = 'blue' | 'green' | 'orange' | 'pink' | 'violet'

export type MetricFormat = 'number' | 'currency' | 'percent'

export type StatIcon = 'leads' | 'revenue' | 'departures' | 'conversion'

export interface MetricSnapshot {
  value: number
  /** Изменение относительно предыдущего периода, в процентах */
  delta: number
  caption: string
}

export interface StatMetric {
  id: string
  title: string
  subtitle: string
  icon: StatIcon
  tone: Tone
  format: MetricFormat
  periods: Record<Period, MetricSnapshot>
}

export interface ForecastPoint {
  month: string
  revenue: number
  isCurrent?: boolean
  isPeak?: boolean
}

export interface ConversionPoint {
  week: string
  rate: number
}

export type InsightIcon = 'payment' | 'visa' | 'offer'

export interface Insight {
  id: string
  title: string
  description: string
  icon: InsightIcon
  tone: Tone
}

export type Gender = 'male' | 'female'
