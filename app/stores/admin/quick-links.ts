import { defineStore } from 'pinia'
import type { QuickLink } from "~/types"

export const useQuickLinksStore = defineStore('quickLinks', {
    state: () => ({
        links: [] as QuickLink[],
        loading: false
    }),

    actions: {
        async fetch() {
            const { $api } = useApi()
            this.loading = true
            try {
                const res = await $api<{ data: QuickLink[] }>('/admin/quick-links')
                // Заменяем массив целиком — это реактивно
                this.links = Array.isArray(res.data) ? res.data : []
            } finally {
                this.loading = false
            }
        },

        async create(data: { title: string; url: string }) {
            const { $api } = useApi()
            try {
                const newLink = await $api<QuickLink>('/admin/quick-links', {
                    method: 'POST',
                    body: data
                })

                // Проверяем, что пришло от сервера, прежде чем пушить
                if (newLink && newLink.title) {
                    this.links.unshift(newLink)
                } else {
                    // Если сервер вернул странный ответ, лучше перезагрузить список целиком
                    await this.fetch()
                }
            } catch (e) {
                console.error(e)
                throw e
            }
        },

        async update(id: number, data: { title: string; url: string }) {
            const { $api } = useApi()

            const response = await $api<{ data: QuickLink }>(`/admin/quick-links/${id}`, {
                method: 'PUT',
                body: data
            })

            const updated = response.data || response

            const index = this.links.findIndex(l => l.id === id)
            if (index !== -1 && updated) {
                // Используем splice для гарантированной реактивности
                this.links.splice(index, 1, updated)
            }
        },

        async delete(id: number) {
            const { $api } = useApi()

            try {
                await $api(`/admin/quick-links/${id}`, {
                    method: 'DELETE'
                })

                // Находим индекс элемента
                const index = this.links.findIndex(l => l.id === id)

                // Если нашли — удаляем именно этот элемент через splice
                // Это гарантирует реактивность и лечит ошибку "debuggerEvents"
                if (index !== -1) {
                    this.links.splice(index, 1)
                }
            } catch (e) {
                console.error('Ошибка при удалении:', e)
            }
        }
    }
})