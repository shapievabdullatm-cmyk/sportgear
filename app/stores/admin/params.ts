import { defineStore } from 'pinia'
import type { Param, FilterTypeItem } from '~/types/param'

const BASE = '/admin/params'

interface PaginationMeta {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
}

export const useParamStore = defineStore('param', () => {
    const params      = ref<Param[]>([])
    const filterTypes = ref<FilterTypeItem[]>([])
    const current     = ref<Param | null>(null)
    const pagination  = ref<PaginationMeta | null>(null)

    // ── Index ──────────────────────────────────────────────────────────────

    async function fetchAll(options?: { page?: number; per_page?: number; search?: string }) {
        const { $api } = useApi()

        if (options?.page || options?.per_page || options?.search) {
            // Серверная пагинация
            const queryParams = new URLSearchParams()
            if (options.page) queryParams.append('page', String(options.page))
            if (options.per_page) queryParams.append('per_page', String(options.per_page))
            if (options.search) queryParams.append('search', options.search)

            const res = await $api<{ data: Param[]; meta: PaginationMeta }>(`${BASE}?${queryParams}`)
            params.value = res.data
            pagination.value = res.meta
        } else {
            // Загрузка всех данных (для обратной совместимости)
            const res = await $api<{ data: Param[] }>(BASE)
            params.value = res.data
            pagination.value = null
        }
    }

    // ── Create page ────────────────────────────────────────────────────────

    async function fetchCreateData() {
        const { $api } = useApi()
        const data = await $api<{ filterTypes: FilterTypeItem[] }>(`${BASE}/create`)
        filterTypes.value = data.filterTypes
    }

    // ── Edit page ──────────────────────────────────────────────────────────

    async function fetchEditData(id: number) {
        const { $api } = useApi()
        const data = await $api<{ param: Param; filterTypes: FilterTypeItem[] }>(`${BASE}/${id}/edit`)
        current.value     = data.param
        filterTypes.value = data.filterTypes
    }

    // ── Store ──────────────────────────────────────────────────────────────

    async function store(payload: Partial<Param> & { options?: { value: string; slug?: string }[] }) {
        const { $api } = useApi()
        const created = await $api<Param>(BASE, { method: 'POST', body: payload })
        params.value.push(created)
        return created
    }

    // ── Update ─────────────────────────────────────────────────────────────

    async function update(
        id: number,
        payload: Partial<Param> & { options?: { value: string; slug?: string }[] },
    ) {
        const { $api } = useApi()
        const updated = await $api<Param>(`${BASE}/${id}`, { method: 'PATCH', body: payload })
        current.value = updated
        const idx = params.value.findIndex((p) => p.id === id)
        if (idx !== -1) params.value[idx] = updated
        return updated
    }

    // ── Destroy ────────────────────────────────────────────────────────────

    async function destroy(id: number) {
        const { $api } = useApi()
        await $api(`${BASE}/${id}`, { method: 'DELETE' })
        params.value = params.value.filter((p) => p.id !== id)
    }

    return {
        params,
        filterTypes,
        current,
        pagination,
        fetchAll,
        fetchCreateData,
        fetchEditData,
        store,
        update,
        destroy,
    }
})