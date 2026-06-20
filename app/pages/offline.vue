<script setup lang="ts">
definePageMeta({ layout: 'default' })

function retry() {
  if (typeof window !== 'undefined') window.location.reload()
}
</script>

<template>
  <div class="offline">
    <img src="/pwa-192x192.png" alt="Rage" class="offline__logo" />
    <h1>Нет соединения</h1>
    <p>Проверьте интернет и попробуйте снова.<br />Доступны страницы, которые вы открывали ранее.</p>
    <button class="offline__btn" @click="retry">Повторить</button>
  </div>
</template>

<style scoped>
.offline {
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 20px;
  gap: 14px;
}
.offline__logo {
  width: 96px;
  height: 96px;
  border-radius: 20px;
  margin-bottom: 8px;
}
.offline h1 {
  font-size: 22px;
  font-weight: 700;
  color: #111;
  margin: 0;
}
.offline p {
  color: #666;
  font-size: 14px;
  margin: 0;
  line-height: 1.5;
}
.offline__btn {
  margin-top: 12px;
  background: #C1121C;
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 10px 22px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>