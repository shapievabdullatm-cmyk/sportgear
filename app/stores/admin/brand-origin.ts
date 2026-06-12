import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface BrandOrigin {
    id: number
    name: string
    flag_url: string | null
    created_at?: string
    updated_at?: string
}

export const useBrandOriginStore = defineStore('brandOrigin', () => {
    const { $api } = useApi()
    const origins = ref<BrandOrigin[]>([])
    const loading = ref(false)

    async function fetchAll() {
        loading.value = true
        try {
            const res = await $api<{ data: BrandOrigin[] } | BrandOrigin[]>('/admin/brand-origins')
            origins.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function store(fd: FormData): Promise<BrandOrigin> {
        const result = await $api<BrandOrigin>('/admin/brand-origins', { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function update(id: number, fd: FormData): Promise<BrandOrigin> {
        const result = await $api<BrandOrigin>(`/admin/brand-origins/${id}`, { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/brand-origins/${id}`, { method: 'DELETE' })
        origins.value = origins.value.filter(o => o.id !== id)
    }

    return { origins, loading, fetchAll, store, update, destroy }
})