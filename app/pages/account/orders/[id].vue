<script setup lang="ts">
import {
    DELIVERY_METHOD_LABELS,
    ORDER_STATUS_LABELS,
    PAYMENT_METHOD_LABELS,
    type Order,
    type OrderEvent,
    type OrderItem as OrderItemT,
} from '~/types/order'

definePageMeta({ middleware: 'auth' })

const route = useRoute()
const orderStore = useOrderStore()
const toast = useToastStore()

const order = ref<Order | null>(null)
const loading = ref(true)
const cancelling = ref(false)
const confirmCancel = ref(false)

async function load(silent = false) {
    if (!silent) loading.value = true
    try {
        const next = await orderStore.fetchOne(route.params.id as string)
        // Если появились новые события — мягко уведомим
        if (silent && order.value && (next.events?.length ?? 0) > (order.value.events?.length ?? 0)) {
            toast.success('Заказ обновлён')
        }
        order.value = next
    } catch (e) {
        if (!silent) console.error(e)
    } finally {
        if (!silent) loading.value = false
    }
}

// Тихая авто-проверка раз в 20 секунд, пока страница открыта
let pollTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
    pollTimer = setInterval(() => {
        if (!document.hidden && order.value && !['delivered', 'cancelled'].includes(order.value.status)) {
            load(true)
        }
    }, 20000)
})
onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer)
})

async function cancelOrder() {
    if (!order.value) return
    cancelling.value = true
    try {
        order.value = await orderStore.cancel(order.value.id)
        toast.success('Заказ отменён')
    } catch (e: any) {
        toast.error(e?.data?.message ?? 'Не удалось отменить')
    } finally {
        cancelling.value = false
        confirmCancel.value = false
    }
}

const canCancel = computed(() =>
    order.value && ['new', 'confirmed'].includes(order.value.status)
)

const deliveryDescription = computed(() => {
    if (!order.value) return ''
    const o = order.value
    switch (o.delivery_method) {
        case 'courier':
            return o.address_full ?? '—'
        case 'pickup': {
            const parts: string[] = []
            if (o.shop?.name) parts.push(o.shop.name + (o.shop.address ? ', ' + o.shop.address : ''))
            if (o.pickup_slot_at) parts.push('Время: ' + formatPickupSlot(o.pickup_slot_at))
            return parts.length ? parts.join(' · ') : '—'
        }
        case 'cdek':
            return [o.cdek_pvz_code ? `ПВЗ: ${o.cdek_pvz_code}` : null, o.address_full]
                .filter(Boolean).join(' · ')
        case 'russian_post':
            return [o.russian_post_index ? `Индекс: ${o.russian_post_index}` : null, o.address_full]
                .filter(Boolean).join(' · ')
    }
})

function formatDate(iso: string | null): string {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatPrice(n: number | null | undefined): string {
    return (n ?? 0).toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

function formatPickupSlot(iso: string): string {
    const d = new Date(iso)
    const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const a = String(d.getHours()).padStart(2, '0')
    const b = String(d.getHours() + 1).padStart(2, '0')
    return `${date}, ${a}:00 – ${b}:00`
}

// ── Трек-номер: ссылка на сайт перевозчика ──────────────────────
function trackingUrl(o: Order | null): string | null {
    if (!o?.tracking_number) return null
    const code = encodeURIComponent(o.tracking_number)
    switch (o.delivery_method) {
        case 'cdek':
            return `https://www.cdek.ru/ru/tracking?order_id=${code}`
        case 'russian_post':
            return `https://www.pochta.ru/tracking#${code}`
        default:
            return null
    }
}

function carrierLabel(o: Order | null): string {
    if (!o) return ''
    return o.delivery_method === 'cdek' ? 'СДЭК'
        : o.delivery_method === 'russian_post' ? 'Почта России'
        : 'Курьер'
}

// Copy to clipboard
const copiedNumber = ref(false)
async function copyOrderNumber() {
    if (!order.value) return
    try {
        await navigator.clipboard.writeText(order.value.number)
        copiedNumber.value = true
        setTimeout(() => { copiedNumber.value = false }, 1500)
    } catch {
        toast.error('Не удалось скопировать')
    }
}

/**
 * Изменения позиции, какими их видит клиент: разница начального состояния
 * заказа и текущего. Восстановления/удаления внутри — внутренняя кухня
 * и не показываются, только нетто-эффект.
 */
function itemChange(it: OrderItemT): {
    addedAt: string | null,
    qtyDiffers: boolean,
    priceDiffers: boolean,
    qtyFrom: number, qtyTo: number,
    priceFrom: number, priceTo: number,
    changeDate: string | null,
} {
    const evts = order.value?.events ?? []

    // Если позиция — восстановленная, начальное состояние ищем по «оригиналу»,
    // который существовал в исходном заказе.
    const restored = evts.find(e => e.type === 'item_restored' && e.data?.new_item_id === it.id)
    const originalId: number = restored ? Number(restored.data?.original_item_id) : it.id

    // Была ли исходная позиция добавлена админом после оформления?
    const added = evts.find(e => e.type === 'item_added' && e.data?.item_id === originalId)

    let initialQty: number
    let initialPrice: number

    if (added) {
        initialQty   = Number(added.data?.quantity ?? it.quantity)
        initialPrice = Number(added.data?.price    ?? it.price)
    } else {
        // Позиция была в заказе изначально — ищем самое раннее зафиксированное
        // состояние оригинала (первая правка) или его snapshot при удалении.
        const updatesForOriginal = evts
            .filter(e => e.type === 'item_updated' && e.data?.item_id === originalId)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        if (updatesForOriginal.length) {
            initialQty   = Number(updatesForOriginal[0].data?.quantity_from ?? it.quantity)
            initialPrice = Number(updatesForOriginal[0].data?.price_from    ?? it.price)
        } else {
            const removed = evts.find(e => e.type === 'item_removed' && e.data?.item_id === originalId)
            if (removed) {
                initialQty   = Number(removed.data?.quantity ?? it.quantity)
                initialPrice = Number(removed.data?.price    ?? it.price)
            } else {
                initialQty   = it.quantity
                initialPrice = it.price
            }
        }
    }

    const qtyDiffers   = initialQty !== it.quantity
    const priceDiffers = Math.abs(initialPrice - it.price) > 0.001

    // Дата последней актуальной правки — максимум по событиям, касающимся
    // и текущего, и оригинального id.
    let changeDate: string | null = null
    if (qtyDiffers || priceDiffers) {
        const relevant = evts.filter(e =>
            (e.type === 'item_updated' && (e.data?.item_id === it.id || e.data?.item_id === originalId))
            || (added && e.id === added.id)
        ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        changeDate = relevant[0]?.created_at ?? null
    }

    return {
        addedAt: added?.created_at ?? null,
        qtyDiffers,
        priceDiffers,
        qtyFrom: initialQty,
        qtyTo: it.quantity,
        priceFrom: initialPrice,
        priceTo: it.price,
        changeDate,
    }
}

const changesById = computed(() => {
    const map: Record<number, ReturnType<typeof itemChange>> = {}
    for (const it of order.value?.items ?? []) {
        map[it.id] = itemChange(it)
    }
    return map
})

const removedItems = computed<OrderEvent[]>(() => {
    if (!order.value?.events?.length) return []
    const currentIds = new Set(order.value.items.map(i => i.id))
    const restoredOriginalIds = new Set(
        order.value.events
            .filter(e => e.type === 'item_restored')
            .map(e => e.data?.original_item_id)
    )
    return order.value.events.filter(e =>
        e.type === 'item_removed'
        && !currentIds.has(e.data?.item_id)
        && !restoredOriginalIds.has(e.data?.item_id)
    )
})

onMounted(() => load())

useHead({ title: 'Заказ' })
</script>

<template>
    <AccountMobileHeader title="Заказ" :back="true" />
    <div class="account-wrap">
        <AccountSidebar />

        <main class="account-main">
            <div v-if="loading" class="muted">Загружаем заказ…</div>

            <template v-else-if="order">
                <div class="page-head">
                    <div>
                        <h2 class="order-title">
                            Заказ № {{ order.number }}
                            <button
                                class="copy-btn"
                                :title="copiedNumber ? 'Скопировано!' : 'Скопировать номер'"
                                @click="copyOrderNumber"
                            >
                                <span v-if="copiedNumber">✓</span>
                                <span v-else>⧉</span>
                            </button>
                        </h2>
                        <p class="muted small">от {{ formatDate(order.created_at) }}</p>
                    </div>
                    <span class="badge" :class="`badge-${order.status}`">
                        {{ ORDER_STATUS_LABELS[order.status] }}
                    </span>
                </div>

                <!-- Трекинг (если задан) -->
                <section v-if="order.tracking_number" class="block tracking-block">
                    <div class="tracking-row">
                        <div class="tracking-info">
                            <div class="tracking-label">Трек-номер {{ carrierLabel(order) }}</div>
                            <div class="tracking-code">{{ order.tracking_number }}</div>
                        </div>
                        <a
                            v-if="trackingUrl(order)"
                            :href="trackingUrl(order)!"
                            target="_blank"
                            rel="noopener"
                            class="btn-track"
                        >Отследить на сайте перевозчика →</a>
                    </div>
                </section>

                <!-- Состав -->
                <section class="block">
                    <h3 class="block-title">Состав заказа</h3>
                    <div class="items">
                        <div v-for="it in order.items" :key="it.id" class="item">
                            <img v-if="it.product_image" :src="it.product_image" :alt="it.product_title" />
                            <div v-else class="no-image">Нет фото</div>
                            <div class="item-info">
                                <NuxtLink
                                    v-if="it.product_slug"
                                    :to="`/products/${it.product_slug}`"
                                    class="item-title-link"
                                >
                                    {{ it.product_title }}
                                </NuxtLink>
                                <span v-else class="item-title-link">{{ it.product_title }}</span>
                                <div v-if="it.product_size" class="item-meta">Размер: {{ it.product_size }}</div>
                                <div class="item-meta">{{ formatPrice(it.price) }} ₽ × {{ it.quantity }}</div>

                                <!-- Итоговые изменения относительно начального состояния -->
                                <div
                                    v-if="changesById[it.id]?.addedAt || changesById[it.id]?.qtyDiffers || changesById[it.id]?.priceDiffers"
                                    class="item-changes"
                                >
                                    <div v-if="changesById[it.id].addedAt" class="ch-row">
                                        <span class="ch-tag ch-tag--add">Добавлено</span>
                                        <span class="ch-date">{{ formatDate(changesById[it.id].addedAt!) }}</span>
                                    </div>
                                    <div v-if="changesById[it.id].qtyDiffers || changesById[it.id].priceDiffers" class="ch-row">
                                        <span class="ch-tag ch-tag--upd">Изменено</span>
                                        <span class="ch-text">
                                            <template v-if="changesById[it.id].qtyDiffers">
                                                кол-во: {{ changesById[it.id].qtyFrom }} → <b>{{ changesById[it.id].qtyTo }}</b>
                                            </template>
                                            <template v-if="changesById[it.id].priceDiffers">
                                                <span v-if="changesById[it.id].qtyDiffers">, </span>
                                                цена: {{ formatPrice(changesById[it.id].priceFrom) }} → <b>{{ formatPrice(changesById[it.id].priceTo) }} ₽</b>
                                            </template>
                                        </span>
                                        <span v-if="changesById[it.id].changeDate" class="ch-date">{{ formatDate(changesById[it.id].changeDate!) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="item-total">{{ formatPrice(it.total) }} ₽</div>
                        </div>

                        <!-- Отменённые позиции -->
                        <div
                            v-for="r in removedItems"
                            :key="`rm-${r.id}`"
                            class="item item-removed"
                        >
                            <NuxtLink
                                v-if="r.data?.slug"
                                :to="`/products/${r.data.slug}`"
                                class="item-image-link"
                            >
                                <img v-if="r.data?.image" :src="r.data.image" :alt="r.data?.title" />
                                <div v-else class="no-image">Нет фото</div>
                            </NuxtLink>
                            <template v-else>
                                <img v-if="r.data?.image" :src="r.data.image" :alt="r.data?.title" />
                                <div v-else class="no-image">Нет фото</div>
                            </template>

                            <div class="item-info">
                                <NuxtLink
                                    v-if="r.data?.slug"
                                    :to="`/products/${r.data.slug}`"
                                    class="item-title-link strike"
                                >
                                    {{ r.data?.title }}<span v-if="r.data?.size"> · {{ r.data?.size }}</span>
                                </NuxtLink>
                                <div v-else class="item-title-link strike">
                                    {{ r.data?.title }}<span v-if="r.data?.size"> · {{ r.data?.size }}</span>
                                </div>
                                <div class="item-meta strike">
                                    {{ formatPrice(r.data?.price) }} ₽ × {{ r.data?.quantity }}
                                </div>
                                <div class="item-changes">
                                    <div class="ch-row">
                                        <span class="ch-tag ch-tag--rem">Отменено</span>
                                        <span class="ch-date">{{ formatDate(r.created_at) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="item-total strike">
                                {{ formatPrice((r.data?.price ?? 0) * (r.data?.quantity ?? 0)) }} ₽
                            </div>
                        </div>
                    </div>
                </section>

                <!-- Доставка -->
                <section class="block">
                    <h3 class="block-title">Доставка и оплата</h3>
                    <div class="info-grid">
                        <div>
                            <div class="info-label">Способ доставки</div>
                            <div class="info-value">{{ DELIVERY_METHOD_LABELS[order.delivery_method] }}</div>
                            <div v-if="deliveryDescription" class="info-sub">{{ deliveryDescription }}</div>
                        </div>
                        <div>
                            <div class="info-label">Способ оплаты</div>
                            <div class="info-value">{{ PAYMENT_METHOD_LABELS[order.payment_method] }}</div>
                        </div>
                        <div>
                            <div class="info-label">Получатель</div>
                            <div class="info-value">{{ order.customer_name }}</div>
                            <div class="info-sub">{{ order.customer_phone }}</div>
                            <div v-if="order.customer_email" class="info-sub">{{ order.customer_email }}</div>
                        </div>
                        <div v-if="order.comment">
                            <div class="info-label">Комментарий</div>
                            <div class="info-value">{{ order.comment }}</div>
                        </div>
                    </div>
                </section>

                <!-- Итог -->
                <section class="block">
                    <div class="totals">
                        <div class="totals-line">
                            <span>Товары</span>
                            <span>{{ formatPrice(order.subtotal) }} ₽</span>
                        </div>
                        <div class="totals-line">
                            <span>Доставка</span>
                            <span>{{ order.delivery_cost > 0 ? formatPrice(order.delivery_cost) + ' ₽' : 'Уточняется' }}</span>
                        </div>
                        <div class="totals-line total">
                            <span>К оплате</span>
                            <span>{{ formatPrice(order.total) }} ₽</span>
                        </div>
                    </div>

                    <div v-if="canCancel" class="actions">
                        <button
                            v-if="!confirmCancel"
                            class="btn-cancel"
                            @click="confirmCancel = true"
                        >Отменить заказ</button>
                        <div v-else class="confirm-row">
                            <span>Вы уверены?</span>
                            <button class="btn-danger" :disabled="cancelling" @click="cancelOrder">
                                {{ cancelling ? '…' : 'Да, отменить' }}
                            </button>
                            <button class="btn-ghost" @click="confirmCancel = false">Нет</button>
                        </div>
                    </div>
                </section>
            </template>

            <div v-else class="muted">Заказ не найден</div>
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
.account-main { padding: 0 60px 0 0; display: flex; flex-direction: column; gap: 16px; }

.page-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 4px; gap: 16px;
}
.order-title {
    font-size: 22px; font-weight: 700; margin: 0 0 4px; color: #111;
    display: inline-flex; align-items: center; gap: 8px;
}
.copy-btn {
    background: none; border: 1px solid transparent; color: #888;
    width: 28px; height: 28px; border-radius: 8px;
    cursor: pointer; font-size: 14px; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center;
}
.copy-btn:hover { background: #f5f5f5; color: #111; }

.tracking-block { background: #f0f7ff; border-color: #cfe2ff; }
.tracking-row {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
}
.tracking-label {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.06em; color: #1f6fdb;
}
.tracking-code {
    font-size: 18px; font-weight: 700; color: #111; margin-top: 2px;
    font-family: 'SF Mono', Menlo, monospace;
}
.btn-track {
    background: #1f6fdb; color: #fff; padding: 10px 16px;
    border-radius: 8px; text-decoration: none; font-size: 13px;
    font-weight: 600; transition: opacity 0.15s;
}
.btn-track:hover { opacity: 0.85; }
.muted { color: #888; }
.muted.small { font-size: 12px; }

.block {
    background: #fff; border: 1px solid #f0f0f0; border-radius: 12px; padding: 20px 24px;
}
.block-title {
    font-size: 12px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: #aaa; margin: 0 0 16px;
}

.badge {
    display: inline-block; padding: 4px 12px;
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

.items { display: flex; flex-direction: column; gap: 14px; }

.item-changes {
    margin-top: 8px;
    padding: 8px 10px;
    background: #fafaf8;
    border: 1px solid #efece5;
    border-radius: 6px;
    display: flex; flex-direction: column; gap: 4px;
}
.ch-row {
    display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
    font-size: 12px; color: #444;
}
.ch-tag {
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
    padding: 2px 6px; border-radius: 4px; text-transform: uppercase;
}
.ch-tag--add { background: #e9f7ec; color: #1f9d4d; }
.ch-tag--upd { background: #fff3e0; color: #c97b00; }
.ch-tag--rem { background: #fdecec; color: #c0392b; }
.ch-text { flex: 1; min-width: 0; }
.ch-text b { color: #111; font-weight: 700; }
.ch-date { color: #999; font-size: 11px; margin-left: auto; }

.item-removed { opacity: 0.7; }
.item-removed img { filter: grayscale(40%); }
.item-image-link {
    display: block; width: 60px; height: 80px;
    border-radius: 6px; overflow: hidden;
    background: #f4f4f4;
}
.item-image-link img {
    width: 100%; height: 100%; object-fit: cover;
}
.strike { text-decoration: line-through; }
.item {
    display: grid; grid-template-columns: 60px 1fr auto;
    gap: 16px; align-items: center;
}
.item img {
    width: 60px; height: 80px; object-fit: cover; border-radius: 6px;
}
.no-image {
    width: 60px; height: 80px; border-radius: 6px;
    background: #f4f4f4; display: flex; align-items: center;
    justify-content: center; font-size: 11px; color: #999;
}
.item-title-link {
    font-size: 14px; font-weight: 600; color: #111; text-decoration: none;
}
.item-title-link:hover { text-decoration: underline; }
.item-meta { font-size: 12px; color: #888; margin-top: 4px; }
.item-total { font-size: 14px; font-weight: 700; color: #111; }

.info-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 20px 24px;
}
.info-label { font-size: 11px; color: #aaa; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px; }
.info-value { font-size: 14px; color: #111; }
.info-sub   { font-size: 13px; color: #666; margin-top: 2px; }

.totals { display: flex; flex-direction: column; gap: 10px; }
.totals-line {
    display: flex; justify-content: space-between; font-size: 14px; color: #555;
}
.totals-line.total {
    font-size: 18px; font-weight: 700; color: #111;
    border-top: 1px solid #f0f0f0; padding-top: 12px; margin-top: 6px;
}

.actions { margin-top: 18px; padding-top: 18px; border-top: 1px solid #f0f0f0; }
.btn-cancel {
    background: none; border: 1px solid #e5e5e5; color: #555;
    border-radius: 8px; padding: 10px 18px; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { border-color: #c0392b; color: #c0392b; }

.confirm-row { display: flex; gap: 10px; align-items: center; font-size: 13px; color: #555; }
.btn-danger {
    background: #c0392b; color: #fff; border: none; border-radius: 8px;
    padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-ghost {
    background: none; border: 1px solid #e5e5e5; color: #555;
    border-radius: 8px; padding: 8px 14px; font-size: 13px; cursor: pointer;
}

@media (max-width: 1024px) {
    .account-wrap { padding: 40px 24px; }
    .account-main { padding: 0; }
}
@media (max-width: 768px) {
    .account-wrap  { grid-template-columns: 1fr; padding: 16px 16px 48px; }
    .info-grid { grid-template-columns: 1fr; }
    .item { grid-template-columns: 56px 1fr; }
    .item-total { grid-column: 1 / -1; text-align: right; }
}
</style>