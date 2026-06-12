<template>
  <div class="min-h-screen flex items-center justify-center bg-[#FAFAF8] px-6">
    <div class="text-center max-w-md w-full space-y-6">

      <!-- Код ошибки -->
      <h1 class="text-[64px] font-semibold text-[#1A1A1A] leading-none">
        404
      </h1>

      <!-- Заголовок -->
      <h2 class="text-[18px] font-medium text-[#1A1A1A]">
        Страница не найдена
      </h2>

      <!-- Описание -->
      <p class="text-[13px] text-[#ABABAB] leading-relaxed">
        Возможно, страница была удалена или вы перешли по неверной ссылке.
      </p>

      <!-- Кнопки -->
      <div class="flex items-center justify-center gap-3 pt-2">
        <NuxtLink
            to="/"
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#1A1A1A] text-white text-[13px] font-medium hover:bg-[#333] transition-colors"
        >
          На главную
        </NuxtLink>

        <button
            @click="$router.back()"
            class="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#1A1A1A] text-[#1A1A1A] text-[13px] font-medium hover:bg-[#1A1A1A] hover:text-white transition-colors"
        >
          Назад
        </button>
      </div>

      <!-- Декоративный блок -->
      <div class="pt-6">
        <div class="w-full h-px bg-[#E8E6E0]" />
        <p class="text-[11px] text-[#C0BEB8] pt-4">
          Ошибка: страница не существует
        </p>
      </div>

    </div>
  </div>
</template>
<script>

</script>