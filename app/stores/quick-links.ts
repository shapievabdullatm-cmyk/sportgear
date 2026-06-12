import { defineStore } from 'pinia'
import type { QuickLink } from "~/types"

export const useQuickLinksClientStore = defineStore('quickClientLinks', {
    state: () => ({
        links: [] as QuickLink[],
        loading: false,
        // Добавим флаг, чтобы понимать, была ли успешная загрузка
        fetched: false
    }),

    actions: {
        async fetch() {
            // Если данные уже загружены, выходим из функции
            if (this.fetched || this.links.length > 0) return

            const { $api } = useApi()
            this.loading = true

            try {
                const res = await $api<{ data: QuickLink[] }>('/quick-links')
                this.links = Array.isArray(res.data) ? res.data : []
                this.fetched = true // Помечаем успех
            } catch (error) {
                console.error('Ошибка загрузки ссылок:', error)
            } finally {
                this.loading = false
            }
        },
    }
})