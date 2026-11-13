<!-- Оболочка центра управления: без бокового меню, шапку и баннер рисует сама страница -->
<template>
  <div class="mx-auto flex min-h-screen max-w-[1920px] flex-col gap-4 p-3 sm:p-4 lg:p-6">
    <main class="min-w-0 flex-1">
      <slot />
    </main>
  </div>
</template>
