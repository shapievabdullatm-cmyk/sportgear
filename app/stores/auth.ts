// stores/auth.ts
import { defineStore } from 'pinia'
import type { User } from '~/types'
import { useApi } from '~/composables/useApi'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'

export const useAuthStore = defineStore('auth', () => {
    // НЕ вызываем useApi здесь наверху

    const user = ref<User | null>(null)

    const token = useCookie<string | null>('auth_token', {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
    })

    const adminToken = useCookie<string | null>('admin_token', {
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
    })

    const isLoggedIn      = computed(() => !!token.value)
    const isAdminLoggedIn = computed(() => !!adminToken.value)
    const isAdmin         = computed(() =>
        user.value?.roles?.some(r => r.title === 'admin') ?? false
    )
    const isFetched = ref(false)

    async function fetchMe() {
        const { $api } = useApi()  // ← свежий инстанс каждый раз
        const route = useRoute()
        const isAdminContext = route?.path?.startsWith('/admin') ?? false
        const activeToken = isAdminContext ? adminToken.value : token.value
        if (!activeToken) {
            isFetched.value = true
            return null
        }
        try {
            const res = await $api<User>('/me')
            user.value = res
            return res
        } catch (error) {
            // Чистим только токен текущего контекста — другой не трогаем
            if (isAdminContext) {
                adminToken.value = null
            } else {
                token.value = null
            }
            user.value = null
            throw error
        } finally {
            isFetched.value = true
        }
    }

    async function adminLogin(email: string, password: string) {
        const { $api } = useApi()  // ← свежий инстанс
        const res = await $api<{ user: User; token: string }>('/admin/auth/login', {
            method: 'POST',
            body: { email, password },
        })
        adminToken.value = res.token
        user.value = res.user
        isFetched.value = true

        // Перезагружаем корзину после авторизации
        const cartStore = useCartStore()
        await cartStore.fetchCart()

        // Перезагружаем избранное после авторизации
        const wishlistStore = useWishlistStore()
        await wishlistStore.fetchWishlist()

        await navigateTo('/admin')
    }

    async function sendCode(phone: string, captchaKey: string, captchaAnswer: string) {
        const { $api } = useApi()
        return $api<{ message: string; debug_code?: number }>('/auth/send-code', {
            method: 'POST',
            body: { phone, captcha_key: captchaKey, captcha_answer: captchaAnswer },
        })
    }

    async function verifyCode(phone: string, code: string) {
        const { $api } = useApi()

        const cartStore     = useCartStore()
        const wishlistStore = useWishlistStore()
        const guestCartId     = cartStore.cartId ?? null
        const guestWishlistId = wishlistStore.wishlistId ?? null

        const res = await $api<{
            user: User
            token: string
            cart?: { id: number; items: any[]; total_quantity: number; total_price: number }
            wishlist?: { id: number; items: any[]; total_items: number }
        }>('/auth/verify-code', {
            method: 'POST',
            body: {
                phone,
                code,
                guest_cart_id:     guestCartId,
                guest_wishlist_id: guestWishlistId,
            },
        })
        token.value = res.token
        user.value = res.user
        isFetched.value = true

        // Бекенд сразу прислал смерженные корзину и избранное —
        // пишем их в сторы синхронно, без второго запроса.
        if (res.cart) {
            cartStore.cartId = res.cart.id
            cartStore.items = res.cart.items.map((item: any) => ({
                id:          item.id,
                product_id:  item.product_id,
                title:       item.title,
                slug:        item.slug,
                price:       item.price,
                old_price:   null,
                image:       item.image,
                quantity:    item.quantity,
                size:        item.size,
                parent_id:   item.parent_id,
                total_stock: item.total_stock,
            }))
            cartStore.initialized = true
        }

        if (res.wishlist) {
            wishlistStore.wishlistId = res.wishlist.id
            wishlistStore.items = res.wishlist.items.map((item: any) => ({
                id:          item.id,
                product_id:  item.product_id,
                title:       item.title,
                slug:        item.slug,
                price:       item.price,
                old_price:   item.old_price,
                image:       item.image,
                size:        item.size,
                parent_id:   item.parent_id,
                total_stock: item.total_stock,
                is_active:   item.is_active,
            }))
            wishlistStore.initialized = true
        }

        const route = useRoute()
        const redirect = route.query.redirect as string | undefined
        await navigateTo(redirect || '/')
    }

    async function logoutUser() {
        const config = useRuntimeConfig()
        // Явно передаём user-токен, чтобы не использовался adminToken из useApi
        if (token.value) {
            try {
                await $fetch(`${config.public.apiBase}/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token.value}`, Accept: 'application/json' },
                })
            } catch (e) {
                console.error('Logout error:', e)
            }
        }
        token.value = null
        if (adminToken.value) {
            await fetchMe().catch(() => {})
        } else {
            user.value = null
            isFetched.value = false
        }
        const cartStore = useCartStore()
        cartStore.$reset()
        const wishlistStore = useWishlistStore()
        wishlistStore.$reset()
        await navigateTo('/login')
    }

    async function logoutAdmin() {
        const config = useRuntimeConfig()
        // Явно передаём admin-токен
        if (adminToken.value) {
            try {
                await $fetch(`${config.public.apiBase}/admin/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${adminToken.value}`, Accept: 'application/json' },
                })
            } catch (e) {
                console.error('Logout error:', e)
            }
        }
        adminToken.value = null
        if (token.value) {
            await fetchMe().catch(() => {})
        } else {
            user.value = null
            isFetched.value = false
        }
        const cartStore = useCartStore()
        cartStore.$reset()
        const wishlistStore = useWishlistStore()
        wishlistStore.$reset()
        await navigateTo('/admin/login')
    }

    // Обратная совместимость — определяет сессию по наличию adminToken
    async function logout() {
        if (adminToken.value) {
            await logoutAdmin()
        } else {
            await logoutUser()
        }
    }

    function setUser(updated: User) {
        user.value = updated
    }

    return {
        user,
        token,
        adminToken,
        isLoggedIn,
        isAdminLoggedIn,
        isAdmin,
        isFetched,
        sendCode,
        verifyCode,
        adminLogin,
        logout,
        logoutUser,
        logoutAdmin,
        fetchMe,
        setUser,
    }
})