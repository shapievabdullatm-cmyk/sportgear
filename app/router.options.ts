import type { RouterConfig } from '@nuxt/schema'

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    if (to.hash) {
      return { el: to.hash, top: 80, behavior: 'smooth' }
    }

    if (from && to.name === from.name && to.path !== from.path) {
      return false
    }

    return { top: 0 }
  },
}