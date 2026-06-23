<template>
  <div v-if="collections.length > 0" class="collections-wrapper">
    <section
        v-for="collection in collections"
        :key="collection.id"
        class="collection-section"
    >
      <div class="collection-header">
        <h2 class="collection-title">{{ collection.name }}</h2>
        <div class="collection-nav">
          <button
              class="nav-btn"
              :class="{ disabled: getScrollPos(collection.id) <= 0 }"
              @click="scrollLeft(collection.id)"
              aria-label="Назад"
          >
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.6875 24.9375L4.75 19M4.75 19L10.6875 13.0625M4.75 19H33.25" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button
              class="nav-btn"
              :class="{ disabled: isAtEnd(collection.id) }"
              @click="scrollRight(collection.id)"
              aria-label="Вперёд"
          >
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M27.3125 13.0625L33.25 19M33.25 19L27.3125 24.9375M33.25 19H4.75" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="products-track">
        <div v-for="n in 5" :key="n" class="skeleton" />
      </div>

      <!-- Products -->
      <div
          v-else
          :ref="el => setTrackRef(collection.id, el)"
          class="products-track"
          @scroll.passive="() => onScroll(collection.id)"
      >
        <div
            v-for="product in collection.products"
            :key="product.id"
            class="product-wrapper"
        >
          <ProductCard :product="formatProduct(product)" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ProductCard from '~/components/catalog/ProductCard.vue'

interface CollectionProductSize {
  product_id: number
  size: string | number
  slug: string
  price: number | null
  old_price: number | null
  total_stock: number
  is_active: boolean
}

interface CollectionProduct {
  id: number
  title: string
  slug: string
  price: number
  old_price: number | null
  article: string
  brand: {
    id: number
    name: string
  } | null
  images: Array<{ url: string }>
  sizes?: CollectionProductSize[]
}

interface Collection {
  id: number
  name: string
  position: number
  products: CollectionProduct[]
}

const { $api } = useApi()

const loading = ref(true)
const collections = ref<Collection[]>([])
const trackRefs = ref<Map<number, HTMLElement>>(new Map())
const scrollPositions = ref<Map<number, number>>(new Map())
const atEndStates = ref<Map<number, boolean>>(new Map())

async function load() {
  try {
    const res = await $api<{ data: Collection[] }>('/product-collections')
    collections.value = res.data ?? []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await load()
})

function setTrackRef(collectionId: number, el: any) {
  if (el) {
    trackRefs.value.set(collectionId, el as HTMLElement)
  }
}

function getScrollPos(collectionId: number): number {
  return scrollPositions.value.get(collectionId) ?? 0
}

function isAtEnd(collectionId: number): boolean {
  return atEndStates.value.get(collectionId) ?? false
}

function onScroll(collectionId: number) {
  const el = trackRefs.value.get(collectionId)
  if (!el) return

  scrollPositions.value.set(collectionId, el.scrollLeft)
  atEndStates.value.set(
      collectionId,
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
  )
}

const SCROLL_STEP = 300

function scrollLeft(collectionId: number) {
  const el = trackRefs.value.get(collectionId)
  el?.scrollBy({ left: -SCROLL_STEP, behavior: 'smooth' })
}

function scrollRight(collectionId: number) {
  const el = trackRefs.value.get(collectionId)
  el?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' })
}

function formatProduct(product: CollectionProduct) {
  return {
    id: product.id,
    name: product.title,
    slug: product.slug,
    price: product.price,
    old_price: product.old_price,
    images: product.images || [],
    sizes: product.sizes || [],
  }
}
</script>

<style scoped>
.collections-wrapper {
  width: 100%;
}

.collection-section {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 70px 80px 0;
  box-sizing: border-box;
}

@media (max-width: 1280px) {
  .collection-section { padding: 48px 48px 0; }
}

@media (max-width: 1024px) {
  .collection-section { padding: 40px 32px 0; }
}

@media (max-width: 768px) {
  .collection-section { padding: 32px 20px 0; }
}

@media (max-width: 480px) {
  .collection-section { padding: 24px 16px 0; }
}

/* ── Header ──────────────────────────────────────────────── */
.collection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.collection-title {
  font-size: 25px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.02em;
}

.collection-nav {
  display: flex;
  gap: 20px;
}

.nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: 28px;
  border: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  color: #1a1a1a;
  transition: opacity 0.15s;
  padding: 0;
}

.nav-btn:hover {
  opacity: 0.5;
}

.nav-btn.disabled {
  opacity: 0.22;
  pointer-events: none;
}

/* ── Track ───────────────────────────────────────────────── */
.products-track {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 2px;
  padding-right: 48px;
}

.products-track::-webkit-scrollbar {
  display: none;
}

/* ── Product wrapper ─────────────────────────────────────── */
.product-wrapper {
  flex: 0 0 260px;
  min-width: 0;
  max-width: 260px;
  scroll-snap-align: start;
}

/* ── Skeleton ────────────────────────────────────────────── */
.skeleton {
  flex: 0 0 260px;
  scroll-snap-align: start;
  border-radius: 10px;
  background-color: #ededef;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.skeleton::before {
  content: '';
  display: block;
  width: 100%;
  aspect-ratio: 2 / 3;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton::after {
  content: '';
  display: block;
  width: 60%;
  height: 13px;
  margin: 16px auto;
  background: linear-gradient(90deg, #e8e8e8 25%, #f2f2f2 50%, #e8e8e8 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 3px;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 640px) {
  .product-wrapper,
  .skeleton {
    flex: 0 0 calc((100% - 12px * 1.15) / 2.15);
    border-radius: 5px;
  }

  .skeleton::after {
    height: 11px;
    margin: 12px auto;
  }

  .products-track {
    padding-right: 0;
  }

  .collection-title {
    font-size: 17px;
  }

  .nav-btn {
    display: none;
  }
}
</style>