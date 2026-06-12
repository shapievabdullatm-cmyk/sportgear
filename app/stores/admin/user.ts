import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Pagination {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
}

export interface AdminAddress {
    id?: number
    title: string
    full_address: string
    lat?: number | null
    lon?: number | null
    city?: string | null
    street?: string | null
    house: string
    apartment?: string | null
    entrance?: string | null
    floor?: string | null
    intercom?: string | null
    comment?: string | null
    is_default: boolean
}

export interface AdminUserListItem {
    id: number
    first_name: string | null
    last_name: string | null
    phone: string | null
    email: string | null
    gender: 'male' | 'female' | 'other' | null
    addresses_count: number
    created_at: string | null
}

export interface AdminUserDetail {
    id: number
    first_name: string | null
    last_name: string | null
    phone: string | null
    email: string | null
    pending_email: string | null
    gender: 'male' | 'female' | 'other' | null
    birth_date: string | null
    addresses: AdminAddress[]
    roles: string[]
    created_at: string | null
    updated_at: string | null
}

export interface UserFormPayload {
    first_name?: string | null
    last_name?: string | null
    phone: string
    email?: string | null
    gender?: 'male' | 'female' | 'other' | null
    birth_date?: string | null
    addresses: AdminAddress[]
}

export const useUserStore = defineStore('admin-user', () => {
    const { $api } = useApi()

    const users      = ref<AdminUserListItem[]>([])
    const loading    = ref(false)
    const saving     = ref(false)
    const pagination = ref<Pagination | null>(null)

    async function fetchAll(params?: { page?: number; per_page?: number; search?: string }) {
        loading.value = true
        try {
            const qs = new URLSearchParams()
            if (params?.page)     qs.append('page',     String(params.page))
            if (params?.per_page) qs.append('per_page', String(params.per_page))
            if (params?.search)   qs.append('search',   params.search)

            const url = `/admin/users${qs.toString() ? '?' + qs.toString() : ''}`
            const res = await $api<{ data: AdminUserListItem[]; meta?: Pagination }>(url)

            users.value = res.data ?? []
            if (res.meta) pagination.value = res.meta
        } finally {
            loading.value = false
        }
    }

    async function fetchOne(id: number): Promise<AdminUserDetail> {
        const res = await $api<{ data: AdminUserDetail }>(`/admin/users/${id}/edit`)
        return res.data
    }

    async function create(payload: UserFormPayload): Promise<AdminUserDetail> {
        saving.value = true
        try {
            const res = await $api<{ data: AdminUserDetail }>('/admin/users', {
                method: 'POST',
                body:   payload,
            })
            return res.data
        } finally {
            saving.value = false
        }
    }

    async function update(id: number, payload: UserFormPayload): Promise<AdminUserDetail> {
        saving.value = true
        try {
            const res = await $api<{ data: AdminUserDetail }>(`/admin/users/${id}`, {
                method: 'PATCH',
                body:   payload,
            })
            return res.data
        } finally {
            saving.value = false
        }
    }

    async function destroy(id: number) {
        saving.value = true
        try {
            await $api(`/admin/users/${id}`, { method: 'DELETE' })
            users.value = users.value.filter(u => u.id !== id)
        } finally {
            saving.value = false
        }
    }

    return {
        users,
        loading,
        saving,
        pagination,
        fetchAll,
        fetchOne,
        create,
        update,
        destroy,
    }
})