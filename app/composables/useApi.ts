export const useApi = () => {
    const config     = useRuntimeConfig()
    const route      = useRoute()
    const token      = useCookie<string | null>('auth_token')
    const adminToken = useCookie<string | null>('admin_token')

    const isAdminContext = () => route?.path?.startsWith('/admin') ?? false

    const $api = $fetch.create({
        baseURL: config.public.apiBase as string,
        credentials: 'include',
        onRequest({ options }) {
            // Токен выбираем по контексту страницы: на /admin/* шлём admin_token,
            // иначе клиентский auth_token. Так оба токена не конфликтуют,
            // если выставлены одновременно.
            const activeToken = isAdminContext() ? adminToken.value : token.value
            if (activeToken) {
                options.headers = new Headers(options.headers as HeadersInit)
                options.headers.set('Authorization', `Bearer ${activeToken}`)
                options.headers.set('Accept', 'application/json')
            }
        },
        async onResponseError({ response }) {
            if (response.status === 401) {
                if (isAdminContext()) {
                    adminToken.value = null
                    await navigateTo('/admin/login')
                } else {
                    token.value = null
                    await navigateTo('/login')
                }
            }
        },
    })

    return { $api }
}