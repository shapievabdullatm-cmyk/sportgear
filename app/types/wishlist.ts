export interface WishlistItem {
    id: number
    product_id: number
    title: string
    slug: string
    price: number
    old_price: number | null
    image: string | null
    size?: string | number | null
    parent_id: number | null
    total_stock: number
    is_active: boolean
}

export interface Wishlist {
    items: WishlistItem[]
    count: number
}