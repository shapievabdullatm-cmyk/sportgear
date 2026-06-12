<script setup lang="ts">
import {
    DELIVERY_METHOD_LABELS,
    ORDER_STATUS_LABELS,
    PAYMENT_METHOD_LABELS,
    type Order,
    type OrderEvent,
    type OrderStatus,
} from '~/types/order'
import { useAdminOrderStore, type ProductSearchResult } from '~/stores/admin/order'
import { useWarehouseStore } from '~/stores/admin/warehouse'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const route = useRoute()
const store = useAdminOrderStore()
const warehouseStore = useWarehouseStore()
const toast = useToastStore()

const order = ref<Order | null>(null)
const loading = ref(true)
const updatingStatus = ref(false)
const savingComment  = ref(false)
const updatingItemId = ref<number | null>(null)

const adminComment   = ref('')
const trackingNumber = ref('')
const savingTracking = ref(false)

async function load() {
    loading.value = true
    try {
        order.value = await store.fetchOne(route.params.id as string)
        adminComment.value   = order.value.admin_comment   ?? ''
        trackingNumber.value = order.value.tracking_number ?? ''
    } finally {
        loading.value = false
    }
}

async function saveTrackingNumber() {
    if (!order.value) return
    savingTracking.value = true
    try {
        const updated = await store.updateTrackingNumber(
            order.value.id,
            trackingNumber.value.trim() || null
        )
        order.value.tracking_number = updated.tracking_number
        toast.success(updated.tracking_number ? 'Трек-номер сохранён' : 'Трек-номер очищен')
    } catch (e: any) {
        toast.error(e?.data?.message ?? 'Не удалось сохранить')
    } finally {
        savingTracking.value = false
    }
}

function carrierLabel(o: Order): string {
    return o.delivery_method === 'cdek' ? 'СДЭК'
        : o.delivery_method === 'russian_post' ? 'Почта России'
        : o.delivery_method === 'pickup' ? 'Самовывоз'
        : 'Курьер'
}

await load()
await warehouseStore.fetchAll()

const ALL_STATUSES: OrderStatus[] = [
    'new', 'confirmed', 'assembling', 'shipped', 'delivered', 'cancelled'
]

const allowedTransitions = computed<OrderStatus[]>(() => {
    if (!order.value) return []
    switch (order.value.status) {
        case 'new':        return ['confirmed', 'cancelled']
        case 'confirmed':  return ['assembling', 'cancelled']
        case 'assembling': return ['packed', 'cancelled']
        case 'packed':     return ['shipped', 'assembling', 'cancelled']
        case 'shipped':    return ['delivered', 'cancelled']
        default:           return []
    }
})

async function changeStatus(to: OrderStatus) {
    if (!order.value) return
    if (to === 'cancelled' && !confirm('Точно отменить заказ? Резерв вернётся на склад.')) return

    updatingStatus.value = true
    try {
        order.value = await store.updateStatus(order.value.id, to)
        toast.success(`Статус изменён: ${ORDER_STATUS_LABELS[to]}`)
    } catch (e: any) {
        toast.error(e?.data?.message ?? 'Не удалось изменить статус')
    } finally {
        updatingStatus.value = false
    }
}

async function saveAdminComment() {
    if (!order.value) return
    savingComment.value = true
    try {
        const updated = await store.updateAdminComment(order.value.id, adminComment.value)
        order.value.admin_comment = updated.admin_comment
        toast.success('Комментарий сохранён')
    } finally {
        savingComment.value = false
    }
}

async function changeItemWarehouse(itemId: number, warehouseId: number) {
    if (!order.value) return
    updatingItemId.value = itemId
    try {
        const updated = await store.updateItemWarehouse(order.value.id, itemId, warehouseId)
        const idx = order.value.items.findIndex(i => i.id === itemId)
        if (idx !== -1) {
            order.value.items[idx] = { ...order.value.items[idx], ...updated }
        }
        toast.success('Склад резерва обновлён')
    } catch (e: any) {
        toast.error(e?.data?.message ?? 'Не удалось переназначить склад')
        // Откат UI к серверной правде
        await load()
    } finally {
        updatingItemId.value = null
    }
}

const canEditWarehouse = computed(() =>
    order.value && !['shipped', 'delivered', 'cancelled'].includes(order.value.status)
)

const canEditItems = computed(() =>
    order.value && ['new', 'confirmed', 'assembling'].includes(order.value.status)
)

// ── Inline-редактирование позиций ─────────────────────────────────
const itemDrafts = reactive<Record<number, { quantity: number; price: number; saving: boolean }>>({})

function ensureDraft(itemId: number, quantity: number, price: number) {
    if (!itemDrafts[itemId]) {
        itemDrafts[itemId] = { quantity, price, saving: false }
    }
}

function isItemDirty(itemId: number, quantity: number, price: number): boolean {
    const d = itemDrafts[itemId]
    if (!d) return false
    return d.quantity !== quantity || Math.abs(d.price - price) > 0.001
}

/**
 * Сколько физически может удержать склад под эту позицию:
 * квота на этом складе минус чужие резервы (= общее физическое - чужие резервы).
 * Если позиция уже резервирует quantity, она считается своей частью reserved.
 */
function effectiveAvailableForItem(it: any): number | null {
    const stocks = it.product?.stocks
    if (!stocks || !it.reserved_warehouse_id) return null
    const stock = stocks.find((s: any) => s.warehouse_id === it.reserved_warehouse_id)
    if (!stock) return null
    return Number(stock.quantity) - (Number(stock.reserved_quantity) - Number(it.quantity))
}

function itemIsOverReserved(it: any): boolean {
    const avail = effectiveAvailableForItem(it)
    return avail !== null && Number(it.quantity) > avail
}

// ── Over-reserve confirmation modal ───────────────────────────────
interface OverReserveDialogState {
    open: boolean
    title: string
    productSize: string | null
    available: number
    requested: number
    confirming: boolean
    onConfirm: (() => Promise<void>) | null
}

const overReserveDialog = reactive<OverReserveDialogState>({
    open: false,
    title: '',
    productSize: null,
    available: 0,
    requested: 0,
    confirming: false,
    onConfirm: null,
})

function closeOverReserveDialog() {
    if (overReserveDialog.confirming) return
    overReserveDialog.open = false
    overReserveDialog.onConfirm = null
}

async function acceptOverReserve() {
    if (!overReserveDialog.onConfirm) return
    overReserveDialog.confirming = true
    try {
        await overReserveDialog.onConfirm()
        overReserveDialog.open = false
        overReserveDialog.onConfirm = null
    } finally {
        overReserveDialog.confirming = false
    }
}

async function saveItem(itemId: number) {
    if (!order.value) return
    const d = itemDrafts[itemId]
    if (!d) return

    const item = order.value.items.find(i => i.id === itemId)

    async function persist(force: boolean) {
        if (!order.value) return
        d.saving = true
        try {
            order.value = await store.updateItem(order.value.id, itemId, {
                quantity: d.quantity,
                price:    d.price,
                force,
            })
            toast.success(force ? 'Позиция обновлена (списано больше, чем есть)' : 'Позиция обновлена')
            delete itemDrafts[itemId]
        } catch (e: any) {
            toast.error(e?.data?.message ?? Object.values(e?.data?.errors ?? {}).flat()[0] ?? 'Не удалось сохранить')
        } finally {
            d.saving = false
        }
    }

    if (item && d.quantity > item.quantity) {
        const avail = effectiveAvailableForItem(item)
        if (avail !== null && d.quantity > avail) {
            overReserveDialog.title       = item.product_title
            overReserveDialog.productSize = item.product_size
            overReserveDialog.available   = Math.max(avail, 0)
            overReserveDialog.requested   = d.quantity
            overReserveDialog.onConfirm   = () => persist(true)
            overReserveDialog.open        = true
            return
        }
    }

    await persist(false)
}

async function deleteItem(itemId: number) {
    if (!order.value) return
    if (!confirm('Удалить позицию из заказа? Резерв вернётся на склад.')) return
    try {
        order.value = await store.removeItem(order.value.id, itemId)
        delete itemDrafts[itemId]
        toast.success('Позиция удалена')
    } catch (e: any) {
        toast.error(e?.data?.message ?? 'Не удалось удалить позицию')
    }
}

// ── Добавление новой позиции ──────────────────────────────────────
const addPanelOpen = ref(false)
const searchQuery  = ref('')
const searchResults = ref<ProductSearchResult[]>([])
const searching = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

const picked = ref<ProductSearchResult | null>(null)
const pickedQty = ref(1)
const pickedPrice = ref<number | null>(null)
const adding = ref(false)

function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
    if (!searchQuery.value.trim()) {
        searchResults.value = []
        return
    }
    searching.value = true
    searchTimer = setTimeout(async () => {
        try {
            searchResults.value = await store.searchProducts(searchQuery.value)
        } finally {
            searching.value = false
        }
    }, 250)
}

function pickProduct(p: ProductSearchResult) {
    picked.value = p
    pickedQty.value = 1
    pickedPrice.value = p.price
    searchResults.value = []
    searchQuery.value = p.title + (p.size ? ` · ${p.size}` : '')
}

function cancelAddPanel() {
    addPanelOpen.value = false
    picked.value = null
    pickedQty.value = 1
    pickedPrice.value = null
    searchQuery.value = ''
    searchResults.value = []
}

async function confirmAdd() {
    if (!order.value || !picked.value) return

    async function persist(force: boolean) {
        if (!order.value || !picked.value) return
        adding.value = true
        try {
            order.value = await store.addItem(
                order.value.id,
                picked.value.id,
                pickedQty.value,
                pickedPrice.value ?? undefined,
                force,
            )
            toast.success(force ? 'Позиция добавлена (списано больше, чем есть)' : 'Позиция добавлена')
            cancelAddPanel()
        } catch (e: any) {
            toast.error(e?.data?.message ?? Object.values(e?.data?.errors ?? {}).flat()[0] ?? 'Не удалось добавить')
        } finally {
            adding.value = false
        }
    }

    if (pickedQty.value > picked.value.available) {
        overReserveDialog.title       = picked.value.title
        overReserveDialog.productSize = picked.value.size
        overReserveDialog.available   = Math.max(picked.value.available, 0)
        overReserveDialog.requested   = pickedQty.value
        overReserveDialog.onConfirm   = () => persist(true)
        overReserveDialog.open        = true
        return
    }

    await persist(false)
}

const deliveryDescription = computed(() => {
    if (!order.value) return ''
    const o = order.value
    switch (o.delivery_method) {
        case 'courier':      return o.address_full ?? '—'
        case 'pickup': {
            const parts: string[] = []
            if (o.shop?.name) parts.push(o.shop.name + (o.shop.address ? ', ' + o.shop.address : ''))
            if (o.pickup_slot_at) parts.push('Время: ' + formatPickupSlot(o.pickup_slot_at))
            return parts.length ? parts.join(' · ') : '—'
        }
        case 'cdek':         return [o.cdek_pvz_code ? `ПВЗ: ${o.cdek_pvz_code}` : null, o.address_full].filter(Boolean).join(' · ')
        case 'russian_post': return [o.russian_post_index ? `Индекс: ${o.russian_post_index}` : null, o.address_full].filter(Boolean).join(' · ')
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

function itemLink(it: { product_id: number | null }): string {
    return it.product_id ? `/admin/products/${it.product_id}` : ''
}

function formatPickupSlot(iso: string): string {
    const d = new Date(iso)
    const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const a = String(d.getHours()).padStart(2, '0')
    const b = String(d.getHours() + 1).padStart(2, '0')
    return `${date}, ${a}:00 – ${b}:00`
}

function badgeClass(status: OrderStatus): string {
    return {
        new:        'bg-blue-50 text-blue-700',
        confirmed:  'bg-emerald-50 text-emerald-700',
        assembling: 'bg-amber-50 text-amber-700',
        packed:     'bg-teal-50 text-teal-700',
        shipped:    'bg-violet-50 text-violet-700',
        delivered:  'bg-zinc-100 text-zinc-600',
        cancelled:  'bg-rose-50 text-rose-700',
    }[status] ?? 'bg-zinc-100 text-zinc-600'
}

function statusButtonLabel(s: OrderStatus): string {
    return s === 'cancelled' ? 'Отменить' : `→ ${ORDER_STATUS_LABELS[s]}`
}

function itemEvents(itemId: number) {
    const evts = order.value?.events ?? []
    return {
        added:    evts.find(e => e.type === 'item_added'    && e.data?.item_id === itemId) ?? null,
        restored: evts.find(e => e.type === 'item_restored' && e.data?.new_item_id === itemId) ?? null,
        updates:  evts.filter(e => e.type === 'item_updated' && e.data?.item_id === itemId),
    }
}

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

const restoringEventId = ref<number | null>(null)
async function restoreCancelledItem(event: OrderEvent) {
    if (!order.value) return
    restoringEventId.value = event.id
    try {
        order.value = await store.restoreItem(order.value.id, event.id)
        toast.success('Позиция возвращена в сборку')
    } catch (e: any) {
        toast.error(e?.data?.message ?? Object.values(e?.data?.errors ?? {}).flat()[0] ?? 'Не удалось вернуть')
    } finally {
        restoringEventId.value = null
    }
}
</script>

<template>
    <div v-if="loading" class="flex justify-center py-16">
        <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
    </div>

    <div v-else-if="order" class="space-y-5">
        <!-- Header -->
        <div class="flex flex-wrap items-center gap-3 justify-between">
            <div class="flex items-center gap-3">
                <NuxtLink to="/admin/orders" class="text-[12px] text-[#888] hover:text-[#1A1A1A]">← К списку</NuxtLink>
                <h1 class="text-[18px] font-semibold text-[#1A1A1A]">№ {{ order.number }}</h1>
                <span class="inline-block px-3 py-1 rounded-full text-[11px] font-semibold" :class="badgeClass(order.status)">
                    {{ ORDER_STATUS_LABELS[order.status] }}
                </span>
            </div>
            <div class="text-[12px] text-[#888]">{{ formatDate(order.created_at) }}</div>
        </div>

        <!-- Status actions -->
        <div v-if="allowedTransitions.length" class="bg-white border border-[#E8E6E0] rounded-xl p-4">
            <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-3">Изменить статус</div>
            <div class="flex flex-wrap gap-2">
                <button
                    v-for="s in allowedTransitions"
                    :key="s"
                    :disabled="updatingStatus"
                    class="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors disabled:opacity-50"
                    :class="s === 'cancelled'
                        ? 'border-rose-200 text-rose-700 hover:bg-rose-50'
                        : 'border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#333]'"
                    @click="changeStatus(s)"
                >{{ statusButtonLabel(s) }}</button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Main column -->
            <div class="lg:col-span-2 space-y-4">
                <!-- Items -->
                <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
                    <div class="flex items-center justify-between mb-3">
                        <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888]">Состав</div>
                        <button
                            v-if="canEditItems && !addPanelOpen"
                            class="text-[12px] font-medium text-[#1A1A1A] hover:underline"
                            @click="addPanelOpen = true"
                        >+ Добавить позицию</button>
                    </div>

                    <!-- Add item panel -->
                    <div v-if="addPanelOpen" class="mb-4 p-3 rounded-lg border border-dashed border-[#E8E6E0] bg-[#FAFAF8]">
                        <div class="relative">
                            <input
                                v-model="searchQuery"
                                @input="onSearchInput"
                                type="text"
                                placeholder="Поиск товара по названию, артикулу, штрихкоду…"
                                class="w-full px-3 py-2 rounded-lg border border-[#E8E6E0] bg-white text-[13px] outline-none focus:border-[#1A1A1A]"
                            />
                            <div v-if="searching" class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-[#888]">…</div>

                            <div
                                v-if="searchResults.length"
                                class="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#E8E6E0] rounded-lg shadow-lg max-h-80 overflow-y-auto"
                            >
                                <button
                                    v-for="p in searchResults"
                                    :key="p.id"
                                    class="w-full flex items-start gap-3 px-3 py-2 text-left hover:bg-[#FAFAF8] border-b border-[#F2F0EA] last:border-b-0"
                                    @click="pickProduct(p)"
                                >
                                    <img v-if="p.image" :src="p.image" class="w-9 h-12 object-cover rounded" />
                                    <div v-else class="w-9 h-12 rounded bg-[#F4F4F4]" />
                                    <div class="flex-1 min-w-0">
                                        <div class="text-[13px] text-[#1A1A1A] truncate">{{ p.title }}</div>
                                        <div class="text-[11px] text-[#888]">
                                            <span v-if="p.size">{{ p.size }} · </span>
                                            <span v-if="p.article">арт. {{ p.article }} · </span>
                                            Доступно: {{ p.available }}
                                        </div>
                                    </div>
                                    <div class="text-[13px] font-medium text-[#1A1A1A] shrink-0">{{ formatPrice(p.price) }} ₽</div>
                                </button>
                            </div>
                        </div>

                        <div v-if="picked" class="mt-3 flex flex-wrap items-end gap-3">
                            <div>
                                <label class="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Кол-во</label>
                                <input
                                    v-model.number="pickedQty"
                                    type="number"
                                    min="1"
                                    class="w-20 px-2 py-1.5 rounded-md border border-[#E8E6E0] bg-white text-[13px] outline-none focus:border-[#1A1A1A]"
                                />
                                <p
                                    v-if="pickedQty > picked.available"
                                    class="mt-1 text-[10px] text-amber-700"
                                >
                                    Больше, чем доступно ({{ picked.available }})
                                </p>
                            </div>
                            <div>
                                <label class="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Цена</label>
                                <input
                                    v-model.number="pickedPrice"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    class="w-28 px-2 py-1.5 rounded-md border border-[#E8E6E0] bg-white text-[13px] outline-none focus:border-[#1A1A1A]"
                                />
                            </div>
                            <div class="text-[11px] text-[#888] pb-2">
                                Сумма: {{ formatPrice((pickedPrice ?? 0) * pickedQty) }} ₽
                            </div>
                            <div class="ml-auto flex gap-2">
                                <button
                                    class="px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-white text-[12px] font-medium hover:bg-[#333] disabled:opacity-50"
                                    :disabled="adding || !pickedQty || pickedQty < 1"
                                    @click="confirmAdd"
                                >{{ adding ? 'Добавляем…' : 'Добавить' }}</button>
                                <button
                                    class="px-3 py-1.5 rounded-lg border border-[#E8E6E0] text-[12px] hover:bg-white"
                                    @click="cancelAddPanel"
                                >Отмена</button>
                            </div>
                        </div>
                        <div v-else class="mt-2 text-right">
                            <button
                                class="px-3 py-1.5 rounded-lg border border-[#E8E6E0] text-[12px] hover:bg-white"
                                @click="cancelAddPanel"
                            >Отмена</button>
                        </div>
                    </div>

                    <div v-if="!order.items.length" class="text-[12px] text-[#888] py-4 text-center">
                        Заказ пуст
                    </div>

                    <div v-else class="space-y-3">
                        <div
                            v-for="it in order.items"
                            :key="it.id"
                            class="flex items-start gap-3 pb-3 border-b border-[#F2F0EA] last:border-b-0 last:pb-0"
                        >
                            <component
                                :is="it.product_id ? 'NuxtLink' : 'div'"
                                v-bind="it.product_id ? { to: itemLink(it) } : {}"
                                class="shrink-0"
                            >
                                <img
                                    v-if="it.product_image"
                                    :src="it.product_image"
                                    :alt="it.product_title"
                                    class="w-12 h-16 object-cover rounded-md bg-[#F4F4F4]"
                                />
                                <div v-else class="w-12 h-16 rounded-md bg-[#F4F4F4] flex items-center justify-center text-[10px] text-[#999]">
                                    Нет фото
                                </div>
                            </component>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <NuxtLink
                                            v-if="it.product_id"
                                            :to="itemLink(it)"
                                            class="text-[13px] font-medium text-[#1A1A1A] truncate block hover:underline"
                                        >{{ it.product_title }}</NuxtLink>
                                        <div v-else class="text-[13px] font-medium text-[#1A1A1A] truncate">{{ it.product_title }}</div>
                                        <div v-if="it.product_size" class="text-[11px] text-[#888]">Размер: {{ it.product_size }}</div>
                                    </div>
                                    <button
                                        v-if="canEditItems"
                                        class="text-[11px] text-rose-600 hover:underline shrink-0"
                                        @click="deleteItem(it.id)"
                                    >Удалить</button>
                                </div>

                                <!-- Over-reserve badge -->
                                <div
                                    v-if="itemIsOverReserved(it)"
                                    class="mt-2 px-2.5 py-1.5 rounded-md bg-rose-50 border border-rose-200 flex items-center gap-2 text-[11px] text-rose-700"
                                >
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-600 text-white">!</span>
                                    Списано больше, чем есть на складе
                                    <span class="text-rose-500">
                                        (на складе для этой позиции: {{ Math.max(effectiveAvailableForItem(it) ?? 0, 0) }} шт. из {{ it.quantity }})
                                    </span>
                                </div>

                                <!-- Inline editors -->
                                <div class="mt-2 flex flex-wrap items-end gap-2">
                                    <div>
                                        <label class="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Цена</label>
                                        <input
                                            :disabled="!canEditItems"
                                            :value="itemDrafts[it.id]?.price ?? it.price"
                                            type="number" min="0" step="0.01"
                                            class="w-24 px-2 py-1 rounded-md border border-[#E8E6E0] bg-white text-[12px] outline-none focus:border-[#1A1A1A] disabled:bg-[#FAFAF8]"
                                            @focus="ensureDraft(it.id, it.quantity, it.price)"
                                            @input="ensureDraft(it.id, it.quantity, it.price); itemDrafts[it.id].price = Number(($event.target as HTMLInputElement).value)"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-[10px] uppercase tracking-wider text-[#999] mb-1">Кол-во</label>
                                        <input
                                            :disabled="!canEditItems"
                                            :value="itemDrafts[it.id]?.quantity ?? it.quantity"
                                            type="number" min="1"
                                            class="w-20 px-2 py-1 rounded-md border border-[#E8E6E0] bg-white text-[12px] outline-none focus:border-[#1A1A1A] disabled:bg-[#FAFAF8]"
                                            @focus="ensureDraft(it.id, it.quantity, it.price)"
                                            @input="ensureDraft(it.id, it.quantity, it.price); itemDrafts[it.id].quantity = Number(($event.target as HTMLInputElement).value)"
                                        />
                                    </div>
                                    <div class="text-[11px] text-[#888] pb-1">
                                        = {{ formatPrice((itemDrafts[it.id]?.price ?? it.price) * (itemDrafts[it.id]?.quantity ?? it.quantity)) }} ₽
                                    </div>
                                    <button
                                        v-if="isItemDirty(it.id, it.quantity, it.price)"
                                        class="ml-auto px-2.5 py-1 rounded-md bg-[#1A1A1A] text-white text-[11px] font-medium hover:bg-[#333] disabled:opacity-50"
                                        :disabled="itemDrafts[it.id]?.saving"
                                        @click="saveItem(it.id)"
                                    >{{ itemDrafts[it.id]?.saving ? '…' : 'Сохранить' }}</button>
                                </div>

                                <!-- Warehouse select -->
                                <div class="mt-2 flex flex-wrap items-center gap-2">
                                    <span class="text-[10px] uppercase tracking-wider text-[#999]">Склад резерва:</span>
                                    <AdminWarehousePicker
                                        :model-value="it.reserved_warehouse_id"
                                        :warehouses="warehouseStore.warehouses"
                                        :stocks="it.product?.stocks"
                                        :quantity="it.quantity"
                                        :disabled="!canEditWarehouse"
                                        :loading="updatingItemId === it.id"
                                        @change="changeItemWarehouse(it.id, $event)"
                                    />
                                </div>

                                <!-- Изменения относительно созданной версии -->
                                <div
                                    v-if="itemEvents(it.id).added || itemEvents(it.id).restored || itemEvents(it.id).updates.length"
                                    class="mt-2 px-2.5 py-2 rounded-md bg-[#FAFAF8] border border-[#EFECE5] flex flex-col gap-1"
                                >
                                    <div v-if="itemEvents(it.id).added" class="flex items-center gap-2 text-[11px]">
                                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700">Добавлено</span>
                                        <span
                                            v-if="itemEvents(it.id).added!.data?.over_reserved"
                                            class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-600 text-white"
                                        >Списано больше</span>
                                        <span class="text-[#999]">{{ formatDate(itemEvents(it.id).added!.created_at) }}</span>
                                    </div>
                                    <div v-if="itemEvents(it.id).restored" class="flex items-center gap-2 text-[11px]">
                                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-700">Восстановлено</span>
                                        <span class="text-[#999]">{{ formatDate(itemEvents(it.id).restored!.created_at) }}</span>
                                    </div>
                                    <div
                                        v-for="u in itemEvents(it.id).updates"
                                        :key="u.id"
                                        class="flex items-center flex-wrap gap-2 text-[11px] text-[#444]"
                                    >
                                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-50 text-amber-700">Изменено</span>
                                        <span
                                            v-if="u.data?.over_reserved"
                                            class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-600 text-white"
                                        >Списано больше</span>
                                        <span>
                                            <template v-if="u.data?.quantity_from !== u.data?.quantity_to">
                                                кол-во: {{ u.data?.quantity_from }} → <b>{{ u.data?.quantity_to }}</b>
                                            </template>
                                            <template v-if="Math.abs((u.data?.price_from ?? 0) - (u.data?.price_to ?? 0)) > 0.001">
                                                <span v-if="u.data?.quantity_from !== u.data?.quantity_to">, </span>
                                                цена: {{ formatPrice(u.data?.price_from) }} → <b>{{ formatPrice(u.data?.price_to) }} ₽</b>
                                            </template>
                                        </span>
                                        <span class="text-[#999] ml-auto">{{ formatDate(u.created_at) }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Отменённые позиции -->
                        <div
                            v-for="r in removedItems"
                            :key="`rm-${r.id}`"
                            class="flex items-start gap-3 pb-3 border-b border-[#F2F0EA] last:border-b-0 last:pb-0 opacity-75"
                        >
                            <img
                                v-if="r.data?.image"
                                :src="r.data.image"
                                :alt="r.data?.title"
                                class="w-12 h-16 object-cover rounded-md bg-[#F4F4F4] shrink-0"
                                style="filter: grayscale(60%);"
                            />
                            <div v-else class="w-12 h-16 rounded-md bg-[#F4F4F4] flex items-center justify-center text-[10px] text-[#999] shrink-0">
                                Нет фото
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="min-w-0">
                                        <div class="text-[13px] font-medium text-[#1A1A1A] line-through truncate">
                                            {{ r.data?.title }}<span v-if="r.data?.size"> · {{ r.data?.size }}</span>
                                        </div>
                                        <div class="text-[11px] text-[#888] line-through">
                                            {{ formatPrice(r.data?.price) }} ₽ × {{ r.data?.quantity }}
                                        </div>
                                    </div>
                                    <button
                                        v-if="canEditItems"
                                        class="shrink-0 px-2.5 py-1 rounded-md bg-[#1A1A1A] text-white text-[11px] font-medium hover:bg-[#333] disabled:opacity-50"
                                        :disabled="restoringEventId === r.id"
                                        @click="restoreCancelledItem(r)"
                                    >{{ restoringEventId === r.id ? '…' : 'Вернуть в сборку' }}</button>
                                </div>
                                <div class="mt-2 flex items-center gap-2 text-[11px]">
                                    <span class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-50 text-rose-700">Отменено</span>
                                    <span class="text-[#999]">{{ formatDate(r.created_at) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Totals -->
                    <div class="mt-4 pt-4 border-t border-[#F2F0EA] space-y-1 text-[13px]">
                        <div class="flex justify-between text-[#666]">
                            <span>Товары</span><span>{{ formatPrice(order.subtotal) }} ₽</span>
                        </div>
                        <div class="flex justify-between text-[#666]">
                            <span>Доставка</span><span>{{ formatPrice(order.delivery_cost) }} ₽</span>
                        </div>
                        <div class="flex justify-between text-[15px] font-bold text-[#1A1A1A] pt-2 border-t border-[#F2F0EA]">
                            <span>Итого</span><span>{{ formatPrice(order.total) }} ₽</span>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Side column -->
            <div class="space-y-4">
                <!-- Customer -->
                <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-3">Клиент</div>
                    <div class="text-[13px] text-[#1A1A1A] font-medium">{{ order.customer_name }}</div>
                    <div class="text-[12px] text-[#666] mt-1 font-mono">{{ order.customer_phone }}</div>
                    <div v-if="order.customer_email" class="text-[12px] text-[#666] mt-0.5">{{ order.customer_email }}</div>
                </div>

                <!-- Delivery -->
                <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-3">Доставка</div>
                    <div class="text-[13px] text-[#1A1A1A]">{{ DELIVERY_METHOD_LABELS[order.delivery_method] }}</div>
                    <div v-if="deliveryDescription" class="text-[12px] text-[#666] mt-1">{{ deliveryDescription }}</div>
                </div>

                <!-- Payment -->
                <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-3">Оплата</div>
                    <div class="text-[13px] text-[#1A1A1A]">{{ PAYMENT_METHOD_LABELS[order.payment_method] }}</div>
                    <div class="text-[12px] mt-1" :class="order.payment_status === 'paid' ? 'text-emerald-700' : 'text-[#888]'">
                        {{ order.payment_status === 'paid' ? 'Оплачен' : 'Ожидает оплаты' }}
                    </div>
                </div>

                <!-- Client comment -->
                <div v-if="order.comment" class="bg-white border border-[#E8E6E0] rounded-xl p-4">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-2">Комментарий клиента</div>
                    <div class="text-[13px] text-[#444] whitespace-pre-line">{{ order.comment }}</div>
                </div>

                <!-- Tracking number (только если способ доставки требует трекинга) -->
                <div
                    v-if="['cdek', 'russian_post', 'courier'].includes(order.delivery_method)"
                    class="bg-white border border-[#E8E6E0] rounded-xl p-4"
                >
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-2">
                        Трек-номер ({{ carrierLabel(order) }})
                    </div>
                    <input
                        v-model="trackingNumber"
                        type="text"
                        class="w-full px-3 py-2 rounded-lg border border-[#E8E6E0] bg-white text-[13px] outline-none focus:border-[#1A1A1A]"
                        placeholder="Например: 1234567890 или AB123456789CN"
                    />
                    <button
                        class="mt-2 w-full px-3 py-2 rounded-lg bg-[#1A1A1A] text-white text-[12px] font-medium hover:bg-[#333] disabled:opacity-50"
                        :disabled="savingTracking || (trackingNumber.trim() === (order.tracking_number ?? ''))"
                        @click="saveTrackingNumber"
                    >{{ savingTracking ? 'Сохраняем…' : (order.tracking_number ? 'Обновить' : 'Сохранить') }}</button>
                    <p v-if="order.tracking_number" class="mt-2 text-[11px] text-[#888]">
                        Клиент видит этот номер у себя в заказе и может перейти на сайт перевозчика для отслеживания.
                    </p>
                </div>

                <!-- Admin comment -->
                <div class="bg-white border border-[#E8E6E0] rounded-xl p-4">
                    <div class="text-[11px] font-semibold uppercase tracking-wider text-[#888] mb-2">Заметка для админов</div>
                    <textarea
                        v-model="adminComment"
                        rows="3"
                        class="w-full px-3 py-2 rounded-lg border border-[#E8E6E0] bg-white text-[13px] outline-none focus:border-[#1A1A1A] resize-y"
                        placeholder="Виден только администраторам"
                    />
                    <button
                        class="mt-2 w-full px-3 py-2 rounded-lg bg-[#1A1A1A] text-white text-[12px] font-medium hover:bg-[#333] disabled:opacity-50"
                        :disabled="savingComment"
                        @click="saveAdminComment"
                    >{{ savingComment ? 'Сохраняем…' : 'Сохранить' }}</button>
                </div>
            </div>
        </div>
    </div>

    <div v-else class="text-[#888] text-center py-12">Заказ не найден</div>

    <!-- Over-reserve confirmation modal -->
    <Transition name="over-reserve-modal">
        <div
            v-if="overReserveDialog.open"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            @click.self="closeOverReserveDialog"
        >
            <div
                class="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col"
                @click.stop
            >
                <div class="flex items-start gap-3 p-5 border-b border-[#F2F0EA]">
                    <div class="shrink-0 w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center">
                        <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h2 class="text-[14px] font-semibold text-[#1A1A1A]">Списать больше, чем есть на складе?</h2>
                        <p class="text-[12px] text-[#666] mt-0.5 truncate">
                            {{ overReserveDialog.title }}<span v-if="overReserveDialog.productSize"> · {{ overReserveDialog.productSize }}</span>
                        </p>
                    </div>
                </div>

                <div class="p-5 space-y-3">
                    <div class="grid grid-cols-2 gap-2 text-[12px]">
                        <div class="rounded-lg bg-[#FAFAF8] border border-[#EFECE5] p-3">
                            <div class="text-[10px] uppercase tracking-wider text-[#999] mb-1">Доступно</div>
                            <div class="text-[16px] font-semibold text-[#1A1A1A]">{{ overReserveDialog.available }} шт.</div>
                        </div>
                        <div class="rounded-lg bg-rose-50 border border-rose-200 p-3">
                            <div class="text-[10px] uppercase tracking-wider text-rose-600 mb-1">Запрошено</div>
                            <div class="text-[16px] font-semibold text-rose-700">
                                {{ overReserveDialog.requested }} шт.
                                <span class="text-[11px] font-normal text-rose-500">(+{{ overReserveDialog.requested - overReserveDialog.available }})</span>
                            </div>
                        </div>
                    </div>

                    <p class="text-[12px] text-[#444] leading-relaxed">
                        Позиция будет помечена как
                        <span class="px-1 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-600 text-white">Списано больше</span>,
                        а при отгрузке остаток на складе уйдёт в минус.
                    </p>
                </div>

                <div class="flex items-center justify-end gap-2 p-4 border-t border-[#F2F0EA] bg-[#FAFAF8]">
                    <button
                        class="px-3.5 py-2 rounded-lg text-[12px] font-medium text-[#555] hover:text-[#1A1A1A] disabled:opacity-50"
                        :disabled="overReserveDialog.confirming"
                        @click="closeOverReserveDialog"
                    >Отмена</button>
                    <button
                        class="px-3.5 py-2 rounded-lg bg-rose-600 text-white text-[12px] font-semibold hover:bg-rose-700 disabled:opacity-50"
                        :disabled="overReserveDialog.confirming"
                        @click="acceptOverReserve"
                    >{{ overReserveDialog.confirming ? 'Сохраняем…' : 'Списать всё равно' }}</button>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.over-reserve-modal-enter-active,
.over-reserve-modal-leave-active {
    transition: opacity 0.18s ease;
}
.over-reserve-modal-enter-from,
.over-reserve-modal-leave-to {
    opacity: 0;
}
.over-reserve-modal-enter-active > div,
.over-reserve-modal-leave-active > div {
    transition: transform 0.18s ease;
}
.over-reserve-modal-enter-from > div,
.over-reserve-modal-leave-to > div {
    transform: scale(0.95);
}
</style>