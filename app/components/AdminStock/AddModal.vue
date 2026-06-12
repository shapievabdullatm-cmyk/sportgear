<template>
  <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @click.self="$emit('close')"
  >
    <div class="bg-white border border-[#E8E6E0] rounded-xl shadow-xl p-6 w-full max-w-md space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-[15px] font-semibold text-[#1A1A1A]">Добавить остаток</h3>
        <button
            @click="$emit('close')"
            class="w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-[#1A1A1A] hover:bg-[#F0EEE9] transition-colors"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <!-- Product Search -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Товар *
          </label>
          <div class="relative">
            <input
                v-model="productSearch"
                @input="searchProducts"
                @focus="showProductDropdown = true"
                type="text"
                required
                class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
                placeholder="Поиск по названию, артикулу или штрихкоду"
                autocomplete="off"
            />

            <!-- Dropdown -->
            <div
                v-if="showProductDropdown && (searchResults.length > 0 || searchingProducts)"
                class="absolute z-10 w-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              <div v-if="searchingProducts" class="p-3 text-[12px] text-[#ABABAB] text-center">
                Поиск...
              </div>
              <div v-else-if="searchResults.length === 0" class="p-3 text-[12px] text-[#ABABAB] text-center">
                Товары не найдены
              </div>
              <button
                  v-for="product in searchResults"
                  :key="product.id"
                  type="button"
                  @click="selectProduct(product)"
                  class="w-full px-3 py-2 text-left hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
              >
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <div class="text-[13px] font-medium text-[#1A1A1A]">{{ product.title }}</div>
                    <div class="text-[11px] text-[#ABABAB] mt-0.5">
                      ID: {{ product.id }}
                      <template v-if="product.price"> • {{ product.price }} ₽</template>
                      <template v-if="product.parent_id">
                        <span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-600 ml-1">
                          Вариант
                        </span>
                      </template>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- Selected Product -->
          <div v-if="selectedProduct" class="mt-2 p-2 bg-[#FAFAF8] border border-[#E8E6E0] rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-[12px] font-medium text-[#1A1A1A]">{{ selectedProduct.title }}</div>
                <div class="text-[11px] text-[#ABABAB]">ID: {{ selectedProduct.id }}</div>
              </div>
              <button
                  type="button"
                  @click="clearProduct"
                  class="text-[#C0BEB8] hover:text-red-500 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Warehouse -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Склад *
          </label>
          <div class="relative">
            <button
                @click="showWarehouseDropdown = !showWarehouseDropdown"
                type="button"
                class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
            >
              <span :class="form.warehouse_id ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                {{ warehouses.find(w => w.id.toString() === form.warehouse_id)?.title || 'Выберите склад' }}
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
                  v-for="warehouse in warehouses"
                  :key="warehouse.id"
                  type="button"
                  @click="selectWarehouse(warehouse.id, warehouse.title)"
                  class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                  :class="form.warehouse_id === warehouse.id.toString() ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
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
          <p v-if="warehouses.length === 0" class="text-[11px] text-red-500 mt-1">
            Склады не загружены
          </p>
        </div>

        <!-- Quantity -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Количество *
          </label>
          <input
              v-model="form.quantity"
              type="number"
              min="1"
              required
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
              placeholder="0"
          />
        </div>

        <!-- Reason -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Причина
          </label>
          <input
              v-model="form.reason"
              type="text"
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent"
              placeholder="Например: Поставка от поставщика"
          />
        </div>

        <!-- Comment -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Комментарий
          </label>
          <textarea
              v-model="form.comment"
              rows="3"
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] focus:border-transparent resize-none"
              placeholder="Дополнительная информация"
          />
        </div>

        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-[12px] text-red-600">{{ error }}</p>
        </div>

        <div class="flex gap-2 justify-end pt-2">
          <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 rounded-lg text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
          >
            Отмена
          </button>
          <button
              type="submit"
              :disabled="submitting || !selectedProduct"
              class="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-[#1A1A1A] hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {{ submitting ? 'Добавление...' : 'Добавить' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

interface Warehouse {
  id: number
  title: string
}

interface Product {
  id: number
  title: string
  price: number
  parent_id?: number | null
}

const props = defineProps<{
  warehouses: Warehouse[]
}>()

const emit = defineEmits<{
  close: []
  success: []
}>()

const { $api } = useApi()

const form = reactive({
  product_id: '',
  warehouse_id: '',
  quantity: '',
  reason: '',
  comment: ''
})

const productSearch = ref('')
const searchResults = ref<Product[]>([])
const selectedProduct = ref<Product | null>(null)
const showProductDropdown = ref(false)
const searchingProducts = ref(false)
const submitting = ref(false)
const error = ref('')
const showWarehouseDropdown = ref(false)

let searchTimeout: NodeJS.Timeout

async function searchProducts() {
  if (productSearch.value.length < 2) {
    searchResults.value = []
    return
  }

  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    searchingProducts.value = true
    try {
      const data = await $api<any>(`/admin/products?search=${encodeURIComponent(productSearch.value)}&per_page=20&include_children=1`)
      searchResults.value = data.data || data
    } catch (err) {
      console.error('Failed to search products:', err)
      searchResults.value = []
    } finally {
      searchingProducts.value = false
    }
  }, 300)
}

function selectProduct(product: Product) {
  selectedProduct.value = product
  form.product_id = product.id.toString()
  productSearch.value = product.title
  showProductDropdown.value = false
}

function clearProduct() {
  selectedProduct.value = null
  form.product_id = ''
  productSearch.value = ''
  searchResults.value = []
}

function selectWarehouse(id: number, title: string) {
  form.warehouse_id = id.toString()
  showWarehouseDropdown.value = false
}

async function submit() {
  if (!selectedProduct.value) {
    error.value = 'Выберите товар'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    await $api('/admin/stocks/add', {
      method: 'POST',
      body: form
    })

    emit('success')
    emit('close')
  } catch (err: any) {
    error.value = err.data?.error || err.message || 'Ошибка при добавлении остатка'
  } finally {
    submitting.value = false
  }
}

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showProductDropdown.value = false
    }
  })
}
</script>