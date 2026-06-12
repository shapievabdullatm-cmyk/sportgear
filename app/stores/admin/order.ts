import { defineStore } from 'pinia'
import type { Order, OrderItem, OrderPaginated, OrderStatus } from '~/types/order'

export interface ProductSearchResult {
    id: number
    title: string
    size: string | null
    article: string | null
    price: number
    image: string | null
    available: number
}

export interface AdminOrderListFilters {
    search?: string
    status?: OrderStatus | ''
    date_from?: string
    date_to?: string
    page?: number
    per_page?: number
}

export const useAdminOrderStore = defineStore('admin-order', () => {
    const orders = ref<Order[]>([])
    const loading = ref(false)
    const pagination = ref<{ current_page: number; last_page: number; total: number } | null>(null)

    async function fetchAll(filters: AdminOrderListFilters = {}) {
        const { $api } = useApi()
        loading.value = true
        try {
            const qs = new URLSearchParams()
            if (filters.search)    qs.set('search',    filters.search)
            if (filters.status)    qs.set('status',    filters.status)
            if (filters.date_from) qs.set('date_from', filters.date_from)
            if (filters.date_to)   qs.set('date_to',   filters.date_to)
            if (filters.page)      qs.set('page',      String(filters.page))
            if (filters.per_page)  qs.set('per_page',  String(filters.per_page))

            const url = '/admin/orders' + (qs.toString() ? `?${qs.toString()}` : '')
            const res = await $api<OrderPaginated>(url)
            orders.value = res.data
            pagination.value = {
                current_page: res.current_page,
                last_page:    res.last_page,
                total:        res.total,
            }
        } finally {
            loading.value = false
        }
    }

    async function fetchOne(id: number | string): Promise<Order> {
        const { $api } = useApi()
        return await $api<Order>(`/admin/orders/${id}`)
    }

    async function updateStatus(id: number, status: OrderStatus): Promise<Order> {
        const { $api } = useApi()
        const order = await $api<Order>(`/admin/orders/${id}/status`, {
            method: 'PATCH',
            body:   { status },
        })
        const idx = orders.value.findIndex(o => o.id === id)
        if (idx !== -1) orders.value[idx] = order
        return order
    }

    function patchLocalStatus(id: number, status: OrderStatus) {
        const idx = orders.value.findIndex(o => o.id === id)
        if (idx === -1) return
        const current = orders.value[idx]
        if (!current) return
        orders.value[idx] = { ...current, status }
    }

    async function updateAdminComment(id: number, admin_comment: string): Promise<Order> {
        const { $api } = useApi()
        return await $api<Order>(`/admin/orders/${id}/admin-comment`, {
            method: 'PATCH',
            body:   { admin_comment },
        })
    }

    async function updateTrackingNumber(id: number, tracking_number: string | null): Promise<Order> {
        const { $api } = useApi()
        return await $api<Order>(`/admin/orders/${id}/tracking`, {
            method: 'PATCH',
            body:   { tracking_number },
        })
    }

    async function updateItemWarehouse(orderId: number, itemId: number, warehouse_id: number): Promise<OrderItem> {
        const { $api } = useApi()
        return await $api<OrderItem>(`/admin/orders/${orderId}/items/${itemId}/warehouse`, {
            method: 'PATCH',
            body:   { warehouse_id },
        })
    }

    async function addItem(orderId: number, productId: number, quantity: number, price?: number, force = false): Promise<Order> {
        const { $api } = useApi()
        const res = await $api<{ order: Order }>(`/admin/orders/${orderId}/items`, {
            method: 'POST',
            body: { product_id: productId, quantity, price, force },
        })
        return res.order
    }

    async function updateItem(orderId: number, itemId: number, payload: { quantity?: number; price?: number; force?: boolean }): Promise<Order> {
        const { $api } = useApi()
        const res = await $api<{ order: Order }>(`/admin/orders/${orderId}/items/${itemId}`, {
            method: 'PATCH',
            body: payload,
        })
        return res.order
    }

    async function restoreItem(orderId: number, eventId: number): Promise<Order> {
        const { $api } = useApi()
        const res = await $api<{ order: Order }>(`/admin/orders/${orderId}/items/restore`, {
            method: 'POST',
            body: { event_id: eventId },
        })
        return res.order
    }

    async function removeItem(orderId: number, itemId: number): Promise<Order> {
        const { $api } = useApi()
        const res = await $api<{ order: Order }>(`/admin/orders/${orderId}/items/${itemId}`, {
            method: 'DELETE',
        })
        return res.order
    }

    async function searchProducts(q: string): Promise<ProductSearchResult[]> {
        const { $api } = useApi()
        if (q.trim().length < 2) return []
        return await $api<ProductSearchResult[]>(`/admin/orders/products/search?q=${encodeURIComponent(q)}`)
    }

    return {
        orders, loading, pagination,
        fetchAll, fetchOne,
        updateStatus, patchLocalStatus, updateAdminComment, updateTrackingNumber, updateItemWarehouse,
        addItem, updateItem, removeItem, restoreItem, searchProducts,
    }
})