export interface CartItem {
    id: number
    product_id: number
    title: string
    slug: string
    price: number
    old_price: number | null
    image: string | null
    quantity: number
    size?: string | number | null
    parent_id: number | null
    total_stock: number
}

export interface Cart {
    items: CartItem[]
    total: number
    count: number
}