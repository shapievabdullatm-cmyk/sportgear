<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Управление остатками</h1>
        <p class="text-[12px] text-[#ABABAB] mt-0.5">Остатки товаров на складах</p>
      </div>
      <button
          @click="showAddModal = true"
          class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Добавить остаток
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <!-- Warehouse Filter -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">Склад</label>
          <div class="relative">
            <button
                @click="showWarehouseDropdown = !showWarehouseDropdown"
                type="button"
                class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
            >
              <span :class="filters.warehouse_id ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                {{ selectedWarehouseName || 'Все склады' }}
              </span>
              <svg class="w-4 h-4 text-[#ABABAB] transition-transform" :class="{ 'rotate-180': showWarehouseDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            <!-- Dropdown -->
            <div
                v-if="showWarehouseDropdown"
                class="absolute z-10 w-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <button
                  type="button"
                  @click="selectWarehouse('', 'Все склады')"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9]"
                  :class="!filters.warehouse_id ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                Все склады
              </button>
              <button
                  v-for="warehouse in warehouses"
                  :key="warehouse.id"
                  type="button"
                  @click="selectWarehouse(warehouse.id.toString(), warehouse.title)"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                  :class="filters.warehouse_id === warehouse.id.toString() ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
              >
                <div class="flex items-center justify-between">
                  <span>{{ warehouse.title }}</span>
                  <span
                      v-if="warehouse.is_active"
                      class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium bg-[#F0FDF4] text-[#15803D]"
                  >
                    Активен
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Product Filter -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">Товар</label>
          <input
              v-model="filters.search"
              @input="fetchStocks"
              type="text"
              placeholder="Поиск по названию, артикулу, ID"
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
          />
        </div>

        <!-- In Stock Filter -->
        <div class="flex items-end">
          <label class="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg hover:bg-[#FAFAF8] transition-colors">
            <input
                v-model="filters.in_stock"
                @change="fetchStocks"
                type="checkbox"
                class="w-4 h-4 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-2 focus:ring-[#1A1A1A]"
            />
            <span class="text-[13px] text-[#555]">Только в наличии</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
        <tr class="border-b border-[#E8E6E0] bg-[#FAFAF8]">
          <th class="th">Товар</th>
          <th class="th">Склад</th>
          <th class="th text-right">Всего</th>
          <th class="th text-right">Резерв</th>
          <th class="th text-right">Доступно</th>
          <th class="th w-32 text-right">Действия</th>
        </tr>
        </thead>

        <tbody>
        <!-- Loading skeleton -->
        <template v-if="loading">
          <tr v-for="n in 5" :key="n" class="border-b border-[#F0EEE9] last:border-0">
            <td class="td"><div class="h-3 w-48 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-32 bg-[#F0EEE9] rounded animate-pulse" /></td>
            <td class="td"><div class="h-3 w-16 bg-[#F0EEE9] rounded animate-pulse ml-auto" /></td>
            <td class="td"><div class="h-3 w-16 bg-[#F0EEE9] rounded animate-pulse ml-auto" /></td>
            <td class="td"><div class="h-3 w-16 bg-[#F0EEE9] rounded animate-pulse ml-auto" /></td>
            <td class="td" />
          </tr>
        </template>

        <template v-else>
          <tr
              v-for="stock in stocks"
              :key="`${stock.product_id}-${stock.warehouse_id}`"
              class="border-b border-[#F0EEE9] last:border-0 hover:bg-[#FAFAF8] transition-colors duration-100"
          >
            <td class="td">
              <div class="text-[13px] font-medium text-[#1A1A1A]">
                {{ stock.product?.title || `Товар #${stock.product_id}` }}
              </div>
              <div class="text-[11px] text-[#ABABAB] mt-0.5">ID: {{ stock.product_id }}</div>
            </td>

            <td class="td text-[13px] text-[#555]">
              {{ stock.warehouse?.title || `Склад #${stock.warehouse_id}` }}
            </td>

            <td class="td text-right">
              <span class="text-[13px] font-medium text-[#1A1A1A]">{{ stock.quantity }}</span>
            </td>

            <td class="td text-right">
              <span class="text-[13px] text-[#ABABAB]">{{ stock.reserved_quantity }}</span>
            </td>

            <td class="td text-right">
              <span
                  class="inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium"
                  :class="stock.quantity - stock.reserved_quantity > 0
                    ? 'bg-[#F0FDF4] text-[#15803D]'
                    : 'bg-[#FEF2F2] text-[#DC2626]'"
              >
                {{ stock.quantity - stock.reserved_quantity }}
              </span>
            </td>

            <td class="td">
              <div class="flex items-center justify-end gap-0.5">
                <button
                    @click="openOperationModal('add', stock)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-green-600 hover:bg-green-50 transition-colors duration-150"
                    title="Приход"
                >
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>

                <button
                    @click="openOperationModal('remove', stock)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                    title="Расход"
                >
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>

                <button
                    @click="openOperationModal('adjust', stock)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                    title="Корректировка"
                >
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>

                <button
                    @click="viewHistory(stock)"
                    class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors duration-150"
                    title="История"
                >
                  <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!stocks.length">
            <td colspan="6" class="px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
              Остатки не найдены
            </td>
          </tr>
        </template>
        </tbody>
      </table>
    </div>

    <!-- Add Stock Modal -->
    <AdminStockAddModal
        v-if="showAddModal"
        :warehouses="warehouses"
        @close="showAddModal = false"
        @success="handleSuccess"
    />

    <!-- Operation Modal -->
    <AdminStockOperationModal
        v-if="operationModal.show"
        :type="operationModal.type"
        :stock="operationModal.stock"
        :warehouses="warehouses"
        @close="operationModal.show = false"
        @success="handleSuccess"
    />

    <!-- History Modal -->
    <AdminStockHistoryModal
        v-if="historyModal.show"
        :product-id="historyModal.productId"
        :warehouse-id="historyModal.warehouseId"
        @close="historyModal.show = false"
    />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

definePageMeta({ layout: 'admin' })

const { $api } = useApi()

interface Stock {
  id: number
  product_id: number
  warehouse_id: number
  quantity: number
  reserved_quantity: number
  product?: { id: number; title: string }
  warehouse?: { id: number; title: string }
}

interface Warehouse {
  id: number
  title: string
  is_active: boolean
}

const stocks = ref<Stock[]>([])
const warehouses = ref<Warehouse[]>([])
const loading = ref(false)
const showAddModal = ref(false)
const showWarehouseDropdown = ref(false)
const selectedWarehouseName = ref('')

const filters = reactive({
  warehouse_id: '',
  search: '',
  in_stock: false
})

const operationModal = reactive({
  show: false,
  type: 'add' as 'add' | 'remove' | 'adjust' | 'transfer',
  stock: null as Stock | null
})

const historyModal = reactive({
  show: false,
  productId: 0,
  warehouseId: 0
})

async function fetchStocks() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    if (filters.warehouse_id) params.append('warehouse_id', filters.warehouse_id)
    if (filters.search) params.append('search', filters.search)
    if (filters.in_stock) params.append('in_stock', '1')

    const data = await $api<any>(`/admin/stocks?${params}`)
    stocks.value = data.data || data
  } catch (error) {
    console.error('Failed to fetch stocks:', error)
  } finally {
    loading.value = false
  }
}

async function fetchWarehouses() {
  try {
    const data = await $api<any>('/admin/warehouses')
    warehouses.value = data.data || data
    console.log('Warehouses loaded:', warehouses.value)
  } catch (error) {
    console.error('Failed to fetch warehouses:', error)
  }
}

function openOperationModal(type: 'add' | 'remove' | 'adjust' | 'transfer', stock: Stock) {
  operationModal.type = type
  operationModal.stock = stock
  operationModal.show = true
}

function viewHistory(stock: Stock) {
  historyModal.productId = stock.product_id
  historyModal.warehouseId = stock.warehouse_id
  historyModal.show = true
}

function handleSuccess() {
  fetchStocks()
}

function selectWarehouse(id: string, name: string) {
  filters.warehouse_id = id
  selectedWarehouseName.value = name === 'Все склады' ? '' : name
  showWarehouseDropdown.value = false
  fetchStocks()
}

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showWarehouseDropdown.value = false
    }
  })
}

onMounted(() => {
  fetchStocks()
  fetchWarehouses()
})
</script>

<style scoped>
.th { @apply px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-[#ABABAB]; }
.td { @apply px-5 py-3.5; }
</style>