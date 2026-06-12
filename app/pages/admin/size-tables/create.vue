<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/admin/size-tables"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8E6E0] text-[#C0BEB8] hover:text-[#1A1A1A] hover:border-[#C0BEB8] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </NuxtLink>
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Создать таблицу размеров</h1>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-5">
      <div class="bg-white border border-[#E8E6E0] rounded-xl p-5">
        <AdminSizeTableBuilder v-model="form" />
      </div>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          :disabled="loading || !form.name"
          class="inline-flex items-center gap-2 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span v-else>Создать таблицу</span>
        </button>
        <NuxtLink
          to="/admin/size-tables"
          class="inline-flex items-center gap-2 rounded-lg border border-[#E8E6E0] bg-white px-4 py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors"
        >
          Отмена
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { SizeTableFormData } from '~/types/sizeTable'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { $api } = useApi()
const router = useRouter()

const loading = ref(false)
const form = ref<SizeTableFormData>({
  name: '',
  headers: ['Размер', 'Обхват груди (см)', 'Обхват талии (см)', 'Обхват бедер (см)'],
  rows: [
    { cells: ['XS', '80-84', '60-64', '86-90'] },
    { cells: ['S', '84-88', '64-68', '90-94'] },
    { cells: ['M', '88-92', '68-72', '94-98'] },
    { cells: ['L', '92-96', '72-76', '98-102'] },
    { cells: ['XL', '96-100', '76-80', '102-106'] },
  ],
  is_active: true
})

const handleSubmit = async () => {
  if (!form.value.name) {
    alert('Введите название таблицы')
    return
  }

  if (form.value.headers.length === 0) {
    alert('Добавьте хотя бы одну колонку')
    return
  }

  loading.value = true
  try {
    const response = await $api('/admin/size-tables', {
      method: 'POST',
      body: form.value
    })

    router.push('/admin/size-tables')
  } catch (error: any) {
    console.error('Failed to create size table:', error)
    alert(error?.data?.message || 'Ошибка при создании таблицы')
  } finally {
    loading.value = false
  }
}
</script>