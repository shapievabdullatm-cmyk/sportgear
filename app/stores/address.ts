import { defineStore } from 'pinia'
import type { Address } from '~/types'

export const useAddressStore = defineStore('address', () => {
    const addresses = ref<Address[]>([])
    const loading   = ref(true)

    async function fetchAddresses() {
        const { $api } = useApi()
        loading.value = true
        try {
            addresses.value = await $api<Address[]>('/addresses')
        } finally {
            loading.value = false
        }
    }

    async function addAddress(data: Partial<Address>): Promise<Address> {
        const { $api } = useApi()
        const address = await $api<Address>('/addresses', {
            method: 'POST',
            body:   data,
        })
        if (data.is_default) {
            addresses.value = addresses.value.map(a => ({ ...a, is_default: false }))
        }
        addresses.value.unshift(address)
        return address
    }

    async function removeAddress(id: number) {
        const { $api } = useApi()
        await $api(`/addresses/${id}`, { method: 'DELETE' })
        addresses.value = addresses.value.filter(a => a.id !== id)
    }

    async function updateAddress(id: number, data: Partial<Address>): Promise<Address> {
        const { $api } = useApi()
        const address = await $api<Address>(`/addresses/${id}`, {
            method: 'PATCH',
            body:   data,
        })
        if (data.is_default) {
            addresses.value = addresses.value.map(a => ({ ...a, is_default: a.id === id }))
        }
        addresses.value = addresses.value.map(a => a.id === id ? address : a)
        return address
    }

    async function setDefaultAddress(id: number) {
        const { $api } = useApi()
        const address = await $api<Address>(`/addresses/${id}/default`, { method: 'PATCH' })
        addresses.value = addresses.value.map(a => ({ ...a, is_default: a.id === id }))
        return address
    }

    return { addresses, loading, fetchAddresses, addAddress, updateAddress, removeAddress, setDefaultAddress }
})