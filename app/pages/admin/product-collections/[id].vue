<template>
  <div class="max-w-7xl space-y-6 mx-auto">

    <div class="flex items-center justify-between">
      <h1 class="text-[15px] font-semibold text-[#1A1A1A]">
        {{ loading ? 'Загрузка...' : originalCollection?.name }}
      </h1>
      <NuxtLink
          to="/admin/product-collections"
          class="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#ABABAB] hover:text-[#1A1A1A] transition-colors duration-150"
      >
        <svg class="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Назад
      </NuxtLink>
    </div>

    <!-- Настройки коллекции -->
    <div v-if="originalCollection" class="bg-white border border-[#E8E6E0] rounded-xl p-5 space-y-4">
      <div>
        <label class="block text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB] mb-2">
          Название коллекции
        </label>
        <input
            v-model="editedCollection.name"
            type="text"
            class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
        />
      </div>

      <div class="flex items-center gap-2">
        <input
            v-model="editedCollection.is_active"
            type="checkbox"
            id="is-active"
            class="w-4 h-4 rounded border-[#E8E6E0] text-[#1A1A1A] focus:ring-0 focus:ring-offset-0"
        />
        <label for="is-active" class="text-[13px] text-[#1A1A1A] cursor-pointer">
          Активна (отображается на сайте)
        </label>
      </div>

      <div class="flex gap-2 pt-2" v-if="hasChanges">
        <button
            :disabled="saving"
            @click="saveChanges"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#1A1A1A] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#333] transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Сохранение...' : 'Сохранить изменения' }}
        </button>
        <button
            @click="cancelChanges"
            class="inline-flex items-center gap-1.5 rounded-lg border border-[#E8E6E0] px-4 py-2.5 text-[13px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors duration-150"
        >
          Отменить
        </button>
      </div>
    </div>

    <!-- Основной контент: два столбца -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- Левая колонка: Доступные товары -->
      <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-[#F0EEE9]">
          <span class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
            Доступные товары · {{ filteredAvailableProducts.length }}
          </span>
        </div>

        <!-- Фильтры -->
        <div class="p-4 space-y-3 border-b border-[#F0EEE9]">
          <input
              v-model="searchQuery"
              type="text"
              placeholder="Поиск по названию или артикулу..."
              class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
          />

          <!-- Фильтр по бренду -->
          <div class="relative" ref="brandDropdownRef">
            <button
                @click="toggleBrandDropdown"
                class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-left outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150 flex items-center justify-between"
            >
              <span :class="selectedBrandId ? 'text-[#1A1A1A]' : 'text-[#C0BEB8]'">
                {{ selectedBrandName || 'Все бренды' }}
              </span>
              <svg class="w-4 h-4 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div
                v-if="brandDropdownOpen"
                class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col"
            >
              <div class="p-2 border-b border-[#F0EEE9]">
                <input
                    ref="brandSearchInput"
                    v-model="brandSearchQuery"
                    type="text"
                    placeholder="Поиск бренда..."
                    class="w-full px-3 py-2 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
                />
              </div>
              <div class="overflow-y-auto">
                <div
                    class="px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                    :class="selectedBrandId === null ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'"
                    @click="selectBrand(null)"
                >
                  Все бренды
                </div>
                <div
                    v-for="brand in filteredBrands"
                    :key="brand.id"
                    class="px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                    :class="selectedBrandId === brand.id ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'"
                    @click="selectBrand(brand.id)"
                >
                  {{ brand.name }}
                </div>
                <div
                    v-if="filteredBrands.length === 0"
                    class="px-3.5 py-3 text-[13px] text-[#ABABAB] text-center"
                >
                  Бренды не найдены
                </div>
              </div>
            </div>
          </div>

          <!-- Фильтр по категории -->
          <div class="relative" ref="categoryDropdownRef">
            <button
                @click="toggleCategoryDropdown"
                class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-left outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150 flex items-center justify-between"
            >
              <span :class="selectedCategoryId ? 'text-[#1A1A1A]' : 'text-[#C0BEB8]'">
                {{ selectedCategoryName || 'Все категории' }}
              </span>
              <svg class="w-4 h-4 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div
                v-if="categoryDropdownOpen"
                class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-xl max-h-64 overflow-hidden flex flex-col"
            >
              <div class="p-2 border-b border-[#F0EEE9]">
                <input
                    ref="categorySearchInput"
                    v-model="categorySearchQuery"
                    type="text"
                    placeholder="Поиск категории..."
                    class="w-full px-3 py-2 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150"
                />
              </div>
              <div class="overflow-y-auto">
                <div
                    class="px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                    :class="selectedCategoryId === null ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'"
                    @click="selectCategory(null)"
                >
                  Все категории
                </div>
                <div
                    v-for="category in filteredCategories"
                    :key="category.id"
                    class="px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                    :class="selectedCategoryId === category.id ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'"
                    @click="selectCategory(category.id)"
                >
                  {{ category.title }}
                </div>
                <div
                    v-if="filteredCategories.length === 0"
                    class="px-3.5 py-3 text-[13px] text-[#ABABAB] text-center"
                >
                  Категории не найдены
                </div>
              </div>
            </div>
          </div>

          <!-- Фильтр по наличию -->
          <div class="relative" ref="stockDropdownRef">
            <button
                @click="toggleStockDropdown"
                class="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E6E0] bg-[#FAFAF8] text-[13px] text-left outline-none focus:border-[#1A1A1A] focus:bg-white transition-colors duration-150 flex items-center justify-between"
            >
              <span class="text-[#1A1A1A]">
                {{ stockFilterLabel }}
              </span>
              <svg class="w-4 h-4 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            <div
                v-if="stockDropdownOpen"
                class="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-xl overflow-hidden"
            >
              <div
                  class="px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                  :class="selectedStockFilter === 'all' ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'"
                  @click="selectStockFilter('all')"
              >
                Все товары
              </div>
              <div
                  class="px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                  :class="selectedStockFilter === 'in_stock' ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'"
                  @click="selectStockFilter('in_stock')"
              >
                В наличии
              </div>
              <div
                  class="px-3.5 py-2 text-[13px] cursor-pointer hover:bg-[#FAFAF8] transition-colors"
                  :class="selectedStockFilter === 'out_of_stock' ? 'bg-[#FAFAF8] font-medium text-[#1A1A1A]' : 'text-[#1A1A1A]'"
                  @click="selectStockFilter('out_of_stock')"
              >
                Нет в наличии
              </div>
            </div>
          </div>
        </div>

        <!-- Список доступных товаров -->
        <div class="max-h-[600px] overflow-y-auto">
          <div v-if="loadingProducts" class="divide-y divide-[#F0EEE9]">
            <div v-for="n in 5" :key="n" class="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div class="w-10 h-10 rounded-lg bg-[#E8E6E0] shrink-0"/>
              <div class="flex-1 space-y-2">
                <div class="h-3 w-3/4 rounded bg-[#E8E6E0]"/>
                <div class="h-2 w-1/2 rounded bg-[#E8E6E0]"/>
              </div>
            </div>
          </div>

          <div v-else-if="filteredAvailableProducts.length === 0" class="py-12 text-center text-[13px] text-[#ABABAB]">
            Товары не найдены
          </div>

          <div v-else class="divide-y divide-[#F0EEE9]">
            <div
                v-for="product in filteredAvailableProducts"
                :key="product.id"
                class="flex items-center gap-3 px-5 py-3 hover:bg-[#FCFCFA] transition-colors cursor-pointer"
                @click="addProductToCollection(product)"
            >
              <div class="w-10 h-10 rounded-lg overflow-hidden border border-[#E8E6E0] shrink-0 bg-[#FAFAF8] flex items-center justify-center">
                <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover" />
                <svg v-else class="w-5 h-5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-[13px] text-[#1A1A1A] font-medium truncate">{{ product.title }}</p>
                <div class="flex items-center gap-2 text-[11px] text-[#ABABAB]">
                  <span>{{ product.article }}</span>
                  <span v-if="product.brand">· {{ product.brand.name }}</span>
                  <span v-if="product.in_stock" class="text-green-600">· В наличии ({{ product.total_stock }})</span>
                  <span v-else class="text-red-600">· Нет в наличии</span>
                </div>
              </div>

              <button
                  class="p-1.5 rounded hover:bg-[#E8E6E0] text-[#1A1A1A] transition-colors"
                  @click.stop="addProductToCollection(product)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Пагинация -->
        <div v-if="lastPage > 1" class="px-5 py-3 border-t border-[#F0EEE9] flex items-center justify-between">
          <span class="text-[11px] text-[#ABABAB]">
            Страница {{ currentPage }} из {{ lastPage }} (всего {{ totalProducts }})
          </span>
          <div class="flex items-center gap-1">
            <button
                @click="goToPage(currentPage - 1)"
                :disabled="currentPage === 1 || loadingProducts"
                class="px-2 py-1 rounded text-[11px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Назад
            </button>
            <button
                @click="goToPage(currentPage + 1)"
                :disabled="currentPage === lastPage || loadingProducts"
                class="px-2 py-1 rounded text-[11px] font-medium text-[#1A1A1A] hover:bg-[#FAFAF8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Вперёд →
            </button>
          </div>
        </div>
      </div>

      <!-- Правая колонка: Товары в коллекции -->
      <div class="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-[#F0EEE9] flex items-center justify-between">
          <span class="text-[11px] font-medium uppercase tracking-[0.1em] text-[#ABABAB]">
            Товары в коллекции · {{ selectedProducts.length }}
          </span>
          <button
              v-if="selectedProducts.length > 0 && hasProductChanges"
              :disabled="saving"
              @click="saveProductChanges"
              class="text-[11px] font-medium text-[#1A1A1A] hover:text-[#666] transition-colors disabled:opacity-40"
          >
            {{ saving ? 'Сохранение...' : 'Сохранить' }}
          </button>
        </div>

        <div class="max-h-[600px] overflow-y-auto">
          <div v-if="selectedProducts.length === 0" class="py-12 text-center text-[13px] text-[#ABABAB]">
            Добавьте товары из списка слева
          </div>

          <ul v-else class="divide-y divide-[#F0EEE9]">
            <li
                v-for="(product, idx) in selectedProducts"
                :key="product.id"
                class="flex items-center gap-3 px-5 py-3 group select-none hover:bg-[#FCFCFA] transition-colors"
                draggable="true"
                @dragstart="onDragStart(idx)"
                @dragover.prevent="onDragOver(idx)"
                @dragend="onDragEnd"
            >
              <svg
                  class="w-4 h-4 text-[#C0BEB8] cursor-grab active:cursor-grabbing shrink-0"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6h16.5"/>
              </svg>

              <span class="text-[11px] font-semibold text-[#C0BEB8] w-4 shrink-0 text-center">{{ idx + 1 }}</span>

              <div class="w-10 h-10 rounded-lg overflow-hidden border border-[#E8E6E0] shrink-0 bg-[#FAFAF8] flex items-center justify-center">
                <img v-if="product.image" :src="product.image" :alt="product.title" class="w-full h-full object-cover" />
                <svg v-else class="w-5 h-5 text-[#C0BEB8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-[13px] text-[#1A1A1A] font-medium truncate">{{ product.title }}</p>
                <p class="text-[11px] text-[#ABABAB]">{{ product.article }}</p>
              </div>

              <button
                  class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded hover:bg-red-50 text-[#ABABAB] hover:text-red-500"
                  @click="removeProductFromCollection(product.id)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                  <path d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </li>
          </ul>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const { $api } = useApi()

interface Product {
  id: number
  title: string
  slug: string
  article: string
  price: number
  brand: { id: number; name: string } | null
  category: { id: number; title: string } | null
  image: string | null
  total_stock: number
  in_stock: boolean
}

interface SelectedProduct {
  id: number
  item_id?: number
  title: string
  article: string
  image: string | null
  position: number
}

interface Collection {
  id: number
  name: string
  is_active: boolean
  position: number
}

interface Brand {
  id: number
  name: string
}

interface Category {
  id: number
  title: string
}

const loading = ref(true)
const loadingProducts = ref(true)
const saving = ref(false)

const originalCollection = ref<Collection | null>(null)
const editedCollection = ref<Collection>({ id: 0, name: '', is_active: true, position: 0 })

const availableProducts = ref<Product[]>([])
const selectedProducts = ref<SelectedProduct[]>([])
const originalSelectedProducts = ref<SelectedProduct[]>([])

const currentPage = ref(1)
const lastPage = ref(1)
const totalProducts = ref(0)

const brands = ref<Brand[]>([])
const categories = ref<Category[]>([])

const searchQuery = ref('')
const selectedBrandId = ref<number | null>(null)
const selectedCategoryId = ref<number | null>(null)
const selectedStockFilter = ref<'all' | 'in_stock' | 'out_of_stock'>('all')

const brandDropdownOpen = ref(false)
const categoryDropdownOpen = ref(false)
const stockDropdownOpen = ref(false)

const brandSearchQuery = ref('')
const categorySearchQuery = ref('')

const brandDropdownRef = ref<HTMLElement | null>(null)
const categoryDropdownRef = ref<HTMLElement | null>(null)
const stockDropdownRef = ref<HTMLElement | null>(null)

const collectionId = route.params.id as string

// Вычисляемые свойства
const selectedBrandName = computed(() => {
  if (!selectedBrandId.value) return null
  return brands.value.find(b => b.id === selectedBrandId.value)?.name || null
})

const selectedCategoryName = computed(() => {
  if (!selectedCategoryId.value) return null
  return categories.value.find(c => c.id === selectedCategoryId.value)?.title || null
})

const stockFilterLabel = computed(() => {
  const labels = {
    all: 'Все товары',
    in_stock: 'В наличии',
    out_of_stock: 'Нет в наличии'
  }
  return labels[selectedStockFilter.value]
})

const filteredBrands = computed(() => {
  if (!brandSearchQuery.value.trim()) return brands.value
  const query = brandSearchQuery.value.toLowerCase()
  return brands.value.filter(b => b.name.toLowerCase().includes(query))
})

const filteredCategories = computed(() => {
  if (!categorySearchQuery.value.trim()) return categories.value
  const query = categorySearchQuery.value.toLowerCase()
  return categories.value.filter(c => c.title.toLowerCase().includes(query))
})
const hasChanges = computed(() => {
  if (!originalCollection.value) return false
  return originalCollection.value.name !== editedCollection.value.name ||
      originalCollection.value.is_active !== editedCollection.value.is_active
})

const hasProductChanges = computed(() => {
  if (selectedProducts.value.length !== originalSelectedProducts.value.length) return true

  return selectedProducts.value.some((product, idx) => {
    const original = originalSelectedProducts.value[idx]
    return !original || product.id !== original.id
  })
})

const filteredAvailableProducts = computed(() => {
  // Исключаем уже добавленные товары
  const selectedIds = new Set(selectedProducts.value.map(p => p.id))
  return availableProducts.value.filter(p => !selectedIds.has(p.id))
})

// Загрузка данных
async function loadCollection() {
  loading.value = true
  try {
    const res = await $api<{ data: any }>(`/admin/product-collections/${collectionId}`)
    originalCollection.value = {
      id: res.data.id,
      name: res.data.name,
      is_active: res.data.is_active,
      position: res.data.position,
    }
    editedCollection.value = { ...originalCollection.value }

    selectedProducts.value = res.data.products.map((p: any) => ({
      id: p.id,
      item_id: p.item_id,
      title: p.title,
      article: p.article,
      image: p.image,
      position: p.position,
    }))
    originalSelectedProducts.value = JSON.parse(JSON.stringify(selectedProducts.value))
  } finally {
    loading.value = false
  }
}

async function loadProducts(page = 1) {
  loadingProducts.value = true
  try {
    const params = new URLSearchParams({ page: String(page) })

    if (selectedBrandId.value) {
      params.append('brand_id', String(selectedBrandId.value))
    }
    if (selectedCategoryId.value) {
      params.append('category_id', String(selectedCategoryId.value))
    }
    if (selectedStockFilter.value !== 'all') {
      params.append('in_stock', selectedStockFilter.value === 'in_stock' ? '1' : '0')
    }
    if (searchQuery.value.trim()) {
      params.append('search', searchQuery.value.trim())
    }

    const res = await $api<{ data: Product[]; meta: any }>(`/admin/product-collections/available-products?${params}`)
    availableProducts.value = res.data ?? []
    currentPage.value = res.meta.current_page
    lastPage.value = res.meta.last_page
    totalProducts.value = res.meta.total
  } finally {
    loadingProducts.value = false
  }
}

async function loadFilters() {
  try {
    const res = await $api<{ data: { brands: Brand[]; categories: Category[] } }>('/admin/product-collections/filters')
    brands.value = res.data.brands ?? []
    categories.value = res.data.categories ?? []
  } catch (e) {
    console.error('Load filters error:', e)
  }
}

await Promise.all([loadCollection(), loadProducts(), loadFilters()])

// Обработчик кликов вне выпадающих списков
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement

  // Проверяем бренд
  if (brandDropdownOpen.value && brandDropdownRef.value && !brandDropdownRef.value.contains(target)) {
    closeBrandDropdown()
  }

  // Проверяем категорию
  if (categoryDropdownOpen.value && categoryDropdownRef.value && !categoryDropdownRef.value.contains(target)) {
    closeCategoryDropdown()
  }

  // Проверяем наличие
  if (stockDropdownOpen.value && stockDropdownRef.value && !stockDropdownRef.value.contains(target)) {
    closeStockDropdown()
  }
}

// Функции для работы с селекторами
function toggleBrandDropdown() {
  brandDropdownOpen.value = !brandDropdownOpen.value
}

function toggleCategoryDropdown() {
  categoryDropdownOpen.value = !categoryDropdownOpen.value
}

function toggleStockDropdown() {
  stockDropdownOpen.value = !stockDropdownOpen.value
}
function selectBrand(brandId: number | null) {
  selectedBrandId.value = brandId
  brandDropdownOpen.value = false
  brandSearchQuery.value = ''
  currentPage.value = 1
  loadProducts(1)
}

function selectCategory(categoryId: number | null) {
  selectedCategoryId.value = categoryId
  categoryDropdownOpen.value = false
  categorySearchQuery.value = ''
  currentPage.value = 1
  loadProducts(1)
}

function selectStockFilter(filter: 'all' | 'in_stock' | 'out_of_stock') {
  selectedStockFilter.value = filter
  stockDropdownOpen.value = false
  currentPage.value = 1
  loadProducts(1)
}

function closeBrandDropdown() {
  brandDropdownOpen.value = false
  brandSearchQuery.value = ''
}

function closeCategoryDropdown() {
  categoryDropdownOpen.value = false
  categorySearchQuery.value = ''
}

function closeStockDropdown() {
  stockDropdownOpen.value = false
}

// Поиск с debounce
let searchTimeout: NodeJS.Timeout | null = null

watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadProducts(1)
  }, 500)
})

// Пагинация
function goToPage(page: number) {
  if (page < 1 || page > lastPage.value || loadingProducts.value) return
  loadProducts(page)
}

// Действия с коллекцией
async function saveChanges() {
  if (!hasChanges.value || saving.value) return

  saving.value = true
  try {
    await $api(`/admin/product-collections/${collectionId}`, {
      method: 'PATCH',
      body: {
        name: editedCollection.value.name,
        is_active: editedCollection.value.is_active
      }
    })
    originalCollection.value = { ...editedCollection.value }
  } catch (e) {
    console.error('Save error:', e)
    alert('Ошибка при сохранении')
  } finally {
    saving.value = false
  }
}

function cancelChanges() {
  if (originalCollection.value) {
    editedCollection.value = { ...originalCollection.value }
  }
}

// Действия с товарами
function addProductToCollection(product: Product) {
  const exists = selectedProducts.value.find(p => p.id === product.id)
  if (exists) return

  selectedProducts.value.push({
    id: product.id,
    title: product.title,
    article: product.article,
    image: product.image,
    position: selectedProducts.value.length,
  })
}

function removeProductFromCollection(productId: number) {
  selectedProducts.value = selectedProducts.value.filter(p => p.id !== productId)
  // Обновляем позиции
  selectedProducts.value.forEach((p, idx) => {
    p.position = idx
  })
}

async function saveProductChanges() {
  if (!hasProductChanges.value || saving.value) return

  saving.value = true
  try {
    // Удаляем товары, которых больше нет
    const currentIds = new Set(selectedProducts.value.map(p => p.id))
    const toDelete = originalSelectedProducts.value.filter(p => !currentIds.has(p.id))

    for (const product of toDelete) {
      if (product.item_id) {
        await $api(`/admin/product-collections/${collectionId}/products/${product.item_id}`, {
          method: 'DELETE'
        })
      }
    }

    // Добавляем новые товары
    const originalIds = new Set(originalSelectedProducts.value.map(p => p.id))
    const toAdd = selectedProducts.value.filter(p => !originalIds.has(p.id))

    for (const product of toAdd) {
      const res = await $api<{ data: any }>(`/admin/product-collections/${collectionId}/products`, {
        method: 'POST',
        body: { product_id: product.id }
      })
      product.item_id = res.data.item_id
    }

    // Обновляем порядок
    const items = selectedProducts.value.map((p, idx) => ({
      id: p.item_id!,
      position: idx
    }))

    await $api(`/admin/product-collections/${collectionId}/products/reorder`, {
      method: 'POST',
      body: { items }
    })

    originalSelectedProducts.value = JSON.parse(JSON.stringify(selectedProducts.value))
  } catch (e) {
    console.error('Save products error:', e)
    alert('Ошибка при сохранении товаров')
  } finally {
    saving.value = false
  }
}

// Drag-and-drop
let dragFromIdx = -1

function onDragStart(idx: number) {
  dragFromIdx = idx
}

function onDragOver(idx: number) {
  if (dragFromIdx === -1 || dragFromIdx === idx) return
  const arr = [...selectedProducts.value]
  const [moved] = arr.splice(dragFromIdx, 1)
  arr.splice(idx, 0, moved)
  selectedProducts.value = arr
  dragFromIdx = idx
}

function onDragEnd() {
  dragFromIdx = -1
  // Обновляем позиции
  selectedProducts.value.forEach((p, idx) => {
    p.position = idx
  })
}
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}
.cursor-grab:active {
  cursor: grabbing;
}
</style>