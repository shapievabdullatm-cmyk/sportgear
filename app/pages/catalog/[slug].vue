<template>
  <div class="category-page">
    <div v-if="categoryPending" class="loading">
      Загрузка...
    </div>

    <div v-else-if="categoryError" class="error">
      Ошибка загрузки категории
    </div>

    <div v-else-if="categoryData">
      <CatalogBreadcrumbs :breadcrumbs="categoryData.breadcrumbs" />

      <div class="category-header">
        <h1>{{ categoryData.category.title }}</h1>
        <p v-if="categoryData.category.meta_description" class="description">
          {{ categoryData.category.meta_description }}
        </p>
      </div>

      <CatalogSubcategoryGrid :categories="categoryData.children" />

      <!-- Main content with filter -->
      <div class="catalog-content">

        <!-- Mobile filter button -->
        <button
            v-if="filtersData && (filtersData.filters.length > 0 || filtersData.price_range.max > 0)"
            class="mobile-filter-btn"
            @click="isFilterOpen = true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
            <line x1="11" y1="18" x2="13" y2="18"/>
          </svg>
          Фильтры
        </button>

        <!-- Mobile overlay backdrop -->
        <Transition name="fade">
          <div v-if="isFilterOpen" class="filter-backdrop" @click="isFilterOpen = false" />
        </Transition>

        <!-- Filter sidebar -->
        <aside
            v-if="filtersData && (filtersData.filters.length > 0 || filtersData.price_range.max > 0)"
            class="filter-sidebar"
            :class="{ 'is-open': isFilterOpen }"
        >
          <!-- Mobile drawer header -->
          <div class="filter-drawer-header">
            <span class="filter-drawer-title">Фильтры</span>
            <div class="filter-drawer-actions">
              <button
                  v-if="hasActiveFilters"
                  class="filter-reset-btn"
                  @click="resetFilters"
                  type="button"
              >
                Сбросить
              </button>
              <button class="filter-close-btn" @click="isFilterOpen = false" aria-label="Закрыть">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <CatalogFilter
              v-model="filterValues"
              :filters="filtersData.filters"
              :price-range="filtersData.price_range"
          />

          <!-- Mobile drawer footer -->
          <div class="filter-drawer-footer">
            <button class="filter-apply-btn" @click="isFilterOpen = false" type="button">
              Показать товары
            </button>
          </div>
        </aside>

        <!-- Products grid -->
        <div class="products-section">
          <!-- Loading overlay for products -->
          <div v-if="productsPending" class="products-loading">
            <div class="spinner"></div>
            <p>Загрузка товаров...</p>
          </div>

          <div v-else>
            <CatalogProductGrid
                v-if="productsData"
                :products="productsData.data"
                :pagination="{
                current_page: productsData.current_page,
                last_page: productsData.last_page
              }"
                @page-change="goToPage"
            />

            <div v-if="productsData && productsData.data.length === 0 && (!categoryData.children || categoryData.children.length === 0)" class="no-products">
              В этой категории пока нет товаров
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CategoryPageResponse } from '~/types/category'

const route = useRoute()
const router = useRouter()
const { $api } = useApi()

const slug = computed(() => route.params.slug as string)
const currentPage = computed(() => {
  const page = route.query.page
  return page ? parseInt(page as string) : 1
})

// Filter values from URL query
const filterValues = ref<{
  price_min?: number
  price_max?: number
  filters?: Record<string, string | string[] | { min: number, max: number }>
}>({})

// Parse filters from URL on mount and route change
function parseFiltersFromQuery() {
  const query = route.query
  const parsed: typeof filterValues.value = {}

  if (query.price_min) parsed.price_min = parseFloat(query.price_min as string)
  if (query.price_max) parsed.price_max = parseFloat(query.price_max as string)

  // Parse param filters by slug (например: color=red,blue или waterproof=true)
  const filters: Record<string, string | string[] | { min: number, max: number }> = {}

  Object.keys(query).forEach(key => {
    // Пропускаем служебные параметры
    if (['price_min', 'price_max', 'page', 'per_page'].includes(key)) {
      return
    }

    // Проверяем диапазоны (например: weight_min, weight_max)
    const rangeMatch = key.match(/^(.+)_(min|max)$/)
    if (rangeMatch) {
      const paramSlug = rangeMatch[1]
      const rangeType = rangeMatch[2] as 'min' | 'max'

      if (!filters[paramSlug]) {
        filters[paramSlug] = { min: 0, max: 0 }
      }
      const rangeValue = filters[paramSlug] as { min: number, max: number }
      rangeValue[rangeType] = parseFloat(query[key] as string)
    } else {
      // Обычный фильтр (boolean или options)
      filters[key] = query[key] as string | string[]
    }
  })

  if (Object.keys(filters).length > 0) {
    parsed.filters = filters
  }

  filterValues.value = parsed
}

// Watch filter changes and update URL (without navigation)
let isUpdatingFromQuery = false

watch(filterValues, (newFilters) => {
  if (isUpdatingFromQuery) return

  const query: Record<string, string | string[]> = {}

  // Add price filters
  if (newFilters.price_min !== undefined) {
    query.price_min = newFilters.price_min.toString()
  }
  if (newFilters.price_max !== undefined) {
    query.price_max = newFilters.price_max.toString()
  }

  // Add param filters (используем slug вместо ID)
  if (newFilters.filters) {
    Object.entries(newFilters.filters).forEach(([paramSlug, value]) => {
      if (typeof value === 'string') {
        // Boolean или single option: waterproof=true
        query[paramSlug] = value
      } else if (Array.isArray(value)) {
        // Multiple options: color=red,blue
        query[paramSlug] = value.join(',')
      } else if (typeof value === 'object' && 'min' in value && 'max' in value) {
        // Range values: weight_min=10&weight_max=50
        query[`${paramSlug}_min`] = value.min.toString()
        query[`${paramSlug}_max`] = value.max.toString()
      }
    })
  }

  // Update URL without navigation
  router.replace({ query })
}, { deep: true })

// Parse filters on mount
onMounted(() => {
  parseFiltersFromQuery()
})

// Re-parse when route changes
watch(() => route.query, () => {
  isUpdatingFromQuery = true
  parseFiltersFromQuery()
  nextTick(() => {
    isUpdatingFromQuery = false
  })
}, { deep: true })

// Fetch category data (once, doesn't change with filters)
const { data: categoryData, pending: categoryPending, error: categoryError } = await useAsyncData(
    'category-' + slug.value,
    async () => {
      const response = await $api<CategoryPageResponse>('/categories/' + slug.value, {
        query: {
          page: 1,
          per_page: 20
        }
      })

      // Return only category info, breadcrumbs, and children
      return {
        category: response.category,
        breadcrumbs: response.breadcrumbs,
        children: response.children
      }
    }
)

// Fetch products separately (updates with filters)
const productsQueryString = computed(() => {
  return JSON.stringify({
    page: currentPage.value,
    ...route.query
  })
})

const { data: productsData, pending: productsPending } = await useAsyncData(
    () => 'products-' + slug.value + '-' + productsQueryString.value,
    async () => {
      const response = await $api<CategoryPageResponse>('/categories/' + slug.value, {
        query: {
          page: currentPage.value,
          per_page: 20,
          ...route.query
        }
      })
      return response.products
    },
    {
      watch: [productsQueryString]
    }
)

// Fetch available filters (once)
const { data: filtersData } = await useAsyncData(
    'category-filters-' + slug.value,
    () => $api<{
      filters: any[]
      price_range: { min: number, max: number }
    }>('/categories/' + slug.value + '/filters')
)

const isFilterOpen = ref(false)

const hasActiveFilters = computed(() =>
    filterValues.value.price_min !== undefined ||
    filterValues.value.price_max !== undefined ||
    (filterValues.value.filters && Object.keys(filterValues.value.filters).length > 0)
)

function resetFilters() {
  filterValues.value = {}
}

// Блокировка скролла body когда открыт мобильный drawer
watch(isFilterOpen, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.body.style.overflow = ''
})

function goToPage(page: number) {
  router.push({
    query: { ...route.query, page: page.toString() }
  })
}
</script>

<style scoped>
.category-page {
  max-width: 1420px;
  margin: 0 auto;
  padding: 20px;
}

.loading,
.error,
.no-products {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.error {
  color: #e74c3c;
}

.category-header {
  margin-bottom: 20px;
}

.category-header h1 {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 6px;
  line-height: 1.2;
}

.description {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.catalog-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  margin-top: 24px;
}

.filter-sidebar {
  /* Sticky positioning handled in CatalogFilter component */
}

.products-section {
  min-width: 0; /* Prevent grid blowout */
  position: relative;
}

.products-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  min-height: 400px;
  z-index: 10;
  border-radius: 12px;
}

.products-loading p {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #E8E6E0;
  border-top-color: #1A1A1A;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .catalog-content {
    grid-template-columns: 240px 1fr;
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .catalog-content {
    grid-template-columns: 1fr;
  }

  /* Mobile filter button */
  .mobile-filter-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    margin-bottom: 16px;
    background: #1A1A1A;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .mobile-filter-btn:active {
    background: #333;
  }

  /* Backdrop overlay */
  .filter-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1100;
  }

  /* Sidebar as slide-in drawer */
  .filter-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    width: min(360px, 92vw);
    background: #fff;
    z-index: 1101;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    transform: translateX(-110%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
    padding: 0;
    order: unset;
    display: flex;
    flex-direction: column;
  }

  .filter-sidebar.is-open {
    transform: translateX(0);
  }

  /* Drawer header */
  .filter-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #E8E6E0;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 2;
    flex-shrink: 0;
  }

  .filter-drawer-title {
    font-size: 17px;
    font-weight: 600;
    color: #1A1A1A;
    letter-spacing: -0.01em;
  }

  .filter-drawer-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .filter-reset-btn {
    background: none;
    border: none;
    padding: 6px 4px;
    font-size: 13px;
    color: #777;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 3px;
    transition: color 0.15s;
  }

  .filter-reset-btn:active {
    color: #1A1A1A;
  }

  .filter-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: #F5F4F0;
    border-radius: 50%;
    cursor: pointer;
    color: #1A1A1A;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .filter-close-btn:active {
    background: #E8E6E0;
  }

  /* Sticky footer in drawer with apply button */
  .filter-drawer-footer {
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 1px solid #E8E6E0;
    margin-top: auto;
    z-index: 2;
    flex-shrink: 0;
  }

  .filter-apply-btn {
    width: 100%;
    padding: 14px 20px;
    background: #1A1A1A;
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .filter-apply-btn:active {
    background: #333;
  }
}

@media (min-width: 769px) {
  .mobile-filter-btn {
    display: none;
  }

  .filter-drawer-header,
  .filter-drawer-footer {
    display: none;
  }

  .filter-backdrop {
    display: none;
  }
}

@media (max-width: 560px) {
  .category-page {
    padding: 10px;
  }
}
</style>