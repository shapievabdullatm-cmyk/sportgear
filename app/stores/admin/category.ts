import { defineStore } from 'pinia'
import { useApi } from '~/composables/useApi'

export interface ParamItem {
    id: number
    sort: number
}

export interface CategoryParam {
    id: number
    title: string
    type_label: string | null
}

export interface Category {
    id: number
    title: string
    parent_id: number | null
    position: number
    is_leaf: boolean
    param_ids: number[]
    param_items: ParamItem[]
    children?: Category[]
    parent?: Category | null
    created_at: string
    updated_at: string
}

export interface CategoryFormData {
    title: string
    parent_id: number | null
    param_items: ParamItem[]
}

export const useCategoryStore = defineStore('category', () => {
    const { $api } = useApi()

    const categories = ref<Category[]>([])
    const currentCategory = ref<Category | null>(null)
    const availableCategories = ref<Category[]>([])
    const availableParams = ref<CategoryParam[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    async function fetchAll() {
        loading.value = true
        error.value = null
        try {
            const res = await $api<{ data: Category[] } | Category[]>('/admin/categories')
            categories.value = Array.isArray(res) ? res : res.data
        } catch (e: any) {
            error.value = e?.data?.message ?? 'Ошибка загрузки'
        } finally {
            loading.value = false
        }
    }

    async function fetchCreate() {
        loading.value = true
        error.value = null
        try {
            const res = await $api<{
                category: Category
                categories: { data: Category[] } | Category[]
                params: CategoryParam[]
            }>('/admin/categories/create')
            currentCategory.value = res.category
            availableCategories.value = Array.isArray(res.categories) ? res.categories : res.categories.data
            availableParams.value = res.params
        } catch (e: any) {
            error.value = e?.data?.message ?? 'Ошибка загрузки'
        } finally {
            loading.value = false
        }
    }

    async function fetchEdit(id: number) {
        loading.value = true
        error.value = null
        try {
            const res = await $api<{
                category: { data: Category } | Category
                categories: { data: Category[] } | Category[]
                params: CategoryParam[]
            }>(`/admin/categories/${id}/edit`)
            // category может быть обёрнут в data (CategoryResource::make) или нет
            currentCategory.value = 'data' in res.category && !('id' in res.category)
                ? (res.category as { data: Category }).data
                : res.category as Category
            availableCategories.value = Array.isArray(res.categories) ? res.categories : res.categories.data
            availableParams.value = res.params
        } catch (e: any) {
            error.value = e?.data?.message ?? 'Ошибка загрузки'
        } finally {
            loading.value = false
        }
    }

    async function store(formData: CategoryFormData): Promise<Category> {
        const data = await $api<Category>('/admin/categories', {
            method: 'POST',
            body: formData,
        })
        return data
    }

    async function update(id: number, formData: CategoryFormData): Promise<Category> {
        const data = await $api<Category>(`/admin/categories/${id}`, {
            method: 'PATCH',
            body: formData,
        })
        return data
    }

    async function destroy(id: number) {
        await $api(`/admin/categories/${id}`, { method: 'DELETE' })
        categories.value = categories.value.filter(c => c.id !== id)
    }

    return {
        categories,
        currentCategory,
        availableCategories,
        availableParams,
        loading,
        error,
        fetchAll,
        fetchCreate,
        fetchEdit,
        store,
        update,
        destroy,
    }
})