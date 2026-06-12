// stores/admin/slider.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Slider {
    id: number
    title: string
    link: string
    image: string | null
    mobile_image: string | null
    position: number
}

export const useSliderStore = defineStore('slider', () => {
    const { $api } = useApi()
    const sliders = ref<Slider[]>([])
    const loading = ref(false)

    async function fetchAll() {
        loading.value = true
        try {
            const res = await $api<{ data: Slider[] } | Slider[]>('/admin/sliders')
            sliders.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function store(fd: FormData): Promise<Slider> {
        const result = await $api<Slider>('/admin/sliders', { method: 'POST', body: fd })
        await fetchAll()   // обновляем список
        return result
    }

    async function update(id: number, fd: FormData): Promise<Slider> {
        // fd уже содержит _method=PUT — Laravel spoofing через POST
        const result = await $api<Slider>(`/admin/sliders/${id}`, { method: 'POST', body: fd })
        await fetchAll()   // обновляем список
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/sliders/${id}`, { method: 'DELETE' })
        sliders.value = sliders.value.filter(s => s.id !== id)
    }

    async function reorder(items: { id: number; position: number }[]) {
        await $api('/admin/sliders/reorder', { method: 'POST', body: { items } })
    }

    return { sliders, loading, fetchAll, store, update, destroy, reorder }
})