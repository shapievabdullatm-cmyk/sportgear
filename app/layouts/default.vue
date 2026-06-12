<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { storeToRefs } from "pinia"
import { useQuickLinksClientStore } from "~/stores/quick-links"
import { useCartStore } from "~/stores/cart"
import { useWishlistStore } from "~/stores/wishlist"
import { useRoute, useRouter } from 'vue-router'
import { useSearch } from '~/composables/useSearch'
import { useApi } from '~/composables/useApi'
import { useToastStore } from '~/stores/toast'

const route = useRoute()
const router = useRouter()
const { $api } = useApi()
const toast = useToastStore()

const store = useQuickLinksClientStore()
const { links } = storeToRefs(store)

const cartStore = useCartStore()
const { count: cartCount } = storeToRefs(cartStore)

const wishlistStore = useWishlistStore()
const { count: wishlistCount } = storeToRefs(wishlistStore)

// --- MegaMenu (mobile) ---
const megaMenu = ref<{ openMobile: () => void } | null>(null)

// --- Поиск ---
const searchOpen = ref(false)
const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const mobileSearchInput = ref<HTMLInputElement | null>(null)

// Используем composable для поиска
const { results, isLoading, debouncedSearch, clear: clearSearch } = useSearch()

const isMobile = ref(false)

function checkMobile() {
  isMobile.value = window.innerWidth <= 1024
}

function openSearch() {
  searchOpen.value = true
  setTimeout(() => {
    if (isMobile.value) {
      mobileSearchInput.value?.focus()
    } else {
      searchInput.value?.focus()
    }
  }, 50)

  // Загружаем популярные подсказки при открытии
  if (!searchQuery.value) {
    debouncedSearch('', 0)
  }
}

function closeSearch() {
  searchOpen.value = false
  searchQuery.value = ''
  clearSearch()
}

function handleSearchSubmit() {
  if (!searchQuery.value.trim()) return

  // Переходим на страницу поиска
  router.push({ path: '/search', query: { q: searchQuery.value.trim() } })
  closeSearch()
}

function handleSuggestionClick(suggestion: string) {
  searchQuery.value = suggestion
  debouncedSearch(suggestion, 0)
}

function goToProduct(slug: string) {
  router.push(`/products/${slug}`)
  closeSearch()
}

function goToCategory(slug: string) {
  router.push(`/catalog/${slug}`)
  closeSearch()
}

// --- Сканер штрихкодов ---
const scannerOpen = ref(false)
const scannerBusy = ref(false)

function openScanner() {
  scannerOpen.value = true
}

async function handleBarcodeDetected(code: string) {
  if (scannerBusy.value) return
  scannerBusy.value = true
  scannerOpen.value = false

  try {
    const { slug } = await $api<{ slug: string }>(`/products/by-barcode/${encodeURIComponent(code)}`)
    closeSearch()
    router.push(`/products/${slug}`)
  } catch (e: any) {
    if (e?.response?.status === 404 || e?.status === 404) {
      toast.error(`Товар по штрихкоду ${code} не найден`)
    } else {
      toast.error('Ошибка при поиске товара')
      console.error('Barcode lookup error:', e)
    }
  } finally {
    scannerBusy.value = false
  }
}

// Следим за изменениями в поле поиска
watch(searchQuery, (newQuery) => {
  if (searchOpen.value) {
    debouncedSearch(newQuery)
  }
})

// Синхронизируем значение поиска с URL query
watch(() => route.query.q, (newQuery) => {
  if (newQuery && typeof newQuery === 'string') {
    searchQuery.value = newQuery
  } else if (route.path !== '/search') {
    // Очищаем только если мы не на странице поиска
    searchQuery.value = ''
  }
}, { immediate: true })

// --- Скролл ---
const isHeaderBottomHidden = ref(false)
const isHeaderHidden = ref(false)
let lastScrollPosition = 0

function handleScroll() {
  if (searchOpen.value) return
  const cur = window.pageYOffset || document.documentElement.scrollTop
  if (cur < 0) return

  // Скрываем нижнюю навбар на десктопе
  isHeaderBottomHidden.value = cur > lastScrollPosition && cur > 50

  // Скрываем весь хедер на мобилке
  if (isMobile.value) {
    if (cur > lastScrollPosition && cur > 80) {
      // Скролл вниз - скрываем хедер
      isHeaderHidden.value = true
    } else if (cur < lastScrollPosition) {
      // Скролл вверх - показываем хедер
      isHeaderHidden.value = false
    }
  }

  lastScrollPosition = cur
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeSearch()
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('keydown', handleKeydown)
  store.fetch()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <!-- Оверлей (общий для десктопа и мобилы) -->
  <Transition name="fade">
    <div v-if="searchOpen" class="search-backdrop" @click="closeSearch" />
  </Transition>

  <!-- Мобильный полноэкранный поиск -->
  <Transition name="slide-down">
    <div v-if="searchOpen && isMobile" class="mobile-search-overlay">
      <div class="mobile-search-bar-wrap">
        <div class="mobile-search-bar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15.803 15.803M15.803 15.803C17.2096 14.3964 17.9998 12.4887 17.9998 10.4995C17.9998 8.5103 17.2096 6.60258 15.803 5.196C14.3965 3.78942 12.4887 2.99922 10.4995 2.99922C8.51035 2.99922 6.60262 3.78942 5.19605 5.196C3.78947 6.60258 2.99927 8.5103 2.99927 10.4995C2.99927 12.4887 3.78947 14.3964 5.19605 15.803C6.60262 17.2096 8.51035 17.9998 10.4995 17.9998C12.4887 17.9998 14.3965 17.2096 15.803 15.803Z" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input
              ref="mobileSearchInput"
              v-model="searchQuery"
              type="text"
              placeholder="Поиск товаров..."
              @keydown.enter="handleSearchSubmit"
          />
          <button class="scan-btn" @click="openScanner" aria-label="Сканировать штрихкод" type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 7V5C3 3.89543 3.89543 3 5 3H7M17 3H19C20.1046 3 21 3.89543 21 5V7M21 17V19C21 20.1046 20.1046 21 19 21H17M7 21H5C3.89543 21 3 20.1046 3 19V17M7 8V16M11 8V16M15 8V16M19 8V16" stroke="#555" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <button class="cancel-btn" @click="closeSearch">Отмена</button>
      </div>
      <!-- Результаты поиска -->
      <div v-if="searchQuery && (results.products.length > 0 || results.categories.length > 0)" class="search-results">
        <!-- Категории -->
        <div v-if="results.categories.length > 0" class="results-section">
          <p class="results-label">Категории</p>
          <div class="category-results">
            <button
              v-for="cat in results.categories"
              :key="cat.id"
              class="category-item"
              @click="goToCategory(cat.slug)"
            >
              <img v-if="cat.image" :src="cat.image" :alt="cat.title" class="category-img" />
              <span>{{ cat.title }}</span>
            </button>
          </div>
        </div>

        <!-- Товары -->
        <div v-if="results.products.length > 0" class="results-section">
          <p class="results-label">Товары</p>
          <div class="product-results">
            <button
              v-for="product in results.products.slice(0, 6)"
              :key="product.id"
              class="product-item"
              @click="goToProduct(product.slug)"
            >
              <img v-if="product.images && product.images.length > 0" :src="product.images[0].url" :alt="product.title" class="product-img" />
              <div class="product-info">
                <p class="product-title">{{ product.title }}</p>
                <p v-if="product.article" class="product-article">Арт: {{ product.article }}</p>
                <p class="product-price">{{ product.price }} ₽</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Подсказки -->
      <div v-else class="search-hints">
        <p class="hints-label">{{ searchQuery ? 'Попробуйте' : 'Популярные запросы' }}</p>
        <div class="hints-chips">
          <button
            v-for="h in results.suggestions"
            :key="h"
            class="chip"
            @click="handleSuggestionClick(h)"
          >
            {{ h }}
          </button>
        </div>
      </div>

      <!-- Loader -->
      <div v-if="isLoading" class="search-loader">
        <div class="spinner"></div>
      </div>
    </div>
  </Transition>

  <header class="site-header" :class="{ 'site-header--hidden': isHeaderHidden }">
    <!-- TOP BAR -->
    <div class="header-top">
      <div class="h-left">
        <button class="icon-btn" aria-label="Меню" @click="megaMenu?.openMobile()">
          <Icon name="my:bar" class="header-icon" />
        </button>
      </div>

      <div class="h-center">
        <NuxtLink to="/" class="logo-link" aria-label="На главную">
          <Icon name="my:logo" class="logo" />
        </NuxtLink>
      </div>

      <div class="h-right">
        <!-- Десктоп иконки -->
        <nav class="desktop-nav" aria-label="Основная навигация">
          <ul>
            <li>
              <button class="icon-btn" aria-label="Поиск" @click="openSearch">
                <Icon name="my:search" class="header-icon" />
              </button>
            </li>
            <li>
              <NuxtLink to="/wishlist" aria-label="Избранное" class="wishlist-link">
                <Icon name="my:heart" class="header-icon" />
                <span v-if="wishlistCount > 0" class="wishlist-badge">{{ wishlistCount }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/cart" aria-label="Корзина" class="cart-link">
                <Icon name="my:bag" class="header-icon" />
                <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
              </NuxtLink>
            </li>
            <li>
              <NuxtLink to="/account" aria-label="Аккаунт">
                <Icon name="my:profile" class="header-icon" />
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <!-- Мобильная кнопка поиска -->
        <button class="icon-btn mobile-search-btn" aria-label="Поиск" @click="openSearch">
          <Icon name="my:search" class="header-icon" />
        </button>
      </div>
    </div>

    <!-- ДЕСКТОПНЫЙ ПОИСК — раскрывается под хедером -->
    <Transition name="search-drop">
      <div v-if="searchOpen && !isMobile" class="desktop-search-panel">
        <div class="desktop-search-inner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 21L15.803 15.803M15.803 15.803C17.2096 14.3964 17.9998 12.4887 17.9998 10.4995C17.9998 8.5103 17.2096 6.60258 15.803 5.196C14.3965 3.78942 12.4887 2.99922 10.4995 2.99922C8.51035 2.99922 6.60262 3.78942 5.19605 5.196C3.78947 6.60258 2.99927 8.5103 2.99927 10.4995C2.99927 12.4887 3.78947 14.3964 5.19605 15.803C6.60262 17.2096 8.51035 17.9998 10.4995 17.9998C12.4887 17.9998 14.3965 17.2096 15.803 15.803Z" stroke="#555" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <form class="desktop-search-form" @submit.prevent="handleSearchSubmit">
            <input
                ref="searchInput"
                v-model="searchQuery"
                type="text"
                placeholder="Введите название товара..."
            />
          </form>
          <button class="desktop-scan-btn" @click="openScanner" aria-label="Сканировать штрихкод" type="button">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 7V5C3 3.89543 3.89543 3 5 3H7M17 3H19C20.1046 3 21 3.89543 21 5V7M21 17V19C21 20.1046 20.1046 21 19 21H17M7 21H5C3.89543 21 3 20.1046 3 19V17M7 8V16M11 8V16M15 8V16M19 8V16" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="desktop-search-close" @click="closeSearch" aria-label="Закрыть поиск">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Результаты поиска -->
        <div v-if="searchQuery && (results.products.length > 0 || results.categories.length > 0)" class="desktop-search-results">
          <!-- Категории -->
          <div v-if="results.categories.length > 0" class="results-section-desktop">
            <p class="results-label-desktop">Категории</p>
            <div class="category-results-desktop">
              <button
                v-for="cat in results.categories"
                :key="cat.id"
                class="category-item-desktop"
                @click="goToCategory(cat.slug)"
              >
                <img v-if="cat.image" :src="cat.image" :alt="cat.title" class="category-img-desktop" />
                <span>{{ cat.title }}</span>
              </button>
            </div>
          </div>

          <!-- Товары -->
          <div v-if="results.products.length > 0" class="results-section-desktop">
            <p class="results-label-desktop">Товары</p>
            <div class="product-results-desktop">
              <button
                v-for="product in results.products.slice(0, 8)"
                :key="product.id"
                class="product-item-desktop"
                @click="goToProduct(product.slug)"
              >
                <img v-if="product.images && product.images.length > 0" :src="product.images[0].url" :alt="product.title" class="product-img-desktop" />
                <div class="product-info-desktop">
                  <p class="product-title-desktop">{{ product.title }}</p>
                  <p v-if="product.article" class="product-article-desktop">Арт: {{ product.article }}</p>
                  <p class="product-price-desktop">{{ product.price }} ₽</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Подсказки для десктопа -->
        <div v-else-if="!isLoading" class="desktop-hints">
          <span class="hints-label-desktop">{{ searchQuery ? 'Попробуйте:' : 'Популярно:' }}</span>
          <button
            v-for="h in results.suggestions"
            :key="h"
            class="chip-desktop"
            @click="handleSuggestionClick(h)"
          >
            {{ h }}
          </button>
        </div>

        <!-- Loader -->
        <div v-if="isLoading" class="search-loader-desktop">
          <div class="spinner"></div>
        </div>
      </div>
    </Transition>

    <!-- НИЖНЯЯ НАВБАР (только десктоп) -->
    <div class="header-bottom" :class="{ 'header-bottom--hidden': isHeaderBottomHidden || searchOpen }">
      <nav class="bottom-nav">
        <ul>
          <li>
            <MegaMenu ref="megaMenu" />
          </li>
          <!-- Skeleton для быстрых ссылок -->
          <template v-if="!store.fetched && links.length === 0">
            <li><div class="nav-link-skeleton" style="width: 65px;"></div></li>
            <li><div class="nav-link-skeleton" style="width: 85px;"></div></li>
            <li><div class="nav-link-skeleton" style="width: 75px;"></div></li>
            <li><div class="nav-link-skeleton" style="width: 95px;"></div></li>
            <li><div class="nav-link-skeleton" style="width: 70px;"></div></li>
          </template>
          <!-- Реальные ссылки -->
          <li v-else v-for="link in links" :key="link.id">
            <a class="nav-link" :href="link.url">{{ link.title }}</a>
          </li>
        </ul>
      </nav>
    </div>
  </header>

  <div class="layout-body">
    <main class="page-content">
      <slot />
    </main>
    <Footer></Footer>
  </div>
  <Toast />

  <!-- Сканер штрихкодов -->
  <BarcodeScannerModal v-model="scannerOpen" @detected="handleBarcodeDetected" />

  <!-- МОБИЛЬНЫЙ ТАБ-БАР -->
  <nav class="mobile-tab-bar" aria-label="Нижняя навигация">
    <div class="mobile-tab-bar-inner">
      <NuxtLink to="/" class="tab-item" :class="{ active: route.path === '/' }">
        <span class="tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="tab-label">Главная</span>
      </NuxtLink>
      <button class="tab-item" :class="{ active: false }" @click="megaMenu?.openMobile()">
        <span class="tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
            <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
            <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
            <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="1.8"/>
          </svg>
        </span>
        <span class="tab-label">Каталог</span>
      </button>
      <NuxtLink to="/wishlist" class="tab-item" :class="{ active: route.path === '/wishlist' }">
        <span class="tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 21C12 21 3 15.5 3 9C3 6.23858 5.23858 4 8 4C9.65 4 11.1 4.83 12 6.08C12.9 4.83 14.35 4 16 4C18.7614 4 21 6.23858 21 9C21 15.5 12 21 12 21Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="tab-label">Избранное</span>
      </NuxtLink>
      <NuxtLink to="/cart" class="tab-item" :class="{ active: route.path === '/cart' }">
        <span class="tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M15.7502 10.5V6C15.7502 5.00544 15.3551 4.05161 14.6519 3.34835C13.9486 2.64509 12.9948 2.25 12.0002 2.25C11.0057 2.25 10.0518 2.64509 9.34858 3.34835C8.64532 4.05161 8.25023 5.00544 8.25023 6V10.5M19.6062 8.507L20.8692 20.507C20.9392 21.172 20.4192 21.75 19.7502 21.75H4.25023C4.09244 21.7502 3.93637 21.7171 3.79218 21.6531C3.64798 21.589 3.51888 21.4953 3.41325 21.3781C3.30763 21.2608 3.22784 21.1227 3.17908 20.9726C3.13032 20.8226 3.11368 20.6639 3.13023 20.507L4.39423 8.507C4.42339 8.23056 4.55385 7.9747 4.76048 7.78876C4.96711 7.60281 5.23526 7.49995 5.51323 7.5H18.4872C19.0632 7.5 19.5462 7.935 19.6062 8.507Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
        <span class="tab-label">Корзина</span>
      </NuxtLink>
      <NuxtLink to="/account" class="tab-item" :class="{ active: route.path.startsWith('/account') }">
        <span class="tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
            <path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </span>
        <span class="tab-label">Профиль</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<style scoped>
/* ─── Reset & Base ─────────────────────────────── */
* { box-sizing: border-box; }

.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
}

.header-icon { font-size: 24px; }

/* ─── Header Shell ─────────────────────────────── */
.site-header {
  position: fixed;
  top: 0; left: 0;
  width: 100%;
  z-index: 1000;
  background: #fff;
  border-bottom: 1px solid #ebebeb;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.site-header--hidden {
  transform: translateY(-100%);
}

/* ─── Top Bar ──────────────────────────────────── */
.header-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 48px;
  height: 55px;
}

.h-left  { display: flex; align-items: center; justify-content: flex-start; }
.h-center{ display: flex; align-items: center; justify-content: center; }
.h-right { display: flex; align-items: center; justify-content: flex-end; }

.logo-link { display: flex; align-items: center; }
.logo { font-size: 45px; }

/* ─── Desktop Nav ──────────────────────────────── */
.desktop-nav ul {
  display: flex;
  align-items: center;
  gap: 20px;
  list-style: none;
  margin: 0; padding: 0;
}

.desktop-nav a,
.desktop-nav button {
  color: #000;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.cart-link {
  position: relative;
}

.wishlist-link {
  position: relative;
}

.cart-badge,
.wishlist-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  background: #dc2626;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.mobile-search-btn { display: none; }

/* ─── Desktop Search Drop ──────────────────────── */
.desktop-search-panel {
  //border-top: 1px solid #ebebeb;
  background: #fff;
  padding: 0 48px;
}

.desktop-search-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1.5px solid #111;
}

.desktop-search-form {
  flex: 1;
  display: flex;
}

.desktop-search-form input {
  width: 100%;
  border: none;
  outline: none;
  font-size: 18px;
  font-weight: 400;
  color: #111;
  background: transparent;
  letter-spacing: -0.01em;
}

.desktop-search-form input::placeholder { color: #bbb; }

.desktop-search-close {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #555;
  padding: 4px;
  transition: color 0.15s;
}
.desktop-search-close:hover { color: #000; }

.desktop-scan-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #555;
  padding: 4px;
  transition: color 0.15s;
}
.desktop-scan-btn:hover { color: #000; }

.scan-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  color: #555;
  transition: color 0.15s;
}
.scan-btn:hover { color: #000; }

.desktop-hints {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  flex-wrap: wrap;
}

.hints-label-desktop {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #999;
  margin-right: 4px;
}

.chip-desktop {
  background: #f3f3f3;
  border: none;
  border-radius: 20px;
  padding: 6px 14px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
}
.chip-desktop:hover { background: #e5e5e5; }

/* ─── Bottom Nav Bar ───────────────────────────── */
.header-bottom {
  display: flex;
  justify-content: center;
  //border-top: 1px solid #f0f0f0;
  max-height: 48px;
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  opacity: 1;
}

.header-bottom--hidden {
  max-height: 0;
  opacity: 0;
  pointer-events: none;
}

.bottom-nav {
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 48px;
}

.bottom-nav ul {
  display: flex;
  align-items: center;
  gap: 28px;
  list-style: none;
  margin: 0;
  padding-bottom: 5px;
}

.nav-link {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #000;
  text-decoration: none;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.nav-link:hover { opacity: 0.55; }

/* Skeleton для быстрых ссылок */
.nav-link-skeleton {
  height: 14px;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 2px;
  display: inline-block;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── Backdrop ─────────────────────────────────── */
.search-backdrop {
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0,0,0,0.35);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}



/* ─── Page ─────────────────────────────────────── */
.layout-body {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-content {
  padding-top: 90px;
  flex: 1 0 auto;
}

/* ─── Transitions ──────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.search-drop-enter-active, .search-drop-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.search-drop-enter-from, .search-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.slide-down-enter-active, .slide-down-leave-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ─────────────────────────────────────────────────
   MOBILE (≤ 1024px)
   ───────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .desktop-nav  { display: none; }
  .mobile-search-btn { display: flex; }
  .header-bottom { display: none; }

  .header-top {
    padding: 0 14px;
    height: 48px;
  }

  .logo { font-size: 32px; }

  .header-icon { font-size: 22px; }

  .page-content {
    padding-top: 50px;
    //padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px));
  }
}

/* ─── Mobile Search Overlay ────────────────────── */
.mobile-search-overlay {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: #fff;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0);
}

.mobile-search-bar-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #ebebeb;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.mobile-search-bar {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f4f4f4;
  border-radius: 10px;
  padding: 9px 12px;
}

.mobile-search-bar input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 16px; /* iOS Safari зумит при focus, если <16px */
  color: #000;
}

.mobile-search-bar input::placeholder { color: #aaa; }

.cancel-btn {
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: #000;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 6px 4px;
}

.search-hints { padding: 16px 14px; }

.hints-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #aaa;
  margin-bottom: 10px;
}

.hints-chips { display: flex; flex-wrap: wrap; gap: 8px; }

.chip {
  background: #f4f4f4;
  border: none;
  border-radius: 20px;
  padding: 7px 14px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
}
.chip:hover { background: #e8e8e8; }

.chip:hover { background: #e8e8e8; }

/* ─── Search Results (Mobile) ──────────────────── */
.search-results {
  padding: 16px 14px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}

.results-section {
  margin-bottom: 24px;
}

.results-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #aaa;
  margin-bottom: 12px;
}

.category-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9f9f9;
  border: none;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.category-item:hover {
  background: #f0f0f0;
}

.category-img {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.product-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-item {
  display: flex;
  gap: 12px;
  background: #f9f9f9;
  border: none;
  border-radius: 12px;
  padding: 10px;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.product-item:hover {
  background: #f0f0f0;
}

.product-img {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-title {
  font-size: 14px;
  font-weight: 500;
  color: #111;
  line-height: 1.3;
}

.product-article {
  font-size: 11px;
  color: #999;
}

.product-price {
  font-size: 14px;
  font-weight: 600;
  color: #111;
  margin-top: auto;
}

.search-loader {
  display: flex;
  justify-content: center;
  padding: 24px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f0f0f0;
  border-top-color: #111;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Desktop Search Results ───────────────────── */
.desktop-search-results {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px 0 24px;
  max-height: 60vh;
  overflow-y: auto;
}

.results-section-desktop {
  margin-bottom: 24px;
}

.results-label-desktop {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #999;
  margin-bottom: 12px;
}

.category-results-desktop {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.category-item-desktop {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f9f9f9;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
  font-size: 14px;
  font-weight: 500;
}

.category-item-desktop:hover {
  background: #f0f0f0;
}

.category-img-desktop {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  object-fit: cover;
}

.product-results-desktop {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.product-item-desktop {
  display: flex;
  gap: 14px;
  background: #f9f9f9;
  border: none;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
}

.product-item-desktop:hover {
  background: #f0f0f0;
}

.product-img-desktop {
  width: 70px;
  height: 70px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.product-info-desktop {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-title-desktop {
  font-size: 14px;
  font-weight: 500;
  color: #111;
  line-height: 1.3;
}

.product-article-desktop {
  font-size: 11px;
  color: #999;
}

.product-price-desktop {
  font-size: 15px;
  font-weight: 600;
  color: #111;
  margin-top: auto;
}

.search-loader-desktop {
  display: flex;
  justify-content: center;
  padding: 32px;
}

/* ─── Mobile Tab Bar (iOS 26 Liquid Glass) ───────── */
.mobile-tab-bar {
  display: none;
  position: fixed;
  bottom: 0; left: 0;
  width: 100%;
  z-index: 1000;
  background: transparent;
  border-top: none;
  align-items: center;
  justify-content: center;
  padding: 8px 16px max(12px, env(safe-area-inset-bottom));
  pointer-events: none;
}

.mobile-tab-bar-inner {
  position: relative;
  display: flex;
  align-items: stretch;
  width: 100%;
  max-width: 420px;
  border-radius: 28px;
  padding: 6px;
  gap: 2px;
  pointer-events: auto;
  isolation: isolate;

  /* Liquid Glass — very transparent, blur does the heavy lifting */
  background: rgba(255, 255, 255, 0.25);
  -webkit-backdrop-filter: blur(36px) saturate(220%);
  backdrop-filter: blur(36px) saturate(220%);

  /* Hairline glass rim */
  border: 1px solid rgba(255, 255, 255, 0.5);

  /* Soft lift only — no dark halo */
  box-shadow:
    0 8px 28px rgba(15, 23, 42, 0.08),
    0 1px 3px rgba(15, 23, 42, 0.04),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

/* Top specular highlight */
.mobile-tab-bar-inner::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.45) 0%,
    rgba(255, 255, 255, 0) 55%
  );
  pointer-events: none;
  z-index: 0;
}

/* Fallback for browsers without backdrop-filter */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .mobile-tab-bar-inner {
    background: rgba(255, 255, 255, 0.85);
  }
}

button.tab-item {
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
}

.tab-item {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1 1 0;
  min-width: 0;
  padding: 4px 2px;
  color: #1f2937;
  text-decoration: none;
  border-radius: 18px;
  transition: color 0.3s ease, transform 0.25s ease;
  -webkit-tap-highlight-color: transparent;
}

/* Icon container — this is where the white "active" pill appears */
.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 30px;
  border-radius: 12px;
  transition: background 0.3s ease, box-shadow 0.3s ease;
}

.tab-item svg {
  width: 22px;
  height: 22px;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-label {
  display: none;
}

.tab-item:active {
  transform: scale(0.94);
}

/* Active state — small white pill behind ICON only, accent-colored label */
.tab-item.active {
  color: var(--tab-accent, #0f172a);
}

.tab-item.active .tab-icon {
  background: rgba(255, 255, 255, 0.95);
  box-shadow:
    0 1px 3px rgba(15, 23, 42, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 1);
}

.tab-item.active svg path,
.tab-item.active svg rect,
.tab-item.active svg circle {
  stroke-width: 2;
  transition: stroke-width 0.3s ease;
}

@media (max-width: 1024px) {
  .mobile-tab-bar { display: flex; }
}

/* Dark-mode-friendly glass (если когда-нибудь добавится тёмная тема) */
@media (prefers-color-scheme: dark) {
  .mobile-tab-bar-inner {
    background: rgba(255, 255, 255, 0.18);
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow:
      0 8px 28px rgba(0, 0, 0, 0.45),
      0 1px 3px rgba(0, 0, 0, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.18);
  }

  .mobile-tab-bar-inner::before {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(255, 255, 255, 0) 55%
    );
  }

  .tab-item { color: rgba(44, 44, 44, 0.7); }

  .tab-item.active { color: #fff; }

  .tab-item.active .tab-icon {
    background: rgb(0, 0, 0);
    box-shadow:
      0 1px 3px rgba(0, 0, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.22);
  }
}
</style>