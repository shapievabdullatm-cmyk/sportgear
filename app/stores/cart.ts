import { defineStore } from 'pinia'
import type { CartItem } from '~/types/cart'
import { useApi } from '~/composables/useApi'
import { useToastStore } from '~/stores/toast'

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: [] as CartItem[],
        loading: false,
        cartId: null as number | null,
        initialized: false,
    }),

    getters: {
        count: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),

        total: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),

        isEmpty: (state) => state.items.length === 0,
    },

    actions: {
        async fetchCart() {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api('/cart')
                this.cartId = response.cart.id
                this.items = response.cart.items.map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id,
                    title: item.title,
                    slug: item.slug,
                    price: item.price,
                    old_price: null,
                    image: item.image,
                    quantity: item.quantity,
                    size: item.size,
                    parent_id: item.parent_id,
                    total_stock: item.total_stock,
                }))
                this.initialized = true
            } catch (error) {
                console.error('Failed to fetch cart:', error)
                this.initialized = true
            } finally {
                this.loading = false
            }
        },

        async addToCart(product: {
            id: number
            title: string
            slug: string
            price: number
            old_price: number | null
            images: Array<{ url: string }>
            parent_id: number | null
            total_stock?: number
        }, quantity: number = 1) {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api('/cart', {
                    method: 'POST',
                    body: {
                        product_id: product.id,
                        quantity,
                    },
                })
                this.cartId = response.cart.id
                this.items = response.cart.items.map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id,
                    title: item.title,
                    slug: item.slug,
                    price: item.price,
                    old_price: null,
                    image: item.image,
                    quantity: item.quantity,
                    size: item.size,
                    parent_id: item.parent_id,
                    total_stock: item.total_stock,
                }))

                // Показываем toast уведомление
                const toastStore = useToastStore()
                toastStore.cart()

                return { success: true }
            } catch (error: any) {
                console.error('Failed to add to cart:', error)

                // Показываем ошибку через toast
                const toastStore = useToastStore()
                toastStore.error(error.data?.message || 'Не удалось добавить товар в корзину')

                return {
                    success: false,
                    message: error.data?.message || 'Не удалось добавить товар в корзину'
                }
            } finally {
                this.loading = false
            }
        },

        async updateQuantity(itemId: number, quantity: number) {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api(`/cart/${itemId}`, {
                    method: 'PATCH',
                    body: { quantity },
                })
                this.items = response.cart.items.map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id,
                    title: item.title,
                    slug: item.slug,
                    price: item.price,
                    old_price: null,
                    image: item.image,
                    quantity: item.quantity,
                    size: item.size,
                    parent_id: item.parent_id,
                    total_stock: item.total_stock,
                }))
            } catch (error) {
                console.error('Failed to update quantity:', error)
            } finally {
                this.loading = false
            }
        },

        async removeFromCart(itemId: number) {
            const { $api } = useApi()
            try {
                this.loading = true
                const response = await $api(`/cart/${itemId}`, {
                    method: 'DELETE',
                })
                this.items = response.cart.items.map((item: any) => ({
                    id: item.id,
                    product_id: item.product_id,
                    title: item.title,
                    slug: item.slug,
                    price: item.price,
                    old_price: null,
                    image: item.image,
                    quantity: item.quantity,
                    size: item.size,
                    parent_id: item.parent_id,
                    total_stock: item.total_stock,
                }))
            } catch (error) {
                console.error('Failed to remove from cart:', error)
            } finally {
                this.loading = false
            }
        },

        async incrementQuantity(itemId: number) {
            const item = this.items.find(i => i.id === itemId)
            if (item && item.quantity < item.total_stock) {
                await this.updateQuantity(itemId, item.quantity + 1)
            }
        },

        async decrementQuantity(itemId: number) {
            const item = this.items.find(i => i.id === itemId)
            if (item) {
                if (item.quantity > 1) {
                    await this.updateQuantity(itemId, item.quantity - 1)
                } else {
                    await this.removeFromCart(itemId)
                }
            }
        },

        async clearCart() {
            const { $api } = useApi()
            try {
                this.loading = true
                await $api('/cart', {
                    method: 'DELETE',
                })
                this.items = []
            } catch (error) {
                console.error('Failed to clear cart:', error)
            } finally {
                this.loading = false
            }
        },
    },
})