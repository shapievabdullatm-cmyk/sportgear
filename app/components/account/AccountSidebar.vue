<template>
  <aside class="account-sidebar">
    <nav class="account-nav">
      <NuxtLink to="/account/profile" class="nav-item" active-class="nav-active">Мои данные</NuxtLink>
      <NuxtLink to="/account/orders" class="nav-item" active-class="nav-active">Заказы</NuxtLink>
      <NuxtLink to="/wishlist" class="nav-item" active-class="nav-active">Избранное</NuxtLink>
      <NuxtLink to="/account/addresses" class="nav-item" active-class="nav-active">Адреса доставки</NuxtLink>
      <span class="nav-item nav-disabled">Отзывы</span>
      <span class="nav-item nav-disabled">Карта лояльности</span>
      <span class="nav-item nav-disabled">Стать продавцом</span>
    </nav>

    <button class="logout-btn" @click="auth.logoutUser">Выйти</button>
  </aside>
</template>

<script setup lang="ts">
const auth = useAuthStore()
</script>

<style scoped>
.account-sidebar {
  padding-right: 48px;
  display: flex;
  flex-direction: column;
}

.account-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.nav-item {
  font-size: 15px;
  font-weight: 500;
  color: #555;
  padding: 8px 0;
  cursor: pointer;
  transition: color 0.15s;
  text-decoration: none;
  display: block;
  border: none;
  background: none;
}

.nav-item:hover:not(.nav-disabled) {
  color: #111;
}

.nav-active {
  color: #C1121C !important;
  font-weight: 600;
}

.nav-disabled {
  color: #bbb;
  cursor: default;
}

.logout-btn {
  margin-top: 32px;
  font-size: 13px;
  color: #bbb;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  transition: color 0.15s;
}
.logout-btn:hover { color: #555; }

@media (max-width: 768px) {
  .account-sidebar {
    display: none;
  }
}
</style>