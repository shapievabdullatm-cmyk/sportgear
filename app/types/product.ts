export interface ProductImage {
    id: number
    url: string
    sort_order?: number
}

export interface ProductParam {
    title: string
    value: string | number | string[] | null
    unit: string | null
    is_color?: boolean
}

export interface ParamOption {
    id: number
    slug: string
    value: string
}

export interface ResolvedParam {
    id: number
    title: string
    slug: string
    label?: string | null
    filter_type: number
    filter_type_title: string | null
    has_options: boolean
    unit: string | null
    is_filterable: boolean
    is_searchable: boolean
    is_comparable: boolean
    is_size: boolean
    required: boolean
    multiple: boolean
    options: ParamOption[]
    // populated on edit
    value?: string | number | null
    option_id?: number | null
    option_ids?: number[]
}

export interface ParamValue {
    value: string | number | null
    option_id: number | null
    option_ids: number[]
}

export interface ProductStock {
    warehouse_id: number
    warehouse_title?: string
    quantity: number
    reserved_quantity: number
    available_quantity: number
}

export interface ProductSize {
    product_id: number
    size: string | number
    slug: string
    price: number | null
    old_price: number | null
    total_stock: number
    is_active: boolean
}

export interface Product {
    id: number
    external_id: string | null
    title: string | null
    external_title: string | null
    slug: string
    article: string | null
    description: string | null
    price: number | null
    old_price: number | null
    meta_title: string | null
    meta_description: string | null
    meta_keywords: string | null
    width: number | null
    height: number | null
    length: number | null
    weight: number | null
    is_active: boolean
    parent_id: number | null
    category_id: number | null
    product_group_id: number | null
    brand_id?: number | null
    brand_origin_id?: number | null
    manufacturing_country_id?: number | null
    images: ProductImage[]
    params?: ProductParam[]
    raw_params?: Array<{
        param_id: number
        value?: string | number | null
        option_id?: number | null
        option_ids?: number[]
    }>
    total_stock?: number
    stocks?: ProductStock[]
    barcodes?: any[]
    children?: Product[]
    sizes?: ProductSize[]
    bought_together_products?: Product[]
}

export interface Category {
    id: number
    title: string
    parent_id: number | null
    is_leaf?: boolean
}

export interface ProductGroup {
    id: number
    title: string
}

export const PARAM_TYPE = {
    STRING: 1,
    TEXT: 2,
    INTEGER: 3,
    FLOAT: 4,
    COLOR: 6,
    BOOLEAN: 7,
    MULTISELECT: 8,
} as const