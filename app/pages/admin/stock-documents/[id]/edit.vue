<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[15px] font-semibold text-[#1A1A1A]">
          Редактирование документа
        </h1>
        <p class="text-[12px] text-[#ABABAB] mt-0.5">
          Документ {{ document?.number }}
        </p>
      </div>
      <NuxtLink
          :to="`/admin/stock-documents/${route.params.id}`"
          class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] px-3.5 py-2 text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
      >
        Отмена
      </NuxtLink>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-32 bg-[#F0EEE9] rounded-xl animate-pulse" />
      <div class="h-64 bg-[#F0EEE9] rounded-xl animate-pulse" />
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="submit" class="space-y-6">
      <!-- Main Info -->
      <div class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-4">
        <h3 class="text-[13px] font-semibold text-[#1A1A1A]">Основная информация</h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Type -->
          <div>
            <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
              Тип документа *
            </label>
            <div class="relative">
              <button
                  @click="showTypeDropdown = !showTypeDropdown"
                  type="button"
                  class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
              >
                <span :class="form.type ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                  {{ getTypeLabel(form.type) || 'Выберите тип' }}
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
                    v-for="type in documentTypes"
                    :key="type.value"
                    type="button"
                    @click="selectType(type.value)"
                    class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                    :class="form.type === type.value ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
                >
                  {{ type.label }}
                </button>
              </div>
            </div>
          </div>

          <!-- Warehouse -->
          <div>
            <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
              {{ form.type === 'transfer' ? 'Склад отправитель *' : 'Склад *' }}
            </label>
            <div class="relative">
              <button
                  @click="showWarehouseDropdown = !showWarehouseDropdown"
                  type="button"
                  class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
              >
                <span :class="form.warehouse_id ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                  {{ warehouses.find(w => w.id.toString() === form.warehouse_id)?.title || 'Выберите склад' }}
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
                    v-for="warehouse in warehouses"
                    :key="warehouse.id"
                    type="button"
                    @click="selectWarehouse(warehouse.id)"
                    class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                    :class="form.warehouse_id === warehouse.id.toString() ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
                >
                  {{ warehouse.title }}
                </button>
              </div>
            </div>
          </div>

          <!-- To Warehouse (for transfer) -->
          <div v-if="form.type === 'transfer'">
            <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
              Склад получатель *
            </label>
            <div class="relative">
              <button
                  @click="showToWarehouseDropdown = !showToWarehouseDropdown"
                  type="button"
                  class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] text-left flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
              >
                <span :class="form.to_warehouse_id ? 'text-[#1A1A1A]' : 'text-[#ABABAB]'">
                  {{ warehouses.find(w => w.id.toString() === form.to_warehouse_id)?.title || 'Выберите склад' }}
                </span>
                <svg class="w-4 h-4 text-[#ABABAB] transition-transform" :class="{ 'rotate-180': showToWarehouseDropdown }" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              <div
                  v-if="showToWarehouseDropdown"
                  class="absolute z-10 w-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <button
                    v-for="warehouse in warehouses"
                    :key="warehouse.id"
                    type="button"
                    @click="selectToWarehouse(warehouse.id)"
                    :disabled="warehouse.id.toString() === form.warehouse_id"
                    class="w-full px-3 py-2 text-left text-[13px] hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="form.to_warehouse_id === warehouse.id.toString() ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#555]'"
                >
                  {{ warehouse.title }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Comment -->
        <div>
          <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
            Комментарий
          </label>
          <textarea
              v-model="form.comment"
              rows="2"
              class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A] resize-none"
              placeholder="Дополнительная информация о документе"
          />
        </div>
      </div>

      <!-- Items -->
      <div class="bg-white border border-[#E8E6E0] rounded-xl p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-[13px] font-semibold text-[#1A1A1A]">Товары</h3>
          <button
              type="button"
              @click="addItem"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#333] transition-colors"
          >
            <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить товар
          </button>
        </div>

        <div v-if="form.items.length === 0" class="text-center py-8 text-[13px] text-[#C0BEB8]">
          Добавьте товары в документ
        </div>

        <div v-else class="space-y-3">
          <div
              v-for="(item, index) in form.items"
              :key="index"
              class="border border-[#E8E6E0] rounded-lg p-4 space-y-3"
          >
            <div class="flex items-start gap-3">
              <!-- Product Search -->
              <div class="flex-1">
                <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
                  Товар *
                </label>
                <div class="relative">
                  <input
                      v-model="item.search"
                      @input="searchProducts(index)"
                      @focus="item.showDropdown = true"
                      type="text"
                      required
                      class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                      placeholder="Поиск по названию, артикулу"
                      autocomplete="off"
                  />

                  <!-- Dropdown -->
                  <div
                      v-if="item.showDropdown && (item.searchResults.length > 0 || item.searching)"
                      class="absolute z-10 w-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <div v-if="item.searching" class="p-3 text-[12px] text-[#ABABAB] text-center">
                      Поиск...
                    </div>
                    <div v-else-if="item.searchResults.length === 0" class="p-3 text-[12px] text-[#ABABAB] text-center">
                      Товары не найдены
                    </div>
                    <button
                        v-for="product in item.searchResults"
                        :key="product.id"
                        type="button"
                        @click="selectProduct(index, product)"
                        class="w-full px-3 py-2 text-left hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EEE9] last:border-0"
                    >
                      <div class="text-[13px] font-medium text-[#1A1A1A]">{{ product.title }}</div>
                      <div class="text-[11px] text-[#ABABAB] mt-0.5">ID: {{ product.id }} • {{ product.price }} ₽</div>
                    </button>
                  </div>
                </div>

                <!-- Selected Product -->
                <div v-if="item.product" class="mt-2 p-2 bg-[#FAFAF8] border border-[#E8E6E0] rounded-lg">
                  <div class="text-[12px] font-medium text-[#1A1A1A]">{{ item.product.title }}</div>
                  <div class="text-[11px] text-[#ABABAB]">ID: {{ item.product.id }}</div>
                </div>
              </div>

              <!-- Quantity -->
              <div class="w-32">
                <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
                  Кол-во *
                </label>
                <input
                    v-model="item.quantity"
                    type="number"
                    min="1"
                    required
                    class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                    placeholder="0"
                />
              </div>

              <!-- Price -->
              <div class="w-32">
                <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
                  Цена
                </label>
                <input
                    v-model="item.price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                    placeholder="0.00"
                />
              </div>

              <!-- Remove -->
              <button
                  type="button"
                  @click="removeItem(index)"
                  class="mt-7 w-7 h-7 flex items-center justify-center rounded-md text-[#C0BEB8] hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- Item Comment -->
            <div>
              <label class="block text-[11px] font-medium text-[#ABABAB] uppercase tracking-wider mb-1.5">
                Комментарий к позиции
              </label>
              <input
                  v-model="item.comment"
                  type="text"
                  class="w-full px-3 py-2 text-[13px] border border-[#E8E6E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A1A1A]"
                  placeholder="Дополнительная информация"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-[13px] text-red-600">{{ error }}</p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 justify-end">
        <NuxtLink
            :to="`/admin/stock-documents/${route.params.id}`"
            class="px-4 py-2 rounded-lg text-[13px] font-medium text-[#555] hover:bg-[#F0EEE9] transition-colors"
        >
          Отмена
        </NuxtLink>
        <button
            type="submit"
            :disabled="submitting || form.items.length === 0"
            class="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-[#1A1A1A] hover:bg-[#333] transition-colors disabled:opacity-50"
        >
          {{ submitting ? 'Сохранение...' : 'Сохранить' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const { $api } = useApi()

const document = ref<any>(null)
const warehouses = ref<any[]>([])
const loading = ref(false)
const submitting = ref(false)
const error = ref('')

const showTypeDropdown = ref(false)
const showWarehouseDropdown = ref(false)
const showToWarehouseDropdown = ref(false)

const documentTypes = [
  { value: 'in', label: 'Приход' },
  { value: 'out', label: 'Расход' },
  { value: 'transfer', label: 'Перемещение' }
]

interface Item {
  product_id: string
  quantity: string
  price: string
  comment: string
  search: string
  product: any
  searchResults: any[]
  searching: boolean
  showDropdown: boolean
}

const form = reactive({
  type: '',
  warehouse_id: '',
  to_warehouse_id: '',
  comment: '',
  items: [] as Item[]
})

function getTypeLabel(type: string): string {
  return documentTypes.find(t => t.value === type)?.label || ''
}

function selectType(type: string) {
  form.type = type
  showTypeDropdown.value = false
}

function selectWarehouse(id: number) {
  form.warehouse_id = id.toString()
  showWarehouseDropdown.value = false
}

function selectToWarehouse(id: number) {
  form.to_warehouse_id = id.toString()
  showToWarehouseDropdown.value = false
}

function addItem() {
  form.items.push({
    product_id: '',
    quantity: '',
    price: '',
    comment: '',
    search: '',
    product: null,
    searchResults: [],
    searching: false,
    showDropdown: false
  })
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

let searchTimeouts: Record<number, NodeJS.Timeout> = {}

async function searchProducts(index: number) {
  const item = form.items[index]

  if (item.search.length < 2) {
    item.searchResults = []
    return
  }

  clearTimeout(searchTimeouts[index])
  searchTimeouts[index] = setTimeout(async () => {
    item.searching = true
    try {
      const data = await $api<any>(`/admin/products?search=${encodeURIComponent(item.search)}&per_page=20&include_children=1`)
      item.searchResults = data.data || data
    } catch (err) {
      console.error('Failed to search products:', err)
      item.searchResults = []
    } finally {
      item.searching = false
    }
  }, 300)
}

function selectProduct(index: number, product: any) {
  const item = form.items[index]
  item.product = product
  item.product_id = product.id.toString()
  item.search = product.title
  item.showDropdown = false

  if (product.price && !item.price) {
    item.price = product.price.toString()
  }
}

async function fetchWarehouses() {
  try {
    const data = await $api<any>('/admin/warehouses')
    warehouses.value = data.data || data
  } catch (err) {
    console.error('Failed to fetch warehouses:', err)
  }
}

async function fetchDocument() {
  loading.value = true
  try {
    const data = await $api<any>(`/admin/stock-documents/${route.params.id}`)
    document.value = data

    form.type = data.type
    form.warehouse_id = data.warehouse_id.toString()
    form.to_warehouse_id = data.to_warehouse_id?.toString() || ''
    form.comment = data.comment || ''

    form.items = data.items.map((item: any) => ({
      product_id: item.product_id.toString(),
      quantity: item.quantity.toString(),
      price: item.price?.toString() || '',
      comment: item.comment || '',
      search: item.product?.title || '',
      product: item.product,
      searchResults: [],
      searching: false,
      showDropdown: false
    }))
  } catch (err) {
    console.error('Failed to fetch document:', err)
    error.value = 'Не удалось загрузить документ'
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (form.items.length === 0) {
    error.value = 'Добавьте хотя бы один товар'
    return
  }

  // Validate required fields
  if (!form.type) {
    error.value = 'Выберите тип документа'
    return
  }

  if (!form.warehouse_id) {
    error.value = 'Выберите склад'
    return
  }

  if (form.type === 'transfer' && !form.to_warehouse_id) {
    error.value = 'Выберите целевой склад для перемещения'
    return
  }

  for (const item of form.items) {
    if (!item.product_id) {
      error.value = 'Выберите товар для всех позиций'
      return
    }
  }

  submitting.value = true
  error.value = ''

  try {
    const payload = {
      type: form.type,
      warehouse_id: parseInt(form.warehouse_id),
      to_warehouse_id: form.to_warehouse_id ? parseInt(form.to_warehouse_id) : undefined,
      comment: form.comment || undefined,
      items: form.items.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: parseInt(item.quantity),
        price: item.price ? parseFloat(item.price) : undefined,
        comment: item.comment || undefined
      }))
    }

    await $api(`/admin/stock-documents/${route.params.id}`, {
      method: 'PATCH',
      body: payload
    })

    router.push(`/admin/stock-documents/${route.params.id}`)
  } catch (err: any) {
    error.value = err.data?.error || err.message || 'Ошибка при сохранении документа'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchWarehouses()
  fetchDocument()

  // Close dropdowns when clicking outside
  if (typeof window !== 'undefined') {
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (!target.closest('.relative')) {
        showTypeDropdown.value = false
        showWarehouseDropdown.value = false
        showToWarehouseDropdown.value = false
      }
    })
  }
})
</script>