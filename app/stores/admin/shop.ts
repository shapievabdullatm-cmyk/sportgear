import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Warehouse } from './warehouse'

export interface WorkingHoursBreak {
    from: string
    to: string
}

export interface WorkingHoursDay {
    day: number          // 1..7 (1 = Понедельник, 7 = Воскресенье)
    is_open: boolean
    open?: string | null
    close?: string | null
    break?: WorkingHoursBreak[] | null
    note?: string | null
}

export interface Shop {
    id: number
    external_id: string | null
    slug: string | null
    name: string
    description: string | null
    address: string | null
    city: string | null
    latitude: number | null
    longitude: number | null
    phone: string | null
    email: string | null
    working_hours: WorkingHoursDay[] | null
    metadata: Record<string, unknown> | null
    is_active: boolean
    sort_order: number
    pickup_enabled?: boolean
    pickup_min_lead_minutes?: number
    pickup_slot_minutes?: number
    pickup_max_per_slot?: number
    pickup_advance_days?: number
    warehouses?: Warehouse[]
    created_at?: string
    updated_at?: string
}

export type ShopPayload = Partial<Omit<Shop, 'id' | 'warehouses' | 'created_at' | 'updated_at'>> & {
    warehouse_ids?: number[]
}

export const useShopStore = defineStore('shop', () => {
    const { $api } = useApi()
    const shops = ref<Shop[]>([])
    const loading = ref(false)

    async function fetchAll(params: { q?: string; is_active?: boolean } = {}) {
        loading.value = true
        try {
            const query = new URLSearchParams()
            if (params.q) query.set('q', params.q)
            if (typeof params.is_active === 'boolean') query.set('is_active', params.is_active ? '1' : '0')
            const url = '/admin/shops' + (query.toString() ? `?${query.toString()}` : '')
            const res = await $api<{ data: Shop[] } | Shop[]>(url)
            shops.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function fetchOne(id: number): Promise<Shop> {
        return await $api<Shop>(`/admin/shops/${id}`)
    }

    async function store(data: ShopPayload): Promise<Shop> {
        const result = await $api<Shop>('/admin/shops', { method: 'POST', body: data })
        await fetchAll()
        return result
    }

    async function update(id: number, data: ShopPayload): Promise<Shop> {
        const result = await $api<Shop>(`/admin/shops/${id}`, { method: 'PUT', body: data })
        await fetchAll()
        return result
    }

    async function toggle(id: number): Promise<Shop> {
        const result = await $api<Shop>(`/admin/shops/${id}/toggle`, { method: 'POST' })
        const idx = shops.value.findIndex(s => s.id === id)
        if (idx !== -1) shops.value[idx] = { ...shops.value[idx], ...result }
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/shops/${id}`, { method: 'DELETE' })
        shops.value = shops.value.filter(s => s.id !== id)
    }

    async function reorder(items: { id: number; sort_order: number }[]) {
        await $api('/admin/shops/reorder', { method: 'POST', body: { items } })
    }

    return { shops, loading, fetchAll, fetchOne, store, update, toggle, destroy, reorder }
})