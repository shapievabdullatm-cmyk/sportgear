import { defineStore } from 'pinia'
import type { Product } from '~/types/product'

interface Pagination {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
}

export const useProductStore = defineStore('product', () => {
    const { $api } = useApi()

    const products = ref<Product[]>([])
    const loading  = ref(false)
    const pagination = ref<Pagination | null>(null)

    async function fetchAll(params?: {
        page?: number
        per_page?: number
        search?: string
        status?: 'all' | 'active' | 'inactive'
        stock?: 'all' | 'in_stock' | 'out_of_stock'
    }) {
        loading.value = true
        try {
            const queryParams = new URLSearchParams()
            if (params?.page) queryParams.append('page', String(params.page))
            if (params?.per_page) queryParams.append('per_page', String(params.per_page))
            if (params?.search) queryParams.append('search', params.search)
            if (params?.status && params.status !== 'all') queryParams.append('status', params.status)
            if (params?.stock && params.stock !== 'all') queryParams.append('stock', params.stock)

            const url = `/admin/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`
            const response = await $api<{ data: Product[]; meta?: Pagination }>(url)

            // Фильтруем записи без корректного id (защита от «пустого товара»)
            products.value = (response?.data ?? []).filter(p => p.id != null && p.id > 0)

            // Сохраняем пагинацию
            if (response?.meta) {
                pagination.value = response.meta
            }
        } finally {
            loading.value = false
        }
    }

    async function create(fd: FormData): Promise<Product> {
        const created = await $api<Product>('/admin/products', {
            method:  'POST',
            body:    fd,
            // Не передаём Content-Type — браузер сам выставит multipart/form-data с boundary
            headers: { Accept: 'application/json' },
        })
        if (created?.id) products.value.unshift(created)
        return created
    }

    async function update(id: number, fd: FormData): Promise<Product> {
        const updated = await $api<Product>(`/admin/products/${id}`, {
            method:  'POST',   // Laravel METHOD SPOOFING: fd содержит _method=PATCH
            body:    fd,
            headers: { Accept: 'application/json' },
        })
        const idx = products.value.findIndex(p => p.id === id)
        if (idx !== -1 && updated) products.value.splice(idx, 1, updated)
        return updated
    }

    async function destroy(id: number) {
        if (!id) return   // guard: не отправляем DELETE /products/null
        await $api(`/admin/products/${id}`, {
            method:  'DELETE',
            headers: { Accept: 'application/json' },
        })
        products.value = products.value.filter(p => p.id !== id)
    }

    return { products, loading, pagination, fetchAll, create, update, destroy }
})