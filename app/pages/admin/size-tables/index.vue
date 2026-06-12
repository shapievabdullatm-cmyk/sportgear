<template>
  <div class="space-y-5">

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Таблицы размеров</h1>
        <Transition name="fade">
          <button v-if="selectedIds.length > 0" @click="confirmBulkDelete"
                  class="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-[12px] font-medium text-red-500 hover:bg-red-100 transition-all">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Удалить ({{ selectedIds.length }})
          </button>
        </Transition>
      </div>
      <NuxtLink to="/admin/size-tables/create"
                class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors">
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Добавить таблицу
      </NuxtLink>
    </div>

    <div class="relative">
      <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg class="w-3.5 h-3.5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      </span>
      <input v-model="searchQuery" type="text" placeholder="Поиск по названию…"
             class="w-full bg-white border border-[#E8E6E0] rounded-xl py-2.5 pl-9 pr-4 text-[13px] placeholder-[#C0BEB8] focus:outline-none focus:border-[#1A1A1A] transition-colors" />
    </div>

    <div class="flex items-center gap-4 text-[12px] text-[#ABABAB]">
      <span v-if="pagination">Всего: <strong class="text-[#1A1A1A]">{{ pagination.total }}</strong></span>
    </div>

    <div class="hidden md:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
        <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
          <th class="th w-10 !pr-0">
            <input type="checkbox" :checked="isAllSelected" @change="toggleSelectAll"
                   class="w-3.5 h-3.5 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 cursor-pointer">
          </th>
          <th class="th w-12">ID</th>
          <th class="th">Название</th>
          <th class="th w-32">Размер</th>
          <th class="th w-24">Статус</th>
          <th class="th w-24 text-right">Действия</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="table in sizeTables" :key="table.id"
            class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors"
            :class="{'bg-[#FAFAF8]': selectedIds.includes(table.id)}">
          <td class="td !pr-0">
            <input type="checkbox" v-model="selectedIds" :value="table.id"
                   class="w-3.5 h-3.5 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 cursor-pointer">
          </td>
          <td class="td font-mono text-[11px] text-[#C0BEB8]">{{ table.id }}</td>

          <td class="td">
            <NuxtLink :to="`/admin/size-tables/${table.id}/edit`"
                      class="text-[13px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors">
              {{ table.name }}
            </NuxtLink>
          </td>

          <td class="td">
            <span class="text-[12px] text-[#888]">
              {{ table.headers?.length || 0 }} × {{ table.rows?.length || 0 }}
            </span>
          </td>

          <td class="td">
            <span v-if="table.is_active" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-50 text-green-600">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Активна
            </span>
            <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-50 text-gray-500">
              <span class="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
              Неактивна
            </span>
          </td>

          <td class="td">
            <div class="flex items-center justify-end gap-0.5">
              <NuxtLink :to="`/admin/size-tables/${table.id}/edit`"
                        class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </NuxtLink>
              <button @click="confirmSingleDelete(table.id)"
                      class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
        <tr v-if="!sizeTables.length">
          <td colspan="6" class="px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
            Таблицы размеров не найдены
          </td>
        </tr>
        </tbody>
      </table>

      <div v-if="pagination && pagination.last_page > 1"
           class="flex items-center justify-between px-5 py-3 border-t border-[#F0EEE9]">
        <div class="text-[12px] text-[#ABABAB]">
          Показано {{ pagination.from }}-{{ pagination.to }} из {{ pagination.total }}
        </div>
        <div class="flex items-center gap-1">
          <button @click="loadPage(pagination.current_page - 1)" :disabled="pagination.current_page === 1"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="text-[12px] text-[#ABABAB] px-2">{{ pagination.current_page }} / {{ pagination.last_page }}</span>
          <button @click="loadPage(pagination.current_page + 1)" :disabled="pagination.current_page === pagination.last_page"
                  class="w-7 h-7 flex items-center justify-center rounded-md text-[#ABABAB] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile cards -->
    <div class="md:hidden space-y-2">
      <div v-for="table in sizeTables" :key="table.id"
           class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-3.5 flex items-start gap-3"
           :class="{'border-[#1A1A1A]': selectedIds.includes(table.id)}">
        <input type="checkbox" v-model="selectedIds" :value="table.id"
               class="w-4 h-4 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 cursor-pointer mt-0.5">
        <div class="flex-1 min-w-0 space-y-1.5">
          <div class="flex items-start justify-between gap-2">
            <NuxtLink :to="`/admin/size-tables/${table.id}/edit`"
                      class="text-[13px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors">
              {{ table.name }}
            </NuxtLink>
            <button @click="confirmSingleDelete(table.id)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-400 hover:bg-red-50 transition-colors shrink-0">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
          <div class="flex items-center gap-2 text-[11px] text-[#888]">
            <span>{{ table.headers?.length || 0 }} × {{ table.rows?.length || 0 }}</span>
            <span v-if="table.is_active" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-medium">
              Активна
            </span>
            <span v-else class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 font-medium">
              Неактивна
            </span>
          </div>
        </div>
      </div>
      <div v-if="!sizeTables.length" class="bg-white border border-[#E8E6E0] rounded-xl px-4 py-12 text-center text-[13px] text-[#C0BEB8]">
        Таблицы размеров не найдены
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import type { SizeTable } from '~/types/sizeTable'

definePageMeta({
  layout: 'admin',
  middleware: 'admin'
})

const { $api } = useApi()

const sizeTables = ref<SizeTable[]>([])
const pagination = ref<any>(null)
const searchQuery = ref('')
const selectedIds = ref<number[]>([])
const loading = ref(false)

const isAllSelected = computed(() => {
  return sizeTables.value.length > 0 && selectedIds.value.length === sizeTables.value.length
})

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = sizeTables.value.map(t => t.id)
  }
}

const loadSizeTables = async (page = 1) => {
  loading.value = true
  try {
    const params: any = { page, per_page: 20 }
    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    const response = await $api('/admin/size-tables', { params })
    sizeTables.value = response.data
    pagination.value = {
      current_page: response.current_page,
      last_page: response.last_page,
      from: response.from,
      to: response.to,
      total: response.total
    }
  } catch (error) {
    console.error('Failed to load size tables:', error)
  } finally {
    loading.value = false
  }
}

const loadPage = (page: number) => {
  loadSizeTables(page)
}

const confirmSingleDelete = async (id: number) => {
  if (!confirm('Удалить эту таблицу размеров?')) return
  await deleteSizeTable(id)
}

const confirmBulkDelete = async () => {
  if (!confirm(`Удалить выбранные таблицы (${selectedIds.value.length})?`)) return
  for (const id of selectedIds.value) {
    await deleteSizeTable(id)
  }
  selectedIds.value = []
}

const deleteSizeTable = async (id: number) => {
  try {
    await $api(`/admin/size-tables/${id}`, { method: 'DELETE' })
    await loadSizeTables(pagination.value?.current_page || 1)
  } catch (error) {
    console.error('Failed to delete size table:', error)
    alert('Ошибка при удалении таблицы')
  }
}

watch(searchQuery, () => {
  loadSizeTables(1)
})

onMounted(() => {
  loadSizeTables()
})
</script>

<style scoped>
.th {
  @apply px-5 py-3 text-left text-[11px] font-semibold text-[#888] uppercase tracking-wide;
}

.td {
  @apply px-5 py-3.5 text-[13px] text-[#1A1A1A];
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>