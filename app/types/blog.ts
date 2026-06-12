// types/blog.ts

export interface BlogCategory {
    id: number
    name: string
    slug: string
    sort_order: number
}

export interface Blog {
    id: number
    category?: BlogCategory | null
    title: string
    slug: string
    banner_image: string | null
    content: string | null
    meta_title: string | null
    meta_description: string | null
    meta_keywords: string | null
    is_published: boolean
    published_at: string | null
    created_at: string
    updated_at: string
}

export interface BlogFormData {
    blog_category_id?: number | null
    title: string
    slug?: string
    banner_image?: File | null
    remove_banner?: boolean
    content: string
    meta_title: string
    meta_description: string
    meta_keywords: string
    is_published: boolean
    published_at?: string | null
}