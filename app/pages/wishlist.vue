<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useWishlistStore } from '~/stores/wishlist'
import { useCartStore } from '~/stores/cart'
import type { WishlistItem } from '~/types/wishlist'

definePageMeta({ middleware: 'auth' })

const wishlistStore = useWishlistStore()
const cartStore = useCartStore()

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
    const indexA = itemOrder.value.indexOf(a.id)
    const indexB = itemOrder.value.indexOf(b.id)
    return indexA - indexB
  })
})

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
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

useHead({ title: 'Избранное' })
</script>

<template>
  <AccountMobileHeader title="Избранное" :back="true" />
  <div class="account-wrap">
    <AccountSidebar />

    <main class="wishlist-main">
      <h2 class="section-title">Избранное</h2>

      <!-- Пусто -->
      <div v-if="wishlistStore.isEmpty" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <p class="empty-text">В избранном пока ничего нет</p>
        <NuxtLink to="/" class="empty-link">Перейти к покупкам</NuxtLink>
      </div>

      <!-- Список -->
      <template v-else>
        <div class="wishlist-items">
          <div v-for="item in orderedItems" :key="item.id" class="wishlist-item">
            <NuxtLink :to="getProductLink(item)" class="item-image">
              <img v-if="item.image" :src="item.image" :alt="item.title" />
              <div v-else class="no-image">Нет фото</div>
            </NuxtLink>

            <div class="item-info">
              <NuxtLink :to="getProductLink(item)" class="item-title">{{ item.title }}</NuxtLink>
              <div v-if="item.size" class="item-meta">Размер: {{ item.size }}</div>
              <div class="item-stock">
                <span v-if="item.total_stock > 0 && item.is_active" class="in-stock">В наличии</span>
                <span v-else class="out-of-stock">Нет в наличии</span>
              </div>
            </div>

            <div class="item-price-col">
              <span class="current-price">{{ formatPrice(item.price) }} ₽</span>
              <span v-if="item.old_price" class="old-price">{{ formatPrice(item.old_price) }} ₽</span>
            </div>

            <div class="item-actions">
              <!-- Счётчик если уже в корзине -->
              <div v-if="getCartItem(item)" class="qty-control">
                <button
                    class="qty-btn"
                    :disabled="cartStore.loading"
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
                    @click="increment(item)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
              </div>

              <!-- Кнопка добавить -->
              <button
                  v-else
                  class="btn-cart"
                  :disabled="item.total_stock < 1 || !item.is_active || cartStore.loading"
                  @click="addToCart(item)"
              >
                В корзину
              </button>

              <button
                  class="btn-remove"
                  aria-label="Удалить"
                  :disabled="wishlistStore.loading"
                  @click="wishlistStore.removeFromWishlist(item.id)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="wishlist-footer">
          <span class="items-count">{{ wishlistStore.count }} {{ wishlistStore.count === 1 ? 'товар' : wishlistStore.count < 5 ? 'товара' : 'товаров' }}</span>
          <button class="btn-clear" @click="wishlistStore.clearWishlist()">Очистить всё</button>
        </div>
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

/* ── Main ────────────────────────────────────────────────────────── */
.wishlist-main {
  min-width: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #aaa;
  margin-bottom: 28px;
}

/* ── Empty ───────────────────────────────────────────────────────── */
.empty-state {
  padding: 60px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  color: #ccc;
}

.empty-text {
  font-size: 15px;
  color: #999;
}

.empty-link {
  font-size: 13px;
  color: #111;
  text-decoration: underline;
  text-underline-offset: 3px;
  margin-top: 4px;
}

/* ── Items ───────────────────────────────────────────────────────── */
.wishlist-items {
  display: flex;
  flex-direction: column;
}

.wishlist-item {
  display: grid;
  grid-template-columns: 80px 1fr auto auto;
  gap: 20px;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #f0f0f0;
}

.item-image {
  width: 80px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  font-size: 11px;
  color: #bbb;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #111;
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.15s;
}
.item-title:hover { color: #555; }

.item-meta {
  font-size: 12px;
  color: #999;
}

.item-stock { font-size: 12px; }
.in-stock  { color: #15803d; }
.out-of-stock { color: #dc2626; }

.item-price-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}

.current-price {
  font-size: 16px;
  font-weight: 700;
  color: #111;
  white-space: nowrap;
}

.old-price {
  font-size: 13px;
  color: #bbb;
  text-decoration: line-through;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cart {
  padding: 9px 18px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.btn-cart:hover:not(:disabled) { opacity: 0.8; }
.btn-cart:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-remove {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  color: #bbb;
  transition: all 0.15s;
  flex-shrink: 0;
}
.btn-remove:hover { border-color: #e53935; color: #e53935; }

/* ── Quantity control ────────────────────────────────────────────── */
.qty-control {
  display: flex;
  align-items: center;
  gap: 0;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  overflow: hidden;
}

.qty-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #111;
  transition: background 0.15s;
  flex-shrink: 0;
}
.qty-btn:hover:not(:disabled) { background: #f5f5f5; }
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.qty-value {
  min-width: 32px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: #111;
  border-left: 1px solid #e0e0e0;
  border-right: 1px solid #e0e0e0;
  height: 36px;
  line-height: 36px;
}

/* ── Footer ──────────────────────────────────────────────────────── */
.wishlist-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 20px;
}

.items-count {
  font-size: 13px;
  color: #aaa;
}

.btn-clear {
  font-size: 13px;
  color: #bbb;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s;
}
.btn-clear:hover { color: #e53935; }

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
    padding: 16px 20px 40px;
  }
  .section-title { display: none; }
  .wishlist-item {
    grid-template-columns: 70px 1fr;
    gap: 12px;
  }
  .item-price-col { display: none; }
  .item-actions { grid-column: 2; }
}
</style>