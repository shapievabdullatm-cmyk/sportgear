export default defineNuxtRouteMiddleware((to) => {
    const auth = useAuthStore()

    // Разрешаем доступ к /admin/login даже если клиент авторизован
    // (админ и клиент - разные авторизации)
    if (to.path === '/admin/login') {
        // Но если уже есть adminToken - редиректим в админку
        if (auth.isAdminLoggedIn) {
            return navigateTo('/admin')
        }
        return
    }

    // Для обычных guest-страниц (клиентский логин)
    if (auth.isLoggedIn) {
        const redirect = to.query.redirect as string
        return navigateTo(redirect || '/')
    }
})