<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Документы движения товаров</h1>
        <p class="text-[12px] text-[#ABABAB] mt-0.5">Приход, расход и перемещение товаров</p>
      </div>
      <NuxtLink
          to="/admin/stock-documents/create"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Создать документ
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <!-- Type Filter -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">Тип</label>
          <div class="relative">
            <button
                @click="showTypeDropdown = !showTypeDropdown"
                type="button"
                class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
            >
              <span :class="filters.type ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                {{ getTypeLabel(filters.type) || 'Все типы' }}
              </span>
              <svg class="w-4 h-4 text-[#ABABAB] transition-transform" :class="{ 'rotate-180': showTypeDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <div
                v-if="showTypeDropdown"
                class="absolute z-10 w-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg"
            >
              <button
                  type="button"
                  @click="selectType('')"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9]"
                  :class="!filters.type ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                Все типы
              </button>
              <button
                  v-for="type in documentTypes"
                  :key="type.value"
                  type="button"
                  @click="selectType(type.value)"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                  :class="filters.type === type.value ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                {{ type.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Status Filter -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">Статус</label>
          <div class="relative">
            <button
                @click="showStatusDropdown = !showStatusDropdown"
                type="button"
                class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
            >
              <span :class="filters.status ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                {{ getStatusLabel(filters.status) || 'Все статусы' }}
              </span>
              <svg class="w-4 h-4 text-[#ABABAB] transition-transform" :class="{ 'rotate-180': showStatusDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <div
                v-if="showStatusDropdown"
                class="absolute z-10 w-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg"
            >
              <button
                  type="button"
                  @click="selectStatus('')"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9]"
                  :class="!filters.status ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                Все статусы
              </button>
              <button
                  v-for="status in documentStatuses"
                  :key="status.value"
                  type="button"
                  @click="selectStatus(status.value)"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                  :class="filters.status === status.value ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                {{ status.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Warehouse Filter -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">Склад</label>
          <div class="relative">
            <button
                @click="showWarehouseDropdown = !showWarehouseDropdown"
                type="button"
                class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
            >
              <span :class="filters.warehouse_id ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                {{ warehouses.find(w => w.id.toString() === filters.warehouse_id)?.title || 'Все склады' }}
              </span>
              <svg class="w-4 h-4 text-[#ABABAB] transition-transform" :class="{ 'rotate-180': showWarehouseDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <div
                v-if="showWarehouseDropdown"
                class="absolute z-10 w-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <button
                  type="button"
                  @click="selectWarehouse('')"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9]"
                  :class="!filters.warehouse_id ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                Все склады
              </button>
              <button
                  v-for="warehouse in warehouses"
                  :key="warehouse.id"
                  type="button"
                  @click="selectWarehouse(warehouse.id.toString())"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                  :class="filters.warehouse_id === warehouse.id.toString() ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                {{ warehouse.title }}
              </button>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">Поиск</label>
          <input
              v-model="filters.search"
              @input="fetchDocuments"
              type="text"
              placeholder="Номер документа"
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
          />
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
        <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
          <th class="th">Номер</th>
          <th class="th">Тип</th>
          <th class="th">Склад</th>
          <th class="th text-right">Позиций</th>
          <th class="th">Статус</th>
          <th class="th">Дата</th>
          <th class="th w-32 text-right">Действия</th>
        </tr>
        </thead>

        <tbody>
        <template v-if="loading">
          <tr v-for="n in 5" :key="n" class="border-b border-[#F0EEE9] last:border-0">
            <td class="td"><div class="h-3 w-32 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-20 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-24 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-12 bg-[#F0EEE9] rounded animate-pulse ml-auto" /></td>
            <td class="td"><div class="h-3 w-20 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-24 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td" />
          </tr>
        </template>

        <template v-else>
          <tr
              v-for="doc in documents"
              :key="doc.id"
              class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
          >
            <td class="td">
              <NuxtLink
                  :to="`/admin/stock-documents/${doc.id}`"
                  class="text-[13px] font-medium text-[#1A1A1A] hover:text-blue-600"
              >
                {{ doc.number }}
              </NuxtLink>
            </td>

            <td class="td">
              <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                  :class="getTypeColor(doc.type)"
              >
                {{ getTypeLabel(doc.type) }}
              </span>
            </td>

            <td class="td text-[13px] text-[#555]">
              {{ doc.warehouse?.title || `#${doc.warehouse_id}` }}
              <span v-if="doc.type === 'transfer' && doc.to_warehouse" class="text-[#ABABAB]">
                → {{ doc.to_warehouse.title }}
              </span>
            </td>

            <td class="td text-right">
              <span class="text-[13px] text-[#555]">{{ doc.items?.length || 0 }}</span>
            </td>

            <td class="td">
              <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
                  :class="getStatusColor(doc.status)"
              >
                {{ getStatusLabel(doc.status) }}
              </span>
            </td>

            <td class="td text-[12px] text-[#ABABAB]">
              {{ formatDate(doc.created_at) }}
            </td>

            <td class="td">
              <div class="flex items-center justify-end gap-0.5">
                <NuxtLink
                    v-if="doc.status === 'draft'"
                    :to="`/admin/stock-documents/${doc.id}/edit`"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
                    title="Редактировать"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </NuxtLink>

                <button
                    v-if="doc.status === 'draft'"
                    @click="completeDocument(doc)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-green-600 hover:bg-green-50 transition-colors"
                    title="Провести"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>

                <button
                    v-if="doc.status === 'draft'"
                    @click="deleteDocument(doc)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Удалить"
                >
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!documents.length">
            <td colspan="7" class="px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
              Документы не найдены
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

definePageMeta({ layout: 'admin' })

const { $api } = useApi()

interface Document {
  id: number
  number: string
  type: string
  warehouse_id: number
  to_warehouse_id?: number
  status: string
  created_at: string
  warehouse?: { id: number; title: string }
  to_warehouse?: { id: number; title: string }
  items?: any[]
}

interface Warehouse {
  id: number
  title: string
}

const documents = ref<Document[]>([])
const warehouses = ref<Warehouse[]>([])
const loading = ref(false)

const showTypeDropdown = ref(false)
const showStatusDropdown = ref(false)
const showWarehouseDropdown = ref(false)

const documentTypes = [
  { value: 'in', label: 'Приход' },
  { value: 'out', label: 'Расход' },
  { value: 'transfer', label: 'Перемещение' }
]

const documentStatuses = [
  { value: 'draft', label: 'Черновик' },
  { value: 'completed', label: 'Проведен' },
  { value: 'cancelled', label: 'Отменен' }
]

const filters = reactive({
  type: '',
  status: '',
  warehouse_id: '',
  search: ''
})

function selectType(type: string) {
  filters.type = type
  showTypeDropdown.value = false
  fetchDocuments()
}

function selectStatus(status: string) {
  filters.status = status
  showStatusDropdown.value = false
  fetchDocuments()
}

function selectWarehouse(id: string) {
  filters.warehouse_id = id
  showWarehouseDropdown.value = false
  fetchDocuments()
}

function getTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    in: 'Приход',
    out: 'Расход',
    transfer: 'Перемещение'
  }
  return labels[type] || type
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    in: 'bg-green-50 text-green-700',
    out: 'bg-red-50 text-red-700',
    transfer: 'bg-blue-50 text-blue-700'
  }
  return colors[type] || 'bg-gray-50 text-gray-700'
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: 'Черновик',
    completed: 'Проведен',
    cancelled: 'Отменен'
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-yellow-50 text-yellow-700',
    completed: 'bg-green-50 text-green-700',
    cancelled: 'bg-gray-50 text-gray-700'
  }
  return colors[status] || 'bg-gray-50 text-gray-700'
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

async function fetchDocuments() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.type) params.append('type', filters.type)
    if (filters.status) params.append('status', filters.status)
    if (filters.warehouse_id) params.append('warehouse_id', filters.warehouse_id)
    if (filters.search) params.append('search', filters.search)

    const data = await $api<any>(`/admin/stock-documents?${params}`)
    documents.value = data.data || data
  } catch (error) {
    console.error('Failed to fetch documents:', error)
  } finally {
    loading.value = false
  }
}

async function fetchWarehouses() {
  try {
    const data = await $api<any>('/admin/warehouses')
    warehouses.value = data.data || data
  } catch (error) {
    console.error('Failed to fetch warehouses:', error)
  }
}

async function completeDocument(doc: Document) {
  if (!confirm(`Провести документ ${doc.number}? После проведения изменения будут применены к остаткам.`)) {
    return
  }

  try {
    await $api(`/admin/stock-documents/${doc.id}/complete`, { method: 'POST' })
    await fetchDocuments()
  } catch (error: any) {
    alert(error.data?.error || 'Ошибка при проведении документа')
  }
}

async function deleteDocument(doc: Document) {
  if (!confirm(`Удалить документ ${doc.number}?`)) {
    return
  }

  try {
    await $api(`/admin/stock-documents/${doc.id}`, { method: 'DELETE' })
    await fetchDocuments()
  } catch (error: any) {
    alert(error.data?.error || 'Ошибка при удалении документа')
  }
}

onMounted(() => {
  fetchDocuments()
  fetchWarehouses()

  // Close dropdowns when clicking outside
  if (typeof window !== 'undefined') {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('.relative')) {
        showTypeDropdown.value = false
        showStatusDropdown.value = false
        showWarehouseDropdown.value = false
      }
    })
  }
})
</script>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }
</style>