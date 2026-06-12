import { defineStore } from 'pinia'

export interface Toast {
    id: string
    message: string
    type: 'success' | 'error' | 'cart' | 'wishlist'
    action?: string
    link?: string
    duration?: number
}

export const useToastStore = defineStore('toast', {
    state: () => ({
        toasts: [] as Toast[],
    }),

    actions: {
        addToast(toast: Omit<Toast, 'id'>) {
            const id = Math.random().toString(36).substring(2, 9)
            const duration = toast.duration || 4000

            this.toasts.push({
                ...toast,
                id,
            })

            // Автоматически удаляем toast через duration
            setTimeout(() => {
                this.removeToast(id)
            }, duration)
        },

        removeToast(id: string) {
            const index = this.toasts.findIndex(t => t.id === id)
            if (index > -1) {
                this.toasts.splice(index, 1)
            }
        },

        // Удобные методы для разных типов
        success(message: string, action?: string, link?: string) {
            this.addToast({
                message,
                type: 'success',
                action,
                link,
            })
        },

        error(message: string) {
            this.addToast({
                message,
                type: 'error',
            })
        },

        cart(message: string = 'Товар добавлен в корзину') {
            this.addToast({
                message,
                type: 'cart',
                action: 'Нажмите, чтобы перейти в корзину',
                link: '/cart',
            })
        },

        wishlistAdded(message: string = 'Товар добавлен в избранное') {
            this.addToast({
                message,
                type: 'wishlist',
                action: 'Нажмите, чтобы перейти в избранное',
                link: '/wishlist',
            })
        },

        wishlistRemoved(message: string = 'Товар удален из избранного') {
            this.addToast({
                message,
                type: 'success',
            })
        },
    },
})