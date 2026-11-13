<script setup lang="ts">
// compact — свёрнутый сайдбар: остаётся только знак; large — крупный логотип в карточке над сайдбаром
defineProps<{ compact?: boolean; large?: boolean }>()
</script>

<template>
  <RouterLink
    to="/"
    aria-label="OSG — Online Service Group"
    class="flex shrink-0 items-center rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
  >
    <img v-if="compact" src="/brand/osg-mark.svg" alt="OSG" class="h-10 w-auto" draggable="false" />
    <img
      v-else
      src="/brand/osg-logo.svg"
      alt="OSG — Online Service Group"
      :class="large ? 'h-[72px] w-auto' : 'h-10 w-auto sm:h-12'"
      draggable="false"
    />
  </RouterLink>
</template>
