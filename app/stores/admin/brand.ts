// stores/admin/brand.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Brand {
    id: number
    name: string
    slug: string
    image: string | null
    created_at?: string
    updated_at?: string
}

export const useBrandStore = defineStore('brand', () => {
    const { $api } = useApi()
    const brands = ref<Brand[]>([])
    const loading = ref(false)

    async function fetchAll() {
        loading.value = true
        try {
            const res = await $api<{ data: Brand[] } | Brand[]>('/admin/brands')
            brands.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function store(fd: FormData): Promise<Brand> {
        const result = await $api<Brand>('/admin/brands', { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function update(id: number, fd: FormData): Promise<Brand> {
        const result = await $api<Brand>(`/admin/brands/${id}`, { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/brands/${id}`, { method: 'DELETE' })
        brands.value = brands.value.filter(b => b.id !== id)
    }

    return { brands, loading, fetchAll, store, update, destroy }
})