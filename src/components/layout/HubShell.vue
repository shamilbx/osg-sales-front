<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
</script>

<!-- Оболочка центра управления: только шапка с логотипом, без бокового меню -->
<template>
  <div class="mx-auto flex min-h-screen max-w-[1920px] flex-col gap-4 p-3 sm:p-4 lg:p-6">
    <AppHeader hub />
    <main class="min-w-0 flex-1">
      <slot />
    </main>
  </div>
</template>
