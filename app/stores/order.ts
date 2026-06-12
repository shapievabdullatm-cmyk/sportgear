import { defineStore } from 'pinia'
import type { Order, OrderCreatePayload, OrderPaginated } from '~/types/order'

export const useOrderStore = defineStore('order', () => {
    const orders = ref<Order[]>([])
    const loading = ref(false)
    const submitting = ref(false)
    const pagination = ref<{ current_page: number; last_page: number; total: number } | null>(null)

    async function fetchAll(page = 1) {
        const { $api } = useApi()
        loading.value = true
        try {
            const res = await $api<OrderPaginated>(`/orders?page=${page}`)
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
        return await $api<Order>(`/orders/${id}`)
    }

    async function create(payload: OrderCreatePayload): Promise<Order> {
        const { $api } = useApi()
        submitting.value = true
        try {
            return await $api<Order>('/orders', { method: 'POST', body: payload })
        } finally {
            submitting.value = false
        }
    }

    async function cancel(id: number): Promise<Order> {
        const { $api } = useApi()
        const order = await $api<Order>(`/orders/${id}/cancel`, { method: 'POST' })
        const idx = orders.value.findIndex(o => o.id === id)
        if (idx !== -1) orders.value[idx] = order
        return order
    }

    return { orders, loading, submitting, pagination, fetchAll, fetchOne, create, cancel }
})