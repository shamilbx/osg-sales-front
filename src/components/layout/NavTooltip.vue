<script setup lang="ts">
import { useNavTooltip } from '@/composables/useNavTooltip'

const { tip } = useNavTooltip()
</script>

<!-- Подсказка у свёрнутого меню: выносится в body, иначе её обрежет прокрутка сайдбара -->
<template>
  <Teleport to="body">
    <Transition name="nav-tip">
      <div
        v-if="tip"
        role="tooltip"
        class="pointer-events-none fixed z-[100] -translate-y-1/2 rounded-xl bg-zinc-950 px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-white shadow-lg ring-1 ring-white/10"
        :style="{ top: `${tip.top}px`, left: `${tip.left}px` }"
      >
        <span
          aria-hidden="true"
          class="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 rounded-[2px] bg-zinc-950"
        />
        {{ tip.text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.nav-tip-enter-active,
.nav-tip-leave-active {
  transition:
    opacity 0.12s ease,
    translate 0.12s ease;
}
.nav-tip-enter-from,
.nav-tip-leave-to {
  opacity: 0;
  translate: -4px 0;
}
</style>
