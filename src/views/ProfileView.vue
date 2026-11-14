<script setup lang="ts">
import ProfilePanel from '@/components/settings/ProfilePanel.vue'
</script>

<template>
  <div class="flex flex-col gap-4">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight text-zinc-950">{{ $t('Профиль') }}</h1>
      <p class="mt-1 text-sm text-zinc-700">{{ $t('Личные данные и пароль') }}</p>
    </header>

    <ProfilePanel />
  </div>
</template>
