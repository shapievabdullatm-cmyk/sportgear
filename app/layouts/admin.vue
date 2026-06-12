<template>
  <div class="flex h-screen bg-zinc-50" style="font-family: 'Inter', sans-serif;">

    <!-- Mobile overlay -->
    <Transition name="overlay">
      <div
          v-if="isMobileSidebarOpen"
          @click="isMobileSidebarOpen = false"
          class="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
      />
    </Transition>

    <!-- SIDEBAR -->
    <aside
        :class="[
        'fixed inset-y-0 left-0 z-40 bg-white border-r border-zinc-100 flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'md:w-[60px]' : 'md:w-60',
        'w-60',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center h-14 border-b border-zinc-100 overflow-hidden relative shrink-0">
        <div class="flex items-center gap-3 px-4 min-w-[240px]">
          <NuxtLink to="/admin" class="text-sm font-semibold text-zinc-900 uppercase tracking-tighter shrink-0">
            <Transition name="logo-swap" mode="out-in">
              <Icon v-if="isCollapsed && isDesktop" key="mini" name="my:mini-logo" style="font-size: 30px"/>
              <Icon v-else key="full" name="my:logo-rage" style="font-size: 37px"/>
            </Transition>
          </NuxtLink>
        </div>

        <button
            @click="isMobileSidebarOpen = false"
            class="absolute right-3 top-1/2 -translate-y-1/2 p-1 md:hidden text-zinc-400 hover:bg-zinc-100 rounded"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5"/>
        </button>
      </div>

      <!-- Floating collapse toggle — desktop only -->
      <!-- Floating collapse toggle — desktop only -->
      <div class="absolute -right-3 top-0 h-14 hidden md:flex items-center z-50">
        <button
            @click="toggleCollapse"
            class="
              flex items-center justify-center
              w-6 h-6 rounded-full
              bg-white border border-zinc-200
              text-zinc-400 hover:text-zinc-900 hover:border-zinc-400
              shadow-sm transition-all duration-200
            "
        >
          <Icon
              name="heroicons:chevron-left"
              class="w-3 h-3 transition-transform duration-300"
              :class="{ 'rotate-180': isCollapsed }"
          />
        </button>
      </div>

      <!-- NAV -->
      <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">

        <NavItem
            to="/admin"
            icon="heroicons:squares-2x2"
            label="Дашборд"
            :collapsed="isCollapsed && isDesktop"
            :active="route.path === '/admin'"
        />

        <NavItem
            to="/admin/orders"
            icon="heroicons:cube"
            label="Заказы"
            :collapsed="isCollapsed && isDesktop"
            :active="route.path === '/admin/orders'"
        />

        <div class="my-2 mx-2 border-b border-zinc-50" />

        <NavGroup
            name="content"
            icon="heroicons:document-text"
            label="Контент"
            :collapsed="isCollapsed && isDesktop"
            :active-group="activeGroup"
            @toggle="toggleGroup"
        >
          <NavSubLink to="/admin/quick-links" label="Быстрые ссылки" :active="route.path === '/admin/quick-links'" />
          <NavSubLink to="/admin/sliders" label="Основной слайдер" :active="route.path === '/admin/sliders'" />
          <NavSubLink to="/admin/popular-categories" label="Популярные категории" :active="route.path === '/admin/popular-categories'" />
          <NavSubLink to="/admin/product-collections" label="Коллекции товаров" :active="route.path.startsWith('/admin/product-collections')" />
          <NavSubLink to="/admin/blogs" label="Блог" :active="route.path === '/admin/blogs'" />
        </NavGroup>

        <NavGroup
            name="shop"
            icon="heroicons:shopping-bag"
            label="Товары"
            :collapsed="isCollapsed && isDesktop"
            :active-group="activeGroup"
            @toggle="toggleGroup"
        >
          <NavSubLink to="/admin/products"   label="Продукты"   :active="route.path === '/admin/products'" />
          <NavSubLink to="/admin/categories" label="Категории"  :active="route.path === '/admin/categories'" />
          <NavSubLink to="/admin/params"   label="Характеристики"   :active="route.path === '/admin/params'" />
          <NavSubLink to="/admin/brands"   label="Бренды"   :active="route.path === '/admin/brands'" />
          <NavSubLink to="/admin/brand-origins"   label="Родина бренда"   :active="route.path === '/admin/brand-origins'" />
          <NavSubLink to="/admin/manufacturing-countries"   label="Страна производства"   :active="route.path === '/admin/manufacturing-countries'" />
          <NavSubLink to="/admin/size-tables"   label="Таблицы размеров"   :active="route.path === '/admin/size-tables'" />
        </NavGroup>

        <NavGroup
            name="storage"
            icon="heroicons:circle-stack"
            label="Хранение"
            :collapsed="isCollapsed && isDesktop"
            :active-group="activeGroup"
            @toggle="toggleGroup"
        >
          <NavSubLink to="/admin/shops"         label="Магазины" :active="route.path.startsWith('/admin/shops')" />
          <NavSubLink to="/admin/warehouses"    label="Склады" :active="route.path.startsWith('/admin/warehouses')" />
          <NavSubLink to="/admin/stocks" label="Остатки"    :active="route.path === '/admin/stocks'" />
          <NavSubLink to="/admin/stock-documents" label="Документы"    :active="route.path.startsWith('/admin/stock-documents')" />
        </NavGroup>

        <NavGroup
            name="management"
            icon="heroicons:cog-6-tooth"
            label="Система"
            :collapsed="isCollapsed && isDesktop"
            :active-group="activeGroup"
            @toggle="toggleGroup"
        >
          <NavSubLink to="/admin/users"    label="Пользователи" :active="route.path === '/admin/users'" />
          <NavSubLink to="/admin/settings" label="Настройки"    :active="route.path === '/admin/settings'" />
        </NavGroup>

      </nav>

      <!-- User footer -->
      <div class="border-t border-zinc-50 overflow-hidden shrink-0">
        <div class="flex items-center gap-3 px-3 py-3.5 min-w-[240px]">
          <div class="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            AD
          </div>
          <Transition name="fade-slide">
            <div v-if="!(isCollapsed && isDesktop)" class="flex flex-col min-w-0">
              <span class="text-xs font-bold text-zinc-900 truncate leading-tight">Admin</span>
              <span class="text-[10px] text-zinc-400 truncate tracking-tight">Nexite Platform</span>
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- MAIN -->
    <div
        :class="[
        'flex-1 flex flex-col min-h-0 min-w-0 transition-all duration-300 ease-in-out',
        isCollapsed && isDesktop ? 'md:ml-[60px]' : 'md:ml-60',
      ]"
    >
      <!-- Topbar -->
      <header class="h-14 bg-white border-b border-zinc-100 flex items-center justify-between px-6 sticky top-0 z-30 shrink-0">
        <button @click="isMobileSidebarOpen = true" class="md:hidden text-zinc-400">
          <Icon name="heroicons:bars-3-bottom-left" class="w-6 h-6" />
        </button>

        <div class="flex items-center gap-4 ml-auto">
          <NuxtLink
              to="/"
              target="_blank"
              class="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-black transition-colors"
          >
            На сайт
          </NuxtLink>
          <div class="w-px h-4 bg-zinc-100" />
          <button
              @click="auth.logoutAdmin"
              class="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
          >
            Выйти
          </button>
        </div>
      </header>

      <main :class="['overflow-auto', route.meta.fullBleed ? '' : 'p-6 md:p-10']">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuthStore()

const isMobileSidebarOpen = ref(false)
const isCollapsed = ref(false)

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) isCollapsed.value = saved === 'true'
})

watch(isCollapsed, (val) => {
  localStorage.setItem('sidebar-collapsed', String(val))
})

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) isCollapsed.value = saved === 'true'
})

watch(isCollapsed, (val) => {
  localStorage.setItem('sidebar-collapsed', String(val))
})
const activeGroup = ref<string | null>(null)

// True only on md+ screens (≥768px)
const isDesktop = ref(false)

const updateIsDesktop = () => {
  isDesktop.value = window.innerWidth >= 768
}

onMounted(() => {
  updateIsDesktop()
  window.addEventListener('resize', updateIsDesktop)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateIsDesktop)
})

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
  if (isCollapsed.value) activeGroup.value = null
}

const toggleGroup = (name: string) => {
  if (isCollapsed.value && isDesktop.value) {
    isCollapsed.value = false
    nextTick(() => { activeGroup.value = name })
    return
  }
  activeGroup.value = activeGroup.value === name ? null : name
}

const syncActiveGroup = () => {
  const p = route.path
  if (p === '/admin')                                                      activeGroup.value = null
  else if (p.includes('quick-links') || p.includes('sliders') || p.includes('popular-categories') || p.includes('blogs'))                                      activeGroup.value = 'content'
  else if (p.includes('users') || p.includes('settings'))                 activeGroup.value = 'management'
  else if (p.includes('products') || p.includes('categories') || p.includes('params') || p.includes('brands') || p.includes('brand-origins') || p.includes('manufacturing-countries') || p.includes('size-tables'))            activeGroup.value = 'shop'
  else if (p.includes('shops') || p.includes('warehouses') || p.includes('stocks') || p.includes('stock-documents'))              activeGroup.value = 'storage'
  else                                                                     activeGroup.value = null
}

watch(() => route.path, syncActiveGroup, { immediate: true, flush: 'post' })
</script>

<style scoped>
. {
  font-family: 'Inter', sans-serif;
}
.logo-swap-enter-active, .logo-swap-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.logo-swap-enter-from { opacity: 0; transform: scale(0.8); }
.logo-swap-leave-to   { opacity: 0; transform: scale(0.8); }

.overlay-enter-active, .overlay-leave-active { transition: opacity 0.2s ease; }
.overlay-enter-from, .overlay-leave-to { opacity: 0; }

.fade-slide-enter-active { transition: opacity 0.2s ease 0.1s, transform 0.2s ease 0.1s; }
.fade-slide-leave-active  { transition: opacity 0.1s ease, transform 0.1s ease; }
.fade-slide-enter-from    { opacity: 0; transform: translateX(-6px); }
.fade-slide-leave-to      { opacity: 0; transform: translateX(-6px); }
</style>