import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Warehouse {
    id: number
    external_id: string | null
    title: string
    is_active: boolean
    created_at?: string
    updated_at?: string
}

export const useWarehouseStore = defineStore('warehouse', () => {
    const { $api } = useApi()
    const warehouses = ref<Warehouse[]>([])
    const loading = ref(false)

    async function fetchAll() {
        loading.value = true
        try {
            const res = await $api<{ data: Warehouse[] } | Warehouse[]>('/admin/warehouses')
            warehouses.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function store(data: Partial<Warehouse>): Promise<Warehouse> {
        const result = await $api<Warehouse>('/admin/warehouses', { method: 'POST', body: data })
        await fetchAll()
        return result
    }

    async function update(id: number, data: Partial<Warehouse>): Promise<Warehouse> {
        const result = await $api<Warehouse>(`/admin/warehouses/${id}`, { method: 'PUT', body: data })
        await fetchAll()
        return result
    }

    async function toggle(id: number): Promise<Warehouse> {
        const result = await $api<Warehouse>(`/admin/warehouses/${id}/toggle`, { method: 'POST' })
        await fetchAll()
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/warehouses/${id}`, { method: 'DELETE' })
        warehouses.value = warehouses.value.filter(w => w.id !== id)
    }

    return { warehouses, loading, fetchAll, store, update, toggle, destroy }
})