export interface CategoryItem {
    id: number
    title: string
    parent_id: number | null
    position: number
    is_leaf: boolean
    param_ids: number[]
    param_items: ParamItem[]
    children?: CategoryItem[]
    parent?: CategoryItem | null
}

export interface ParamOption {
    id: number
    value: string
}

export interface ParamMeta {
    id: number
    title: string
    type_label: string | null
}

export interface ParamItem {
    id: number
    sort: number
}

export interface CategoryFormData {
    title: string
    parent_id: number | null
}

export interface CategoryBreadcrumb {
    id: number
    title: string
    slug: string
}

export interface CategoryChild {
    id: number
    title: string
    slug: string
    image: string | null
}

export interface CategoryDetail {
    id: number
    title: string
    slug: string
    image: string | null
    meta_title: string | null
    meta_description: string | null
    keywords: string | null
    parent_id: number | null
    position: number
}

export interface CategoryPageResponse {
    category: CategoryDetail
    breadcrumbs: CategoryBreadcrumb[]
    children: CategoryChild[]
    products: {
        data: any[]
        current_page: number
        last_page: number
        per_page: number
        total: number
    }
}