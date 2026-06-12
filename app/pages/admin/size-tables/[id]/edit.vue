<template>
  <div class="space-y-5">
    <div class="flex items-center gap-3">
      <NuxtLink to="/admin/size-tables"
                class="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8E6E0] text-[#C0BEB8] hover:text-[#1A1A1A] hover:border-[#C0BEB8] transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </NuxtLink>
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Редактировать таблицу размеров</h1>
    </div>

    <div v-if="loadingData" class="flex items-center justify-center py-12">
      <svg class="w-8 h-8 animate-spin text-[#1A1A1A]" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
      </svg>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
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
          <span v-else>Сохранить изменения</span>
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
const route = useRoute()

const id = computed(() => route.params.id as string)

const loading = ref(false)
const loadingData = ref(true)
const form = ref<SizeTableFormData>({
  name: '',
  headers: [],
  rows: [],
  is_active: true
})

const loadSizeTable = async () => {
  loadingData.value = true
  try {
    const data = await $api(`/admin/size-tables/${id.value}`)
    form.value = {
      name: data.name,
      headers: data.headers || [],
      rows: data.rows || [],
      is_active: data.is_active
    }
  } catch (error) {
    console.error('Failed to load size table:', error)
    alert('Ошибка при загрузке таблицы')
    router.push('/admin/size-tables')
  } finally {
    loadingData.value = false
  }
}

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
    await $api(`/admin/size-tables/${id.value}`, {
      method: 'PATCH',
      body: form.value
    })

    router.push('/admin/size-tables')
  } catch (error: any) {
    console.error('Failed to update size table:', error)
    alert(error?.data?.message || 'Ошибка при обновлении таблицы')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadSizeTable()
})
</script>