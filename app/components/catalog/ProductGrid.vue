<template>
  <div v-if="products && products.length > 0" class="products-section">
    <div class="products-grid">
      <CatalogProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
      />
    </div>

    <div v-if="pagination && pagination.last_page > 1" class="pagination">
      <button
          :disabled="pagination.current_page === 1"
          class="pagination-btn"
          @click="$emit('page-change', pagination.current_page - 1)"
      >
        ← Назад
      </button>

      <div class="page-numbers">
        <template v-for="page in visiblePages" :key="page">
          <span v-if="page === '...'" class="page-dots">…</span>
          <button
              v-else
              class="page-num"
              :class="{ active: page === pagination.current_page }"
              @click="$emit('page-change', page)"
          >
            {{ page }}
          </button>
        </template>
      </div>

      <button
          :disabled="pagination.current_page === pagination.last_page"
          class="pagination-btn"
          @click="$emit('page-change', pagination.current_page + 1)"
      >
        Вперёд →
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ProductImage {
  url: string
}

interface Product {
  id: number
  name: string
  price: number | string
  old_price?: number | string
  images?: ProductImage[]
  children?: Product[]
}

interface Pagination {
  current_page: number
  last_page: number
}

const props = defineProps<{
  products: Product[]
  pagination?: Pagination
}>()

defineEmits<{
  'page-change': [page: number]
}>()

const visiblePages = computed(() => {
  if (!props.pagination) return []
  const { current_page, last_page } = props.pagination
  const pages: (number | string)[] = []

  for (let i = 1; i <= last_page; i++) {
    if (i === 1 || i === last_page || (i >= current_page - 2 && i <= current_page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }
  return pages
})
</script>

<style scoped>
.products-section {
  margin-top: 20px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 560px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
}

.pagination-btn {
  padding: 8px 18px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  transition: background 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-num {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.page-num:hover {
  background: #f0f0f0;
}

.page-num.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.page-dots {
  color: #aaa;
  padding: 0 4px;
}
</style>