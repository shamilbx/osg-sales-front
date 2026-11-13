<script setup lang="ts">
import { cn } from '@/lib/utils'

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
    <template v-else>
      <!-- В тёмной теме надпись белая: чёрная на тёмной карточке не читается -->
      <img
        src="/brand/osg-logo.svg"
        alt="OSG — Online Service Group"
        :class="cn(large ? 'h-[72px] w-auto' : 'h-10 w-auto sm:h-12', 'dark:hidden')"
        draggable="false"
      />
      <img
        src="/brand/osg-logo-dark.svg"
        alt="OSG — Online Service Group"
        :class="cn(large ? 'h-[72px] w-auto' : 'h-10 w-auto sm:h-12', 'hidden dark:block')"
        draggable="false"
      />
    </template>
  </RouterLink>
</template>
