import { defineStore } from 'pinia'
import type { WishlistItem } from '~/types/wishlist'
import { useApi } from '~/composables/useApi'
import { useToastStore } from '~/stores/toast'

interface WishlistItemRaw {
    id: number
    product_id: number
    title: string
    slug: string
    price: number
    old_price: number | null
    image: string | null
    size: string | number | null
    parent_id: number | null
    total_stock: number
    is_active: boolean
}

interface WishlistResponse {
    wishlist: {
        id: number
        items: WishlistItemRaw[]
        total_items: number
    }
}

function mapItems(items: WishlistItemRaw[]): WishlistItem[] {
    return items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        title: item.title,
        slug: item.slug,
        price: item.price,
        old_price: item.old_price,
        image: item.image,
        size: item.size,
        parent_id: item.parent_id,
        total_stock: item.total_stock,
        is_active: item.is_active,
    }))
}

export const useWishlistStore = defineStore('wishlist', {
    state: () => ({
        items: [] as WishlistItem[],
        loading: false,
        wishlistId: null as number | null,
        initialized: false,
    }),

    getters: {
        count: (state) => state.items.length,

        isEmpty: (state) => state.items.length === 0,

        isInWishlist: (state) => (productId: number) => {
            return state.items.some(item => item.product_id === productId || item.parent_id === productId)
        },
    },

    actions: {
        async fetchWishlist() {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api<WishlistResponse>('/wishlist')
                this.wishlistId = response.wishlist.id
                this.items = mapItems(response.wishlist.items)
                this.initialized = true
            } catch (error) {
                console.error('Failed to fetch wishlist:', error)
                this.initialized = true
            } finally {
                this.loading = false
            }
        },

        async addToWishlist(product: {
            id: number
            title: string
            slug: string
            price: number
            old_price: number | null
            images: Array<{ url: string }>
            parent_id: number | null
            total_stock?: number
        }) {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api<WishlistResponse>('/wishlist', {
                    method: 'POST',
                    body: { product_id: product.id },
                })
                this.wishlistId = response.wishlist.id
                this.items = mapItems(response.wishlist.items)

                const toastStore = useToastStore()
                toastStore.wishlistAdded()

                return { success: true }
            } catch (error: any) {
                console.error('Failed to add to wishlist:', error)

                const toastStore = useToastStore()
                toastStore.error(error.data?.message || 'Не удалось добавить товар в избранное')

                return {
                    success: false,
                    message: error.data?.message || 'Не удалось добавить товар в избранное',
                }
            } finally {
                this.loading = false
            }
        },

        async removeFromWishlist(itemId: number) {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api<WishlistResponse>(`/wishlist/${itemId}`, {
                    method: 'DELETE',
                })
                this.items = mapItems(response.wishlist.items)
            } catch (error) {
                console.error('Failed to remove from wishlist:', error)
            } finally {
                this.loading = false
            }
        },

        async removeByProductId(productId: number) {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api<WishlistResponse>(`/wishlist/product/${productId}`, {
                    method: 'DELETE',
                })
                this.items = mapItems(response.wishlist.items)
            } catch (error) {
                console.error('Failed to remove from wishlist:', error)
            } finally {
                this.loading = false
            }
        },

        async removeByParentId(parentId: number) {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api<WishlistResponse>(`/wishlist/parent/${parentId}`, {
                    method: 'DELETE',
                })
                this.items = mapItems(response.wishlist.items)
            } catch (error) {
                console.error('Failed to remove from wishlist:', error)
            } finally {
                this.loading = false
            }
        },

        async toggleWishlist(product: {
            id: number
            title: string
            slug: string
            price: number
            old_price: number | null
            images: Array<{ url: string }>
            parent_id: number | null
            total_stock?: number
        }) {
            const toastStore = useToastStore()

            if (this.isInWishlist(product.id)) {
                await this.removeByProductId(product.id)
                toastStore.wishlistRemoved()
                return { success: true, action: 'removed' }
            } else {
                const result = await this.addToWishlist(product)
                return { ...result, action: 'added' }
            }
        },

        async clearWishlist() {
            const { $api } = useApi()
            try {
                this.loading = true
                await $api('/wishlist', { method: 'DELETE' })
                this.items = []
            } catch (error) {
                console.error('Failed to clear wishlist:', error)
            } finally {
                this.loading = false
            }
        },

        async checkProduct(productId: number) {
            const { $api } = useApi()
            try {
                const response = await $api<{ in_wishlist: boolean }>(`/wishlist/check/${productId}`)
                return response.in_wishlist
            } catch (error) {
                console.error('Failed to check wishlist:', error)
                return false
            }
        },
    },
})