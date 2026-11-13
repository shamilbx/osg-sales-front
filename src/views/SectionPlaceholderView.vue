<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Hammer } from '@lucide/vue'
import { allNav } from '@/config/navigation'
import BasePanel from '@/components/dashboard/BasePanel.vue'

// Заглушка для разделов, которые еще не сверстаны
const route = useRoute()
const item = computed(() => allNav.find((nav) => nav.to === `/${String(route.params.section)}`))
</script>

<template>
  <BasePanel class="grid min-h-[60vh] place-items-center text-center">
    <div v-if="item" class="max-w-sm">
      <span class="mx-auto grid size-14 place-items-center rounded-2xl bg-zinc-100 text-zinc-700">
        <component :is="item.icon" class="size-6" :stroke-width="1.8" />
      </span>
      <h1 class="mt-5 font-serif text-3xl text-zinc-950">{{ item.title }}</h1>
      <p class="mt-2 flex items-center justify-center gap-2 text-sm text-zinc-500">
        <Hammer class="size-4" />
        {{ $t('Раздел в разработке') }}
      </p>
      <RouterLink
        to="/"
        class="mt-6 inline-flex h-11 items-center rounded-2xl bg-zinc-950 px-5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
      >
        {{ $t('Вернуться на дашборд') }}
      </RouterLink>
    </div>
  </BasePanel>
</template>
