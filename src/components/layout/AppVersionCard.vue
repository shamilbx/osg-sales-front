<script setup lang="ts">
const appInfo = {
  name: 'AMBASSADOR CRM',
  version: '1.0.0',
  developer: 'Online Service Group',
}
</script>

<template>
  <div
    class="relative overflow-hidden rounded-2xl bg-white/[0.06] px-4 py-3.5 text-center ring-1 ring-white/10 backdrop-blur-sm"
  >
    <!-- Золотистый блик сверху, как в референсе -->
    <div
      aria-hidden="true"
      class="pointer-events-none absolute -top-10 left-1/2 h-20 w-44 -translate-x-1/2 rounded-full bg-amber-400/25 blur-2xl"
    />
    <div
      aria-hidden="true"
      class="absolute inset-x-8 top-0 h-px bg-linear-to-r from-transparent via-amber-300/70 to-transparent"
    />

    <p class="relative text-[13px] font-semibold tracking-wide text-white">
      {{ appInfo.name }} <span class="font-normal text-slate-400">v{{ appInfo.version }}</span>
    </p>
    <p class="relative mt-1 text-xs text-slate-400">
      {{ $t('Разработчик:') }} <span class="text-slate-200">{{ appInfo.developer }}</span>
    </p>
  </div>
</template>
