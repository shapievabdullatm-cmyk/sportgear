import { defineStore } from 'pinia'
import type { Order, OrderCreatePayload, OrderPaginated } from '~/types/order'

export const useOrderStore = defineStore('order', () => {
    const orders = ref<Order[]>([])
    const loading = ref(false)
    const loadingMore = ref(false)
    const submitting = ref(false)
    const pagination = ref<{ current_page: number; last_page: number; total: number } | null>(null)
    const perPage = 10

    const hasMore = computed(() => {
        const p = pagination.value
        return p ? p.current_page < p.last_page : false
    })

    async function fetchAll(page = 1) {
        const { $api } = useApi()
        const append = page > 1
        if (append) loadingMore.value = true
        else loading.value = true
        try {
            const res = await $api<OrderPaginated>(`/orders?page=${page}&per_page=${perPage}`)
            orders.value = append ? [...orders.value, ...res.data] : res.data
            pagination.value = {
                current_page: res.current_page,
                last_page:    res.last_page,
                total:        res.total,
            }
        } finally {
            loading.value = false
            loadingMore.value = false
        }
    }

    async function fetchNext() {
        if (loadingMore.value || !hasMore.value) return
        await fetchAll((pagination.value?.current_page ?? 0) + 1)
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

    return { orders, loading, loadingMore, submitting, pagination, hasMore, fetchAll, fetchNext, fetchOne, create, cancel }
})