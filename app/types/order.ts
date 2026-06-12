export type OrderStatus =
    | 'new'
    | 'confirmed'
    | 'assembling'
    | 'packed'
    | 'shipped'
    | 'delivered'
    | 'cancelled'

export type DeliveryMethod = 'courier' | 'pickup' | 'cdek' | 'russian_post'

export type PaymentMethod = 'cash' | 'card_on_delivery'

export type PaymentStatus = 'pending' | 'paid'

export interface OrderItem {
    id: number
    order_id: number
    product_id: number | null
    product_title: string
    product_slug: string | null
    product_image: string | null
    product_size: string | null
    price: number
    quantity: number
    total: number
    reserved_warehouse_id: number | null
    reserved_warehouse?: { id: number; title: string } | null
    product?: {
        id: number
        title: string
        slug: string
        stocks?: Array<{
            id: number
            warehouse_id: number
            quantity: number
            reserved_quantity: number
            warehouse?: { id: number; title: string }
        }>
    } | null
}

export type OrderEventType =
    | 'created'
    | 'status_changed'
    | 'item_added'
    | 'item_updated'
    | 'item_removed'
    | 'item_restored'

export interface OrderEvent {
    id: number
    order_id: number
    type: OrderEventType
    data: Record<string, any> | null
    created_at: string
}

export interface Order {
    id: number
    number: string
    user_id: number
    status: OrderStatus
    delivery_method: DeliveryMethod
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    subtotal: number
    delivery_cost: number
    total: number
    customer_name: string
    customer_phone: string
    customer_email: string | null
    shop_id: number | null
    shop?: { id: number; name: string; address: string | null } | null
    pickup_slot_at: string | null
    address_full: string | null
    address_lat: number | null
    address_lon: number | null
    city: string | null
    street: string | null
    house: string | null
    apartment: string | null
    entrance: string | null
    floor: string | null
    intercom: string | null
    cdek_pvz_code: string | null
    russian_post_index: string | null
    tracking_number: string | null
    comment: string | null
    admin_comment: string | null
    confirmed_at: string | null
    shipped_at: string | null
    delivered_at: string | null
    cancelled_at: string | null
    created_at: string
    updated_at: string
    items: OrderItem[]
    events?: OrderEvent[]
    user?: {
        id: number
        phone: string
        email: string | null
        first_name: string | null
        last_name: string | null
    }
}

export interface OrderCreatePayload {
    delivery_method: DeliveryMethod
    payment_method: PaymentMethod
    customer_name: string
    customer_phone: string
    customer_email?: string | null
    comment?: string | null

    // courier
    address_full?: string | null
    address_lat?: number | null
    address_lon?: number | null
    city?: string | null
    street?: string | null
    house?: string | null
    apartment?: string | null
    entrance?: string | null
    floor?: string | null
    intercom?: string | null

    // pickup
    shop_id?: number | null
    pickup_slot_at?: string | null

    // cdek / russian post
    cdek_pvz_code?: string | null
    russian_post_index?: string | null
}

export interface OrderPaginated {
    data: Order[]
    current_page: number
    last_page: number
    total: number
    per_page: number
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
    new:        'Новый',
    confirmed:  'Подтверждён',
    assembling: 'Собирается',
    packed:     'Собран',
    shipped:    'Отправлен',
    delivered:  'Доставлен',
    cancelled:  'Отменён',
}

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
    courier:      'Курьер',
    pickup:       'Самовывоз из магазина',
    cdek:         'СДЭК',
    russian_post: 'Почта России',
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    cash:             'Наличными при получении',
    card_on_delivery: 'Картой при получении',
}