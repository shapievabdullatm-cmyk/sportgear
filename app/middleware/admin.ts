export default defineNuxtRouteMiddleware(async (to) => {
    const auth = useAuthStore()

    // 1. Если мы уже на странице логина, ничего не делаем (прерываем цикл)
    if (to.path === '/admin/login') {
        return
    }

    // 2. Если есть adminToken, но юзер ещё не загружен — грузим
    if (auth.adminToken && !auth.isFetched) {
        try {
            await auth.fetchMe()
        } catch (e) {
            // Если токен протух или ошибка — чистим и на логин
            return navigateTo('/admin/login')
        }
    }

    // 3. Защита роута — проверяем adminToken, а не обычный token
    if (!auth.isAdminLoggedIn) {
        return navigateTo('/admin/login')
    }

    // 4. Проверка прав (если не админ — на главную)
    if (!auth.isAdmin) {
        return navigateTo('/')
    }
})