<script setup lang="ts">
import { LayoutDashboard, TrendingUp, Users, Wallet } from '@lucide/vue'
import BasePanel from '@/components/dashboard/BasePanel.vue'
import PanelHeader from '@/components/dashboard/PanelHeader.vue'
import SummaryCard from '@/components/common/SummaryCard.vue'

// Заготовка: карточки сводки и пустая панель. Данные и разделы появятся вместе с сервером
const summary = [
  { title: 'Продажи', value: '—', icon: TrendingUp, tone: 'blue' },
  { title: 'Выручка', value: '—', icon: Wallet, tone: 'green' },
  { title: 'Клиенты', value: '—', icon: Users, tone: 'violet' },
] as const
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Дашборд') }}</h1>
      <p class="mt-1 text-sm text-zinc-700">{{ $t('Система управления продажами') }}</p>
    </div>

    <section :aria-label="$t('Ключевые показатели')" class="grid gap-4 sm:grid-cols-3">
      <SummaryCard
        v-for="item in summary"
        :key="item.title"
        :title="$t(item.title)"
        :value="item.value"
        :icon="item.icon"
        :tone="item.tone"
      />
    </section>

    <BasePanel>
      <PanelHeader :icon="LayoutDashboard" :title="$t('Начало работы')" />
      <p class="mt-4 text-sm text-zinc-500">
        {{ $t('Здесь появятся разделы и данные системы продаж') }}
      </p>
    </BasePanel>
  </div>
</template>
