import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { BlogCategory } from '~/types/blog'

export const useBlogCategoryStore = defineStore('blogCategory', () => {
    const { $api } = useApi()
    const categories = ref<BlogCategory[]>([])
    const loading = ref(false)

    async function fetchAll() {
        loading.value = true
        try {
            const res = await $api<{ data: BlogCategory[] } | BlogCategory[]>('/admin/blog-categories')
            categories.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function store(data: { name: string; slug?: string; sort_order?: number }): Promise<BlogCategory> {
        const result = await $api<BlogCategory>('/admin/blog-categories', { method: 'POST', body: data })
        await fetchAll()
        return result
    }

    async function update(id: number, data: { name: string; slug?: string; sort_order?: number }): Promise<BlogCategory> {
        const result = await $api<BlogCategory>(`/admin/blog-categories/${id}`, { method: 'PUT', body: data })
        await fetchAll()
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/blog-categories/${id}`, { method: 'DELETE' })
        categories.value = categories.value.filter(c => c.id !== id)
    }

    async function reorder(ids: number[]) {
        await $api('/admin/blog-categories/reorder', { method: 'POST', body: { ids } })
        await fetchAll()
    }

    return { categories, loading, fetchAll, store, update, destroy, reorder }
})