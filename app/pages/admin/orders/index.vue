<script setup lang="ts">
import {
    DELIVERY_METHOD_LABELS,
    ORDER_STATUS_LABELS,
    type Order,
    type OrderStatus,
} from '~/types/order'
import { useAdminOrderStore } from '~/stores/admin/order'

definePageMeta({ layout: 'admin', middleware: 'admin' })

const store = useAdminOrderStore()

type ViewMode = 'list' | 'kanban'
const view = useCookie<ViewMode>('admin-orders-view', {
    default: () => 'list',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
})

const search    = ref('')
const status    = ref<OrderStatus | ''>('')
const dateFrom  = ref('')
const dateTo    = ref('')
const page      = ref(1)

let searchTimer: ReturnType<typeof setTimeout> | null = null

async function load() {
    await store.fetchAll({
        search:    search.value || undefined,
        status:    view.value === 'kanban' ? undefined : (status.value || undefined),
        date_from: dateFrom.value || undefined,
        date_to:   dateTo.value || undefined,
        page:      view.value === 'kanban' ? 1 : page.value,
        per_page:  view.value === 'kanban' ? 200 : undefined,
    })
}

await load()

function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
        page.value = 1
        load()
    }, 300)
}

watch([status, dateFrom, dateTo], () => {
    page.value = 1
    load()
})

watch(view, () => {
    page.value = 1
    load()
})

function changePage(p: number) {
    page.value = p
    load()
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatPrice(n: number): string {
    return n.toLocaleString('ru-RU', { maximumFractionDigits: 0 })
}

const statusSavingId = ref<number | null>(null)

async function changeStatusFromList(o: Order, to: OrderStatus) {
    if (to === 'cancelled' && !confirm('Точно отменить заказ? Резерв вернётся на склад.')) return
    const previous = o.status
    store.patchLocalStatus(o.id, to)
    statusSavingId.value = o.id
    try {
        await store.updateStatus(o.id, to)
    } catch (err) {
        store.patchLocalStatus(o.id, previous)
        console.error('Не удалось обновить статус заказа', err)
        alert('Не удалось обновить статус заказа')
    } finally {
        statusSavingId.value = null
    }
}

// ─── Kanban ────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS: { status: OrderStatus; label: string; accent: string }[] = [
    { status: 'new',        label: ORDER_STATUS_LABELS.new,        accent: 'bg-blue-500' },
    { status: 'confirmed',  label: ORDER_STATUS_LABELS.confirmed,  accent: 'bg-emerald-500' },
    { status: 'assembling', label: ORDER_STATUS_LABELS.assembling, accent: 'bg-amber-500' },
    { status: 'packed',     label: ORDER_STATUS_LABELS.packed,     accent: 'bg-teal-500' },
    { status: 'shipped',    label: ORDER_STATUS_LABELS.shipped,    accent: 'bg-violet-500' },
    { status: 'delivered',  label: ORDER_STATUS_LABELS.delivered,  accent: 'bg-zinc-400' },
    { status: 'cancelled',  label: ORDER_STATUS_LABELS.cancelled,  accent: 'bg-rose-500' },
]

const columns = computed<Record<OrderStatus, Order[]>>(() => {
    const map: Record<OrderStatus, Order[]> = {
        new: [], confirmed: [], assembling: [], packed: [], shipped: [], delivered: [], cancelled: [],
    }
    for (const o of store.orders) {
        if (map[o.status]) map[o.status].push(o)
    }
    return map
})

const draggedId = ref<number | null>(null)
const dragOverStatus = ref<OrderStatus | null>(null)
const savingId = ref<number | null>(null)

function onDragStart(e: DragEvent, o: Order) {
    draggedId.value = o.id
    if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(o.id))
    }
}

function onDragEnd() {
    draggedId.value = null
    dragOverStatus.value = null
}

function onDragOver(e: DragEvent, target: OrderStatus) {
    e.preventDefault()
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
    dragOverStatus.value = target
}

function onDragLeave(target: OrderStatus) {
    if (dragOverStatus.value === target) dragOverStatus.value = null
}

async function onDrop(e: DragEvent, target: OrderStatus) {
    e.preventDefault()
    const id = draggedId.value ?? Number(e.dataTransfer?.getData('text/plain'))
    dragOverStatus.value = null
    draggedId.value = null
    if (!id) return

    const order = store.orders.find(o => o.id === id)
    if (!order || order.status === target) return

    const previous = order.status
    store.patchLocalStatus(id, target)
    savingId.value = id
    try {
        await store.updateStatus(id, target)
    } catch (err) {
        store.patchLocalStatus(id, previous)
        console.error('Не удалось обновить статус заказа', err)
        alert('Не удалось обновить статус заказа')
    } finally {
        savingId.value = null
    }
}
</script>

<template>
    <div class="space-y-4 sm:space-y-5 min-w-0">
        <!-- Header -->
        <div class="flex items-center justify-between gap-3 flex-wrap">
            <h1 class="text-[15px] font-semibold text-[#1A1A1A]">Заказы</h1>

            <div class="flex items-center gap-3">
                <!-- View switch -->
                <div class="inline-flex rounded-lg border border-[#E8E6E0] bg-white p-0.5">
                    <button
                        type="button"
                        class="px-3 py-1.5 text-[12px] rounded-md transition-colors flex items-center gap-1.5"
                        :class="view === 'list' ? 'bg-[#1A1A1A] text-white' : 'text-[#666] hover:text-[#1A1A1A]'"
                        @click="view = 'list'"
                    >
                        <Icon name="heroicons:list-bullet" class="w-3.5 h-3.5" />
                        Список
                    </button>
                    <button
                        type="button"
                        class="px-3 py-1.5 text-[12px] rounded-md transition-colors flex items-center gap-1.5"
                        :class="view === 'kanban' ? 'bg-[#1A1A1A] text-white' : 'text-[#666] hover:text-[#1A1A1A]'"
                        @click="view = 'kanban'"
                    >
                        <Icon name="heroicons:view-columns" class="w-3.5 h-3.5" />
                        Канбан
                    </button>
                </div>

                <div v-if="store.pagination" class="text-[12px] text-[#ABABAB]">
                    Всего: {{ store.pagination.total }}
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white border border-[#E8E6E0] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div class="relative sm:col-span-2">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ABABAB]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                    v-model="search"
                    @input="onSearchInput"
                    type="text"
                    placeholder="Номер, телефон, имя…"
                    class="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[13px] text-[#1A1A1A] placeholder-[#C0BEB8] outline-none focus:border-[#1A1A1A] transition-colors"
                />
            </div>
            <AdminStatusFilter
                v-if="view === 'list'"
                v-model="status"
            />
            <div v-else class="text-[12px] text-[#999] flex items-center px-3">
                Перетащите карточку, чтобы сменить статус
            </div>
            <div class="grid grid-cols-2 gap-2">
                <input
                    v-model="dateFrom"
                    type="date"
                    class="px-2 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                />
                <input
                    v-model="dateTo"
                    type="date"
                    class="px-2 py-2.5 rounded-lg border border-[#E8E6E0] bg-white text-[12px] text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="store.loading" class="flex justify-center py-12">
            <div class="w-5 h-5 border-2 border-[#E8E6E0] border-t-[#1A1A1A] rounded-full animate-spin" />
        </div>

        <!-- Empty -->
        <div v-else-if="!store.orders.length" class="bg-white border border-[#E8E6E0] rounded-xl px-5 py-12 text-center text-[13px] text-[#C0BEB8]">
            Заказов не найдено
        </div>

        <!-- ──────── KANBAN ──────── -->
        <template v-else-if="view === 'kanban'">
            <div class="w-full overflow-x-auto pb-2 snap-x snap-mandatory sm:snap-none">
                <div class="flex gap-2 sm:gap-3 w-max">
                    <div
                        v-for="col in KANBAN_COLUMNS"
                        :key="col.status"
                        class="w-[80vw] max-w-[300px] sm:w-[260px] md:w-[280px] flex-shrink-0 snap-start bg-[#FAFAF8] border border-[#E8E6E0] rounded-xl flex flex-col max-h-[calc(100vh-320px)] sm:max-h-[calc(100vh-260px)]"
                        :class="dragOverStatus === col.status ? 'ring-2 ring-[#1A1A1A] ring-offset-1' : ''"
                        @dragover="onDragOver($event, col.status)"
                        @dragleave="onDragLeave(col.status)"
                        @drop="onDrop($event, col.status)"
                    >
                        <!-- column header -->
                        <div class="flex items-center justify-between px-3 py-2.5 border-b border-[#E8E6E0]">
                            <div class="flex items-center gap-2">
                                <span class="w-2 h-2 rounded-full" :class="col.accent" />
                                <span class="text-[12px] font-semibold text-[#1A1A1A]">{{ col.label }}</span>
                            </div>
                            <span class="text-[11px] text-[#999] bg-white border border-[#E8E6E0] rounded-full px-2 py-0.5">
                                {{ columns[col.status].length }}
                            </span>
                        </div>

                        <!-- cards -->
                        <div class="flex-1 overflow-y-auto p-2 space-y-2">
                            <div
                                v-for="o in columns[col.status]"
                                :key="o.id"
                                draggable="true"
                                class="group bg-white border border-[#E8E6E0] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#1A1A1A] hover:shadow-sm transition"
                                :class="[
                                    draggedId === o.id ? 'opacity-40' : '',
                                    savingId === o.id ? 'pointer-events-none opacity-60' : '',
                                ]"
                                @dragstart="onDragStart($event, o)"
                                @dragend="onDragEnd"
                                @click="navigateTo(`/admin/orders/${o.id}`)"
                            >
                                <div class="flex items-start justify-between gap-2">
                                    <div class="text-[12px] font-semibold text-[#1A1A1A]">{{ o.number }}</div>
                                    <div class="text-[12px] font-bold text-[#1A1A1A]">{{ formatPrice(o.total) }} ₽</div>
                                </div>
                                <div class="mt-1 text-[11px] text-[#666] truncate">{{ o.customer_name }}</div>
                                <div class="text-[11px] font-mono text-[#999] truncate">{{ o.customer_phone }}</div>
                                <div class="mt-2 flex items-center justify-between text-[10px] text-[#999]">
                                    <span class="truncate max-w-[55%]">{{ DELIVERY_METHOD_LABELS[o.delivery_method] }}</span>
                                    <span>{{ formatDate(o.created_at) }}</span>
                                </div>
                            </div>

                            <div v-if="!columns[col.status].length" class="text-center text-[11px] text-[#C0BEB8] py-6">
                                Пусто
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <!-- ──────── LIST ──────── -->
        <template v-else>
            <!-- Desktop table -->
            <div class="hidden sm:block bg-white border border-[#E8E6E0] rounded-xl overflow-hidden">
                <table class="w-full text-[13px]">
                    <thead class="bg-[#FAFAF8]">
                    <tr class="text-left text-[#888]">
                        <th class="px-4 py-3 font-medium">№</th>
                        <th class="px-4 py-3 font-medium">Дата</th>
                        <th class="px-4 py-3 font-medium">Клиент</th>
                        <th class="px-4 py-3 font-medium">Доставка</th>
                        <th class="px-4 py-3 font-medium">Статус</th>
                        <th class="px-4 py-3 font-medium text-right">Сумма</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr
                        v-for="o in store.orders"
                        :key="o.id"
                        class="border-t border-[#F2F0EA] hover:bg-[#FAFAF8] cursor-pointer"
                        @click="navigateTo(`/admin/orders/${o.id}`)"
                    >
                        <td class="px-4 py-3 font-medium text-[#1A1A1A]">{{ o.number }}</td>
                        <td class="px-4 py-3 text-[#666]">{{ formatDate(o.created_at) }}</td>
                        <td class="px-4 py-3">
                            <div class="text-[#1A1A1A]">{{ o.customer_name }}</div>
                            <div class="text-[11px] text-[#999] font-mono">{{ o.customer_phone }}</div>
                        </td>
                        <td class="px-4 py-3 text-[#666]">{{ DELIVERY_METHOD_LABELS[o.delivery_method] }}</td>
                        <td class="px-4 py-3">
                            <AdminOrderStatusPicker
                                :model-value="o.status"
                                :loading="statusSavingId === o.id"
                                @change="changeStatusFromList(o, $event)"
                            />
                        </td>
                        <td class="px-4 py-3 text-right font-semibold text-[#1A1A1A]">{{ formatPrice(o.total) }} ₽</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <!-- Mobile cards -->
            <div class="sm:hidden space-y-2">
                <div
                    v-for="o in store.orders"
                    :key="o.id"
                    class="bg-white border border-[#E8E6E0] rounded-xl p-4 cursor-pointer"
                    @click="navigateTo(`/admin/orders/${o.id}`)"
                >
                    <div class="flex justify-between items-start gap-2">
                        <div class="min-w-0">
                            <div class="text-[13px] font-semibold text-[#1A1A1A]">{{ o.number }}</div>
                            <div class="text-[11px] text-[#999] mt-0.5">{{ formatDate(o.created_at) }}</div>
                        </div>
                        <AdminOrderStatusPicker
                            :model-value="o.status"
                            :loading="statusSavingId === o.id"
                            @change="changeStatusFromList(o, $event)"
                        />
                    </div>
                    <div class="mt-2 text-[12px] text-[#666]">{{ o.customer_name }} · {{ o.customer_phone }}</div>
                    <div class="mt-1 flex justify-between items-center">
                        <span class="text-[11px] text-[#999]">{{ DELIVERY_METHOD_LABELS[o.delivery_method] }}</span>
                        <span class="text-[14px] font-bold text-[#1A1A1A]">{{ formatPrice(o.total) }} ₽</span>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="store.pagination && store.pagination.last_page > 1" class="flex items-center justify-center gap-2 pt-2">
                <button
                    class="px-3 py-1.5 rounded-lg border border-[#E8E6E0] text-[12px] hover:bg-[#FAFAF8] disabled:opacity-40"
                    :disabled="store.pagination.current_page <= 1"
                    @click="changePage(store.pagination.current_page - 1)"
                >Назад</button>
                <span class="text-[12px] text-[#666]">
                    Страница {{ store.pagination.current_page }} из {{ store.pagination.last_page }}
                </span>
                <button
                    class="px-3 py-1.5 rounded-lg border border-[#E8E6E0] text-[12px] hover:bg-[#FAFAF8] disabled:opacity-40"
                    :disabled="store.pagination.current_page >= store.pagination.last_page"
                    @click="changePage(store.pagination.current_page + 1)"
                >Вперёд</button>
            </div>
        </template>
    </div>
</template>