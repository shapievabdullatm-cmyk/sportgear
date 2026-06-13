<script setup lang="ts">
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()

// Загружаем данные пользователя при старте приложения
// catch нужен: невалидный/истёкший токен кидает ошибку и очищает его
await auth.fetchMe().catch(() => {})

// Загружаем корзину и избранное (работает и для авторизованных, и для гостей)
if (process.client) {
  await cart.fetchCart()
  await wishlist.fetchWishlist()
}
</script>

<template>
    <NuxtLoadingIndicator color="#C1121C" :height="3" :throttle="200" />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
</template>
