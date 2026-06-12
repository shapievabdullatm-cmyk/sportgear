<template>
  <div class="search-page">
    <div v-if="isLoading" class="loading">
      Загрузка...
    </div>

    <div v-else>
      <CatalogBreadcrumbs :breadcrumbs="breadcrumbs" />

      <div class="search-header">
        <h1>Результаты поиска</h1>
        <p v-if="searchQuery" class="search-query">
          По запросу: <strong>{{ searchQuery }}</strong>
        </p>
      </div>

      <!-- Категории -->
      <div v-if="results.categories.length > 0" class="categories-section">
        <h2 class="section-title">Категории</h2>
        <CatalogSubcategoryGrid :categories="formattedCategories" />
      </div>

      <!-- Товары -->
      <div v-if="results.products.length > 0" class="products-section">
        <h2 class="section-title">Товары <span class="count">({{ results.products.length }})</span></h2>
        <CatalogProductGrid
          :products="formattedProducts"
        />
      </div>

      <!-- Нет результатов -->
      <div v-if="results.products.length === 0 && results.categories.length === 0 && searchQuery" class="no-results">
        <Icon name="my:search" class="no-results-icon" />
        <h2>Ничего не найдено</h2>
        <p>По запросу «{{ searchQuery }}» ничего не найдено</p>
        <p class="hint">Попробуйте изменить запрос или проверьте правильность написания</p>
      </div>

      <!-- Начальное состояние -->
      <div v-if="!searchQuery" class="empty-state">
        <Icon name="my:search" class="empty-icon" />
        <h2>Начните поиск</h2>
        <p>Используйте поисковую строку в шапке сайта</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSearch } from '~/composables/useSearch'

const route = useRoute()

const searchQuery = ref('')
const { results, isLoading, search } = useSearch()

// Breadcrumbs для страницы поиска
const breadcrumbs = computed(() => [
  { title: 'Главная', url: '/' },
  { title: 'Поиск', url: '/search' }
])

// Форматируем категории для SubcategoryGrid
const formattedCategories = computed(() => {
  return results.value.categories.map(cat => ({
    id: cat.id,
    title: cat.title,
    slug: cat.slug,
    image: cat.image,
    children: []
  }))
})

// Форматируем товары для ProductGrid (преобразуем title -> name)
const formattedProducts = computed(() => {
  return results.value.products.map(product => ({
    id: product.id,
    name: product.title, // title -> name
    slug: product.slug,
    price: product.price,
    old_price: product.old_price,
    images: product.images, // уже массив с url
    article: product.article,
    category: product.category
  }))
})

// Получаем запрос из URL и выполняем поиск
watch(() => route.query.q, (newQuery) => {
  if (newQuery && typeof newQuery === 'string') {
    searchQuery.value = newQuery
    search(newQuery)
  } else {
    searchQuery.value = ''
  }
}, { immediate: true })
</script>

<style scoped>
.search-page {
  max-width: 1420px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
}

.search-header {
  margin-bottom: 20px;
}

.search-header h1 {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 6px;
  line-height: 1.2;
}

.search-query {
  color: #666;
  font-size: 14px;
  line-height: 1.4;
}

.search-query strong {
  color: #111;
  font-weight: 600;
}

.categories-section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: #111;
}

.count {
  color: #999;
  font-weight: 400;
}

.products-section {
  margin-top: 24px;
}

/* Empty States */
.no-results,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
}

.no-results-icon,
.empty-icon {
  font-size: 64px;
  color: #ddd;
  margin-bottom: 20px;
}

.no-results h2,
.empty-state h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #111;
}

.no-results p,
.empty-state p {
  font-size: 16px;
  color: #666;
  margin-bottom: 8px;
}

.hint {
  font-size: 14px;
  color: #999;
}

@media (max-width: 768px) {
  .search-page {
    padding: 16px 12px;
  }

  .search-header h1 {
    font-size: 24px;
  }
}

@media (max-width: 560px) {
  .search-page {
    padding: 10px;
  }
}
</style>