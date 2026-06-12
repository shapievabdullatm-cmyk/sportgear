import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Product } from '~/types/product'
import type { ApiResponse } from '~/types/api'

export const useProductGroupStore = defineStore('product-group', () => {
    const { $api } = useApi()

    const members = ref<Product[]>([])
    const loading = ref(false)
    const saving = ref(false)

    async function fetchMembers(productId: number) {
        loading.value = true
        try {
            const res = await $api<ApiResponse<Product[]>>(`/admin/products/${productId}/group-members`)
            members.value = res.data
            return members.value
        } finally {
            loading.value = false
        }
    }

    async function merge(productIds: number[]) {
        saving.value = true
        try {
            const res = await $api<ApiResponse<Product[]>>('/admin/product-groups/merge', {
                method: 'POST',
                body: { product_ids: productIds },
            })
            members.value = res.data
            return members.value
        } finally {
            saving.value = false
        }
    }

    async function detach(groupId: number, productId: number) {
        saving.value = true
        try {
            const res = await $api<ApiResponse<Product[]>>(`/admin/product-groups/${groupId}/detach`, {
                method: 'POST',
                body: { product_id: productId },
            })
            members.value = res.data
            return members.value
        } finally {
            saving.value = false
        }
    }

    function reset() {
        members.value = []
    }

    return {
        members,
        loading,
        saving,
        fetchMembers,
        merge,
        detach,
        reset,
    }
})