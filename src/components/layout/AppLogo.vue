<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <RouterLink
    to="/"
    aria-label="Ambassador"
    class="flex items-center rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    <!-- Свёрнутый сайдбар показывает только знак; для тёмной темы у надписи отдельная светлая версия -->
    <img
      v-if="compact"
      src="/brand/ambassador-mark.png"
      alt="Ambassador"
      class="h-9 w-auto"
      draggable="false"
    />
    <template v-else>
      <img
        src="/brand/ambassador-logo.png"
        alt="Ambassador"
        class="h-14 w-auto dark:hidden"
        draggable="false"
      />
      <img
        src="/brand/ambassador-logo-dark.png"
        alt="Ambassador"
        class="hidden h-14 w-auto dark:block"
        draggable="false"
      />
    </template>
  </RouterLink>
</template>
