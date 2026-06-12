import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface ManufacturingCountry {
    id: number
    name: string
    flag_url: string | null
    created_at?: string
    updated_at?: string
}

export const useManufacturingCountryStore = defineStore('manufacturingCountry', () => {
    const { $api } = useApi()
    const countries = ref<ManufacturingCountry[]>([])
    const loading = ref(false)

    async function fetchAll() {
        loading.value = true
        try {
            const res = await $api<{ data: ManufacturingCountry[] } | ManufacturingCountry[]>('/admin/manufacturing-countries')
            countries.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function store(fd: FormData): Promise<ManufacturingCountry> {
        const result = await $api<ManufacturingCountry>('/admin/manufacturing-countries', { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function update(id: number, fd: FormData): Promise<ManufacturingCountry> {
        const result = await $api<ManufacturingCountry>(`/admin/manufacturing-countries/${id}`, { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/manufacturing-countries/${id}`, { method: 'DELETE' })
        countries.value = countries.value.filter(c => c.id !== id)
    }

    return { countries, loading, fetchAll, store, update, destroy }
})