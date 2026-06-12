<script setup lang="ts">
definePageMeta({
  layout: false
})

const auth    = useAuthStore()
const error   = ref('')
const loading = ref(false)
const form    = reactive({ email: '', password: '' })

// Если уже авторизован как админ - редиректим
onMounted(() => {
  if (auth.isAdminLoggedIn) {
    navigateTo('/admin')
  }
})

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.adminLogin(form.email, form.password)
    // navigateTo('/admin') вызывается внутри store
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Неверные данные'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center mb-8">
        <h1 class="text-[24px] font-bold text-[#1A1A1A] mb-2">Rage Shop</h1>
        <p class="text-[13px] text-[#ABABAB]">Панель администратора</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white border border-[#E8E6E0] rounded-xl p-8 shadow-sm">
        <h2 class="text-[15px] font-semibold text-[#1A1A1A] mb-6">Вход в систему</h2>

        <!-- Error Message -->
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-[12px] text-red-600">{{ error }}</p>
        </div>

        <!-- Email Field -->
        <div class="mb-6">
          <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
            Email
          </label>
          <input
              v-model="form.email"
              type="email"
              placeholder="admin@example.com"
              class="w-full px-0 py-2.5 bg-transparent text-[14px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none border-0 border-b border-[#E8E6E0] focus:border-[#1A1A1A] transition-colors"
              @keyup.enter="handleLogin"
          />
        </div>

        <!-- Password Field -->
        <div class="mb-8">
          <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
            Пароль
          </label>
          <input
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              class="w-full px-0 py-2.5 bg-transparent text-[14px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none border-0 border-b border-[#E8E6E0] focus:border-[#1A1A1A] transition-colors"
              @keyup.enter="handleLogin"
          />
        </div>

        <!-- Login Button -->
        <button
            @click="handleLogin"
            :disabled="loading"
            class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          {{ loading ? 'Входим...' : 'Войти' }}
        </button>
      </div>

      <!-- Footer -->
      <p class="text-center text-[11px] text-[#C0BEB8] mt-6">
        © 2026 Rage Shop. Все права защищены.
      </p>
    </div>
  </div>
</template>