import type { RouterConfig } from '@nuxt/schema'

let scrollResetNext = false
export function armScrollReset() {
  scrollResetNext = true
}

export default <RouterConfig>{
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    if (to.hash) {
      return { el: to.hash, top: 80, behavior: 'smooth' }
    }

    if (scrollResetNext) {
      scrollResetNext = false
      return { top: 0 }
    }

    if (from && to.path === from.path) {
      return false
    }

    if (from && to.name === from.name && to.path !== from.path) {
      return false
    }

    return { top: 0 }
  },
}