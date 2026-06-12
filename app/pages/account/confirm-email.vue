<script setup lang="ts">
import type { User } from '~/types'

// Эта страница открывается по ссылке из письма:
// /account/confirm-email?token=xxxx
// Пользователь может быть не залогинен — обрабатываем оба случая

const route   = useRoute()
const auth    = useAuthStore()
const { $api } = useApi()

const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

onMounted(async () => {
  const token = route.query.token as string

  if (!token) {
    status.value  = 'error'
    message.value = 'Токен не найден в ссылке'
    return
  }

  // Если не залогинен — отправляем на логин с редиректом обратно
  if (!auth.isLoggedIn) {
    await navigateTo(`/login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }

  try {
    const res = await $api<{ message: string; user: User }>('/profile/confirm-email', {
      method: 'POST',
      body: { token },
    })
    auth.user     = res.user
    status.value  = 'success'
    message.value = res.message
  } catch (e: any) {
    status.value  = 'error'
    message.value = e?.data?.message ?? 'Ссылка недействительна или истекла'
  }
})
</script>

<template>
  <div class="auth-page">
    <div class="auth-card" style="text-align:center;">

      <!-- Загрузка -->
      <template v-if="status === 'loading'">
        <p class="label">Подтверждение</p>
        <h1>Проверяем...</h1>
      </template>

      <!-- Успех -->
      <template v-else-if="status === 'success'">
        <p class="label">Готово</p>
        <h1>Email подтверждён</h1>
        <p class="debug" style="margin-top:16px;">✓ {{ message }}</p>
        <p class="sub" style="margin-top:8px;">
          Новый адрес: <strong>{{ auth.user?.email }}</strong>
        </p>
        <NuxtLink to="/account/profile" class="btn" style="margin-top:24px;display:block;">
          Вернуться в профиль
        </NuxtLink>
      </template>

      <!-- Ошибка -->
      <template v-else>
        <p class="label">Ошибка</p>
        <h1>Не получилось</h1>
        <p class="error" style="margin-top:16px;">{{ message }}</p>
        <NuxtLink to="/account/profile" class="btn" style="margin-top:24px;display:block;">
          Вернуться в профиль
        </NuxtLink>
      </template>

    </div>
  </div>
</template>