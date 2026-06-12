<template>
  <div class="cart-page">
    <div class="cart-container">
      <!-- Breadcrumbs -->
      <nav class="breadcrumbs" aria-label="Хлебные крошки">
        <NuxtLink to="/" class="crumb">Главная</NuxtLink>
        <svg class="crumb-sep" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span class="crumb crumb-current">Корзина</span>
      </nav>

      <header class="cart-header">
        <h1 class="cart-title">
          Корзина
          <span v-if="!cartStore.isEmpty" class="cart-count">{{ totalQty }} {{ pluralizeItems(totalQty) }}</span>
        </h1>
      </header>

      <!-- Пустая корзина -->
      <div v-if="cartStore.isEmpty && cartStore.initialized" class="empty-cart">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h2>В корзине пока пусто</h2>
        <p>Самое время выбрать что-нибудь стоящее — у нас широкий ассортимент спортивных товаров.</p>
        <div class="empty-actions">
          <NuxtLink to="/" class="btn-primary">К покупкам</NuxtLink>
          <NuxtLink to="/wishlist" class="btn-ghost">Открыть избранное</NuxtLink>
        </div>
      </div>

      <!-- Скелетон при первой загрузке -->
      <div v-else-if="!cartStore.initialized" class="cart-content">
        <div class="cart-items">
          <div v-for="n in 3" :key="n" class="cart-item skeleton-item">
            <div class="skeleton skeleton-img"/>
            <div class="skeleton-lines">
              <div class="skeleton skeleton-line w-70"/>
              <div class="skeleton skeleton-line w-40"/>
              <div class="skeleton skeleton-line w-25"/>
            </div>
          </div>
        </div>
        <aside class="cart-summary">
          <div class="summary-card">
            <div class="skeleton skeleton-line w-50" style="height: 24px; margin-bottom: 24px;"/>
            <div class="skeleton skeleton-line w-100" style="margin-bottom: 12px;"/>
            <div class="skeleton skeleton-line w-100" style="margin-bottom: 12px;"/>
            <div class="skeleton skeleton-line w-100" style="height: 48px; margin-top: 24px;"/>
          </div>
        </aside>
      </div>

      <!-- Товары в корзине -->
      <div v-else class="cart-content">
        <div class="cart-main">
          <!-- Список товаров -->
          <TransitionGroup name="item" tag="div" class="cart-items">
            <article
                v-for="item in orderedItems"
                :key="item.id"
                class="cart-item"
                :class="{ 'is-loading': cartStore.loading }"
            >
              <NuxtLink :to="getProductLink(item)" class="item-image">
                <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy"/>
                <div v-else class="no-image">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              </NuxtLink>

              <div class="item-info">
                <div class="item-info-top">
                  <NuxtLink :to="getProductLink(item)" class="item-title">
                    {{ item.title }}
                  </NuxtLink>
                  <div class="item-actions">
                    <button
                        @click="toggleWishlist(item)"
                        class="icon-btn wish-btn"
                        :class="{ active: isInWishlist(item) }"
                        :disabled="wishlistStore.loading"
                        :aria-label="isInWishlist(item) ? 'Убрать из избранного' : 'В избранное'"
                        :title="isInWishlist(item) ? 'Убрать из избранного' : 'В избранное'"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" :fill="isInWishlist(item) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </button>
                    <button
                        @click="cartStore.removeFromCart(item.id)"
                        class="icon-btn remove-btn"
                        :disabled="cartStore.loading"
                        aria-label="Удалить товар"
                        title="Удалить товар"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M3 6h18"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="item-meta">
                  <span v-if="hasSize(item)" class="meta-chip">Размер: <strong>{{ item.size }}</strong></span>
                  <span v-if="item.total_stock > 0" class="meta-chip stock-ok">
                    <span class="dot"/> В наличии
                  </span>
                  <span v-else class="meta-chip stock-out">
                    <span class="dot"/> Нет в наличии
                  </span>
                </div>

                <div class="item-bottom">
                  <div class="item-quantity" :class="{ disabled: cartStore.loading }">
                    <button
                        @click="cartStore.decrementQuantity(item.id)"
                        class="qty-btn"
                        aria-label="Уменьшить количество"
                        :disabled="cartStore.loading"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <input
                        type="number"
                        :value="item.quantity"
                        @change="handleQuantityInput($event, item)"
                        min="1"
                        :max="item.total_stock"
                        class="qty-input"
                        :disabled="cartStore.loading"
                        aria-label="Количество"
                    />
                    <button
                        @click="cartStore.incrementQuantity(item.id)"
                        class="qty-btn"
                        :disabled="item.quantity >= item.total_stock || cartStore.loading"
                        aria-label="Увеличить количество"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>

                  <div class="item-price">
                    <div v-if="item.old_price" class="old-price">{{ formatPrice(item.old_price * item.quantity) }} ₽</div>
                    <div class="current-price">{{ formatPrice(item.price * item.quantity) }} ₽</div>
                    <div v-if="item.quantity > 1" class="unit-price">{{ formatPrice(item.price) }} ₽ × {{ item.quantity }}</div>
                  </div>
                </div>
              </div>
            </article>
          </TransitionGroup>

          <button
              v-if="orderedItems.length"
              @click="confirmClear"
              class="btn-clear-all"
              :disabled="cartStore.loading"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M3 6h18"/>
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Очистить корзину
          </button>
        </div>

        <!-- Правая колонка -->
        <aside class="cart-summary">
          <div class="summary-card">
            <h2 class="summary-title">Ваш заказ</h2>

            <!-- Промокод -->
            <div class="promo-block">
              <div class="promo-input-wrap">
                <input
                    v-model="promoCode"
                    type="text"
                    placeholder="Промокод"
                    class="promo-input"
                    :disabled="promoApplied"
                />
                <button
                    v-if="!promoApplied"
                    @click="applyPromo"
                    class="promo-btn"
                    :disabled="!promoCode.trim()"
                >
                  Применить
                </button>
                <button v-else @click="resetPromo" class="promo-btn promo-btn-reset" aria-label="Сбросить промокод">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <p v-if="promoError" class="promo-error">{{ promoError }}</p>
              <p v-if="promoApplied" class="promo-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Промокод применён — скидка 10%
              </p>
            </div>

            <div class="summary-rows">
              <div class="summary-row">
                <span>Товары, {{ totalQty }} шт.</span>
                <span>{{ formatPrice(cartStore.total) }} ₽</span>
              </div>
              <div v-if="discount > 0" class="summary-row discount-row">
                <span>Скидка по промокоду</span>
                <span>−{{ formatPrice(discount) }} ₽</span>
              </div>
              <div class="summary-row">
                <span>Доставка</span>
                <span class="free-tag">Бесплатно</span>
              </div>
            </div>

            <div class="summary-divider"/>

            <div class="summary-total">
              <span>Итого</span>
              <span class="total-amount">{{ formatPrice(finalTotal) }} ₽</span>
            </div>

            <NuxtLink ref="summaryCheckoutRef" to="/checkout" class="btn-checkout">
              Оформить заказ
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </NuxtLink>
          </div>

          <!-- Преимущества -->
          <div class="perks">
            <div class="perk">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"/>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <div>
                <div class="perk-title">Быстрая доставка</div>
                <div class="perk-text">По Москве — от 1 дня</div>
              </div>
            </div>
            <div class="perk">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              <div>
                <div class="perk-title">Возврат 14 дней</div>
                <div class="perk-text">Без лишних вопросов</div>
              </div>
            </div>
            <div class="perk">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <div>
                <div class="perk-title">Гарантия качества</div>
                <div class="perk-text">Только оригинальный товар</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <!-- Фиксированная кнопка оформления для мобильной версии (над tab-bar) -->
      <NuxtLink
          v-if="!cartStore.isEmpty && cartStore.initialized"
          to="/checkout"
          class="mobile-checkout-fab"
          :class="{ 'is-hidden': isSummaryCheckoutVisible }"
      >
        <span class="mcf-label">Оформить заказ</span>
        <span class="mcf-amount">{{ formatPrice(finalTotal) }} ₽</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'
import type { CartItem } from '~/types/cart'

const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const promoCode = ref('')
const promoApplied = ref(false)
const promoError = ref('')

const summaryCheckoutRef = ref<any>(null)
const isSummaryCheckoutVisible = ref(false)
let checkoutObserver: IntersectionObserver | null = null

onMounted(() => {
  if (!wishlistStore.initialized) {
    wishlistStore.fetchWishlist()
  }
})

watch(summaryCheckoutRef, (val) => {
  checkoutObserver?.disconnect()
  checkoutObserver = null
  isSummaryCheckoutVisible.value = false

  const el: Element | null = val?.$el ?? val ?? null
  if (!(el instanceof Element) || typeof IntersectionObserver === 'undefined') return

  checkoutObserver = new IntersectionObserver(
      (entries) => {
        isSummaryCheckoutVisible.value = entries[0]?.isIntersecting ?? false
      },
      { threshold: 0.15 }
  )
  checkoutObserver.observe(el)
})

onBeforeUnmount(() => {
  checkoutObserver?.disconnect()
  checkoutObserver = null
})

const itemOrder = ref<(string | number)[]>([])

watch(
    () => cartStore.items,
    (newItems) => {
      newItems.forEach((item) => {
        if (!itemOrder.value.includes(item.id)) {
          itemOrder.value.push(item.id)
        }
      })
      const currentIds = new Set(newItems.map((i) => i.id))
      itemOrder.value = itemOrder.value.filter((id) => currentIds.has(id))
    },
    { immediate: true, deep: false }
)

const orderedItems = computed(() => {
  return [...cartStore.items].sort((a, b) => {
    return itemOrder.value.indexOf(a.id) - itemOrder.value.indexOf(b.id)
  })
})

const totalQty = computed(() => cartStore.count)

const discount = computed(() => {
  if (!promoApplied.value) return 0
  return Math.round(cartStore.total * 0.1)
})

const finalTotal = computed(() => Math.max(0, cartStore.total - discount.value))

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function pluralizeItems(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'товар'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'товара'
  return 'товаров'
}

function getProductLink(item: CartItem): string {
  if (item.size) {
    return `/products/${item.slug}?size=${item.size}`
  }
  return `/products/${item.slug}`
}

function handleQuantityInput(event: Event, item: CartItem) {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value)
  if (!isNaN(value) && value > 0 && value <= item.total_stock) {
    cartStore.updateQuantity(item.id, value)
  } else {
    target.value = item.quantity.toString()
  }
}

function applyPromo() {
  const code = promoCode.value.trim().toUpperCase()
  if (code === 'RAGE10' || code === 'WELCOME') {
    promoApplied.value = true
    promoError.value = ''
  } else {
    promoError.value = 'Промокод не найден или истёк'
    promoApplied.value = false
  }
}

function resetPromo() {
  promoApplied.value = false
  promoCode.value = ''
  promoError.value = ''
}

function confirmClear() {
  if (confirm('Удалить все товары из корзины?')) {
    cartStore.clearCart()
  }
}

function hasSize(item: CartItem): boolean {
  const s = item.size
  return s !== null && s !== undefined && String(s).trim() !== ''
}

function isInWishlist(item: CartItem): boolean {
  return wishlistStore.isInWishlist(item.product_id)
}

function toggleWishlist(item: CartItem) {
  wishlistStore.toggleWishlist({
    id: item.product_id,
    title: item.title,
    slug: item.slug,
    price: item.price,
    old_price: item.old_price,
    images: item.image ? [{ url: item.image }] : [],
    parent_id: item.parent_id,
    total_stock: item.total_stock,
  })
}

useHead({
  title: 'Корзина',
})
</script>

<style scoped>
.cart-page {
  min-height: calc(100vh - 200px);
  padding: 32px 20px 40px;
  background: #fff;
}

.cart-container {
  max-width: 1240px;
  margin: 0 auto;
}

/* ===== Breadcrumbs ===== */
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 13px;
  color: #8B8B8B;
}

.crumb {
  color: #8B8B8B;
  text-decoration: none;
  transition: color 0.2s;
}

.crumb:hover {
  color: #1A1A1A;
}

.crumb-current {
  color: #1A1A1A;
  font-weight: 500;
}

.crumb-sep {
  color: #C6C6C6;
  flex-shrink: 0;
}

/* ===== Header ===== */
.cart-header {
  margin-bottom: 28px;
}

.cart-title {
  font-size: 36px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
  letter-spacing: -0.02em;
  display: flex;
  align-items: baseline;
  gap: 14px;
  flex-wrap: wrap;
}

.cart-count {
  font-size: 16px;
  font-weight: 500;
  color: #8B8B8B;
}

/* ===== Empty state ===== */
.empty-cart {
  background: #fff;
  border-radius: 20px;
  padding: 80px 24px;
  text-align: center;
  border: 1px solid #ECEAE5;
}

.empty-illustration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEF2F3 0%, #FFE4E6 100%);
  color: #C1121C;
  margin-bottom: 24px;
}

.empty-cart h2 {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #1A1A1A;
}

.empty-cart p {
  font-size: 16px;
  color: #6B6B6B;
  margin: 0 auto 28px;
  max-width: 420px;
  line-height: 1.5;
}

.empty-actions {
  display: inline-flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background: #C1121C;
  color: #fff;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(193, 18, 28, 0.25);
}

.btn-primary:hover {
  background: #A50F18;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(193, 18, 28, 0.32);
}

.btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background: transparent;
  color: #1A1A1A;
  text-decoration: none;
  border: 1px solid #D9D6CF;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: #fff;
  border-color: #1A1A1A;
}

/* ===== Layout ===== */
.cart-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 28px;
  align-items: start;
}

.cart-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

/* ===== Cart items ===== */
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cart-item {
  background: #fff;
  border: 1px solid #ECEAE5;
  border-radius: 14px;
  padding: 16px;
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 18px;
  align-items: stretch;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}

.cart-item:hover {
  border-color: #D9D6CF;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.cart-item.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.item-image {
  display: block;
  width: 110px;
  height: 140px;
  border-radius: 10px;
  overflow: hidden;
  background: #EDEDEF;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.item-image:hover img {
  transform: scale(1.04);
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #BFBCB4;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.item-info-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  min-height: 20px;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A1A;
  text-decoration: none;
  line-height: 1.35;
  transition: color 0.2s;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-title:hover {
  color: #C1121C;
}

.item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #EDEDEF;
  border-radius: 999px;
  font-size: 12px;
  color: #4A4A4A;
  font-weight: 500;
}

.meta-chip strong {
  color: #1A1A1A;
  font-weight: 700;
}

.meta-chip .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.meta-chip.stock-ok {
  background: #ECFDF3;
  color: #15803D;
}

.meta-chip.stock-ok .dot {
  background: #22C55E;
}

.meta-chip.stock-out {
  background: #FEF2F3;
  color: #C1121C;
}

.meta-chip.stock-out .dot {
  background: #C1121C;
}

.item-bottom {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  padding-top: 8px;
}

/* Quantity stepper */
.item-quantity {
  display: inline-flex;
  align-items: center;
  background: #EDEDEF;
  border: 1px solid #ECEAE5;
  border-radius: 10px;
  padding: 2px;
}

.item-quantity.disabled {
  opacity: 0.6;
}

.qty-btn {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  color: #4A4A4A;
  border-radius: 8px;
  transition: all 0.15s;
}

.qty-btn:hover:not(:disabled) {
  background: #fff;
  color: #1A1A1A;
}

.qty-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.qty-input {
  width: 38px;
  height: 34px;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: #1A1A1A;
  -moz-appearance: textfield;
}

.qty-input:focus {
  outline: none;
}

.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  text-align: right;
}

.current-price {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A1A;
  letter-spacing: -0.01em;
}

.old-price {
  font-size: 13px;
  color: #ABABAB;
  text-decoration: line-through;
}

.unit-price {
  font-size: 12px;
  color: #8B8B8B;
}

/* Item actions (wishlist / remove) — в правом верхнем углу карточки */
.item-actions {
  display: inline-flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
  color: #8B8B8B;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wish-btn:hover:not(:disabled) {
  background: #FEF2F3;
  color: #C1121C;
  border-color: #FAD0D3;
}

.wish-btn.active {
  color: #C1121C;
  background: #FEF2F3;
}

.remove-btn:hover:not(:disabled) {
  background: #FEF2F3;
  color: #C1121C;
  border-color: #FAD0D3;
}

/* Clear all */
.btn-clear-all {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: #8B8B8B;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  margin-top: 4px;
}

.btn-clear-all:hover:not(:disabled) {
  color: #C1121C;
  background: #FEF2F3;
}

.btn-clear-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ===== Summary ===== */
.cart-summary {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-card {
  background: #fff;
  border: 1px solid #ECEAE5;
  border-radius: 16px;
  padding: 24px;
}

.summary-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0 0 20px;
  color: #1A1A1A;
  letter-spacing: -0.01em;
}

/* Promo */
.promo-block {
  margin-bottom: 20px;
}

.promo-input-wrap {
  display: flex;
  gap: 8px;
}

.promo-input {
  flex: 1;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #ECEAE5;
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A1A;
  background: #F7F6F2;
  transition: all 0.2s;
}

.promo-input:focus {
  outline: none;
  border-color: #1A1A1A;
  background: #fff;
}

.promo-input:disabled {
  cursor: not-allowed;
}

.promo-btn {
  padding: 0 16px;
  background: #1A1A1A;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
}

.promo-btn:hover:not(:disabled) {
  background: #333;
}

.promo-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.promo-btn-reset {
  background: transparent;
  color: #8B8B8B;
  padding: 0 12px;
  border: 1px solid #ECEAE5;
}

.promo-btn-reset:hover:not(:disabled) {
  background: #FEF2F3;
  color: #C1121C;
  border-color: #FAD0D3;
}

.promo-error {
  margin: 8px 0 0;
  font-size: 12px;
  color: #C1121C;
}

.promo-success {
  margin: 8px 0 0;
  font-size: 12px;
  color: #15803D;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* Summary rows */
.summary-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #4A4A4A;
}

.summary-row span:last-child {
  color: #1A1A1A;
  font-weight: 500;
}

.discount-row span:last-child {
  color: #C1121C;
  font-weight: 600;
}

.free-tag {
  color: #15803D !important;
  font-weight: 600 !important;
}

.summary-divider {
  height: 1px;
  background: #ECEAE5;
  margin: 18px 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 22px;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
}

.total-amount {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.btn-checkout {
  width: 100%;
  padding: 16px;
  background: #C1121C;
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 14px rgba(193, 18, 28, 0.25);
}

.btn-checkout:hover {
  background: #A50F18;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(193, 18, 28, 0.32);
}

.btn-checkout svg {
  transition: transform 0.2s;
}

.btn-checkout:hover svg {
  transform: translateX(3px);
}

/* Perks */
.perks {
  background: #fff;
  border: 1px solid #ECEAE5;
  border-radius: 16px;
  padding: 6px 20px;
}

.perk {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid #F4F2EC;
}

.perk:last-child {
  border-bottom: none;
}

.perk svg {
  color: #C1121C;
  flex-shrink: 0;
}

.perk-title {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 2px;
}

.perk-text {
  font-size: 12px;
  color: #8B8B8B;
}

/* ===== Mobile floating checkout button ===== */
.mobile-checkout-fab {
  display: none;
}

/* ===== Skeletons ===== */
.skeleton {
  background: linear-gradient(90deg, #F1EFEA 0%, #F7F6F2 50%, #F1EFEA 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-item {
  grid-template-columns: 110px 1fr;
}

.skeleton-img {
  width: 110px;
  height: 140px;
  border-radius: 10px;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
}

.skeleton-line {
  height: 14px;
}

.w-25 { width: 25%; }
.w-40 { width: 40%; }
.w-50 { width: 50%; }
.w-70 { width: 70%; }
.w-100 { width: 100%; }

/* ===== Transitions ===== */
.item-enter-active,
.item-leave-active {
  transition: all 0.3s ease;
}

.item-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.item-leave-active {
  position: absolute;
  width: 100%;
}

/* ===== Адаптив ===== */
@media (max-width: 1024px) {
  .cart-content {
    grid-template-columns: 1fr;
  }

  .cart-summary {
    position: static;
  }

  .cart-title {
    font-size: 30px;
  }
}

@media (max-width: 640px) {
  .cart-page {
    /* отступ снизу под глобальный mobile-tab-bar + плавающую кнопку checkout */
    padding: 16px 12px calc(170px + env(safe-area-inset-bottom));
  }

  .cart-title {
    font-size: 24px;
  }

  .cart-count {
    font-size: 13px;
  }

  .breadcrumbs {
    font-size: 12px;
    margin-bottom: 12px;
  }

  .cart-header {
    margin-bottom: 18px;
  }

  .empty-cart {
    padding: 56px 20px;
    border-radius: 16px;
  }

  .empty-illustration {
    width: 120px;
    height: 120px;
  }

  .empty-illustration svg {
    width: 90px;
    height: 90px;
  }

  .empty-cart h2 {
    font-size: 22px;
  }

  .empty-cart p {
    font-size: 14px;
  }

  .empty-actions {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .empty-actions .btn-primary,
  .empty-actions .btn-ghost {
    width: 100%;
  }

  .cart-main {
    gap: 12px;
  }

  /* Карточка товара — компактная одноколоночная композиция */
  .cart-item {
    grid-template-columns: 84px 1fr;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
  }

  .item-image {
    width: 84px;
    height: 108px;
    border-radius: 10px;
  }

  .item-info {
    gap: 6px;
  }

  .item-title {
    font-size: 14px;
    line-height: 1.3;
    padding-right: 4px;
  }

  .item-meta {
    gap: 5px;
  }

  .meta-chip {
    padding: 3px 8px;
    font-size: 11px;
  }

  /* Нижний ряд — степпер и цена в строку, выровнены */
  .item-bottom {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding-top: 6px;
    margin-top: 2px;
  }

  .item-quantity {
    padding: 1px;
  }

  .qty-btn {
    width: 30px;
    height: 30px;
  }

  .qty-input {
    width: 32px;
    height: 30px;
    font-size: 14px;
  }

  .item-price {
    align-items: flex-end;
    text-align: right;
  }

  .current-price {
    font-size: 16px;
  }

  .unit-price {
    font-size: 11px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
  }

  .summary-card {
    padding: 18px;
    border-radius: 14px;
  }

  .summary-title {
    font-size: 18px;
    margin-bottom: 16px;
  }

  .total-amount {
    font-size: 22px;
  }

  .btn-checkout {
    padding: 14px;
    font-size: 14px;
  }

  .perks {
    border-radius: 14px;
    padding: 4px 16px;
  }

  .perk {
    padding: 14px 0;
  }

  /* Плавающая кнопка над таб-баром (taб-бар ~90px высоты + safe-area) */
  .mobile-checkout-fab {
    display: flex;
    position: fixed;
    left: 12px;
    right: 12px;
    bottom: calc(96px + env(safe-area-inset-bottom));
    z-index: 999;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 20px;
    background: #C1121C;
    color: #fff;
    text-decoration: none;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
    box-shadow: 0 10px 28px rgba(193, 18, 28, 0.32), 0 2px 6px rgba(0, 0, 0, 0.08);
    transition: opacity 0.25s ease, transform 0.25s ease, background 0.2s;
    will-change: opacity, transform;
  }

  .mobile-checkout-fab.is-hidden {
    opacity: 0;
    transform: translateY(120%);
    pointer-events: none;
  }

  .mobile-checkout-fab:active {
    background: #A50F18;
  }

  .mcf-amount {
    font-size: 16px;
    font-weight: 700;
    white-space: nowrap;
  }
}

@media (max-width: 380px) {
  .cart-item {
    grid-template-columns: 76px 1fr;
    gap: 10px;
  }

  .item-image {
    width: 76px;
    height: 100px;
  }

  .item-info-top {
    gap: 6px;
  }
}
</style>