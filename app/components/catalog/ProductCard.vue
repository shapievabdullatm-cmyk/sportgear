<template>
  <NuxtLink :to="`/products/${product.slug}`" class="product-card">
    <div
        class="product-image-wrap"
        @mousemove="onMouseMove"
        @mouseenter="isHovered = true"
        @mouseleave="onMouseLeave"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @touchcancel="onTouchEnd"
    >
      <div v-if="isMobile" class="images-slider" :style="sliderStyle">
        <img
            v-for="(image, idx) in product.images"
            :key="idx"
            :src="image.url"
            :alt="product.name"
            class="product-img"
        />
      </div>
      <img
          v-else-if="product.images && product.images.length > 0"
          :src="product.images[currentImageIndex]?.url"
          :alt="product.name"
          class="product-img"
      />
      <div v-if="!product.images || product.images.length === 0" class="no-image"></div>

      <!-- Image indicators -->
      <div
          v-if="product.images && product.images.length > 1"
          class="image-indicators"
          :class="{ visible: isHovered || isTouching }"
      >
        <span
            v-for="index in product.images.length"
            :key="index"
            class="indicator"
            :class="{ active: index - 1 === currentImageIndex }"
        ></span>
      </div>

      <!-- Badges row: tags left, wishlist right -->
      <div class="badges-row">
        <div class="badges-left">
          <div v-if="discountPercent" class="badge badge-discount">-{{ discountPercent }}%</div>
          <div class="badge badge-hit">ХИТ</div>
          <div class="badge badge-new">НОВИНКА</div>
        </div>
        <button
            class="wishlist-btn"
            :class="{ active: isInWishlist }"
            @click.prevent="toggleWishlist"
            :disabled="wishlistStore.loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" :fill="isInWishlist ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="product-info">
      <p class="product-name">{{ product.name }}</p>
      <div class="product-prices">
        <span class="price-current">{{ formatPrice(product.price) }} ₽</span>
        <span v-if="product.old_price" class="price-old">{{ formatPrice(product.old_price) }} ₽</span>
      </div>
    </div>
  </NuxtLink>

  <!-- Size Selection Modal -->
  <SizeSelectionModal
      v-if="product.sizes"
      v-model="showSizeModal"
      :sizes="product.sizes"
      mode="wishlist"
      @confirm="handleSizeConfirm"
  />
</template>

<script setup lang="ts">
import { useWishlistStore } from '~/stores/wishlist'
import SizeSelectionModal from '~/components/SizeSelectionModal.vue'
import type { ProductSize } from '~/types/product'

interface ProductImage {
  url: string
}

interface Product {
  id: number
  name: string
  slug: string
  price: number | string
  old_price?: number | string
  images?: ProductImage[]
  children?: Product[]
  sizes?: ProductSize[]
  is_hit?: boolean
  is_new?: boolean
  total_stock?: number
}

const props = defineProps<{
  product: Product
}>()

const wishlistStore = useWishlistStore()

const currentImageIndex = ref(0)
const isHovered = ref(false)
const isTouching = ref(false)
const touchStartX = ref(0)
const touchStartY = ref(0)
const dragOffset = ref(0)
const isDragging = ref(false)
const swipeDirection = ref<'horizontal' | 'vertical' | null>(null)
const isMobile = ref(false)
const showSizeModal = ref(false)

const isInWishlist = computed(() => {
  return wishlistStore.isInWishlist(props.product.id)
})

const hasChildren = computed(() => {
  return props.product.children && props.product.children.length > 0
})

async function toggleWishlist() {
  if (props.product.sizes && props.product.sizes.length > 0) {
    if (isInWishlist.value) {
      // Убираем все размеры этого товара из вишлиста
      const toastStore = useToastStore()
      await wishlistStore.removeByParentId(props.product.id)
      toastStore.wishlistRemoved()
    } else {
      showSizeModal.value = true
    }
    return
  }

  await wishlistStore.toggleWishlist({
    id: props.product.id,
    title: props.product.name,
    slug: props.product.slug,
    price: typeof props.product.price === 'string' ? parseFloat(props.product.price) : props.product.price,
    old_price: props.product.old_price ? (typeof props.product.old_price === 'string' ? parseFloat(props.product.old_price) : props.product.old_price) : null,
    images: props.product.images || [],
    parent_id: null,
    total_stock: props.product.total_stock || 1,
  })
}

async function handleSizeConfirm(sizeId: number) {
  const selectedSize = props.product.sizes?.find(s => s.product_id === sizeId)
  if (!selectedSize) return

  await wishlistStore.addToWishlist({
    id: sizeId,
    title: props.product.name,
    slug: selectedSize.slug,
    price: selectedSize.price || 0,
    old_price: selectedSize.old_price,
    images: props.product.images || [],
    parent_id: props.product.id,
    total_stock: selectedSize.total_stock,
  })
}

onMounted(() => {
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
  })
})

const sliderStyle = computed(() => {
  if (!props.product.images || props.product.images.length === 0) return {}

  if (isMobile.value) {
    // Mobile: smooth dragging slider
    const baseOffset = -currentImageIndex.value * 100
    const dragOffsetPercent = isDragging.value ? (dragOffset.value / window.innerWidth) * 100 : 0
    const totalOffset = baseOffset + dragOffsetPercent

    return {
      transform: `translateX(${totalOffset}%)`,
      transition: isDragging.value ? 'none' : 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    }
  } else {
    // Desktop: simple image switching
    return {}
  }
})

function onMouseMove(event: MouseEvent) {
  if (!props.product.images || props.product.images.length <= 1) return
  if (isMobile.value) return

  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const percentage = x / rect.width
  const imageCount = props.product.images.length
  const index = Math.floor(percentage * imageCount)

  currentImageIndex.value = Math.min(Math.max(0, index), imageCount - 1)
}

function onMouseLeave() {
  if (!isMobile.value) {
    currentImageIndex.value = 0
  }
  isHovered.value = false
}

// Touch support for mobile with smooth dragging + direction detection
function onTouchStart(event: TouchEvent) {
  if (!props.product.images || props.product.images.length <= 1) return
  if (!isMobile.value) return

  const touch = event.touches[0]
  if (!touch) return

  isTouching.value = true
  isDragging.value = false
  swipeDirection.value = null
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  dragOffset.value = 0
}

function onTouchMove(event: TouchEvent) {
  if (!props.product.images || props.product.images.length <= 1 || !isTouching.value) return
  if (!isMobile.value) return

  const touch = event.touches[0]
  if (!touch) return

  const dx = touch.clientX - touchStartX.value
  const dy = touch.clientY - touchStartY.value

  // На первом существенном движении определяем направление свайпа:
  // если палец двигается больше по горизонтали — берём управление, иначе пропускаем (страница скроллится).
  if (swipeDirection.value === null) {
    const adx = Math.abs(dx)
    const ady = Math.abs(dy)
    if (adx < 8 && ady < 8) return
    swipeDirection.value = adx > ady ? 'horizontal' : 'vertical'
    if (swipeDirection.value === 'horizontal') {
      isDragging.value = true
    }
  }

  if (swipeDirection.value === 'horizontal') {
    // Перехватываем — страница не должна одновременно скроллиться
    if (event.cancelable) event.preventDefault()
    dragOffset.value = dx
  }
}

function onTouchEnd() {
  if (!props.product.images || props.product.images.length <= 1) return
  if (!isMobile.value) return

  const wasHorizontal = swipeDirection.value === 'horizontal'
  isDragging.value = false
  swipeDirection.value = null

  if (wasHorizontal) {
    const threshold = 50
    if (Math.abs(dragOffset.value) > threshold) {
      if (dragOffset.value > 0 && currentImageIndex.value > 0) {
        currentImageIndex.value--
      } else if (dragOffset.value < 0 && currentImageIndex.value < props.product.images.length - 1) {
        currentImageIndex.value++
      }
    }
  }

  dragOffset.value = 0

  setTimeout(() => {
    isTouching.value = false
  }, 300)
}

const discountPercent = computed(() => {
  if (!props.product.old_price) return null
  const current = typeof props.product.price === 'string' ? parseFloat(props.product.price) : props.product.price
  const old = typeof props.product.old_price === 'string' ? parseFloat(props.product.old_price) : props.product.old_price
  if (!old || old <= current) return null
  return Math.round((1 - current / old) * 100)
})

function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}
</script>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  cursor: pointer;
}

.product-image-wrap {
  position: relative;
  display: block;
  width: 100%;
  padding-bottom: 150%; /* 2:3 (height = 1.5 × width) — гарантированная высота */
  flex-shrink: 0;
  background-color: #f4f4f4;
  border-radius: 10px;
  overflow: hidden;
  touch-action: pan-y;
  -webkit-user-select: none;
  user-select: none;
}

.images-slider {
  position: absolute;
  inset: 0;
  display: flex;
  width: 100%;
  height: 100%;
  will-change: transform;
}

.product-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  -webkit-user-drag: none;
  flex-shrink: 0;
  pointer-events: none;
}

.images-slider .product-img {
  position: relative;
  inset: auto;
}

.no-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: #ebebeb;
}

.image-indicators {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  padding: 5px 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
}

.image-indicators.visible {
  opacity: 1;
}

.indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.2s;
}

.indicator.active {
  background: #fff;
  width: 16px;
  border-radius: 2px;
}

.badges-row {
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  pointer-events: none;
}

.badges-left {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-wrap: wrap;
}

.badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
  color: #fff;
  white-space: nowrap;
}

.badge-discount {
  background: #C1121C;
}

.badge-hit {
  background: #000000;
}

.badge-new {
  background: #000000;
}

.wishlist-btn {
  pointer-events: all;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
  transition: all 0.2s;
}

.wishlist-btn:hover {
  color: #C1121C;
}

.wishlist-btn.active {
  color: #C1121C;
}

.wishlist-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.product-info {
  padding-top: 17px;
  min-width: 0;
  width: 100%;
}

.product-name {
  display: block;
  max-width: 100%;
  font-size: 13px;
  color: #333;
  margin: 0 0 6px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-prices {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.price-current {
  font-size: 16px;
  font-weight: 700;
  color: #111;
}

.price-old {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

@media (max-width: 560px) {
  .product-info {
    padding-top: 5px;
  }

  .product-name {
    font-size: 12px;
    margin: 0 0 3px;
  }

  .badge {
    font-size: 8px;
    padding: 1px 6px;
  }

  .price-current {
    font-size: 14px;
  }

  .price-old {
    font-size: 12px;
  }

  .badges-row {
    position: absolute;
    top: 2px;
    left: 5px;
    right: 5px;
  }

  .badges-left {
    gap: 1px;
  }
}
</style>