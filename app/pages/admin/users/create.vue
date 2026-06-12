<template>
  <div class="max-w-3xl space-y-6 mx-auto">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Новый пользователь</h1>
      <NuxtLink to="/admin/users" class="inline-flex items-center gap-1.5 text-[13px] text-[#ABABAB] hover:text-[#1A1A1A] transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Назад
      </NuxtLink>
    </div>

    <!-- Errors -->
    <div v-if="errors.length" class="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
      <p v-for="(e, i) in errors" :key="i" class="text-[12px] text-red-600">{{ e }}</p>
    </div>

    <!-- Основные поля -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-6">
      <h2 class="text-[13px] font-semibold text-[#1A1A1A] mb-4">Личные данные</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="space-y-1">
          <label class="field-label">Фамилия</label>
          <input v-model="form.last_name" type="text" class="field-input" />
        </div>
        <div class="space-y-1">
          <label class="field-label">Имя</label>
          <input v-model="form.first_name" type="text" class="field-input" />
        </div>

        <div class="space-y-1">
          <label class="field-label">Телефон <span class="text-red-400">*</span></label>
          <PhoneInput v-model="form.phone" input-class="field-input" />
        </div>
        <div class="space-y-1">
          <label class="field-label">Email</label>
          <input v-model="form.email" type="email" class="field-input" />
        </div>

        <div class="space-y-1">
          <label class="field-label">Пол</label>
          <select v-model="form.gender" class="field-input">
            <option :value="null">Не указано</option>
            <option value="male">Мужской</option>
            <option value="female">Женский</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div class="space-y-1">
          <label class="field-label">Дата рождения</label>
          <input v-model="form.birth_date" type="date" class="field-input" />
        </div>
      </div>
    </div>

    <!-- Адреса -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-6">
      <UserAddressesEditor v-model="addresses" />
    </div>

    <!-- Save -->
    <div class="flex justify-end pb-6">
      <button
          @click.prevent="submit"
          :disabled="store.saving"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        <svg v-if="store.saving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
        {{ store.saving ? 'Создание...' : 'Создать пользователя' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { AdminAddress, UserFormPayload } from '~/stores/admin/user'
import { useUserStore } from '~/stores/admin/user'
import UserAddressesEditor from '~/components/admin/UserAddressesEditor.vue'
import PhoneInput from '~/components/admin/PhoneInput.vue'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const router = useRouter()
const store  = useUserStore()

const form = reactive({
  first_name: '' as string | null,
  last_name:  '' as string | null,
  phone:      '',
  email:      '' as string | null,
  gender:     null as 'male' | 'female' | 'other' | null,
  birth_date: '' as string | null,
})

const addresses = ref<AdminAddress[]>([])
const errors = ref<string[]>([])

async function submit() {
  errors.value = []
  if (!form.phone.trim()) {
    errors.value.push('Укажите телефон')
    return
  }

  const payload: UserFormPayload = {
    first_name: form.first_name || null,
    last_name:  form.last_name  || null,
    phone:      form.phone.trim(),
    email:      form.email      || null,
    gender:     form.gender,
    birth_date: form.birth_date || null,
    addresses:  addresses.value.map(({ _key, ...rest }: any) => rest),
  }

  try {
    const created = await store.create(payload)
    await router.push(`/admin/users/${created.id}/edit`)
  } catch (e: any) {
    if (e?.data?.errors) {
      errors.value = Object.values(e.data.errors).flat() as string[]
    } else {
      errors.value = [e?.data?.message ?? 'Ошибка при создании пользователя']
    }
  }
}
</script>

<style scoped>
.field-label { @apply block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]; }
.field-input { @apply w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors; }
</style>