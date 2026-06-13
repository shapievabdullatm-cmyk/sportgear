<template>
  <div class="product-page">
    <div v-if="pending" class="loading">
      Загрузка...
    </div>

    <div v-else-if="error" class="error">
      Товар не найден
    </div>

    <div v-else-if="product" class="product-container">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <NuxtLink to="/">Главная</NuxtLink>
        <span class="separator">/</span>
        <template v-for="(crumb, index) in breadcrumbs" :key="crumb.id">
          <NuxtLink :to="`/catalog/${crumb.slug}`">{{ crumb.title }}</NuxtLink>
          <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
        </template>
        <span class="current-desktop-only"><span class="separator">/</span>{{ product.title }}</span>
      </div>

      <div class="product-content">
        <!-- Галерея изображений -->
        <div class="product-gallery">
          <div v-if="product.images && product.images.length > 1" class="thumbnails">
            <button
                v-for="(image, index) in product.images"
                :key="index"
                @click="selectedImageIndex = index"
                class="thumbnail"
                :class="{ active: selectedImageIndex === index }"
            >
              <img :src="image.url" :alt="`${product.title} - ${index + 1}`" />
            </button>
          </div>

          <div
              class="main-image"
              @touchstart="onMainTouchStart"
              @touchmove="onMainTouchMove"
              @touchend="onMainTouchEnd"
              @touchcancel="onMainTouchEnd"
          >
            <div
                v-if="product.images && product.images.length > 0"
                class="main-image-track"
                :class="{ dragging: mainIsDragging }"
                :style="{ transform: `translate3d(calc(${-selectedImageIndex * 100}% + ${mainDragOffset}px), 0, 0)` }"
            >
              <img
                  v-for="(image, idx) in product.images"
                  :key="idx"
                  :src="image.url"
                  :alt="`${product.title} - ${idx + 1}`"
                  class="main-img"
                  draggable="false"
                  @click="onMainImageClick(idx)"
              />
            </div>
            <div v-else class="no-image">Нет изображения</div>
          </div>
        </div>

        <!-- Информация о товаре -->
        <div class="product-info">
          <h1 class="product-title">{{ product.external_title || product.title }}</h1>

          <div class="product-meta">
            <span v-if="product.article" class="article">Артикул: {{ product.article }}</span>
          </div>

          <!-- Цена -->
          <div class="product-pricing">
            <div class="prices">
              <span class="current-price">{{ formatPrice(displayPrice) }} ₽</span>
              <span v-if="displayOldPrice" class="old-price">{{ formatPrice(displayOldPrice) }} ₽</span>
            </div>
            <div v-if="discountPercent" class="discount-badge">-{{ discountPercent }}%</div>
          </div>

          <!-- Товары из группы (варианты) -->
          <div v-if="(relatedProducts && relatedProducts.length > 0) || getColorParam(product)" class="product-group-variants">
            <div class="variants-header">
              <h3 class="variants-title">Цвет:</h3>
              <span v-if="getColorParam(product)" class="variants-active-color">{{ getColorParam(product) }}</span>
            </div>
            <div v-if="relatedProducts && relatedProducts.length > 0" class="variants-scroll">
              <NuxtLink
                  v-for="variant in relatedProducts"
                  :key="variant.id"
                  :to="`/products/${variant.slug}`"
                  class="variant-item"
                  :class="{ active: variant.id === product.id }"
              >
                <img
                    v-if="variant.images && variant.images.length > 0"
                    :src="variant.images[0].url"
                    :alt="variant.title"
                    class="variant-img"
                />
                <div v-else class="variant-no-img"></div>
              </NuxtLink>
            </div>
          </div>

          <!-- Выбор размера -->
          <div v-if="availableSizes.length > 0" class="product-sizes">
            <SizeTableDrawer v-if="sizeTable" :size-table="sizeTable" />
            <div class="size-buttons">
              <button
                  v-for="size in availableSizes"
                  :key="size.product_id"
                  class="size-btn"
                  :class="{
                    active: selectedSize === size.product_id,
                    disabled: size.total_stock === 0
                  }"
                  @click="size.total_stock > 0 && selectSize(size.product_id)"
                  type="button"
              >
                {{ size.size }}
                <span v-if="getSizeQuantityInCart(size.product_id) > 0" class="size-btn__badge">
                  {{ getSizeQuantityInCart(size.product_id) }}
                </span>
              </button>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div class="product-actions">
            <!-- Если товар уже в корзине - показываем счетчик -->
            <div v-if="cartItem" class="quantity-control">
              <button
                  @click="decrementCartItem"
                  class="qty-btn"
                  :disabled="cartStore.loading"
                  aria-label="Уменьшить количество"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <span class="qty-display">{{ cartItem.quantity }}</span>
              <button
                  @click="incrementCartItem"
                  class="qty-btn"
                  :disabled="cartItem.quantity >= (displayStock || 999) || cartStore.loading"
                  aria-label="Увеличить количество"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
            </div>

            <!-- Если товара нет в корзине - показываем кнопку добавления -->
            <button
                v-else
                class="btn-add-to-cart"
                @click="handleAddToCart"
                :disabled="cartStore.loading || displayStock === 0"
            >
              <span class="btn-add-to-cart__ghost">Добавить в корзину</span>
              <span class="btn-add-to-cart__label">{{ cartStore.loading ? 'Добавление...' : addToCartButtonText }}</span>
            </button>

            <button
                class="btn-wishlist"
                :class="{ active: isInWishlist }"
                @click="handleToggleWishlist"
                :disabled="wishlistStore.loading"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" :fill="isInWishlist ? '#C1121C' : 'none'" :stroke="isInWishlist ? '#C1121C' : '#666'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          <!-- Сообщение об ошибке -->
          <Transition name="fade">
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </Transition>

          <!-- Сообщение об успехе -->
          <Transition name="fade">
            <div v-if="successMessage" class="success-message">
              {{ successMessage }}
            </div>
          </Transition>

          <!-- Превью описания + кнопка drawer -->
          <div v-if="product.description || (product.params && product.params.length > 0)" class="description-preview-block">
            <div v-if="product.description" class="description-preview">
              <div class="description-preview__text" v-html="product.description"></div>
              <div class="description-preview__fade"></div>
            </div>
            <button class="btn-info-drawer" @click="infoDrawerOpen = true">
              Характеристики и описание
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- С этим товаром покупают -->
      <div v-if="boughtTogetherProducts && boughtTogetherProducts.length > 0" class="bought-together-products">
        <div class="section-header">
          <h2 class="bought-together-title">С этим товаром покупают</h2>
          <div class="slider-nav-btns">
            <button class="slider-nav-btn" @click="scrollBoughtTogether(-1)" aria-label="Назад">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="slider-nav-btn" @click="scrollBoughtTogether(1)" aria-label="Вперёд">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div class="bought-together-slider-wrapper">
          <div class="bought-together-slider" ref="boughtTogetherSliderRef">
            <div
                v-for="boughtProduct in boughtTogetherProducts"
                :key="boughtProduct.id"
                class="bought-together-slide"
            >
              <CatalogProductCard :product="boughtProduct" />
            </div>
          </div>
        </div>
      </div>

      <!-- Похожие товары -->
      <div v-if="similarProducts && similarProducts.length > 0" class="similar-products">
        <div class="section-header">
          <h2 class="similar-title">Похожие товары</h2>
          <div class="slider-nav-btns">
            <button class="slider-nav-btn" @click="scrollSimilarProducts(-1)" aria-label="Назад">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="slider-nav-btn" @click="scrollSimilarProducts(1)" aria-label="Вперёд">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
        <div class="similar-slider-wrapper">
          <div class="similar-slider" ref="sliderRef">
            <div
                v-for="similarProduct in similarProducts"
                :key="similarProduct.id"
                class="similar-slide"
            >
              <CatalogProductCard :product="similarProduct" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Drawer: Характеристики и описание -->
    <Transition name="drawer-fade">
      <div v-if="infoDrawerOpen" class="info-drawer-overlay" @click.self="infoDrawerOpen = false">
        <div class="info-drawer">
          <div class="info-drawer__header">
            <h2 class="info-drawer__title">Характеристики и описание</h2>
            <button class="info-drawer__close" @click="infoDrawerOpen = false" aria-label="Закрыть">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <div class="info-drawer__body">
            <!-- Характеристики -->
            <div v-if="product && product.params && product.params.length > 0" class="drawer-params">
              <h3 class="drawer-section-title">Характеристики</h3>
              <div class="drawer-params-list">
                <div v-for="(param, index) in product.params" :key="index" class="drawer-param-row">
                  <span class="drawer-param-name">{{ param.title }}</span>
                  <span class="drawer-param-value">
                    <template v-if="param.is_color && typeof param.value === 'string'">
                      <span class="color-display">
                        <span class="color-circle" :style="getColorStyle(param.value)"></span>
                        {{ parseColorValue(param.value) }}
                      </span>
                    </template>
                    <template v-else-if="Array.isArray(param.value)">
                      {{ param.value.join(', ') }}
                    </template>
                    <template v-else>
                      {{ param.value }}{{ param.unit ? ' ' + param.unit : '' }}
                    </template>
                  </span>
                </div>
              </div>
            </div>
            <!-- Описание -->
            <div v-if="product && product.description" class="drawer-description">
              <h3 class="drawer-section-title">Описание</h3>
              <div class="drawer-description-content" v-html="product.description"></div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Полноэкранная галерея -->
    <Transition name="gallery-fade">
      <div v-if="isGalleryOpen" class="fullscreen-gallery" @click.self="closeGallery">
        <button class="gallery-close" @click="closeGallery">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <button
            v-if="!isMobile && galleryIndex > 0"
            class="gallery-nav gallery-prev"
            @click="prevImage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <div class="gallery-content">
          <div v-if="isMobile" class="gallery-slider" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
            <div class="gallery-slides" :style="{ transform: `translateX(-${galleryIndex * 100}%)` }">
              <div v-for="(image, index) in product.images" :key="index" class="gallery-slide">
                <img
                    :src="image.url"
                    :alt="`${product.title || 'Товар'} - ${index + 1}`"
                    class="gallery-image"
                />
              </div>
            </div>
          </div>
          <img
              v-else-if="product.images && product.images[galleryIndex]"
              :src="product.images[galleryIndex].url"
              :alt="`${product.title || 'Товар'} - ${galleryIndex + 1}`"
              class="gallery-image"
          />
          <div class="gallery-counter">{{ galleryIndex + 1 }} / {{ product.images?.length || 0 }}</div>
        </div>

        <button
            v-if="!isMobile && product.images && galleryIndex < product.images.length - 1"
            class="gallery-nav gallery-next"
            @click="nextImage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>

  <!-- Модальное окно выбора размера -->
  <SizeSelectionModal
      v-model="showSizeModal"
      :sizes="availableSizes"
      :initial-size="selectedSize"
      @confirm="handleSizeConfirm"
  />
</template>

<script setup lang="ts">
import type { Product } from '~/types/product'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'
import { useToastStore } from '~/stores/toast'

const infoDrawerOpen = ref(false)

const vClickOutside = {
  mounted(el: HTMLElement, binding: { value: () => void }) {
    el._clickOutside = (event: MouseEvent) => {
      if (!el.contains(event.target as Node)) binding.value()
    }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el: HTMLElement) {
    document.removeEventListener('click', el._clickOutside)
  }
}

const route = useRoute()
const router = useRouter()
const { $api } = useApi()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const slug = computed(() => route.params.slug as string)
const selectedImageIndex = ref(0)
const sliderRef = ref<HTMLElement | null>(null)
const isGalleryOpen = ref(false)
const galleryIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)
const isMobile = ref(false)

const mainTouchStartX = ref(0)
const mainTouchStartY = ref(0)
const mainDragOffset = ref(0)
const mainIsDragging = ref(false)
const mainAxisLocked = ref<null | 'x' | 'y'>(null)
const mainSuppressClick = ref(false)
const selectedSize = ref<number | null>(null)
const sizeDropdownOpen = ref(false)
const boughtTogetherSliderRef = ref<HTMLElement | null>(null)
const errorMessage = ref('')
const successMessage = ref('')
const showSizeModal = ref(false)

const { data: response, pending, error } = await useAsyncData<{
  product: Product
  breadcrumbs: Array<{ id: number, title: string, slug: string }>
  related_products: Product[]
  similar_products: Product[]
  bought_together_products: Product[]
}>(
    'product-' + slug.value,
    () => $api('/products/' + slug.value)
)

const product = computed(() => response.value?.product)
const breadcrumbs = computed(() => response.value?.breadcrumbs || [])
const relatedProducts = computed(() => response.value?.related_products || [])
const similarProducts = computed(() => response.value?.similar_products || [])
const boughtTogetherProducts = computed(() => response.value?.bought_together_products || [])

// Загрузка таблицы размеров
const sizeTable = ref(null)
const loadSizeTable = async () => {
  if (product.value?.size_table_id) {
    try {
      const data = await $api(`/size-tables/${product.value.size_table_id}`)
      sizeTable.value = data
    } catch (error) {
      console.error('Failed to load size table:', error)
    }
  }
}

// Размеры товара
const availableSizes = computed(() => product.value?.sizes || [])

// Инициализация выбранного размера из URL при загрузке
onMounted(() => {
  const sizeParam = route.query.size as string
  if (sizeParam && availableSizes.value.length > 0) {
    // Ищем размер по значению size (например "45", "M", "L")
    const sizeFromUrl = availableSizes.value.find(s => String(s.size) === sizeParam)
    if (sizeFromUrl) {
      selectedSize.value = sizeFromUrl.product_id
    }
  }

  // Загружаем таблицу размеров
  loadSizeTable()
})

// Перезагружаем таблицу при изменении товара
watch(() => product.value?.size_table_id, () => {
  loadSizeTable()
})

// Выбранный размер (товар)
const selectedSizeData = computed(() => {
  if (!selectedSize.value || !availableSizes.value.length) return null
  return availableSizes.value.find(s => s.product_id === selectedSize.value)
})

// ID товара для проверки в корзине (дочерний если выбран размер, иначе основной)
const productIdForCart = computed(() => {
  if (selectedSize.value) return selectedSize.value
  return product.value?.id || null
})

// Проверяем, есть ли товар в корзине
const cartItem = computed(() => {
  if (!productIdForCart.value) return null
  return cartStore.items.find(item => item.product_id === productIdForCart.value)
})

// Проверяем, есть ли товар в избранном
const isInWishlist = computed(() => {
  if (!productIdForCart.value) return false
  return wishlistStore.isInWishlist(productIdForCart.value)
})

// Отображаемая цена (из выбранного размера или основного товара)
const displayPrice = computed(() => {
  return selectedSizeData.value?.price ?? product.value?.price
})

const displayOldPrice = computed(() => {
  return selectedSizeData.value?.old_price ?? product.value?.old_price
})

const displayStock = computed(() => {
  return selectedSizeData.value?.total_stock ?? product.value?.total_stock
})

const discountPercent = computed(() => {
  if (!displayOldPrice.value || !displayPrice.value) return null
  const current = typeof displayPrice.value === 'string' ? parseFloat(displayPrice.value) : displayPrice.value
  const old = typeof displayOldPrice.value === 'string' ? parseFloat(displayOldPrice.value) : displayOldPrice.value
  if (!old || old <= current) return null
  return Math.round((1 - current / old) * 100)
})

function formatPrice(price: number | string | null | undefined): string {
  if (!price) return '0'
  const num = typeof price === 'string' ? parseFloat(price) : price
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

function parseColorValue(value: string): string {
  try {
    const parsed = JSON.parse(value)
    return parsed.name || value
  } catch {
    return value
  }
}

function getColorParam(variant: Product): string | null {
  if (!variant.params || variant.params.length === 0) return null

  const colorParam = variant.params.find(p => p.is_color)
  if (!colorParam || !colorParam.value) return null

  const val = colorParam.value
  if (typeof val === 'string' && val.startsWith('{')) {
    return parseColorValue(val)
  }
  if (Array.isArray(val)) {
    const first = val[0]?.toString() || null
    if (first && first.startsWith('{')) return parseColorValue(first)
    return first
  }
  return val?.toString() || null
}

function getColorStyle(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value)
    if (parsed.type === 'solid' && parsed.color1) {
      return { backgroundColor: parsed.color1 }
    }
    if (parsed.type === 'gradient' && parsed.color1 && parsed.color2) {
      return {
        background: `linear-gradient(135deg, ${parsed.color1} 0%, ${parsed.color2} 100%)`
      }
    }
  } catch {
    // ignore
  }
  return { backgroundColor: '#ccc' }
}

function openGallery(index: number) {
  galleryIndex.value = index
  isGalleryOpen.value = true
  document.body.style.overflow = 'hidden'
}

function closeGallery() {
  isGalleryOpen.value = false
  document.body.style.overflow = ''
}

function nextImage() {
  if (product.value?.images && galleryIndex.value < product.value.images.length - 1) {
    galleryIndex.value++
  }
}

function prevImage() {
  if (galleryIndex.value > 0) {
    galleryIndex.value--
  }
}

function handleTouchStart(e: TouchEvent) {
  touchStartX.value = e.touches[0].clientX
}

function handleTouchEnd(e: TouchEvent) {
  touchEndX.value = e.changedTouches[0].clientX
  handleSwipe()
}

function onMainTouchStart(e: TouchEvent) {
  const images = product.value?.images || []
  if (images.length < 2) return
  mainTouchStartX.value = e.touches[0].clientX
  mainTouchStartY.value = e.touches[0].clientY
  mainDragOffset.value = 0
  mainIsDragging.value = true
  mainAxisLocked.value = null
  mainSuppressClick.value = false
}

function onMainTouchMove(e: TouchEvent) {
  if (!mainIsDragging.value) return
  const dx = e.touches[0].clientX - mainTouchStartX.value
  const dy = e.touches[0].clientY - mainTouchStartY.value
  if (mainAxisLocked.value === null) {
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      mainAxisLocked.value = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }
  }
  if (mainAxisLocked.value === 'x') {
    mainDragOffset.value = dx
    if (Math.abs(dx) > 5) mainSuppressClick.value = true
  }
}

function onMainTouchEnd() {
  if (!mainIsDragging.value) return
  const images = product.value?.images || []
  const dx = mainDragOffset.value
  const threshold = 50
  if (mainAxisLocked.value === 'x' && Math.abs(dx) > threshold) {
    if (dx < 0 && selectedImageIndex.value < images.length - 1) {
      selectedImageIndex.value++
    } else if (dx > 0 && selectedImageIndex.value > 0) {
      selectedImageIndex.value--
    }
  }
  mainDragOffset.value = 0
  mainIsDragging.value = false
  mainAxisLocked.value = null
}

function onMainImageClick(idx: number) {
  if (mainSuppressClick.value) {
    mainSuppressClick.value = false
    return
  }
  openGallery(idx)
}

function scrollBoughtTogether(direction: 1 | -1) {
  boughtTogetherSliderRef.value?.scrollBy({ left: direction * 600, behavior: 'smooth' })
}

function scrollSimilarProducts(direction: 1 | -1) {
  sliderRef.value?.scrollBy({ left: direction * 600, behavior: 'smooth' })
}

function handleSwipe() {
  const diff = touchStartX.value - touchEndX.value
  const threshold = 50

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      nextImage()
    } else {
      prevImage()
    }
  }
}

function selectSize(productId: number) {
  selectedSize.value = productId
  errorMessage.value = ''

  // Обновляем URL с параметром размера (только значение размера, не slug)
  const size = availableSizes.value.find(s => s.product_id === productId)
  if (size) {
    router.push({
      query: { ...route.query, size: size.size }
    })
  }
}

function clearSize() {
  selectedSize.value = null
  errorMessage.value = ''

  // Удаляем параметр size из URL
  const query = { ...route.query }
  delete query.size
  router.push({ query })
}

function getSizeQuantityInCart(productId: number): number {
  const item = cartStore.items.find(item => item.product_id === productId)
  return item ? item.quantity : 0
}

const addToCartButtonText = computed(() => {
  if (!product.value?.is_active) return 'Товар недоступен'
  if (displayStock.value === 0) return 'Нет в наличии'
  return 'Добавить в корзину'
})

async function handleAddToCart() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!product.value) return

  // Если нет в наличии
  if (displayStock.value === 0) {
    const toastStore = useToastStore()
    toastStore.error('Товар отсутствует на складе')
    return
  }

  // Если есть размеры, но не выбран - показываем модалку
  if (availableSizes.value.length > 0 && !selectedSize.value) {
    showSizeModal.value = true
    return
  }

  // Если есть дочерние товары (размеры), но не выбран - показываем модалку
  if (product.value.children && product.value.children.length > 0 && !selectedSize.value) {
    showSizeModal.value = true
    return
  }

  // Добавляем в корзину
  await addProductToCart()
}

async function handleSizeConfirm(sizeId: number) {
  selectedSize.value = sizeId

  // Обновляем URL с параметром размера (только значение размера)
  const size = availableSizes.value.find(s => s.product_id === sizeId)
  if (size) {
    router.push({
      query: { ...route.query, size: size.size }
    })
  }

  await addProductToCart()
}

async function addProductToCart() {
  if (!product.value) return

  // Определяем, какой товар добавлять
  let productToAdd = product.value

  if (selectedSize.value && product.value.children) {
    // Если выбран размер, добавляем дочерний товар
    const childProduct = product.value.children.find(c => c.id === selectedSize.value)
    if (childProduct) {
      productToAdd = childProduct
    }
  }

  // Добавляем в корзину (количество всегда 1)
  await cartStore.addToCart({
    id: productToAdd.id,
    title: productToAdd.title || '',
    slug: productToAdd.slug,
    price: productToAdd.price || 0,
    old_price: productToAdd.old_price,
    images: productToAdd.images || [],
    parent_id: productToAdd.parent_id,
    total_stock: productToAdd.total_stock || 0,
  }, 1)
}

async function incrementCartItem() {
  if (!cartItem.value) return
  await cartStore.incrementQuantity(cartItem.value.id)
}

async function decrementCartItem() {
  if (!cartItem.value) return
  await cartStore.decrementQuantity(cartItem.value.id)
}

async function handleToggleWishlist() {
  if (!product.value) return

  // Если есть размеры, но не выбран - показываем ошибку
  if (availableSizes.value.length > 0 && !selectedSize.value) {
    const toastStore = useToastStore()
    toastStore.error('Выберите размер')
    return
  }

  // Определяем, какой товар добавлять
  let productToAdd = product.value

  if (selectedSize.value && product.value.children) {
    // Если выбран размер, добавляем дочерний товар
    const childProduct = product.value.children.find(c => c.id === selectedSize.value)
    if (childProduct) {
      productToAdd = childProduct
    }
  }

  await wishlistStore.toggleWishlist({
    id: productToAdd.id,
    title: productToAdd.title || '',
    slug: productToAdd.slug,
    price: productToAdd.price || 0,
    old_price: productToAdd.old_price,
    images: productToAdd.images || [],
    parent_id: productToAdd.parent_id,
    total_stock: productToAdd.total_stock || 0,
  })
}

// Клавиатурная навигация
onMounted(() => {
  isMobile.value = window.innerWidth <= 768

  const handleResize = () => {
    isMobile.value = window.innerWidth <= 768
  }

  window.addEventListener('resize', handleResize)
  const handleKeydown = (e: KeyboardEvent) => {
    if (!isGalleryOpen.value) return

    if (e.key === 'Escape') {
      closeGallery()
    } else if (e.key === 'ArrowRight') {
      nextImage()
    } else if (e.key === 'ArrowLeft') {
      prevImage()
    }
  }

  window.addEventListener('keydown', handleKeydown)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('resize', handleResize)
    document.body.style.overflow = ''
  })
})

// SEO
const pageTitle = computed(() => {
  let title = product.value?.meta_title || product.value?.title || 'Товар'

  // Добавляем размер в заголовок, если выбран
  if (selectedSizeData.value) {
    title += ` - Размер ${selectedSizeData.value.size}`
  }

  return title
})

useHead({
  title: pageTitle,
  meta: [
    { name: 'description', content: product.value?.meta_description || product.value?.description || '' },
    { name: 'keywords', content: product.value?.meta_keywords || '' }
  ]
})
</script>

<style scoped>
.product-page {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px 80px;
}

.loading,
.error {
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
}

.error {
  color: #e74c3c;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 30px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.breadcrumbs a {
  color: #666;
  text-decoration: none;
  transition: color 0.2s;
  white-space: nowrap;
}

.breadcrumbs a:hover {
  color: #1a1a1a;
}

.separator {
  color: #ccc;
}

.current-desktop-only {
  color: #1a1a1a;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.product-container {
  background: #fff;
}

.product-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  margin-bottom: 60px;
  align-items: stretch;
}

/* Галерея */
.product-gallery {
  display: flex;
  gap: 15px;
  width: 100%;
  box-sizing: border-box;
  align-items: stretch;
}

.thumbnails {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 5px;
  scrollbar-width: none;
}

.main-image {
  flex: 1;
  aspect-ratio: 2 / 3;
  background: #f4f4f4;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  touch-action: pan-y;
}

.main-image-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 0.3s ease;
  will-change: transform;
}

.main-image-track.dragging {
  transition: none;
}

.main-img {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: auto;
}

.main-img:hover {
  opacity: 0.95;
}

.no-image {
  color: #999;
  font-size: 14px;
}

.thumbnail {
  width: 60px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  transition: border-color 0.2s;
  flex-shrink: 0;
  background: #f4f4f4;
  padding: 0;
}

.thumbnail:hover {
  border-color: #ccc;
}

.thumbnail.active {
  border-color: #1a1a1a;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Информация */
.product-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
  align-self: start;
}

.product-title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  color: #1a1a1a;
  margin: 0;
}

.product-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.article {
  color: #666;
}

.stock {
  font-weight: 600;
}

.stock.in-stock {
  color: #15803d;
}

.stock.out-of-stock {
  color: #C1121C;
}

.product-pricing {
  display: flex;
  align-items: center;
  gap: 15px;
}

.prices {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-price {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
}

.old-price {
  font-size: 18px;
  color: #999;
  text-decoration: line-through;
}

.discount-badge {
  background: #C1121C;
  color: #fff;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
}

/* Варианты из группы */
.product-group-variants {
  padding: 0;
}

.variants-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
}

.variants-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.variants-active-color {
  text-transform: lowercase;
  font-size: 13px;
  font-weight: 400;
  color: #888;
}

.variants-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.variants-scroll::-webkit-scrollbar {
  height: 6px;
}

.variants-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.variants-scroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.variant-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  cursor: pointer;
  text-decoration: none;
}

.variant-item > div:first-child {
  width: 60px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e5e5;
  transition: all 0.2s;
}

.variant-item:hover > div:first-child {
  border-color: #999;
}

.variant-item.active > div:first-child {
  border-color: #1a1a1a;
  box-shadow: 0 0 0 1px #1a1a1a;
}

.variant-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.variant-no-img {
  width: 100%;
  height: 100%;
  background: #f4f4f4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.variant-color-label {
  font-size: 12px;
  color: #666;
  text-align: center;
  max-width: 70px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.variant-item.active .variant-color-label {
  color: #1a1a1a;
  font-weight: 600;
}

/* Выбор размера */
.product-sizes {
  padding: 0;
}

.sizes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.sizes-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.sizes-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.clear-size-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
  padding: 4px 8px;
}

.clear-size-btn:hover {
  color: #1a1a1a;
}

/* Кастомный селект размера */
.custom-select {
  position: relative;
  user-select: none;
}

.custom-select__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  background: #fff;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.2s;
  text-align: left;
}

.custom-select__trigger:hover,
.custom-select.open .custom-select__trigger {
  border-color: #1a1a1a;
}

.custom-select__value {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}

.custom-select__value.placeholder {
  color: #999;
  font-weight: 400;
}

.custom-select__trigger-badge {
  background: #C1121C;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.custom-select__arrow {
  color: #999;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.custom-select.open .custom-select__arrow {
  transform: rotate(180deg);
}

.custom-select__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border: 2px solid #1a1a1a;
  border-radius: 10px;
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0,0,0,0.10);
}

.custom-select__option {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.custom-select__option:last-child {
  border-bottom: none;
}

.custom-select__option:hover:not(.disabled) {
  background: #f7f7f7;
}

.custom-select__option.selected {
  background: #f7f7f7;
}

.custom-select__option.disabled {
  cursor: default;
  opacity: 0.5;
}

.custom-select__option-label {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-select__option-label.muted {
  color: #999;
  font-weight: 400;
}

.custom-select__option-stock {
  font-size: 13px;
  color: #bbb;
  font-weight: 400;
}

.custom-select__option-badge {
  background: #C1121C;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.custom-select__check {
  color: #1a1a1a;
  flex-shrink: 0;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.variants-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.variants-scroll::-webkit-scrollbar {
  height: 6px;
}

.variants-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.variants-scroll::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.variant-item {
  width: 60px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid transparent;
  flex-shrink: 0;
  transition: all 0.2s;
  cursor: pointer;
  display: block;
  background: #EDEDEF;
}

.variant-item:hover {
  border-color: #ccc;
}

.variant-item.active {
  border-color: #1a1a1a;
}

.variant-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.variant-no-img {
  width: 100%;
  height: 100%;
  background: #f4f4f4;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Действия */
.product-actions {
  display: flex;
  gap: 12px;
}

.quantity-control {
  width: 300px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 2px solid #1a1a1a;
  border-radius: 100px;
  padding: 5px 16px;
  background: #fff;
}

.qty-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #1a1a1a;
  transition: all 0.2s;
  border-radius: 8px;
}

.qty-btn:hover:not(:disabled) {
  background: #f4f4f4;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-display {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  min-width: 40px;
  text-align: center;
}

.btn-add-to-cart {
  width: 300px;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  background: #C1121C;
  color: #fff;
  border: none;
  border-radius: 100px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-add-to-cart__ghost {
  visibility: hidden;
  white-space: nowrap;
}

.btn-add-to-cart__label {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  white-space: nowrap;
}

.btn-add-to-cart:hover:not(:disabled) {
  background: #9a0e16;
}

.btn-add-to-cart:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.error-message,
.success-message {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.error-message {
  background: #fee;
  color: #c00;
  border: 1px solid #fcc;
}

.success-message {
  background: #efe;
  color: #060;
  border: 1px solid #cfc;
}

.btn-wishlist {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #e5e5e5;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
  flex-shrink: 0;
  padding: 0;
  line-height: 0;
}

.btn-wishlist:hover {
  border-color: #C1121C;
}

.btn-wishlist.active {
  border-color: #C1121C;
  background: #fff;
}

.btn-wishlist:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Превью описания в правой колонке */
.description-preview-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.description-preview {
  position: relative;
  max-height: 120px;
  overflow: hidden;
}

.description-preview__text {
  font-size: 14px;
  line-height: 1.7;
  color: #555;
}

.description-preview__text :deep(p) {
  margin: 0 0 10px;
}

.description-preview__fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%);
  pointer-events: none;
}

.btn-info-drawer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: opacity 0.2s;
}

.btn-info-drawer:hover {
  opacity: 0.65;
}

/* Drawer overlay */
.info-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 1100;
  display: flex;
  justify-content: flex-end;
}

.info-drawer {
  width: 100%;
  max-width: 520px;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 32px rgba(0,0,0,0.12);
}

.info-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}

.info-drawer__title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.info-drawer__close {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f4;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #1a1a1a;
  transition: background 0.2s;
  flex-shrink: 0;
}

.info-drawer__close:hover {
  background: #e5e5e5;
}

.info-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.drawer-section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 12px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1a1a1a;
}

/* Характеристики в drawer */
.drawer-params-list {
  display: flex;
  flex-direction: column;
}

.drawer-param-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 14px;
  gap: 16px;
}

.drawer-param-row:last-child {
  border-bottom: none;
}

.drawer-param-name {
  color: #888;
  font-weight: 400;
  flex-shrink: 0;
}

.drawer-param-value {
  color: #1a1a1a;
  font-weight: 500;
  text-align: right;
}

/* Описание в drawer */
.drawer-description-content {
  font-size: 15px;
  line-height: 1.8;
  color: #444;
}

.drawer-description-content :deep(p) {
  margin: 0 0 14px;
}

.drawer-description-content :deep(p:last-child) {
  margin-bottom: 0;
}

.drawer-description-content :deep(ul),
.drawer-description-content :deep(ol) {
  margin: 0 0 14px;
  padding-left: 20px;
}

.drawer-description-content :deep(li) {
  margin-bottom: 5px;
}

.drawer-description-content :deep(strong) {
  color: #1a1a1a;
  font-weight: 600;
}

.color-display {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.color-circle {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid #e5e5e5;
  flex-shrink: 0;
}

/* Анимация drawer */
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease;
}

.drawer-fade-enter-active .info-drawer,
.drawer-fade-leave-active .info-drawer {
  transition: transform 0.25s ease;
}

.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

.drawer-fade-enter-from .info-drawer,
.drawer-fade-leave-to .info-drawer {
  transform: translateX(100%);
}

/* Инлайн-кнопки размеров */
.size-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.size-btn {
  position: relative;
  padding: 7px 14px;
  background: #fff;
  border: 1.5px solid #e5e5e5;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  white-space: nowrap;
}

.size-btn:hover:not(.disabled) {
  border-color: #1a1a1a;
}

.size-btn.active {
  border-color: #1a1a1a;
  background: #1a1a1a;
  color: #fff;
}

.size-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  text-decoration: line-through;
}

.size-btn__badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #C1121C;
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
}

/* Заголовок секции со стрелками */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30px;
}

.section-header .bought-together-title,
.section-header .similar-title {
  margin: 0;
}

.slider-nav-btns {
  display: flex;
  gap: 8px;
}

.slider-nav-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f4f4f4;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  color: #1a1a1a;
  transition: background 0.2s, color 0.2s;
  flex-shrink: 0;
}

.slider-nav-btn:hover {
  background: #1a1a1a;
  color: #fff;
}

/* С этим товаром покупают */
.bought-together-products {
  padding: 60px 0 0;
  border-top: 1px solid #e5e5e5;
}

.bought-together-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.bought-together-slider-wrapper {
  position: relative;
  overflow: hidden;
  margin: 0 -20px;
  padding: 0 20px;
}

.bought-together-slider {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
  padding-bottom: 10px;
}

.bought-together-slider::-webkit-scrollbar {
  height: 6px;
}

.bought-together-slider::-webkit-scrollbar-track {
  background: transparent;
}

.bought-together-slider::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.bought-together-slide {
  flex: 0 0 250px;
  width: 250px;
  max-width: 250px;
}

/* Похожие товары */
.similar-products {
  padding: 60px 0 0;
  border-top: 1px solid #e5e5e5;
}

.similar-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.similar-slider-wrapper {
  position: relative;
  overflow: hidden;
  margin: 0 -20px;
  padding: 0 20px;
}

.similar-slider {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
  padding-bottom: 10px;
}

.similar-slider::-webkit-scrollbar {
  height: 6px;
}

.similar-slider::-webkit-scrollbar-track {
  background: transparent;
}

.similar-slider::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.similar-slide {
  flex: 0 0 250px;
  width: 250px;
  max-width: 250px;
}

/* Полноэкранная галерея */
.fullscreen-gallery {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gallery-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;
}

.gallery-close:hover {
  background: rgba(0, 0, 0, 0.1);
}

.gallery-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.gallery-image {
  max-width: 100%;
  max-height: calc(90vh - 60px);
  object-fit: contain;
  user-select: none;
}

.gallery-counter {
  color: #1a1a1a;
  font-size: 16px;
  font-weight: 500;
  background: rgba(0, 0, 0, 0.05);
  padding: 8px 16px;
  border-radius: 20px;
}

.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 56px;
  height: 56px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10;
}

.gallery-nav:hover {
  background: rgba(0, 0, 0, 0.1);
}

.gallery-prev {
  left: 20px;
}

.gallery-next {
  right: 20px;
}

.gallery-fade-enter-active,
.gallery-fade-leave-active {
  transition: opacity 0.3s ease;
}

.gallery-fade-enter-from,
.gallery-fade-leave-to {
  opacity: 0;
}

/* Адаптив — планшет */
@media (max-width: 1024px) and (min-width: 769px) {
  .product-page {
    padding: 16px 24px;
  }

  .product-content {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-bottom: 48px;
  }

  .thumbnail {
    width: 52px;
    height: 78px;
  }

  .main-image {
    aspect-ratio: 2 / 3;
  }

  .product-title {
    font-size: 20px;
  }

  .current-price {
    font-size: 26px;
  }

  .old-price {
    font-size: 18px;
  }

  .product-info {
    gap: 12px;
  }

  .bought-together-slide,
  .similar-slide {
    flex: 0 0 200px;
    width: 200px;
    max-width: 200px;
  }

  .section-header {
    margin-bottom: 20px;
  }

  .bought-together-products,
  .similar-products {
    padding: 40px 0 0;
  }
}

@media (max-width: 768px) {
  .product-page {
    padding: 15px;
    overflow-x: hidden;
  }

  .product-container {
    overflow-x: hidden;
  }

  .breadcrumbs {
    margin-bottom: 16px;
    font-size: 12px;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 4px;
  }

  .breadcrumbs::-webkit-scrollbar {
    display: none;
  }

  .current-desktop-only {
    display: none;
  }

  .product-content {
    grid-template-columns: 1fr;
    gap: 30px;
    margin-bottom: 40px;
    overflow-x: hidden;
  }

  .product-gallery {
    flex-direction: column-reverse;
    width: 100%;
    max-width: 100%;
    overflow: hidden;
  }

  .main-image {
    width: 100%;
    max-width: 100%;
    aspect-ratio: 2 / 3;
  }

  .thumbnails {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    max-height: none;
    padding-right: 0;
    padding-bottom: 5px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }

  .thumbnails::-webkit-scrollbar {
    display: none;
  }

  .thumbnail {
    width: 60px;
    height: 60px;
    flex-shrink: 0;
  }

  .product-title {
    font-size: 20px;
  }

  .current-price {
    font-size: 26px;
  }

  .old-price {
    font-size: 18px;
  }

  .product-actions {
    flex-direction: row;
  }

  .quantity-control {
    flex: 1;
    width: auto;
  }

  .btn-add-to-cart {
    flex: 1;
    width: auto;
  }

  .btn-wishlist {
    width: 56px;
    height: 56px;
    min-width: 56px;
    flex-shrink: 0;
  }

  .variant-item {
    width: 50px;
    height: 75px;
  }

  .similar-products {
    padding: 40px 0 0;
  }

  .similar-title {
    font-size: 20px;
  }

  .similar-slider-wrapper {
    margin: 0 -15px;
    padding: 0 15px;
  }

  .similar-slider {
    gap: 10px;
  }

  .similar-slide {
    width: 45%;
    min-width: 150px;
    max-width: 180px;
  }

  .bought-together-products {
    padding: 40px 0 0;
  }

  .bought-together-title {
    font-size: 20px;
  }

  .bought-together-slider-wrapper {
    margin: 0 -15px;
    padding: 0 15px;
  }

  .bought-together-slider {
    gap: 10px;
  }

  .bought-together-slide {
    width: 45%;
    min-width: 150px;
    max-width: 180px;
  }

  .gallery-close {
    top: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
  }

  .gallery-nav {
    width: 48px;
    height: 48px;
  }

  .gallery-prev {
    left: 10px;
  }

  .gallery-next {
    right: 10px;
  }

  .gallery-counter {
    font-size: 14px;
    padding: 6px 12px;
  }

  .gallery-content {
    width: 100%;
    height: 100%;
    max-width: 100vw;
    max-height: 100vh;
    gap: 0;
  }

  .gallery-slider {
    width: 100%;
    height: calc(100vh - 80px);
    overflow: hidden;
  }

  .gallery-slides {
    display: flex;
    height: 100%;
    transition: transform 0.3s ease-out;
    touch-action: pan-y;
  }

  .gallery-slide {
    flex: 0 0 100%;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .gallery-image {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
  }

  .gallery-nav {
    display: none;
  }
}
</style>