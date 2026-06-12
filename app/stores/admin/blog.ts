// stores/admin/blog.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Blog } from '~/types/blog'

export const useBlogStore = defineStore('blog', () => {
    const { $api } = useApi()
    const blogs = ref<Blog[]>([])
    const loading = ref(false)

    async function fetchAll() {
        loading.value = true
        try {
            const res = await $api<{ data: Blog[] } | Blog[]>('/admin/blogs')
            blogs.value = Array.isArray(res) ? res : res.data
        } finally {
            loading.value = false
        }
    }

    async function fetchOne(id: number): Promise<{ blog: Blog }> {
        return await $api<{ blog: Blog }>(`/admin/blogs/${id}/edit`)
    }

    async function store(fd: FormData): Promise<Blog> {
        const result = await $api<Blog>('/admin/blogs', { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function update(id: number, fd: FormData): Promise<Blog> {
        const result = await $api<Blog>(`/admin/blogs/${id}`, { method: 'POST', body: fd })
        await fetchAll()
        return result
    }

    async function destroy(id: number) {
        await $api(`/admin/blogs/${id}`, { method: 'DELETE' })
        blogs.value = blogs.value.filter(b => b.id !== id)
    }

    return { blogs, loading, fetchAll, fetchOne, store, update, destroy }
})