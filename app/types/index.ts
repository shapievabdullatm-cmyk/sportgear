export interface Role {
    id: number
    title: 'admin' | 'client'
    label: string
}

export interface User {
    id: number
    phone: string | null
    email: string | null
    pending_email: string | null
    first_name: string | null
    last_name: string | null
    gender: 'male' | 'female' | 'other' | null
    birth_date: string | null
    roles: Role[]           // массив ролей
}

export interface QuickLink {
    id: number
    title: string
    url: string
}

export interface Address {
    id: number
    user_id: number
    title: string
    full_address: string
    lat: number | null
    lon: number | null
    city: string | null
    street: string | null
    house: string | null
    apartment: string | null
    entrance: string | null
    floor: string | null
    intercom: string | null
    comment: string | null
    is_default: boolean
    created_at: string
    updated_at: string
}
