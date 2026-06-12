<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useWishlistStore } from '~/stores/wishlist'
import { useCartStore } from '~/stores/cart'
import type { WishlistItem } from '~/types/wishlist'

definePageMeta({ middleware: 'auth' })

const wishlistStore = useWishlistStore()
const cartStore = useCartStore()

const movingAll = ref(false)

onMounted(() => {
  if (!wishlistStore.initialized) wishlistStore.fetchWishlist()
})

const itemOrder = ref<number[]>([])

watch(
    () => wishlistStore.items,
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
  return [...wishlistStore.items].sort((a, b) => {
    return itemOrder.value.indexOf(a.id) - itemOrder.value.indexOf(b.id)
  })
})

const availableItems = computed(() =>
    orderedItems.value.filter(i => i.is_active && i.total_stock > 0 && !getCartItem(i))
)

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function pluralizeItems(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'товар'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'товара'
  return 'товаров'
}

function getProductLink(item: WishlistItem): string {
  return item.size ? `/products/${item.slug}?size=${item.size}` : `/products/${item.slug}`
}

function getCartItem(item: WishlistItem) {
  return cartStore.items.find(i => i.product_id === item.product_id) ?? null
}

async function addToCart(item: WishlistItem) {
  await cartStore.addToCart({
    id: item.product_id,
    title: item.title,
    slug: item.slug,
    price: item.price,
    old_price: item.old_price,
    images: item.image ? [{ url: item.image }] : [],
    parent_id: item.parent_id,
    total_stock: item.total_stock,
  }, 1)
}

async function increment(item: WishlistItem) {
  const cartItem = getCartItem(item)
  if (cartItem) await cartStore.incrementQuantity(cartItem.id)
}

async function decrement(item: WishlistItem) {
  const cartItem = getCartItem(item)
  if (cartItem) await cartStore.decrementQuantity(cartItem.id)
}

async function moveAllToCart() {
  if (!availableItems.value.length) return
  movingAll.value = true
  try {
    for (const it of availableItems.value) {
      // eslint-disable-next-line no-await-in-loop
      await addToCart(it)
    }
  } finally {
    movingAll.value = false
  }
}

function confirmClear() {
  if (confirm('Удалить все товары из избранного?')) {
    wishlistStore.clearWishlist()
  }
}

useHead({ title: 'Избранное' })
</script>

<template>
  <AccountMobileHeader title="Избранное" :back="true" />
  <div class="account-wrap">
    <AccountSidebar />

    <main class="wishlist-main">
      <header class="wl-header">
        <h1 class="wl-title">
          Избранное
          <span v-if="!wishlistStore.isEmpty" class="wl-count">
            {{ wishlistStore.count }} {{ pluralizeItems(wishlistStore.count) }}
          </span>
        </h1>

        <button
            v-if="availableItems.length > 1"
            class="btn-move-all"
            :disabled="movingAll || cartStore.loading"
            @click="moveAllToCart"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          {{ movingAll ? 'Добавляем…' : `Всё в корзину (${availableItems.length})` }}
        </button>
      </header>

      <!-- Скелетон при первой загрузке -->
      <div v-if="!wishlistStore.initialized" class="wl-items">
        <div v-for="n in 3" :key="n" class="wl-item skeleton-item">
          <div class="skeleton skeleton-img"/>
          <div class="skeleton-lines">
            <div class="skeleton skeleton-line w-70"/>
            <div class="skeleton skeleton-line w-40"/>
            <div class="skeleton skeleton-line w-25"/>
          </div>
        </div>
      </div>

      <!-- Пусто -->
      <div v-else-if="wishlistStore.isEmpty" class="empty-state">
        <div class="empty-illustration">
          <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </div>
        <h2>В избранном пока пусто</h2>
        <p>Сохраняйте товары, чтобы вернуться к ним позже или быстро переложить в корзину.</p>
        <NuxtLink to="/" class="btn-primary">К покупкам</NuxtLink>
      </div>

      <!-- Список -->
      <template v-else>
        <TransitionGroup name="item" tag="div" class="wl-items">
          <article v-for="item in orderedItems" :key="item.id" class="wl-item">
            <NuxtLink :to="getProductLink(item)" class="item-image">
              <img v-if="item.image" :src="item.image" :alt="item.title" loading="lazy" />
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
                <NuxtLink :to="getProductLink(item)" class="item-title">{{ item.title }}</NuxtLink>

                <button
                    class="icon-btn remove-btn"
                    aria-label="Удалить"
                    :disabled="wishlistStore.loading"
                    @click="wishlistStore.removeFromWishlist(item.id)"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M3 6h18"/>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>

              <div class="item-meta">
                <span v-if="item.size" class="meta-chip">Размер: <strong>{{ item.size }}</strong></span>
                <span v-if="item.total_stock > 0 && item.is_active" class="meta-chip stock-ok">
                  <span class="dot"/> В наличии
                </span>
                <span v-else class="meta-chip stock-out">
                  <span class="dot"/> Нет в наличии
                </span>
              </div>

              <div class="item-bottom">
                <div class="item-price">
                  <span v-if="item.old_price" class="old-price">{{ formatPrice(item.old_price) }} ₽</span>
                  <span class="current-price">{{ formatPrice(item.price) }} ₽</span>
                </div>

                <!-- Счётчик если уже в корзине -->
                <div v-if="getCartItem(item)" class="item-quantity" :class="{ disabled: cartStore.loading }">
                  <button
                      class="qty-btn"
                      :disabled="cartStore.loading"
                      aria-label="Уменьшить"
                      @click="decrement(item)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                  <span class="qty-value">{{ getCartItem(item)!.quantity }}</span>
                  <button
                      class="qty-btn"
                      :disabled="cartStore.loading || getCartItem(item)!.quantity >= item.total_stock"
                      aria-label="Увеличить"
                      @click="increment(item)"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>

                <button
                    v-else
                    class="btn-cart"
                    :disabled="item.total_stock < 1 || !item.is_active || cartStore.loading"
                    @click="addToCart(item)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"/>
                    <circle cx="20" cy="21" r="1"/>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                  </svg>
                  В корзину
                </button>
              </div>
            </div>
          </article>
        </TransitionGroup>

        <button class="btn-clear-all" @click="confirmClear">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 6h18"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          Очистить избранное
        </button>
      </template>
    </main>
  </div>
</template>

<style scoped>
.account-wrap {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: calc(100vh - 120px);
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 40px;
}

.wishlist-main { min-width: 0; }

/* ── Header ──────────────────────────────────────────────────────── */
.wl-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.wl-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #1A1A1A;
  letter-spacing: -0.02em;
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
}

.wl-count {
  font-size: 14px;
  font-weight: 500;
  color: #8B8B8B;
}

.btn-move-all {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #1A1A1A;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.btn-move-all:hover:not(:disabled) { background: #333; transform: translateY(-1px); }
.btn-move-all:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Empty state ─────────────────────────────────────────────────── */
.empty-state {
  background: #fff;
  border-radius: 20px;
  padding: 64px 24px;
  text-align: center;
  border: 1px solid #ECEAE5;
}

.empty-illustration {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEF2F3 0%, #FFE4E6 100%);
  color: #C1121C;
  margin-bottom: 20px;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 10px;
  color: #1A1A1A;
}

.empty-state p {
  font-size: 15px;
  color: #6B6B6B;
  margin: 0 auto 24px;
  max-width: 400px;
  line-height: 1.5;
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

/* ── Items ───────────────────────────────────────────────────────── */
.wl-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wl-item {
  background: #fff;
  border: 1px solid #ECEAE5;
  border-radius: 14px;
  padding: 16px;
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 18px;
  align-items: stretch;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.wl-item:hover {
  border-color: #D9D6CF;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
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
  width: 100%; height: 100%; object-fit: cover;
  transition: transform 0.3s;
}
.item-image:hover img { transform: scale(1.04); }

.no-image {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
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
.item-title:hover { color: #C1121C; }

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
.meta-chip strong { color: #1A1A1A; font-weight: 700; }
.meta-chip .dot { width: 6px; height: 6px; border-radius: 50%; }
.meta-chip.stock-ok { background: #ECFDF3; color: #15803D; }
.meta-chip.stock-ok .dot { background: #22C55E; }
.meta-chip.stock-out { background: #FEF2F3; color: #C1121C; }
.meta-chip.stock-out .dot { background: #C1121C; }

.item-bottom {
  margin-top: auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 6px;
}

.item-price {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
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

/* Кнопки */
.btn-cart {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: #C1121C;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  box-shadow: 0 4px 14px rgba(193, 18, 28, 0.2);
}
.btn-cart:hover:not(:disabled) {
  background: #A50F18;
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(193, 18, 28, 0.28);
}
.btn-cart:disabled {
  background: #DDD9D2;
  color: #fff;
  box-shadow: none;
  cursor: not-allowed;
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
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.remove-btn:hover:not(:disabled) {
  background: #FEF2F3;
  color: #C1121C;
  border-color: #FAD0D3;
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
.item-quantity.disabled { opacity: 0.6; }

.qty-btn {
  width: 32px;
  height: 32px;
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
.qty-btn:hover:not(:disabled) { background: #fff; color: #1A1A1A; }
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.qty-value {
  min-width: 32px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  color: #1A1A1A;
  padding: 0 6px;
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
  margin-top: 8px;
}
.btn-clear-all:hover { color: #C1121C; background: #FEF2F3; }

/* Skeleton */
.skeleton {
  background: linear-gradient(90deg, #F1EFEA 0%, #F7F6F2 50%, #F1EFEA 100%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;
  border-radius: 8px;
}
@keyframes skeleton-shimmer {
  0%   { background-position:  200% 0; }
  100% { background-position: -200% 0; }
}
.skeleton-item { grid-template-columns: 110px 1fr; }
.skeleton-img  { width: 110px; height: 140px; border-radius: 10px; }
.skeleton-lines {
  display: flex; flex-direction: column; gap: 10px; padding-top: 8px;
}
.skeleton-line { height: 14px; }
.w-25 { width: 25%; } .w-40 { width: 40%; } .w-70 { width: 70%; }

/* Transitions */
.item-enter-active, .item-leave-active { transition: all 0.3s ease; }
.item-enter-from   { opacity: 0; transform: translateY(-10px); }
.item-leave-to     { opacity: 0; transform: translateX(20px); }
.item-leave-active { position: absolute; width: 100%; }

/* ── Responsive ──────────────────────────────────────────────────── */
@media (max-width: 1024px) {
  .account-wrap {
    grid-template-columns: 180px 1fr;
    padding: 40px 24px;
  }
}

@media (max-width: 768px) {
  .account-wrap {
    grid-template-columns: 1fr;
    padding: 16px 16px 40px;
  }

  .wl-header { margin-bottom: 14px; }
  .wl-title { font-size: 22px; }
  .wl-count { font-size: 12px; }
  .btn-move-all { width: 100%; justify-content: center; padding: 12px 16px; }

  .empty-state { padding: 48px 20px; border-radius: 16px; }
  .empty-illustration { width: 110px; height: 110px; }
  .empty-illustration svg { width: 80px; height: 80px; }
  .empty-state h2 { font-size: 20px; }
  .empty-state p  { font-size: 14px; }
  .btn-primary    { width: 100%; }

  .wl-item {
    grid-template-columns: 84px 1fr;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
  }
  .item-image { width: 84px; height: 108px; border-radius: 10px; }
  .item-info  { gap: 8px; }
  .item-title { font-size: 14px; line-height: 1.3; padding-right: 4px; }
  .meta-chip  { padding: 3px 8px; font-size: 11px; }

  .item-bottom { gap: 8px; }
  .current-price { font-size: 15px; }
  .old-price { font-size: 12px; }

  .btn-cart {
    padding: 9px 14px;
    font-size: 12px;
    border-radius: 9px;
  }
  .qty-btn { width: 28px; height: 28px; }
  .qty-value { font-size: 14px; min-width: 24px; }
  .icon-btn { width: 32px; height: 32px; }

  .skeleton-item { grid-template-columns: 84px 1fr; }
  .skeleton-img  { width: 84px; height: 108px; }
}

@media (max-width: 380px) {
  .wl-item { grid-template-columns: 76px 1fr; gap: 10px; }
  .item-image { width: 76px; height: 100px; }
  .btn-cart span { display: none; }
}
</style>