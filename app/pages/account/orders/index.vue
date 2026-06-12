<script setup lang="ts">
import {
    DELIVERY_METHOD_LABELS,
    ORDER_STATUS_LABELS,
    type Order,
} from '~/types/order'

definePageMeta({ middleware: 'auth' })

const orderStore = useOrderStore()

onMounted(() => {
    orderStore.fetchAll()
})

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatPrice(n: number): string {
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

function statusBadge(o: Order): string {
    return ORDER_STATUS_LABELS[o.status]
}

useHead({ title: 'Мои заказы' })
</script>

<template>
    <AccountMobileHeader title="Заказы" :back="true" />
    <div class="account-wrap">
        <AccountSidebar />

        <main class="account-main">
            <div class="page-head">
                <h2 class="section-title">Мои заказы</h2>
            </div>

            <template v-if="orderStore.loading">
                <div class="orders-list">
                    <div v-for="n in 3" :key="n" class="order-card order-skeleton">
                        <div class="skel skel-title" />
                        <div class="skel skel-line" />
                        <div class="skel skel-line skel-line--short" />
                    </div>
                </div>
            </template>

            <template v-else>
                <div v-if="!orderStore.orders.length" class="empty-state">
                    У вас пока нет заказов.
                    <NuxtLink to="/" class="text-link">Перейти к покупкам</NuxtLink>
                </div>

                <div v-else class="orders-list">
                    <NuxtLink
                        v-for="o in orderStore.orders"
                        :key="o.id"
                        :to="`/account/orders/${o.id}`"
                        class="order-card"
                    >
                        <div class="order-head">
                            <span class="order-number">№ {{ o.number }}</span>
                            <span class="order-date">{{ formatDate(o.created_at) }}</span>
                        </div>

                        <div class="order-meta">
                            <span class="badge" :class="`badge-${o.status}`">{{ statusBadge(o) }}</span>
                            <span class="muted">{{ DELIVERY_METHOD_LABELS[o.delivery_method] }}</span>
                        </div>

                        <div class="order-body">
                            <div class="items-stack">
                                <img
                                    v-for="(it, idx) in o.items.slice(0, 4)"
                                    :key="it.id"
                                    :src="it.product_image || ''"
                                    :alt="it.product_title"
                                    class="item-thumb"
                                    :style="{ zIndex: 10 - idx }"
                                />
                                <span v-if="o.items.length > 4" class="items-more">+{{ o.items.length - 4 }}</span>
                            </div>
                            <div class="order-total">
                                <div class="muted small">Итого</div>
                                <div class="price">{{ formatPrice(o.total) }} ₽</div>
                            </div>
                        </div>
                    </NuxtLink>
                </div>
            </template>
        </main>
    </div>
</template>

<style scoped>
.account-wrap {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 0;
    min-height: calc(100vh - 120px);
    max-width: 1200px;
    margin: 0 auto;
    padding: 60px 40px;
}
.account-main { padding: 0 60px 0 0; }

.page-head { margin-bottom: 28px; }
.section-title {
    font-size: 13px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: #aaa; margin: 0;
}

.empty-state {
    font-size: 14px; color: #888;
    padding: 40px 0;
    display: flex; flex-direction: column; gap: 12px;
}
.text-link { color: #111; text-decoration: underline; text-underline-offset: 3px; }

.orders-list { display: flex; flex-direction: column; gap: 14px; }

.order-card {
    display: flex; flex-direction: column; gap: 14px;
    border: 1px solid #f0f0f0; border-radius: 10px;
    padding: 20px 24px; text-decoration: none; color: inherit;
    transition: border-color 0.15s, transform 0.1s;
}
.order-card:hover { border-color: #ccc; }

.order-head {
    display: flex; justify-content: space-between; align-items: baseline;
    gap: 12px;
}
.order-number { font-size: 15px; font-weight: 700; color: #111; }
.order-date { font-size: 12px; color: #999; }

.order-meta {
    display: flex; align-items: center; gap: 12px;
    font-size: 13px;
}
.muted { color: #888; }
.muted.small { font-size: 12px; }

.badge {
    display: inline-block; padding: 3px 10px;
    border-radius: 999px; font-size: 11px; font-weight: 600;
    letter-spacing: 0.04em;
}
.badge-new        { background: #eaf3ff; color: #1f6fdb; }
.badge-confirmed  { background: #e9f7ec; color: #1f9d4d; }
.badge-assembling { background: #fff3e0; color: #c97b00; }
.badge-packed     { background: #d7f0ee; color: #0d7065; }
.badge-shipped    { background: #ede7f6; color: #5e35b1; }
.badge-delivered  { background: #f0f0f0; color: #555; }
.badge-cancelled  { background: #fdecec; color: #c0392b; }

.order-body {
    display: flex; justify-content: space-between; align-items: center;
    gap: 12px;
}
.items-stack { display: flex; align-items: center; }
.item-thumb {
    width: 44px; height: 56px; object-fit: cover;
    border-radius: 6px; border: 2px solid #fff;
    background: #f4f4f4; margin-left: -10px; box-shadow: 0 0 0 1px #eee;
}
.item-thumb:first-child { margin-left: 0; }
.items-more {
    margin-left: 8px; font-size: 12px; color: #888; font-weight: 600;
}
.order-total { text-align: right; }
.price { font-size: 17px; font-weight: 700; color: #111; }

/* Скелетон */
@keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
}
.skel {
    border-radius: 4px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
    background-size: 800px 100%;
    animation: shimmer 1.4s infinite;
}
.order-skeleton { pointer-events: none; }
.skel-title       { height: 14px; width: 100px; margin-bottom: 14px; }
.skel-line        { height: 12px; width: 100%; margin-bottom: 10px; }
.skel-line--short { width: 55%; }

@media (max-width: 1024px) {
    .account-wrap { padding: 40px 24px; }
    .account-main { padding: 0; }
}
@media (max-width: 768px) {
    .account-wrap  { grid-template-columns: 1fr; padding: 16px 16px 48px; }
    .section-title { display: none; }
    .order-card    { padding: 16px; border-radius: 12px; }
}
</style>